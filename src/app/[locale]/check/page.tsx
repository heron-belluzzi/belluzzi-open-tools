import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteCheckStudio from "@/components/SiteCheckStudio";
import { SiteShell } from "@/components/SiteShell";
import {
  isLocale,
  languageAlternates,
  localizedPath,
  SITE_URL,
  type Locale,
} from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeValue } = await params;
  const locale: Locale = isLocale(localeValue) ? localeValue : "pt";
  const t = await getTranslations({ locale, namespace: "sitecheck" });

  return {
    title: t("meta_title"),
    description: t("meta_description"),
    alternates: {
      canonical: `${SITE_URL}${localizedPath(locale, "check")}`,
      languages: languageAlternates("check"),
    },
    openGraph: {
      title: t("meta_title"),
      description: t("meta_description"),
      url: `${SITE_URL}${localizedPath(locale, "check")}`,
    },
  };
}

export default async function SiteCheckPage({ params }: Props) {
  const { locale: localeValue } = await params;
  const locale: Locale = isLocale(localeValue) ? localeValue : "pt";
  setRequestLocale(locale);
  const t = await getTranslations("sitecheck");

  return (
    <SiteShell>
      <main className="px-5 pb-24 pt-28 sm:px-8 sm:pb-32 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <a
            href={localizedPath(locale, "home")}
            className="sitecheck-print-hidden inline-flex items-center font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-accent"
          >
            <span className="mr-2" aria-hidden="true">←</span> {t("back")}
          </a>

          <div className="mb-12 mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                {t("eyebrow")}
              </p>
              <h1 className="mt-4 text-balance font-serif text-5xl font-medium leading-[1.02] tracking-[-0.04em] text-ink sm:text-6xl">
                {t("title")}
              </h1>
            </div>
            <p className="max-w-xl text-base leading-7 text-muted lg:justify-self-end">
              {t("description")}
            </p>
          </div>

          <SiteCheckStudio />
        </div>
      </main>
    </SiteShell>
  );
}

