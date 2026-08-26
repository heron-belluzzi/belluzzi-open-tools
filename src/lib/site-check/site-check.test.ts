import { describe, expect, it } from "vitest";
import {
  analyzeSite,
  analyzeResponseHeaders,
  analyzeResponseHtml,
} from "./analyzer";
import { analyzeAgentReadiness } from "./agent-analyzer";
import { analyzeAgentCard } from "./agent-card";
import { SiteCheckError } from "./errors";
import { analyzeLlmsTxt } from "./llms-txt";
import {
  isPublicIpAddress,
  normalizeTargetUrl,
  safeRequest,
  type SafeResponse,
} from "./network";
import {
  acquireSiteCheckSlot,
  consumeSiteCheckRateLimit,
  resetSiteCheckLimitsForTests,
} from "./rate-limit";
import { evaluateRobotsPolicy, parseRobotsTxt } from "./robots-policy";
import { analyzeStructuredData } from "./structured-data";

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

describe("SiteCheck AI and agent readiness parsers", () => {
  it("applies specific robots groups, longest rules and allow on equal matches", () => {
    const document = parseRobotsTxt(`
      User-agent: *
      Disallow: /private

      User-agent: GPTBot
      Disallow: /docs
      Allow: /docs/public
      Disallow: /docs/public
    `);

    expect(evaluateRobotsPolicy(document, "ClaudeBot", "/private/report").decision).toBe("blocked");
    expect(evaluateRobotsPolicy(document, "GPTBot", "/private/report").decision).toBe("allowed");
    expect(evaluateRobotsPolicy(document, "GPTBot", "/docs/public")).toMatchObject({
      decision: "allowed",
      evidence: "allow: /docs/public",
    });
  });

  it("keeps an undeclared crawler distinct from an invalid robots file", () => {
    const declared = parseRobotsTxt("User-agent: Googlebot\nDisallow:");
    expect(evaluateRobotsPolicy(declared, "GPTBot", "/").decision).toBe("not_declared");
    expect(evaluateRobotsPolicy(parseRobotsTxt("Sitemap: /sitemap.xml"), "GPTBot", "/").decision).toBe("invalid");
  });

  it("validates llms.txt structure without fetching its links", () => {
    expect(analyzeLlmsTxt(`# Example\n> Product summary\n\n## Docs\n- [Guide](/guide.md)\n- [Full](/llms-full.txt)`, "https://example.com/llms.txt")).toMatchObject({
      valid: true,
      links: 2,
      hasFullVersion: true,
    });
    expect(analyzeLlmsTxt("# Example", "https://example.com/llms.txt").valid).toBe(false);
  });

  it("reports valid, malformed and incomplete JSON-LD independently", () => {
    expect(analyzeStructuredData([
      JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", url: "https://example.com" }),
      "{broken",
      JSON.stringify({ "@context": "https://schema.org", name: "No type" }),
    ])).toEqual({ valid: 1, invalid: 2, types: ["Organization"] });
  });

  it("rejects incomplete Agent Cards and private operational URLs", () => {
    expect(analyzeAgentCard(JSON.stringify({
      name: "Public agent",
      description: "A public test agent",
      url: "https://agent.example.com/a2a",
    }))).toMatchObject({ valid: true, name: "Public agent", privateUrls: 0 });
    expect(analyzeAgentCard(JSON.stringify({
      name: "Private agent",
      description: "Not publicly callable",
      url: "http://127.0.0.1/a2a",
    }))).toMatchObject({ valid: false, privateUrls: 1 });
  });

  it("treats blocked training and absent experimental resources as information", () => {
    const analysis = analyzeAgentReadiness(
      response({
        body: Buffer.from(`<!doctype html><html lang="en"><head>
          <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite"}</script>
        </head><body><main><h1>Useful public website</h1><p>${"Public content ".repeat(30)}</p></main></body></html>`),
      }),
      {
        resource: { url: "https://example.com/robots.txt", status: "available", statusCode: 200 },
        content: "User-agent: GPTBot\nDisallow: /\nUser-agent: *\nAllow: /",
      },
      { resource: { url: "https://example.com/llms.txt", status: "missing", statusCode: 404 } },
      { resource: { url: "https://example.com/.well-known/agent-card.json", status: "missing", statusCode: 404 } },
    );

    expect(analysis.agents.policies.find(({ crawler }) => crawler === "GPTBot")?.decision).toBe("blocked");
    expect(analysis.checks.find(({ id }) => id === "agents_crawl_training")?.status).toBe("info");
    expect(analysis.checks.find(({ id }) => id === "agents_llms_txt")?.status).toBe("info");
    expect(analysis.checks.find(({ id }) => id === "agents_agent_card")?.status).toBe("info");
  });

  it("keeps the complete analysis within five same-origin resources", async () => {
    const requested: string[] = [];
    const request: typeof safeRequest = async (url, _maxBytes, _deadline, options = {}) => {
      requested.push(url.pathname);
      if (url.pathname !== "/") expect(options.allowedOrigin).toBe("https://example.com");
      const bodies: Record<string, string> = {
        "/": "<!doctype html><html lang=\"en\"><head><title>Example website title</title></head><body><main><h1>Example</h1></main></body></html>",
        "/robots.txt": "User-agent: *\nAllow: /",
        "/sitemap.xml": "<urlset></urlset>",
        "/llms.txt": "# Example\n> Summary\n## Docs\n- [Guide](/guide.md)",
        "/.well-known/agent-card.json": JSON.stringify({
          name: "Example Agent",
          description: "A public example agent",
          url: "https://example.com/a2a",
        }),
      };
      return response({
        url: url.toString(),
        body: Buffer.from(bodies[url.pathname] ?? ""),
      });
    };

    const report = await analyzeSite("example.com", request);
    expect(requested).toEqual([
      "/",
      "/robots.txt",
      "/sitemap.xml",
      "/llms.txt",
      "/.well-known/agent-card.json",
    ]);
    expect(report.agents.profile).toBe("agent_service");
    expect(report.agents.llms.valid).toBe(true);
    expect(report.agents.agentCard.valid).toBe(true);
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

