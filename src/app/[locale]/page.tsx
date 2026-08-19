import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteShell } from "@/components/SiteShell";
import {
  belluzziCampaignUrl,
  isLocale,
  localizedPath,
  REPOSITORY_URL,
  type Locale,
} from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

const icons = {
  qr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <path d="M14 14h2v2h-2zM18 14h2v4h-2zM14 18h4v2h-4zM20 20h.01" />
    </svg>
  ),
  pass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 0h10.5A2.25 2.25 0 0 1 19.5 12.75v6A2.25 2.25 0 0 1 17.25 21H6.75a2.25 2.25 0 0 1-2.25-2.25v-6a2.25 2.25 0 0 1 2.25-2.25Z" />
    </svg>
  ),
  utm: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H17a4 4 0 0 1 0 8h-3.5m-3 4H7a4 4 0 0 1 0-8h3.5m-3 2h9" />
    </svg>
  ),
  data: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3.75 3.75 12l4.5 8.25M15.75 3.75 20.25 12l-4.5 8.25M13.5 4.5l-3 15" />
    </svg>
  ),
};

export default async function HomePage({ params }: Props) {
  const { locale: localeValue } = await params;
  const locale: Locale = isLocale(localeValue) ? localeValue : "pt";
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const common = await getTranslations("common");

  const tools = [
    {
      key: "qr",
      index: "01",
      title: t("qr_title"),
      description: t("qr_description"),
      status: common("available"),
      href: localizedPath(locale, "qr"),
      available: true,
    },
    {
      key: "pass",
      index: "02",
      title: t("pass_title"),
      description: t("pass_description"),
      status: common("available"),
      href: localizedPath(locale, "pass"),
      available: true,
    },
    {
      key: "utm",
      index: "03",
      title: t("utm_title"),
      description: t("utm_description"),
      status: common("available"),
      href: localizedPath(locale, "utm"),
      available: true,
    },
    {
      key: "data",
      index: "04",
      title: t("data_title"),
      description: t("data_description"),
      status: common("planned"),
      available: false,
    },
  ] as const;

  return (
    <SiteShell>
      <main>
        <section className="relative flex min-h-[740px] items-center overflow-hidden border-b border-border px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
          <div className="editorial-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
          <div className="pointer-events-none absolute right-0 top-32 h-72 w-72 rounded-full bg-accent/10 blur-3xl sm:-right-24 sm:h-80 sm:w-80" />

          <div className="relative mx-auto w-full max-w-6xl">
            <div className="max-w-4xl">
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                  {common("open_source")}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                  {common("privacy_first")}
                </span>
              </div>

              <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                {t("eyebrow")}
              </p>
              <h1 className="text-balance font-serif text-[clamp(3rem,8vw,6.8rem)] font-medium leading-[0.93] tracking-[-0.045em] text-ink">
                {t("title")}
                <span className="mt-1 block italic text-accent">{t("title_accent")}</span>
              </h1>
              <p className="mt-8 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                {t("description")}
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#tools"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-6 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-accent-hover"
                >
                  {t("primary_cta")}
                  <span className="ml-3" aria-hidden="true">↓</span>
                </a>
                <a
                  href={REPOSITORY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border-strong bg-surface/60 px-6 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  {t("secondary_cta")}
                  <span className="ml-3" aria-hidden="true">↗</span>
                </a>
              </div>
            </div>

            <div className="mt-20 grid border-y border-border sm:grid-cols-3">
              {(["local", "open", "simple"] as const).map((principle, index) => (
                <div
                  key={principle}
                  className={`py-6 sm:px-6 ${index === 0 ? "sm:pl-0" : "border-t border-border sm:border-l sm:border-t-0"}`}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                    0{index + 1} · {t(`principle_${principle}`)}
                  </p>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
                    {t(`principle_${principle}_text`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tools" className="scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-end">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                  {t("tools_eyebrow")}
                </p>
                <h2 className="mt-4 font-serif text-4xl font-medium tracking-[-0.035em] text-ink sm:text-5xl">
                  {t("tools_title")}
                </h2>
              </div>
              <p className="max-w-xl text-base leading-7 text-muted md:justify-self-end">
                {t("tools_description")}
              </p>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-2">
              {tools.map((tool) => {
                const content = (
                  <>
                    <div className="flex items-start justify-between gap-5">
                      <div className={`h-11 w-11 ${tool.available ? "text-accent" : "text-faint"}`}>
                        {icons[tool.key]}
                      </div>
                      <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] ${
                        tool.available
                          ? "bg-accent/10 text-accent"
                          : "bg-surface-2 text-faint"
                      }`}>
                        {tool.status}
                      </span>
                    </div>
                    <div className="mt-10">
                      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
                        {tool.index}
                      </p>
                      <h3 className="mt-2 font-serif text-3xl font-medium tracking-[-0.025em] text-ink">
                        {tool.title}
                      </h3>
                      <p className="mt-3 max-w-md text-sm leading-6 text-muted">
                        {tool.description}
                      </p>
                    </div>
                    {tool.available && (
                      <div className="mt-8 flex items-center font-mono text-[10px] font-semibold uppercase tracking-widest text-accent">
                        {common("open_tool")} <span className="ml-2" aria-hidden="true">→</span>
                      </div>
                    )}
                  </>
                );

                return tool.available ? (
                  <a
                    key={tool.key}
                    href={tool.href}
                    className="group rounded-2xl border border-border bg-surface p-6 shadow-card transition-all hover:-translate-y-1 hover:border-accent/60 sm:p-8"
                  >
                    {content}
                  </a>
                ) : (
                  <article
                    key={tool.key}
                    className="rounded-2xl border border-border bg-surface/55 p-6 sm:p-8"
                  >
                    {content}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-surface px-5 py-24 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:items-start">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
              {t("manifesto_eyebrow")}
            </p>
            <div>
              <h2 className="font-serif text-4xl font-medium tracking-[-0.035em] text-ink sm:text-5xl">
                {t("manifesto_title")}
              </h2>
              <p className="mt-6 max-w-3xl text-base leading-8 text-muted sm:text-lg">
                {t("manifesto_text")}
              </p>
              <a
                href={belluzziCampaignUrl(locale, "home_manifesto")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center border-b border-accent pb-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-accent transition-colors hover:text-accent-hover"
              >
                {t("manifesto_cta")} <span className="ml-3" aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
