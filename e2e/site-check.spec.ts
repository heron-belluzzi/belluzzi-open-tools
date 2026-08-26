import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const report = {
  analyzedAt: "2026-08-20T18:00:00.000Z",
  durationMs: 420,
  target: {
    normalizedUrl: "https://belluzzi.dev/",
    finalUrl: "https://belluzzi.dev/pt",
    status: 200,
    responseTimeMs: 180,
  },
  summary: { pass: 5, warning: 0, fail: 0, info: 0 },
  redirects: [{ url: "https://belluzzi.dev/", status: 307, durationMs: 40 }],
  tls: { enabled: true, authorized: true, protocol: "TLSv1.3", daysRemaining: 72 },
  resources: {
    robots: { url: "https://belluzzi.dev/robots.txt", status: "available", statusCode: 200 },
    sitemap: { url: "https://belluzzi.dev/sitemap.xml", status: "available", statusCode: 200 },
  },
  agents: {
    profile: "website",
    policies: [
      { provider: "OpenAI", crawler: "OAI-SearchBot", purpose: "search", decision: "allowed", source: "robots", evidence: "allow: /" },
      { provider: "OpenAI", crawler: "ChatGPT-User", purpose: "user_action", decision: "allowed", source: "robots", evidence: "allow: /" },
      { provider: "OpenAI", crawler: "GPTBot", purpose: "training", decision: "blocked", source: "robots", evidence: "disallow: /" },
    ],
    pageDirectives: { meta: [], headers: [], conflicts: [] },
    initialHtml: { textLength: 840, appShellSuspected: false, semanticLandmarks: 4, discoverableLinks: 12 },
    structuredData: { valid: 1, invalid: 0, types: ["WebSite"] },
    llms: {
      url: "https://belluzzi.dev/llms.txt",
      status: "missing",
      statusCode: 404,
      experimental: true,
      valid: false,
      links: 0,
      hasFullVersion: false,
    },
    agentCard: {
      url: "https://belluzzi.dev/.well-known/agent-card.json",
      status: "missing",
      statusCode: 404,
      valid: false,
    },
    signals: [],
  },
  checks: [
    { id: "http_status", category: "http", status: "pass", value: "200" },
    { id: "tls_enabled", category: "tls", status: "pass", value: "TLSv1.3" },
    { id: "header_csp", category: "headers", status: "pass", value: "default-src 'self'" },
    { id: "seo_title", category: "seo", status: "pass", value: "Belluzzi" },
    { id: "indexing_robots", category: "indexing", status: "pass", value: "200" },
    { id: "agents_crawl_search", category: "agents", status: "pass", value: "allowed: 1" },
    { id: "agents_crawl_training", category: "agents", status: "info", value: "blocked: 1" },
    { id: "agents_llms_txt", category: "agents", status: "info", value: "missing · HTTP 404" },
  ],
};

test("Check alias negotiates language and preserves the query", async ({ request }) => {
  const response = await request.get("/?source=e2e", {
    headers: {
      host: "check.belluzzi.dev",
      "accept-language": "en-US,en;q=0.9,pt-BR;q=0.7",
    },
    maxRedirects: 0,
  });

  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe(
    "https://tools.belluzzi.dev/en/check?source=e2e",
  );
  expect(response.headers().vary).toContain("Accept-Language");
});

test("blocks private network targets at the API boundary", async ({ request }) => {
  const response = await request.post("/api/site-check", {
    data: { url: "http://127.0.0.1" },
  });
  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({ error: { code: "TARGET_BLOCKED" } });
});

test("renders an actionable bilingual report without sending the target to analytics", async ({
  page,
}) => {
  await page.route("**/api/site-check", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ url: "belluzzi.dev" });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(report) });
  });
  await page.goto("/pt/check");

  await page.getByRole("textbox", { name: "Endereço do site" }).fill("belluzzi.dev");
  await page.getByRole("button", { name: "Analisar site" }).click();
  await expect(page.getByRole("heading", { name: "Diagnóstico acionável" })).toBeVisible();
  await expect(page.getByText("Resposta HTTP final")).toBeVisible();
  await expect(page.getByText("Content Security Policy")).toBeVisible();
  await expect(page.getByText("Arquivo robots.txt")).toBeVisible();
  await expect(page.getByRole("heading", { name: "IA e agentes" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Política por crawler" })).toBeVisible();
  await expect(page.getByText("Bloqueado")).toBeVisible();
  await expect(page.getByText("Recurso opcional; a ausência não penaliza o relatório.").first()).toBeVisible();
  await expect(page.getByText("https://belluzzi.dev/pt")).toBeVisible();

  await page.goto("/en/check");
  await expect(page.getByRole("heading", { name: "Your website, seen from outside." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyze website" })).toBeVisible();
});

test("supports mobile layout, keyboard use and accessibility", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.route("**/api/site-check", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(report) }),
  );
  await page.goto("/pt/check");

  const input = page.getByRole("textbox", { name: "Endereço do site" });
  await input.focus();
  await input.fill("belluzzi.dev");
  await input.press("Enter");
  await expect(page.getByRole("heading", { name: "Diagnóstico acionável" })).toBeVisible();

  const seriousViolations = (await new AxeBuilder({ page }).analyze()).violations
    .filter(({ impact }) => impact === "critical" || impact === "serious")
    .map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }));
  expect(seriousViolations).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
  ).toBe(false);
});

