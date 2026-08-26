import type { AgentPolicyPurpose } from "./types";

export type AgentCrawler = {
  provider: string;
  token: string;
  purpose: AgentPolicyPurpose;
  source: string;
};

export const AGENT_CATALOG_REVIEWED_AT = "2026-08-26";

export const AGENT_CRAWLERS: readonly AgentCrawler[] = [
  {
    provider: "OpenAI",
    token: "OAI-SearchBot",
    purpose: "search",
    source: "https://help.openai.com/en/articles/12627856-publishers-and-developers-faq",
  },
  {
    provider: "OpenAI",
    token: "ChatGPT-User",
    purpose: "user_action",
    source: "https://help.openai.com/en/articles/12627856-publishers-and-developers-faq",
  },
  {
    provider: "OpenAI",
    token: "GPTBot",
    purpose: "training",
    source: "https://help.openai.com/en/articles/12627856-publishers-and-developers-faq",
  },
  {
    provider: "Anthropic",
    token: "Claude-SearchBot",
    purpose: "search",
    source: "https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
  },
  {
    provider: "Anthropic",
    token: "Claude-User",
    purpose: "user_action",
    source: "https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
  },
  {
    provider: "Anthropic",
    token: "ClaudeBot",
    purpose: "training",
    source: "https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
  },
  {
    provider: "Google",
    token: "Googlebot",
    purpose: "search",
    source: "https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers",
  },
  {
    provider: "Google",
    token: "Google-Extended",
    purpose: "training",
    source: "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers",
  },
] as const;
