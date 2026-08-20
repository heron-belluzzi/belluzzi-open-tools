import { describe, expect, it } from "vitest";
import {
  analyzeResponseHeaders,
  analyzeResponseHtml,
} from "./analyzer";
import { SiteCheckError } from "./errors";
import {
  isPublicIpAddress,
  normalizeTargetUrl,
  type SafeResponse,
} from "./network";
import {
  acquireSiteCheckSlot,
  consumeSiteCheckRateLimit,
  resetSiteCheckLimitsForTests,
} from "./rate-limit";

function response(overrides: Partial<SafeResponse> = {}): SafeResponse {
  return {
    url: "https://example.com/",
    status: 200,
    headers: {},
    body: Buffer.from("<html></html>"),
    durationMs: 120,
    redirects: [],
    tls: { enabled: true, authorized: true, daysRemaining: 60 },
    ...overrides,
  };
}

describe("SiteCheck target normalization", () => {
  it("assumes HTTPS, preserves paths and removes fragments", () => {
    expect(normalizeTargetUrl("example.com/path?q=1#private").toString()).toBe(
      "https://example.com/path?q=1",
    );
  });

  it("rejects credentials, unsupported protocols and non-standard ports", () => {
    for (const target of [
      "https://user:secret@example.com",
      "file:///etc/passwd",
      "https://example.com:8443",
    ]) {
      expect(() => normalizeTargetUrl(target)).toThrow(SiteCheckError);
    }
  });

  it("recognizes public addresses and blocks special IPv4 and IPv6 ranges", () => {
    expect(isPublicIpAddress("8.8.8.8")).toBe(true);
    expect(isPublicIpAddress("2606:4700:4700::1111")).toBe(true);
    for (const address of [
      "127.0.0.1",
      "10.0.0.1",
      "100.64.0.1",
      "169.254.169.254",
      "192.168.1.1",
      "::1",
      "fc00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
    ]) {
      expect(isPublicIpAddress(address), address).toBe(false);
    }
  });
});

describe("SiteCheck response analysis", () => {
  it("reports secure headers and cookie flags", () => {
    const checks = analyzeResponseHeaders(
      response({
        headers: {
          "content-security-policy": "default-src 'self'; frame-ancestors 'none'",
          "strict-transport-security": "max-age=31536000",
          "x-content-type-options": "nosniff",
          "referrer-policy": "strict-origin-when-cross-origin",
          "permissions-policy": "camera=()",
          "cache-control": "public, max-age=60",
          "set-cookie": ["session=test; Secure; HttpOnly; SameSite=Lax"],
        },
      }),
    );

    expect(checks.filter(({ status }) => status === "warning")).toEqual([]);
    expect(checks.find(({ id }) => id === "header_frame")?.status).toBe("pass");
    expect(checks.find(({ id }) => id === "header_cookies")?.status).toBe("pass");
  });

  it("extracts essential SEO metadata without executing markup", () => {
    const checks = analyzeResponseHtml(
      response({
        body: Buffer.from(`<!doctype html><html lang="pt-BR"><head>
          <title>Uma página completa para testar o SiteCheck</title>
          <meta name="description" content="Uma descrição clara e suficientemente completa para demonstrar a análise segura dos metadados desta página pública.">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="canonical" href="https://example.com/">
          <link rel="alternate" hreflang="en" href="https://example.com/en">
          <meta property="og:title" content="Example">
          <meta property="og:description" content="Description">
          <meta property="og:image" content="image.png">
        </head><body><h1>Example</h1><script>throw new Error('never')</script></body></html>`),
      }),
    );

    expect(checks.every(({ status }) => status === "pass")).toBe(true);
  });
});

describe("SiteCheck in-memory protection", () => {
  it("limits clients and global concurrency", () => {
    resetSiteCheckLimitsForTests();
    for (let index = 0; index < 10; index += 1) {
      expect(consumeSiteCheckRateLimit("client").allowed).toBe(true);
    }
    expect(consumeSiteCheckRateLimit("client").allowed).toBe(false);

    const releaseFirst = acquireSiteCheckSlot();
    const releaseSecond = acquireSiteCheckSlot();
    expect(releaseFirst).toBeTypeOf("function");
    expect(releaseSecond).toBeTypeOf("function");
    expect(acquireSiteCheckSlot()).toBeNull();
    releaseFirst?.();
    expect(acquireSiteCheckSlot()).toBeTypeOf("function");
    releaseSecond?.();
    resetSiteCheckLimitsForTests();
  });
});

