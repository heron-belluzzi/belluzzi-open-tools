import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routing } from "./i18n/config";
import {
  aliasRouteForHost,
  localizedPath,
  preferredLocale,
  SITE_URL,
} from "./lib/site";

const intlMiddleware = createMiddleware(routing);

function requestHostname(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0];
  const host = forwardedHost ?? request.headers.get("host") ?? request.nextUrl.host;
  return host.trim().toLowerCase().split(":")[0];
}

export default function proxy(request: NextRequest) {
  const aliasRoute = aliasRouteForHost(requestHostname(request));
  if (aliasRoute) {
    const locale = preferredLocale(request.headers.get("accept-language"));
    const target = new URL(localizedPath(locale, aliasRoute), SITE_URL);
    target.search = request.nextUrl.search;

    const response = NextResponse.redirect(target, 307);
    response.headers.set("Vary", "Accept-Language");
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
