import type { LookupAddress } from "node:dns";
import { lookup } from "node:dns/promises";
import http, { type IncomingHttpHeaders, type RequestOptions } from "node:http";
import https from "node:https";
import type { TLSSocket } from "node:tls";
import ipaddr from "ipaddr.js";
import { SiteCheckError } from "./errors";
import type { SiteCheckRedirect, SiteCheckTls } from "./types";

export const SITE_CHECK_LIMITS = {
  urlCharacters: 2_048,
  redirects: 5,
  requestTimeoutMs: 5_000,
  analysisTimeoutMs: 15_000,
  htmlBytes: 1_048_576,
  robotsBytes: 262_144,
  sitemapBytes: 1_048_576,
} as const;

type ResolvedAddress = {
  address: string;
  family: 4 | 6;
};

export type SafeResponse = {
  url: string;
  status: number;
  headers: IncomingHttpHeaders;
  body: Buffer;
  durationMs: number;
  redirects: SiteCheckRedirect[];
  tls: SiteCheckTls;
};

const blockedHostnames = new Set(["localhost", "localhost.localdomain"]);

export function normalizeTargetUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > SITE_CHECK_LIMITS.urlCharacters) {
    throw new SiteCheckError("INVALID_URL");
  }

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new SiteCheckError("INVALID_URL");
  }

  if (!["http:", "https:"].includes(url.protocol) || !url.hostname) {
    throw new SiteCheckError("INVALID_URL");
  }
  if (url.username || url.password) throw new SiteCheckError("INVALID_URL");

  const expectedPort = url.protocol === "https:" ? "443" : "80";
  if (url.port && url.port !== expectedPort) {
    throw new SiteCheckError("PORT_NOT_ALLOWED");
  }

  url.hash = "";
  return url;
}

export function isPublicIpAddress(address: string) {
  try {
    let parsed = ipaddr.parse(address);
    if (parsed instanceof ipaddr.IPv6 && parsed.isIPv4MappedAddress()) {
      parsed = parsed.toIPv4Address();
    }
    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}

async function resolvePublicAddress(hostname: string): Promise<ResolvedAddress> {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  if (
    blockedHostnames.has(normalized) ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  ) {
    throw new SiteCheckError("TARGET_BLOCKED");
  }

  if (ipaddr.isValid(normalized)) {
    if (!isPublicIpAddress(normalized)) throw new SiteCheckError("TARGET_BLOCKED");
    const parsed = ipaddr.parse(normalized);
    return { address: normalized, family: parsed.kind() === "ipv4" ? 4 : 6 };
  }

  let addresses: LookupAddress[];
  try {
    addresses = await Promise.race([
      lookup(normalized, { all: true, verbatim: true }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new SiteCheckError("TIMEOUT")),
          SITE_CHECK_LIMITS.requestTimeoutMs,
        ),
      ),
    ]);
  } catch (error) {
    if (error instanceof SiteCheckError) throw error;
    throw new SiteCheckError("TARGET_UNREACHABLE");
  }

  if (!addresses.length || addresses.some(({ address }) => !isPublicIpAddress(address))) {
    throw new SiteCheckError("TARGET_BLOCKED");
  }

  const selected = addresses[0];
  return {
    address: selected.address,
    family: selected.family === 6 ? 6 : 4,
  };
}

function certificateName(certificate: ReturnType<TLSSocket["getPeerCertificate"]>["issuer"]) {
  if (!certificate) return undefined;
  const value = certificate.O ?? certificate.CN;
  return value ? String(value) : Object.values(certificate).flat().join(", ");
}

function tlsDetails(socket: TLSSocket): SiteCheckTls {
  const certificate = socket.getPeerCertificate();
  const validTo = certificate.valid_to
    ? new Date(certificate.valid_to).toISOString()
    : undefined;
  return {
    enabled: true,
    authorized: socket.authorized,
    authorizationError: socket.authorizationError?.toString(),
    issuer: certificateName(certificate.issuer),
    protocol: socket.getProtocol() ?? undefined,
    validFrom: certificate.valid_from
      ? new Date(certificate.valid_from).toISOString()
      : undefined,
    validTo,
    daysRemaining: validTo
      ? Math.floor((new Date(validTo).getTime() - Date.now()) / 86_400_000)
      : undefined,
  };
}

async function requestOnce(
  url: URL,
  maxBytes: number,
  deadline: number,
): Promise<Omit<SafeResponse, "redirects">> {
  const address = await resolvePublicAddress(url.hostname);
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new SiteCheckError("TIMEOUT");
  const timeoutMs = Math.min(remaining, SITE_CHECK_LIMITS.requestTimeoutMs);
  const startedAt = performance.now();

  return new Promise((resolve, reject) => {
    let tls: SiteCheckTls = { enabled: url.protocol === "https:" };
    const pinnedLookup: NonNullable<RequestOptions["lookup"]> = (
      _hostname,
      options,
      callback,
    ) => {
      if (typeof options === "object" && options.all) {
        const allCallback = callback as unknown as (
          error: NodeJS.ErrnoException | null,
          addresses: LookupAddress[],
        ) => void;
        allCallback(null, [address]);
        return;
      }
      const oneCallback = callback as unknown as (
        error: NodeJS.ErrnoException | null,
        selectedAddress: string,
        family: number,
      ) => void;
      oneCallback(null, address.address, address.family);
    };
    const options: RequestOptions = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: `${url.pathname}${url.search}`,
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
        "Accept-Encoding": "identity",
        "User-Agent":
          "Belluzzi-SiteCheck/0.5 (+https://tools.belluzzi.dev/en/check)",
      },
      lookup: pinnedLookup,
      ...(url.protocol === "https:"
        ? { rejectUnauthorized: false, servername: url.hostname }
        : {}),
    };

    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request(options, (response) => {
      if (url.protocol === "https:") {
        tls = tlsDetails(response.socket as TLSSocket);
      }
      const status = response.statusCode ?? 0;
      const declaredLength = Number(response.headers["content-length"] ?? 0);
      if (declaredLength > maxBytes) {
        response.destroy();
        reject(new SiteCheckError("RESPONSE_TOO_LARGE"));
        return;
      }

      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxBytes) {
          response.destroy(new SiteCheckError("RESPONSE_TOO_LARGE"));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () =>
        resolve({
          url: url.toString(),
          status,
          headers: response.headers,
          body: Buffer.concat(chunks),
          durationMs: Math.round(performance.now() - startedAt),
          tls,
        }),
      );
      response.on("error", reject);
    });

    request.on("socket", (socket) => {
      if (url.protocol !== "https:") return;
      socket.once("secureConnect", () => {
        tls = tlsDetails(socket as TLSSocket);
      });
    });

    request.setTimeout(timeoutMs, () => request.destroy(new SiteCheckError("TIMEOUT")));
    request.on("error", (error) => {
      if (error instanceof SiteCheckError) reject(error);
      else reject(new SiteCheckError("TARGET_UNREACHABLE"));
    });
    request.end();
  });
}

export async function safeRequest(
  initialUrl: URL,
  maxBytes: number,
  deadline: number,
): Promise<SafeResponse> {
  let current = initialUrl;
  const redirects: SiteCheckRedirect[] = [];

  for (let index = 0; index <= SITE_CHECK_LIMITS.redirects; index += 1) {
    const response = await requestOnce(current, maxBytes, deadline);
    const location = response.headers.location;
    if (response.status >= 300 && response.status < 400 && location) {
      if (index === SITE_CHECK_LIMITS.redirects) {
        throw new SiteCheckError("TARGET_UNREACHABLE");
      }
      redirects.push({
        url: current.toString(),
        status: response.status,
        durationMs: response.durationMs,
      });
      try {
        current = normalizeTargetUrl(new URL(location, current).toString());
      } catch (error) {
        if (error instanceof SiteCheckError) throw error;
        throw new SiteCheckError("TARGET_UNREACHABLE");
      }
      continue;
    }

    return { ...response, redirects };
  }

  throw new SiteCheckError("TARGET_UNREACHABLE");
}
