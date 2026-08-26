export type LlmsTxtAnalysis = {
  valid: boolean;
  hasTitle: boolean;
  hasSummary: boolean;
  sections: number;
  links: number;
  invalidLinks: number;
  hasFullVersion: boolean;
};

export function analyzeLlmsTxt(content: string, baseUrl: string): LlmsTxtAnalysis {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/);
  const hasTitle = lines.some((line) => /^#\s+\S/.test(line));
  const hasSummary = lines.some((line) => /^>\s+\S/.test(line));
  const sections = lines.filter((line) => /^##\s+\S/.test(line)).length;
  const linkMatches = [...content.matchAll(/\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)];
  let invalidLinks = 0;
  let hasFullVersion = false;

  for (const match of linkMatches) {
    try {
      const url = new URL(match[1], baseUrl);
      if (!["http:", "https:"].includes(url.protocol)) invalidLinks += 1;
      if (/llms-full\.txt$/i.test(url.pathname)) hasFullVersion = true;
    } catch {
      invalidLinks += 1;
    }
  }

  const links = linkMatches.length;
  return {
    valid: hasTitle && hasSummary && sections > 0 && links > 0 && invalidLinks === 0,
    hasTitle,
    hasSummary,
    sections,
    links,
    invalidLinks,
    hasFullVersion,
  };
}
