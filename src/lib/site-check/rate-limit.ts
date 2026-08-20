type RateEntry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 10 * 60 * 1_000;
const REQUESTS_PER_WINDOW = 10;
const MAX_TRACKED_CLIENTS = 10_000;
const MAX_CONCURRENT_ANALYSES = 2;

const clients = new Map<string, RateEntry>();
let activeAnalyses = 0;

function cleanExpired(now: number) {
  for (const [key, entry] of clients) {
    if (entry.resetAt <= now) clients.delete(key);
  }
  while (clients.size >= MAX_TRACKED_CLIENTS) {
    const firstKey = clients.keys().next().value;
    if (!firstKey) break;
    clients.delete(firstKey);
  }
}

export function consumeSiteCheckRateLimit(clientKey: string) {
  const now = Date.now();
  cleanExpired(now);
  const current = clients.get(clientKey);
  if (current && current.resetAt > now && current.count >= REQUESTS_PER_WINDOW) {
    return {
      allowed: false as const,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    };
  }

  clients.set(clientKey, {
    count: current && current.resetAt > now ? current.count + 1 : 1,
    resetAt: current && current.resetAt > now ? current.resetAt : now + WINDOW_MS,
  });
  return { allowed: true as const };
}

export function acquireSiteCheckSlot() {
  if (activeAnalyses >= MAX_CONCURRENT_ANALYSES) return null;
  activeAnalyses += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeAnalyses = Math.max(0, activeAnalyses - 1);
  };
}

export function resetSiteCheckLimitsForTests() {
  clients.clear();
  activeAnalyses = 0;
}

