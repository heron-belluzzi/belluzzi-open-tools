import { load } from "cheerio";
import { analyzeAgentReadiness, type InspectedTextResource } from "./agent-analyzer";
import { SiteCheckError } from "./errors";
import {
  normalizeTargetUrl,
  safeRequest,
  SITE_CHECK_LIMITS,
  type SafeResponse,
} from "./network";
import type {
  SiteCheckReport,
  SiteCheckResource,
  SiteCheckResult,
  SiteCheckStatus,
} from "./types";

function header(response: SafeResponse, name: string) {
  const value = response.headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join(", ") : value ?? "";
}

function result(
  id: SiteCheckResult["id"],
  category: SiteCheckResult["category"],
  status: SiteCheckStatus,
  value?: string,
): SiteCheckResult {
  return { id, category, status, ...(value ? { value } : {}) };
}

function lengthStatus(value: string, minimum: number, maximum: number) {
  if (!value) return "fail" as const;
  return value.length >= minimum && value.length <= maximum
    ? ("pass" as const)
    : ("warning" as const);
}

export function analyzeResponseHeaders(response: SafeResponse) {
  const csp = header(response, "content-security-policy");
  const hsts = header(response, "strict-transport-security");
  const xFrame = header(response, "x-frame-options");
  const nosniff = header(response, "x-content-type-options");
  const referrer = header(response, "referrer-policy");
  const permissions = header(response, "permissions-policy");
  const cache = header(response, "cache-control");
  const cookies = response.headers["set-cookie"] ?? [];
  const unsafeCookies = cookies.filter((cookie) => {
    const lower = cookie.toLowerCase();
    return !lower.includes("secure") || !lower.includes("httponly") || !lower.includes("samesite=");
  });

  return [
    result("header_csp", "headers", csp ? "pass" : "warning", csp || undefined),
    result(
      "header_hsts",
      "headers",
      response.tls.enabled && hsts ? "pass" : "warning",
      hsts || undefined,
    ),
    result(
      "header_frame",
      "headers",
      xFrame || /frame-ancestors/i.test(csp) ? "pass" : "warning",
      xFrame || (/frame-ancestors/i.test(csp) ? "CSP frame-ancestors" : undefined),
    ),
    result(
      "header_nosniff",
      "headers",
      nosniff.toLowerCase() === "nosniff" ? "pass" : "warning",
      nosniff || undefined,
    ),
    result("header_referrer", "headers", referrer ? "pass" : "warning", referrer || undefined),
    result(
      "header_permissions",
      "headers",
      permissions ? "pass" : "warning",
      permissions || undefined,
    ),
    result("header_cache", "headers", cache ? "info" : "warning", cache || undefined),
    result(
      "header_cookies",
      "headers",
      cookies.length === 0 ? "info" : unsafeCookies.length === 0 ? "pass" : "warning",
      `${cookies.length}`,
    ),
  ];
}

export function analyzeResponseHtml(response: SafeResponse) {
  const html = response.body.toString("utf8");
  const $ = load(html);
  const title = $("title").first().text().trim();
  const description = $('meta[name="description"]').first().attr("content")?.trim() ?? "";
  const canonical = $('link[rel~="canonical"]').first().attr("href")?.trim() ?? "";
  const robots = $('meta[name="robots"]').first().attr("content")?.trim() ?? "";
  const viewport = $('meta[name="viewport"]').first().attr("content")?.trim() ?? "";
  const language = $("html").attr("lang")?.trim() ?? "";
  const hreflangCount = $('link[rel~="alternate"][hreflang]').length;
  const openGraphCount = $('meta[property^="og:"]').length;
  const h1Count = $("h1").length;
  let canonicalStatus: SiteCheckStatus = "fail";
  if (canonical) {
    try {
      const parsed = new URL(canonical, response.url);
      canonicalStatus = ["http:", "https:"].includes(parsed.protocol) ? "pass" : "warning";
    } catch {
      canonicalStatus = "warning";
    }
  }

  return [
    result("seo_title", "seo", lengthStatus(title, 10, 70), title || undefined),
    result(
      "seo_description",
      "seo",
      lengthStatus(description, 50, 180),
      description || undefined,
    ),
    result("seo_canonical", "seo", canonicalStatus, canonical || undefined),
    result(
      "seo_robots",
      "seo",
      /noindex/i.test(robots) ? "warning" : "pass",
      robots || "index, follow (default)",
    ),
    result("seo_viewport", "seo", viewport ? "pass" : "warning", viewport || undefined),
    result("seo_language", "seo", language ? "pass" : "warning", language || undefined),
    result(
      "seo_hreflang",
      "seo",
      hreflangCount > 0 ? "pass" : "info",
      `${hreflangCount}`,
    ),
    result(
      "seo_opengraph",
      "seo",
      openGraphCount >= 3 ? "pass" : openGraphCount > 0 ? "warning" : "info",
      `${openGraphCount}`,
    ),
    result(
      "seo_h1",
      "seo",
      h1Count === 1 ? "pass" : h1Count === 0 ? "fail" : "warning",
      `${h1Count}`,
    ),
  ];
}

async function inspectResource(
  url: URL,
  maxBytes: number,
  deadline: number,
  kind: "robots" | "sitemap",
  request: typeof safeRequest,
): Promise<{ resource: SiteCheckResource; check: SiteCheckResult; content?: string }> {
  try {
    const response = await request(url, maxBytes, deadline, { allowedOrigin: url.origin });
    const text = response.body.toString("utf8").trim();
    const available = response.status >= 200 && response.status < 300;
    const valid =
      kind === "robots"
        ? /(^|\n)\s*user-agent\s*:/i.test(text)
        : /<(urlset|sitemapindex)(\s|>)/i.test(text);
    const resourceStatus: SiteCheckResource["status"] = !available
      ? response.status === 404
        ? "missing"
        : "error"
      : valid
        ? "available"
        : "invalid";
    const checkStatus: SiteCheckStatus = resourceStatus === "available"
      ? "pass"
      : resourceStatus === "missing" || resourceStatus === "invalid"
        ? "warning"
        : "fail";

    return {
      resource: {
        url: response.url,
        status: resourceStatus,
        statusCode: response.status,
      },
      check: result(
        kind === "robots" ? "indexing_robots" : "indexing_sitemap",
        "indexing",
        checkStatus,
        `${response.status}`,
      ),
      ...(available ? { content: text } : {}),
    };
  } catch (error) {
    const tooLarge = error instanceof SiteCheckError && error.code === "RESPONSE_TOO_LARGE";
    return {
      resource: {
        url: url.toString(),
        status: tooLarge ? "too_large" : "error",
      },
      check: result(
        kind === "robots" ? "indexing_robots" : "indexing_sitemap",
        "indexing",
        tooLarge ? "warning" : "fail",
      ),
    };
  }
}

async function inspectOptionalResource(
  url: URL,
  maxBytes: number,
  deadline: number,
  request: typeof safeRequest,
): Promise<InspectedTextResource> {
  try {
    const response = await request(url, maxBytes, deadline, { allowedOrigin: url.origin });
    const available = response.status >= 200 && response.status < 300;
    let content: string | undefined;
    if (available) {
      try {
        content = new TextDecoder("utf-8", { fatal: true }).decode(response.body).trim();
      } catch {
        return {
          resource: {
            url: response.url,
            status: "invalid",
            statusCode: response.status,
          },
        };
      }
    }
    return {
      resource: {
        url: response.url,
        status: available ? "available" : response.status === 404 ? "missing" : "error",
        statusCode: response.status,
      },
      ...(content !== undefined ? { content } : {}),
    };
  } catch (error) {
    return {
      resource: {
        url: url.toString(),
        status:
          error instanceof SiteCheckError && error.code === "RESPONSE_TOO_LARGE"
            ? "too_large"
            : "error",
      },
    };
  }
}

export async function analyzeSite(
  input: string,
  request: typeof safeRequest = safeRequest,
): Promise<SiteCheckReport> {
  const startedAt = Date.now();
  const deadline = startedAt + SITE_CHECK_LIMITS.analysisTimeoutMs;
  const normalizedUrl = normalizeTargetUrl(input);
  const response = await request(normalizedUrl, SITE_CHECK_LIMITS.htmlBytes, deadline);
  const finalUrl = new URL(response.url);
  const origin = new URL(finalUrl.origin);
  const [robots, sitemap, llms, agentCard] = await Promise.all([
    inspectResource(
      new URL("/robots.txt", origin),
      SITE_CHECK_LIMITS.robotsBytes,
      deadline,
      "robots",
      request,
    ),
    inspectResource(
      new URL("/sitemap.xml", origin),
      SITE_CHECK_LIMITS.sitemapBytes,
      deadline,
      "sitemap",
      request,
    ),
    inspectOptionalResource(
      new URL("/llms.txt", origin),
      SITE_CHECK_LIMITS.llmsBytes,
      deadline,
      request,
    ),
    inspectOptionalResource(
      new URL("/.well-known/agent-card.json", origin),
      SITE_CHECK_LIMITS.agentCardBytes,
      deadline,
      request,
    ),
  ]);

  const agentAnalysis = analyzeAgentReadiness(response, robots, llms, agentCard);

  const statusCheck: SiteCheckStatus = response.status >= 200 && response.status < 300
    ? "pass"
    : response.status >= 400
      ? "fail"
      : "warning";
  const tlsValidity: SiteCheckStatus = !response.tls.enabled || !response.tls.authorized
    ? "fail"
    : (response.tls.daysRemaining ?? 0) < 30
      ? "warning"
      : "pass";

  const checks: SiteCheckResult[] = [
    result("http_status", "http", statusCheck, `${response.status}`),
    result(
      "http_redirects",
      "http",
      response.redirects.length <= 1 ? "pass" : "warning",
      `${response.redirects.length}`,
    ),
    result(
      "http_response_time",
      "http",
      response.durationMs <= 2_000 ? "pass" : "warning",
      `${response.durationMs} ms`,
    ),
    result(
      "tls_enabled",
      "tls",
      response.tls.enabled ? "pass" : "fail",
      response.tls.protocol,
    ),
    result(
      "tls_validity",
      "tls",
      tlsValidity,
      response.tls.daysRemaining === undefined ? undefined : `${response.tls.daysRemaining}`,
    ),
    ...analyzeResponseHeaders(response),
    ...analyzeResponseHtml(response),
    robots.check,
    sitemap.check,
    ...agentAnalysis.checks,
  ];

  const summary = checks.reduce<SiteCheckReport["summary"]>(
    (totals, check) => ({ ...totals, [check.status]: totals[check.status] + 1 }),
    { pass: 0, warning: 0, fail: 0, info: 0 },
  );

  return {
    analyzedAt: new Date(startedAt).toISOString(),
    durationMs: Date.now() - startedAt,
    target: {
      normalizedUrl: normalizedUrl.toString(),
      finalUrl: response.url,
      status: response.status,
      responseTimeMs: response.durationMs,
    },
    summary,
    redirects: response.redirects,
    tls: response.tls,
    resources: {
      robots: robots.resource,
      sitemap: sitemap.resource,
    },
    agents: agentAnalysis.agents,
    checks,
  };
}
