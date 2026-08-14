"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  belluzziCampaignUrl,
  isLocale,
  localizedPath,
  REPOSITORY_URL,
  type Locale,
} from "@/lib/site";

export default function Footer() {
  const t = useTranslations("footer");
  const localeValue = useLocale();
  const locale: Locale = isLocale(localeValue) ? localeValue : "pt";

  return (
    <footer className="border-t border-border px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
          <div className="max-w-xl">
            <a
              href={localizedPath(locale, "home")}
              className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-ink"
            >
              Belluzzi <span className="text-accent">Open Tools.</span>
            </a>
            <p className="mt-3 text-sm leading-6 text-muted">{t("description")}</p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-5 gap-y-3 font-mono text-[10px] uppercase tracking-widest text-muted md:justify-end"
          >
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-accent"
            >
              {t("source")}
            </a>
            <a
              href={belluzziCampaignUrl(locale, "footer_services")}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-accent"
            >
              {t("belluzzi")}
            </a>
          </nav>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-2 border-t border-border pt-6 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-faint">
              © {new Date().getFullYear()} Heron Belluzzi. {t("rights")}
            </p>
            <p className="mt-1.5 font-mono text-[10px] text-faint">{t("built_with")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
