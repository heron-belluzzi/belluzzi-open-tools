"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  buildCampaignUrl,
  buildWhatsAppLink,
  CAMPAIGN_PRESETS,
  CAMPAIGN_URL_WARNING_LENGTH,
  LinkBuilderError,
  messageCharacterCount,
  type CampaignPresetId,
  type LinkBuilderErrorCode,
} from "@/lib/campaign-links";
import { localizedPath, type Locale } from "@/lib/site";
import {
  QR_HANDOFF_STORAGE_KEY,
  serializeQrHandoff,
} from "@/lib/tool-handoff";

type Mode = "utm" | "whatsapp";

type UtmForm = {
  destination: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  normalizeValues: boolean;
};

type WhatsAppForm = {
  phone: string;
  message: string;
};

const initialUtmForm: UtmForm = {
  destination: "https://belluzzi.dev",
  source: "",
  medium: "",
  campaign: "",
  content: "",
  term: "",
  normalizeValues: true,
};

const initialWhatsAppForm: WhatsAppForm = {
  phone: "",
  message: "",
};

const fieldClass =
  "mt-2 min-h-11 w-full rounded-lg border border-border-strong bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent";
const labelClass =
  "font-mono text-[10px] uppercase tracking-[0.14em] text-muted";

function errorCode(error: unknown): LinkBuilderErrorCode | null {
  return error instanceof LinkBuilderError ? error.code : "destinationInvalid";
}

export default function CampaignLinksStudio() {
  const t = useTranslations("utm");
  const locale = useLocale() as Locale;
  const [mode, setMode] = useState<Mode>("utm");
  const [utm, setUtm] = useState(initialUtmForm);
  const [whatsapp, setWhatsApp] = useState(initialWhatsAppForm);
  const [dirty, setDirty] = useState<Record<Mode, boolean>>({
    utm: false,
    whatsapp: false,
  });
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copyTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const modes: Array<{ value: Mode; label: string }> = [
    { value: "utm", label: t("modes.utm") },
    { value: "whatsapp", label: t("modes.whatsapp") },
  ];

  const result = useMemo(() => {
    try {
      return {
        value:
          mode === "utm"
            ? buildCampaignUrl({
                destination: utm.destination,
                source: utm.source,
                medium: utm.medium,
                campaign: utm.campaign,
                content: utm.content,
                term: utm.term,
                normalizeValues: utm.normalizeValues,
              })
            : buildWhatsAppLink(whatsapp.phone, whatsapp.message),
        error: null,
      };
    } catch (error) {
      return { value: "", error: errorCode(error) };
    }
  }, [mode, utm, whatsapp]);

  const activePreset = (
    Object.entries(CAMPAIGN_PRESETS) as Array<
      [CampaignPresetId, { source: string; medium: string }]
    >
  ).find(
    ([, preset]) =>
      preset.source === utm.source && preset.medium === utm.medium,
  )?.[0];

  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    setCopied(false);
    setCopyError(false);
  }

  function navigateModeTabs(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % modes.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + modes.length) % modes.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = modes.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    const nextMode = modes[nextIndex].value;
    selectMode(nextMode);
    document.getElementById(`campaign-tab-${nextMode}`)?.focus();
  }

  function updateUtm<K extends keyof UtmForm>(field: K, value: UtmForm[K]) {
    setUtm((current) => ({ ...current, [field]: value }));
    setDirty((current) => ({ ...current, utm: true }));
    setCopied(false);
    setCopyError(false);
  }

  function updateWhatsApp<K extends keyof WhatsAppForm>(
    field: K,
    value: WhatsAppForm[K],
  ) {
    setWhatsApp((current) => ({ ...current, [field]: value }));
    setDirty((current) => ({ ...current, whatsapp: true }));
    setCopied(false);
    setCopyError(false);
  }

  function applyPreset(presetId: CampaignPresetId) {
    const preset = CAMPAIGN_PRESETS[presetId];
    setUtm((current) => ({ ...current, ...preset }));
    setDirty((current) => ({ ...current, utm: true }));
    setCopied(false);
    setCopyError(false);
  }

  function clearCurrent() {
    if (mode === "utm") setUtm(initialUtmForm);
    else setWhatsApp(initialWhatsAppForm);
    setDirty((current) => ({ ...current, [mode]: false }));
    setCopied(false);
    setCopyError(false);
  }

  async function copyResult() {
    if (!result.value) return;
    try {
      await navigator.clipboard.writeText(result.value);
      setCopied(true);
      setCopyError(false);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  function sendToQr() {
    if (!result.value) return;
    window.sessionStorage.setItem(
      QR_HANDOFF_STORAGE_KEY,
      serializeQrHandoff(result.value),
    );
    window.location.assign(localizedPath(locale, "qr"));
  }

  const validationMessage =
    dirty[mode] && result.error ? t(`errors.${result.error}`) : "";
  const longUrl =
    mode === "utm" &&
    result.value.length > CAMPAIGN_URL_WARNING_LENGTH;

  const presetIds = Object.keys(CAMPAIGN_PRESETS) as CampaignPresetId[];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:items-start">
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">
        <p className={labelClass}>{t("mode_label")}</p>
        <div
          className="mt-3 grid grid-cols-2 gap-2"
          role="tablist"
          aria-label={t("mode_label")}
        >
          {modes.map((item, index) => (
            <button
              key={item.value}
              id={`campaign-tab-${item.value}`}
              type="button"
              role="tab"
              aria-selected={mode === item.value}
              aria-controls={`campaign-panel-${item.value}`}
              tabIndex={mode === item.value ? 0 : -1}
              onClick={() => selectMode(item.value)}
              onKeyDown={(event) => navigateModeTabs(event, index)}
              className={`min-h-11 rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                mode === item.value
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-bg text-muted hover:border-accent/60 hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          id={`campaign-panel-${mode}`}
          role="tabpanel"
          aria-labelledby={`campaign-tab-${mode}`}
          tabIndex={0}
          className="mt-7 border-t border-border pt-6"
        >
          {mode === "utm" ? (
            <div className="space-y-6">
              <label className="block">
                <span className={labelClass}>{t("fields.destination")}</span>
                <input
                  type="url"
                  value={utm.destination}
                  onChange={(event) =>
                    updateUtm("destination", event.target.value)
                  }
                  placeholder={t("fields.destination_placeholder")}
                  className={fieldClass}
                  autoComplete="url"
                  required
                />
              </label>

              <fieldset>
                <legend className={labelClass}>{t("preset_label")}</legend>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {presetIds.map((presetId) => (
                    <button
                      key={presetId}
                      type="button"
                      aria-pressed={activePreset === presetId}
                      onClick={() => applyPreset(presetId)}
                      className={`min-h-10 rounded-lg border px-2 py-2 font-mono text-[9px] uppercase tracking-wider transition-colors ${
                        activePreset === presetId
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-bg text-muted hover:border-accent/60 hover:text-ink"
                      }`}
                    >
                      {t(`presets.${presetId}`)}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>{t("fields.source")}</span>
                  <input
                    value={utm.source}
                    onChange={(event) => updateUtm("source", event.target.value)}
                    placeholder="google"
                    className={fieldClass}
                    required
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>{t("fields.medium")}</span>
                  <input
                    value={utm.medium}
                    onChange={(event) => updateUtm("medium", event.target.value)}
                    placeholder="cpc"
                    className={fieldClass}
                    required
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>{t("fields.campaign")}</span>
                  <input
                    value={utm.campaign}
                    onChange={(event) =>
                      updateUtm("campaign", event.target.value)
                    }
                    placeholder={t("fields.campaign_placeholder")}
                    className={fieldClass}
                    required
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>{t("fields.content")}</span>
                  <input
                    value={utm.content}
                    onChange={(event) => updateUtm("content", event.target.value)}
                    placeholder={t("fields.content_placeholder")}
                    className={fieldClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>{t("fields.term")}</span>
                  <input
                    value={utm.term}
                    onChange={(event) => updateUtm("term", event.target.value)}
                    placeholder={t("fields.term_placeholder")}
                    className={fieldClass}
                  />
                </label>
              </div>

              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-bg px-3.5 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={utm.normalizeValues}
                  onChange={(event) =>
                    updateUtm("normalizeValues", event.target.checked)
                  }
                  className="h-4 w-4 accent-accent"
                />
                {t("normalize")}
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              <label className="block">
                <span className={labelClass}>{t("fields.phone")}</span>
                <input
                  type="tel"
                  value={whatsapp.phone}
                  onChange={(event) =>
                    updateWhatsApp("phone", event.target.value)
                  }
                  placeholder={t("fields.phone_placeholder")}
                  className={fieldClass}
                  autoComplete="tel"
                  required
                />
              </label>
              <label className="block">
                <span className="flex items-center justify-between gap-3">
                  <span className={labelClass}>{t("fields.message")}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-faint">
                    {t("message_count", {
                      count: messageCharacterCount(whatsapp.message),
                    })}
                  </span>
                </span>
                <textarea
                  value={whatsapp.message}
                  onChange={(event) =>
                    updateWhatsApp("message", event.target.value)
                  }
                  placeholder={t("fields.message_placeholder")}
                  className={`${fieldClass} min-h-40 resize-y`}
                  rows={6}
                />
              </label>
              <p className="text-sm leading-6 text-muted">
                {t("phone_notice")}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={clearCurrent}
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg border border-border-strong bg-bg px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink transition-colors hover:border-accent hover:text-accent"
          >
            {t("clear")}
          </button>
        </div>
      </section>

      <div className="space-y-6 xl:sticky xl:top-24">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">
          <div>
            <p className={labelClass}>{t("result_title")}</p>
            <p className="mt-2 text-sm text-muted">
              {t(`result_hint.${mode}`)}
            </p>
          </div>

          <output
            aria-live="polite"
            aria-label={t("result_title")}
            className="mt-6 block min-h-36 break-all rounded-xl border border-border-strong bg-bg p-5 font-mono text-sm leading-7 text-ink"
          >
            {result.value || t("result_empty")}
          </output>

          {mode === "whatsapp" && whatsapp.message.trim() && (
            <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4">
              <p className={labelClass}>{t("message_preview")}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">
                {whatsapp.message.trim()}
              </p>
            </div>
          )}

          {validationMessage && (
            <p role="alert" className="mt-4 text-sm leading-6 text-accent">
              {validationMessage}
            </p>
          )}
          {copyError && (
            <p role="alert" className="mt-4 text-sm leading-6 text-accent">
              {t("errors.copy")}
            </p>
          )}
          {longUrl && (
            <p role="status" className="mt-4 text-sm leading-6 text-accent">
              {t("long_url_warning")}
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={copyResult}
              disabled={!result.value}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-strong bg-bg px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-45"
            >
              {copied ? t("copied") : t("copy")}
            </button>
            {result.value ? (
              <a
                href={result.value}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-strong bg-bg px-3 py-2 text-center font-mono text-[10px] font-semibold uppercase tracking-widest text-ink transition-colors hover:border-accent hover:text-accent"
              >
                {t("open")}
              </a>
            ) : (
              <span className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-lg border border-border-strong bg-bg px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink opacity-45">
                {t("open")}
              </span>
            )}
            <button
              type="button"
              onClick={sendToQr}
              disabled={!result.value}
              className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45 sm:col-span-1"
            >
              {t("to_qr")}
              <span className="ml-2" aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface/70 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-success" aria-hidden="true">✓</span>
            <div>
              <h2 className="font-serif text-xl font-medium text-ink">
                {t("privacy_title")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t("privacy_note")}
              </p>
            </div>
          </div>
          <div className="mt-5 border-t border-border pt-5">
            <h2 className="font-serif text-xl font-medium text-ink">
              {t("guidance_title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {t(`guidance.${mode}`)}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              {t("qr_handoff_note")}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
