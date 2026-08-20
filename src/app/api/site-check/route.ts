import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { analyzeSite } from "@/lib/site-check/analyzer";
import { toSiteCheckError } from "@/lib/site-check/errors";
import {
  acquireSiteCheckSlot,
  consumeSiteCheckRateLimit,
} from "@/lib/site-check/rate-limit";
import type { SiteCheckApiError } from "@/lib/site-check/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function errorResponse(
  code: SiteCheckApiError["error"]["code"],
  status: number,
  retryAfter?: number,
) {
  const response = NextResponse.json<SiteCheckApiError>({ error: { code } }, { status });
  response.headers.set("Cache-Control", "no-store");
  if (retryAfter) response.headers.set("Retry-After", `${retryAfter}`);
  return response;
}

function clientKey(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

async function readRequestUrl(request: NextRequest) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > 4_096) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const body = JSON.parse(text) as { url?: unknown };
    return typeof body.url === "string" ? body.url : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return errorResponse("INVALID_URL", 400);
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4_096) return errorResponse("INVALID_URL", 400);

  const rate = consumeSiteCheckRateLimit(clientKey(request));
  if (!rate.allowed) return errorResponse("RATE_LIMITED", 429, rate.retryAfter);

  const release = acquireSiteCheckSlot();
  if (!release) return errorResponse("BUSY", 429, 10);

  try {
    const url = await readRequestUrl(request);
    if (!url) return errorResponse("INVALID_URL", 400);
    const report = await analyzeSite(url);
    const response = NextResponse.json(report);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const siteCheckError = toSiteCheckError(error);
    const statusByCode: Partial<Record<typeof siteCheckError.code, number>> = {
      INVALID_URL: 400,
      PORT_NOT_ALLOWED: 400,
      TARGET_BLOCKED: 403,
      TIMEOUT: 408,
      RESPONSE_TOO_LARGE: 413,
    };
    return errorResponse(siteCheckError.code, statusByCode[siteCheckError.code] ?? 502);
  } finally {
    release();
  }
}
