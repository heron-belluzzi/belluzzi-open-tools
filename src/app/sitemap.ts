import type { MetadataRoute } from "next";
import {
  languageAlternates,
  localizedPath,
  SITE_URL,
  type Locale,
  type RouteKey,
} from "@/lib/site";

const routes: RouteKey[] = ["home", "qr", "pass", "utm", "data"];
const locales: Locale[] = ["pt", "en"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${SITE_URL}${localizedPath(locale, route)}`,
      lastModified: new Date(),
      changeFrequency: route === "home" ? "weekly" : "monthly",
      priority: route === "home" ? 1 : 0.9,
      alternates: {
        languages: languageAlternates(route),
      },
    })),
  );
}
