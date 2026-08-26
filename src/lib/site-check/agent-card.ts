import ipaddr from "ipaddr.js";

export type AgentCardAnalysis = {
  valid: boolean;
  name?: string;
  privateUrls: number;
};

function isPrivateUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const literal = hostname.replace(/^\[|\]$/g, "");
    return (
      !["http:", "https:"].includes(url.protocol) ||
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      (ipaddr.isValid(literal) && ipaddr.parse(literal).range() !== "unicast")
    );
  } catch {
    return true;
  }
}

export function analyzeAgentCard(content: string): AgentCardAnalysis {
  try {
    const card = JSON.parse(content) as Record<string, unknown>;
    const name = typeof card.name === "string" && card.name.trim() ? card.name.trim() : undefined;
    const description = typeof card.description === "string" && card.description.trim();
    const urls = new Set<string>();
    if (typeof card.url === "string") urls.add(card.url);
    if (Array.isArray(card.supportedInterfaces)) {
      for (const item of card.supportedInterfaces) {
        if (item && typeof item === "object" && typeof (item as Record<string, unknown>).url === "string") {
          urls.add((item as Record<string, unknown>).url as string);
        }
      }
    }
    const privateUrls = [...urls].filter(isPrivateUrl).length;
    return {
      valid: Boolean(name && description && urls.size > 0 && privateUrls === 0),
      ...(name ? { name } : {}),
      privateUrls,
    };
  } catch {
    return { valid: false, privateUrls: 0 };
  }
}
