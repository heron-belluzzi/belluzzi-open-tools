export type SiteCheckCategory =
  | "http"
  | "tls"
  | "headers"
  | "seo"
  | "indexing"
  | "agents";

export type SiteCheckStatus = "pass" | "warning" | "fail" | "info";

export type SiteCheckErrorCode =
  | "INVALID_URL"
  | "TARGET_BLOCKED"
  | "PORT_NOT_ALLOWED"
  | "TIMEOUT"
  | "RESPONSE_TOO_LARGE"
  | "RATE_LIMITED"
  | "BUSY"
  | "TARGET_UNREACHABLE";

export type SiteCheckId =
  | "http_status"
  | "http_redirects"
  | "http_response_time"
  | "tls_enabled"
  | "tls_validity"
  | "header_csp"
  | "header_hsts"
  | "header_frame"
  | "header_nosniff"
  | "header_referrer"
  | "header_permissions"
  | "header_cache"
  | "header_cookies"
  | "seo_title"
  | "seo_description"
  | "seo_canonical"
  | "seo_robots"
  | "seo_viewport"
  | "seo_language"
  | "seo_hreflang"
  | "seo_opengraph"
  | "seo_h1"
  | "indexing_robots"
  | "indexing_sitemap"
  | "agents_crawl_search"
  | "agents_crawl_user"
  | "agents_crawl_training"
  | "agents_page_directives"
  | "agents_initial_html"
  | "agents_structured_data"
  | "agents_llms_txt"
  | "agents_interfaces"
  | "agents_agent_card";

export type SiteCheckResult = {
  id: SiteCheckId;
  category: SiteCheckCategory;
  status: SiteCheckStatus;
  value?: string;
};

export type SiteCheckRedirect = {
  url: string;
  status: number;
  durationMs: number;
};

export type SiteCheckTls = {
  enabled: boolean;
  authorized?: boolean;
  authorizationError?: string;
  issuer?: string;
  protocol?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
};

export type SiteCheckResource = {
  url: string;
  status: "available" | "missing" | "invalid" | "error" | "too_large";
  statusCode?: number;
};

export type AgentPolicyPurpose = "search" | "user_action" | "training";

export type AgentPolicyDecision =
  | "allowed"
  | "blocked"
  | "not_declared"
  | "unavailable"
  | "invalid";

export type AgentPolicyEvidence = {
  provider: string;
  crawler: string;
  purpose: AgentPolicyPurpose;
  decision: AgentPolicyDecision;
  source: "robots";
  evidence?: string;
};

export type AgentSignal = "openapi" | "mcp" | "webmcp" | "a2a";

export type AgentReadiness = {
  profile: "website" | "developer_api" | "agent_service";
  policies: AgentPolicyEvidence[];
  pageDirectives: {
    meta: string[];
    headers: string[];
    conflicts: string[];
  };
  initialHtml: {
    textLength: number;
    appShellSuspected: boolean;
    semanticLandmarks: number;
    discoverableLinks: number;
  };
  structuredData: {
    valid: number;
    invalid: number;
    types: string[];
  };
  llms: SiteCheckResource & {
    experimental: true;
    valid: boolean;
    links: number;
    hasFullVersion: boolean;
  };
  agentCard: SiteCheckResource & {
    valid: boolean;
    name?: string;
  };
  signals: AgentSignal[];
};

export type SiteCheckReport = {
  analyzedAt: string;
  durationMs: number;
  target: {
    normalizedUrl: string;
    finalUrl: string;
    status: number;
    responseTimeMs: number;
  };
  summary: Record<SiteCheckStatus, number>;
  redirects: SiteCheckRedirect[];
  tls: SiteCheckTls;
  resources: {
    robots: SiteCheckResource;
    sitemap: SiteCheckResource;
  };
  agents: AgentReadiness;
  checks: SiteCheckResult[];
};

export type SiteCheckApiError = {
  error: {
    code: SiteCheckErrorCode;
  };
};

