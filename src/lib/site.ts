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
} as const;

export type RouteKey = keyof typeof routeSlugs;

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
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
