import { load } from "cheerio";
import { AGENT_CRAWLERS } from "./agent-catalog";
import { analyzeAgentCard } from "./agent-card";
import { analyzeLlmsTxt } from "./llms-txt";
import { evaluateRobotsPolicy, parseRobotsTxt } from "./robots-policy";
import { analyzeStructuredData } from "./structured-data";
import type { SafeResponse } from "./network";
import type {
  AgentPolicyDecision,
  AgentPolicyEvidence,
  AgentPolicyPurpose,
  AgentReadiness,
  AgentSignal,
  SiteCheckResource,
  SiteCheckResult,
  SiteCheckStatus,
} from "./types";

export type InspectedTextResource = {
  resource: SiteCheckResource;
  content?: string;
};

function result(
  id: SiteCheckResult["id"],
  status: SiteCheckStatus,
  value?: string,
): SiteCheckResult {
  return { id, category: "agents", status, ...(value ? { value } : {}) };
}

function headerValues(response: SafeResponse, name: string) {
  const value = response.headers[name.toLowerCase()];
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map(String).filter(Boolean);
}

function policyStatus(purpose: AgentPolicyPurpose, policies: AgentPolicyEvidence[]): SiteCheckStatus {
  const decisions = policies.filter((policy) => policy.purpose === purpose).map(({ decision }) => decision);
  if (purpose === "training") return "info";
  if (decisions.includes("blocked") || decisions.includes("invalid")) return "warning";
  if (decisions.length > 0 && decisions.every((decision) => decision === "allowed")) return "pass";
  return "info";
}

function policySummary(purpose: AgentPolicyPurpose, policies: AgentPolicyEvidence[]) {
  const counts = policies
    .filter((policy) => policy.purpose === purpose)
    .reduce<Record<AgentPolicyDecision, number>>(
      (totals, { decision }) => ({ ...totals, [decision]: totals[decision] + 1 }),
      { allowed: 0, blocked: 0, not_declared: 0, unavailable: 0, invalid: 0 },
    );
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([decision, count]) => `${decision}: ${count}`)
    .join(" · ");
}

function analyzeInitialHtml(html: string) {
  const $ = load(html);
  $("script, style, template, noscript, svg").remove();
  const textLength = $("body").text().replace(/\s+/g, " ").trim().length;
  const semanticLandmarks = $("main, article, nav, header, footer, aside").length;
  const discoverableLinks = $("a[href]").filter((_, element) => {
    const link = $(element);
    return Boolean((link.text() || link.attr("aria-label") || link.find("img[alt]").attr("alt"))?.trim());
  }).length;
  const appRoots = $("#root:empty, #app:empty, #__next:empty, [data-reactroot]:empty").length;
  const appShellSuspected = textLength < 200 && (appRoots > 0 || semanticLandmarks === 0);
  return { textLength, appShellSuspected, semanticLandmarks, discoverableLinks };
}

function detectSignals(html: string): AgentSignal[] {
  const $ = load(html);
  const signals = new Set<AgentSignal>();

  if (
    $('link[type*="openapi" i][href], link[rel~="service-desc" i][href], a[href*="openapi" i], a[href*="swagger.json" i]').length
  ) signals.add("openapi");
  if (
    $('link[rel~="mcp" i][href], link[type*="mcp" i][href], a[href^="mcp:" i], a[href*="/mcp" i]').length
  ) signals.add("mcp");
  if ($('form[toolname], form[tool-name], [data-webmcp], script[type="application/webmcp+json" i]').length) {
    signals.add("webmcp");
  }

  return [...signals];
}

function pageDirectives(response: SafeResponse, policies: AgentPolicyEvidence[]) {
  const html = response.body.toString("utf8");
  const $ = load(html);
  const meta = $('meta[name="robots" i], meta[name$="bot" i], meta[name$="-user" i]')
    .map((_, element) => {
      const name = $(element).attr("name")?.trim();
      const content = $(element).attr("content")?.trim();
      return name && content ? `${name}: ${content}` : "";
    })
    .get()
    .filter(Boolean);
  const headers = headerValues(response, "x-robots-tag");
  const conflicts: string[] = [];
  const metaNoIndex = meta.some((value) => /\bnoindex\b/i.test(value));
  const headerNoIndex = headers.some((value) => /\bnoindex\b/i.test(value));
  const metaIndex = meta.some((value) => /(^|[:,\s])index\b/i.test(value) && !/\bnoindex\b/i.test(value));
  const headerIndex = headers.some((value) => /(^|[:,\s])index\b/i.test(value) && !/\bnoindex\b/i.test(value));
  if ((metaNoIndex && headerIndex) || (headerNoIndex && metaIndex)) conflicts.push("index/noindex");
  if ((metaNoIndex || headerNoIndex) && policies.some(({ decision }) => decision === "blocked")) {
    conflicts.push("robots-blocked/page-noindex");
  }
  return { meta, headers, conflicts };
}

function resourceDecision(resource: SiteCheckResource): AgentPolicyDecision {
  if (resource.status === "invalid") return "invalid";
  return "unavailable";
}

export function analyzeAgentReadiness(
  response: SafeResponse,
  robots: InspectedTextResource,
  llms: InspectedTextResource,
  agentCardResource: InspectedTextResource,
): { agents: AgentReadiness; checks: SiteCheckResult[] } {
  const path = `${new URL(response.url).pathname}${new URL(response.url).search}`;
  const robotsDocument = robots.resource.status === "available" && robots.content
    ? parseRobotsTxt(robots.content)
    : null;
  const policies = AGENT_CRAWLERS.map<AgentPolicyEvidence>((crawler) => {
    if (!robotsDocument) {
      return {
        provider: crawler.provider,
        crawler: crawler.token,
        purpose: crawler.purpose,
        decision: resourceDecision(robots.resource),
        source: "robots",
      };
    }
    const evaluated = evaluateRobotsPolicy(robotsDocument, crawler.token, path);
    return {
      provider: crawler.provider,
      crawler: crawler.token,
      purpose: crawler.purpose,
      decision: evaluated.decision,
      source: "robots",
      ...(evaluated.evidence ? { evidence: evaluated.evidence } : {}),
    };
  });

  const html = response.body.toString("utf8");
  const $ = load(html);
  const initialHtml = analyzeInitialHtml(html);
  const structuredData = analyzeStructuredData(
    $('script[type="application/ld+json" i]').map((_, element) => $(element).html() ?? "").get(),
  );
  const directives = pageDirectives(response, policies);
  const llmsAnalysis = llms.resource.status === "available" && llms.content
    ? analyzeLlmsTxt(llms.content, llms.resource.url)
    : { valid: false, links: 0, hasFullVersion: false };
  const agentCardAnalysis = agentCardResource.resource.status === "available" && agentCardResource.content
    ? analyzeAgentCard(agentCardResource.content)
    : { valid: false, privateUrls: 0 };
  const signals = detectSignals(html);
  if (
    agentCardResource.resource.statusCode !== undefined &&
    agentCardResource.resource.statusCode >= 200 &&
    agentCardResource.resource.statusCode < 300
  ) signals.push("a2a");
  const uniqueSignals = [...new Set(signals)];
  const profile: AgentReadiness["profile"] = uniqueSignals.some((signal) => signal !== "openapi")
    ? "agent_service"
    : uniqueSignals.includes("openapi")
      ? "developer_api"
      : "website";

  const agents: AgentReadiness = {
    profile,
    policies,
    pageDirectives: directives,
    initialHtml,
    structuredData,
    llms: {
      ...llms.resource,
      experimental: true,
      valid: llmsAnalysis.valid,
      links: llmsAnalysis.links,
      hasFullVersion: llmsAnalysis.hasFullVersion,
    },
    agentCard: {
      ...agentCardResource.resource,
      valid: agentCardAnalysis.valid,
      ...(agentCardAnalysis.name ? { name: agentCardAnalysis.name } : {}),
    },
    signals: uniqueSignals,
  };

  const directiveValues = [...directives.meta, ...directives.headers];
  const checks: SiteCheckResult[] = [
    result("agents_crawl_search", policyStatus("search", policies), policySummary("search", policies)),
    result("agents_crawl_user", policyStatus("user_action", policies), policySummary("user_action", policies)),
    result("agents_crawl_training", "info", policySummary("training", policies)),
    result(
      "agents_page_directives",
      directives.conflicts.length ? "warning" : directiveValues.length ? "pass" : "info",
      directives.conflicts.length ? directives.conflicts.join(" · ") : directiveValues.join(" · ") || "default",
    ),
    result(
      "agents_initial_html",
      initialHtml.appShellSuspected ? "warning" : "pass",
      `text: ${initialHtml.textLength} · landmarks: ${initialHtml.semanticLandmarks} · links: ${initialHtml.discoverableLinks}`,
    ),
    result(
      "agents_structured_data",
      structuredData.invalid ? "warning" : structuredData.valid ? "pass" : "info",
      `valid: ${structuredData.valid} · invalid: ${structuredData.invalid}${structuredData.types.length ? ` · ${structuredData.types.join(", ")}` : ""}`,
    ),
    result(
      "agents_llms_txt",
      llms.resource.status === "available"
        ? llmsAnalysis.valid ? "pass" : "warning"
        : llms.resource.status === "invalid" || llms.resource.status === "too_large"
          ? "warning"
          : "info",
      `${llms.resource.status}${llms.resource.statusCode ? ` · HTTP ${llms.resource.statusCode}` : ""}`,
    ),
    result("agents_interfaces", "info", uniqueSignals.join(", ") || "none"),
    result(
      "agents_agent_card",
      agentCardResource.resource.status === "available"
        ? agentCardAnalysis.valid ? "pass" : "fail"
        : agentCardResource.resource.status === "invalid" || agentCardResource.resource.status === "too_large"
          ? "fail"
          : "info",
      `${agentCardResource.resource.status}${agentCardResource.resource.statusCode ? ` · HTTP ${agentCardResource.resource.statusCode}` : ""}`,
    ),
  ];

  return { agents, checks };
}
