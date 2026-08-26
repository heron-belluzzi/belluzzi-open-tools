import type { AgentPolicyDecision } from "./types";

type RobotsRule = {
  directive: "allow" | "disallow";
  pattern: string;
  raw: string;
};

type RobotsGroup = {
  agents: string[];
  rules: RobotsRule[];
};

export type RobotsDocument = {
  valid: boolean;
  groups: RobotsGroup[];
};

export type RobotsDecision = {
  decision: Extract<AgentPolicyDecision, "allowed" | "blocked" | "not_declared" | "invalid">;
  evidence?: string;
};

export function parseRobotsTxt(content: string): RobotsDocument {
  const groups: RobotsGroup[] = [];
  let agents: string[] = [];
  let rules: RobotsRule[] = [];

  const flush = () => {
    if (agents.length) groups.push({ agents, rules });
    agents = [];
    rules = [];
  };

  for (const rawLine of content.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "user-agent") {
      if (rules.length) flush();
      if (value) agents.push(value.toLowerCase());
      continue;
    }

    if ((field === "allow" || field === "disallow") && agents.length) {
      rules.push({ directive: field, pattern: value, raw: `${field}: ${value}` });
    }
  }
  flush();

  return { valid: groups.length > 0, groups };
}

function escapedPattern(pattern: string) {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const source = body
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${source}${anchored ? "$" : ""}`);
}

export function evaluateRobotsPolicy(
  document: RobotsDocument,
  crawler: string,
  path: string,
): RobotsDecision {
  if (!document.valid) return { decision: "invalid" };

  const token = crawler.toLowerCase();
  const exact = document.groups.filter(({ agents }) => agents.includes(token));
  const groups = exact.length
    ? exact
    : document.groups.filter(({ agents }) => agents.includes("*"));
  if (!groups.length) return { decision: "not_declared" };

  const matching = groups
    .flatMap(({ rules }) => rules)
    .filter(({ pattern }) => pattern && escapedPattern(pattern).test(path))
    .sort((left, right) => {
      const length = right.pattern.replace(/\*|\$$/g, "").length - left.pattern.replace(/\*|\$$/g, "").length;
      if (length !== 0) return length;
      return left.directive === "allow" ? -1 : 1;
    });
  const selected = matching[0];
  if (!selected) {
    return {
      decision: "allowed",
      evidence: `user-agent: ${exact.length ? crawler : "*"}`,
    };
  }

  return {
    decision: selected.directive === "disallow" ? "blocked" : "allowed",
    evidence: selected.raw,
  };
}
