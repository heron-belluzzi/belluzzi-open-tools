"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import type {
  SiteCheckApiError,
  SiteCheckCategory,
  SiteCheckErrorCode,
  SiteCheckReport,
  SiteCheckStatus,
} from "@/lib/site-check/types";

const categories: SiteCheckCategory[] = ["http", "tls", "headers", "seo", "indexing"];
const summaryStatuses: SiteCheckStatus[] = ["pass", "warning", "fail", "info"];

const statusStyles: Record<SiteCheckStatus, string> = {
  pass: "border-success/30 bg-success/10 text-success",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  fail: "border-accent/30 bg-accent/10 text-accent",
  info: "border-border-strong bg-surface-2 text-muted",
};

function trackSiteCheckEvent(name: string, parameters: Record<string, string | number> = {}) {
  const analyticsWindow = window as typeof window & {
    gtag?: (command: "event", name: string, parameters: Record<string, string | number>) => void;
  };
  analyticsWindow.gtag?.("event", name, parameters);
}

export default function SiteCheckStudio() {
  const t = useTranslations("sitecheck");
  const locale = useLocale();
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<SiteCheckReport | null>(null);
  const [errorCode, setErrorCode] = useState<SiteCheckErrorCode | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorCode(null);
    setReport(null);
    trackSiteCheckEvent("sitecheck_started", { locale });

    try {
      const response = await fetch("/api/site-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = (await response.json()) as SiteCheckReport | SiteCheckApiError;
      if (!response.ok || "error" in payload) {
        const code = "error" in payload ? payload.error.code : "TARGET_UNREACHABLE";
        setErrorCode(code);
        trackSiteCheckEvent("sitecheck_failed", { locale, error_code: code });
        return;
      }

      setReport(payload);
      trackSiteCheckEvent("sitecheck_completed", {
        locale,
        passed: payload.summary.pass,
        warnings: payload.summary.warning,
        failed: payload.summary.fail,
      });
    } catch {
      setErrorCode("TARGET_UNREACHABLE");
      trackSiteCheckEvent("sitecheck_failed", {
        locale,
        error_code: "TARGET_UNREACHABLE",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="sitecheck-print-hidden rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8">
        <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {t("url_label")}
            </span>
            <input
              type="text"
              inputMode="url"
              autoComplete="url"
              maxLength={2_048}
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={t("url_placeholder")}
              className="mt-2 min-h-12 w-full rounded-xl border border-border-strong bg-bg px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? t("analyzing") : t("analyze")}
          </button>
        </form>
        <div className="mt-4 flex flex-col gap-2 text-sm leading-6 text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{t("input_hint")}</p>
          <button
            type="button"
            onClick={() => setUrl("belluzzi.dev")}
            className="self-start font-mono text-[10px] uppercase tracking-widest text-accent hover:text-accent-hover sm:self-auto"
          >
            {t("use_example")}
          </button>
        </div>
      </section>

      {errorCode && (
        <div
          role="alert"
          className="sitecheck-print-hidden rounded-2xl border border-accent/30 bg-accent/10 p-5 text-sm leading-6 text-ink"
        >
          <p className="font-semibold text-accent">{t("error_title")}</p>
          <p className="mt-2">{t(`errors.${errorCode}`)}</p>
        </div>
      )}

      {loading && (
        <div role="status" className="sitecheck-print-hidden rounded-2xl border border-border bg-surface p-8">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
          </div>
          <p className="mt-4 text-sm text-muted">{t("loading_note")}</p>
        </div>
      )}

      {report && (
        <article aria-labelledby="sitecheck-report-title" className="sitecheck-report space-y-8">
          <header className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                  {t("report_eyebrow")}
                </p>
                <h2 id="sitecheck-report-title" className="mt-3 font-serif text-3xl font-medium text-ink sm:text-4xl">
                  {t("report_title")}
                </h2>
                <a
                  href={report.target.finalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block break-all text-sm text-muted underline decoration-border-strong underline-offset-4 hover:text-accent"
                >
                  {report.target.finalUrl}
                </a>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="sitecheck-print-hidden inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-border-strong px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink hover:border-accent hover:text-accent"
              >
                {t("print")}
              </button>
            </div>

            <dl className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {summaryStatuses.map((status) => (
                <div key={status} className={`rounded-xl border p-4 ${statusStyles[status]}`}>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.14em]">
                    {t(`statuses.${status}`)}
                  </dt>
                  <dd className="mt-2 font-serif text-3xl font-medium">{report.summary[status]}</dd>
                </div>
              ))}
            </dl>

            <dl className="mt-6 grid gap-x-8 gap-y-3 border-t border-border pt-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-faint">{t("http_status")}</dt>
                <dd className="mt-1 font-medium text-ink">{report.target.status}</dd>
              </div>
              <div>
                <dt className="text-faint">{t("response_time")}</dt>
                <dd className="mt-1 font-medium text-ink">{report.target.responseTimeMs} ms</dd>
              </div>
              <div>
                <dt className="text-faint">{t("redirect_count")}</dt>
                <dd className="mt-1 font-medium text-ink">{report.redirects.length}</dd>
              </div>
              <div>
                <dt className="text-faint">{t("analyzed_at")}</dt>
                <dd className="mt-1 font-medium text-ink">
                  {new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(
                    new Date(report.analyzedAt),
                  )}
                </dd>
              </div>
            </dl>
          </header>

          {categories.map((category) => {
            const checks = report.checks.filter((check) => check.category === category);
            return (
              <section key={category} className="rounded-2xl border border-border bg-surface p-5 sm:p-8">
                <h3 className="font-serif text-2xl font-medium text-ink">
                  {t(`categories.${category}`)}
                </h3>
                <div className="mt-5 divide-y divide-border">
                  {checks.map((check) => (
                    <div key={check.id} className="grid gap-3 py-5 first:pt-0 last:pb-0 md:grid-cols-[auto_1fr]">
                      <span className={`inline-flex h-fit w-fit rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${statusStyles[check.status]}`}>
                        {t(`statuses.${check.status}`)}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-medium text-ink">{t(`checks.${check.id}.title`)}</h4>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {t(`checks.${check.id}.recommendation`)}
                        </p>
                        {check.value && (
                          <code className="mt-3 block max-w-full break-all rounded-lg bg-bg px-3 py-2 text-xs leading-5 text-muted">
                            {check.value}
                          </code>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          <aside className="sitecheck-print-hidden rounded-2xl border border-border bg-surface-2 p-5 text-sm leading-6 text-muted sm:p-6">
            <h3 className="font-medium text-ink">{t("limitations_title")}</h3>
            <p className="mt-2">{t("limitations_note")}</p>
          </aside>
        </article>
      )}

      <aside className="sitecheck-print-hidden rounded-2xl border border-border bg-surface-2 p-5 text-sm leading-6 text-muted sm:p-6">
        <h2 className="font-medium text-ink">{t("privacy_title")}</h2>
        <p className="mt-2">{t("privacy_note")}</p>
      </aside>
    </div>
  );
}

