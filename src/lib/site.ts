export const SITE_NAME = "Belluzzi Open Tools";
export const SITE_URL = "https://tools.belluzzi.dev";
export const BELLUZZI_URL = "https://belluzzi.dev";
export const REPOSITORY_URL =
  "https://github.com/heron-belluzzi/belluzzi-open-tools";
export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];

export const routeSlugs = {
  home: { pt: "", en: "" },
  qr: { pt: "qr", en: "qr" },
  pass: { pt: "pass", en: "pass" },
  utm: { pt: "utm", en: "utm" },
  data: { pt: "data", en: "data" },
  check: { pt: "check", en: "check" },
} as const;

export type RouteKey = keyof typeof routeSlugs;

export const TOOL_ALIAS_ROUTES: Partial<Record<string, RouteKey>> = {
  "qr.belluzzi.dev": "qr",
  "pass.belluzzi.dev": "pass",
  "utm.belluzzi.dev": "utm",
  "data.belluzzi.dev": "data",
  "check.belluzzi.dev": "check",
};

export function aliasRouteForHost(hostname: string) {
  return TOOL_ALIAS_ROUTES[hostname.trim().toLowerCase()] ?? null;
}

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function preferredLocale(acceptLanguage?: string | null): Locale {
  if (!acceptLanguage) return "pt";

  const preferences = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [languagePart, ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) =>
        parameter.trim().startsWith("q="),
      );
      const parsedQuality = qualityParameter
        ? Number.parseFloat(qualityParameter.trim().slice(2))
        : 1;

      return {
        language: languagePart.toLowerCase(),
        quality: Number.isFinite(parsedQuality) ? parsedQuality : 0,
        index,
      };
    })
    .filter(({ language, quality }) => language && quality > 0)
    .sort((left, right) => right.quality - left.quality || left.index - right.index);

  for (const { language } of preferences) {
    const primaryLanguage = language.split("-")[0];
    if (primaryLanguage === "pt" || primaryLanguage === "en") {
      return primaryLanguage;
    }
  }

  return "pt";
}

export function belluzziCampaignUrl(
  locale: Locale,
  content: string,
) {
  const url = new URL(`/${locale}`, BELLUZZI_URL);
  url.searchParams.set("utm_source", "tools_belluzzi");
  url.searchParams.set("utm_medium", "opensource");
  url.searchParams.set("utm_campaign", "belluzzi_open_tools");
  url.searchParams.set("utm_content", content);
  return url.toString();
}

export function localizedPath(locale: Locale, route: RouteKey) {
  const slug = routeSlugs[route][locale];
  return slug ? `/${locale}/${slug}` : `/${locale}`;
}

export function routeFromSlug(locale: Locale, slug?: string): RouteKey | null {
  if (!slug) return "home";

  const match = (Object.keys(routeSlugs) as RouteKey[]).find(
    (route) => routeSlugs[route][locale] === slug,
  );

  return match ?? null;
}

export function alternateLocalePath(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/").filter(Boolean);
  const currentSegment = segments[0] ?? "";
  const currentLocale: Locale = isLocale(currentSegment) ? currentSegment : "pt";
  const route = routeFromSlug(currentLocale, segments[1]);

  return localizedPath(nextLocale, route ?? "home");
}

export function languageAlternates(route: RouteKey) {
  return {
    "pt-BR": `${SITE_URL}${localizedPath("pt", route)}`,
    en: `${SITE_URL}${localizedPath("en", route)}`,
    "x-default": `${SITE_URL}${localizedPath("pt", route)}`,
  };
}
