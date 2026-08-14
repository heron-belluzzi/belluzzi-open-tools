"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import {
  buildContactPayload,
  buildEmailPayload,
  buildEventPayload,
  buildWhatsAppPayload,
  buildWifiPayload,
  normalizeWebUrl,
  type WifiEncryption,
} from "@/lib/qr-payload";
import {
  addLogoToSvg,
  contrastRatio,
  MIN_QR_CONTRAST,
} from "@/lib/qr-design";

type ContentType =
  | "url"
  | "text"
  | "wifi"
  | "contact"
  | "event"
  | "whatsapp"
  | "email";
type ErrorCorrection = "L" | "M" | "Q" | "H";

type LogoState = {
  dataUrl: string;
  key: string;
  name: string;
};

type FormState = {
  url: string;
  text: string;
  ssid: string;
  wifiPassword: string;
  encryption: WifiEncryption;
  hidden: boolean;
  name: string;
  organization: string;
  phone: string;
  contactEmail: string;
  website: string;
  whatsappPhone: string;
  whatsappMessage: string;
  emailAddress: string;
  subject: string;
  body: string;
  eventTitle: string;
  eventStart: string;
  eventEnd: string;
  eventLocation: string;
  eventDescription: string;
};

const initialForm: FormState = {
  url: "https://belluzzi.dev",
  text: "",
  ssid: "",
  wifiPassword: "",
  encryption: "WPA",
  hidden: false,
  name: "",
  organization: "",
  phone: "",
  contactEmail: "",
  website: "",
  whatsappPhone: "",
  whatsappMessage: "",
  emailAddress: "",
  subject: "",
  body: "",
  eventTitle: "",
  eventStart: "",
  eventEnd: "",
  eventLocation: "",
  eventDescription: "",
};

const fieldClass =
  "mt-2 min-h-11 w-full rounded-lg border border-border-strong bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent";
const labelClass = "font-mono text-[10px] uppercase tracking-[0.14em] text-muted";

function setDownload(data: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = data;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Invalid file result"));
    });
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Image load failed")));
    image.src = source;
  });
}

async function addLogoToPng(
  qrDataUrl: string,
  logoDataUrl: string,
  background: string,
  size: number,
) {
  const [qrImage, logoImage] = await Promise.all([
    loadImage(qrDataUrl),
    loadImage(logoDataUrl),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  context.drawImage(qrImage, 0, 0, size, size);

  const plateSize = size * 0.24;
  const logoBoxSize = size * 0.18;
  const plateOffset = (size - plateSize) / 2;
  const plateRadius = size * 0.025;
  context.fillStyle = background;
  context.beginPath();
  context.roundRect(
    plateOffset,
    plateOffset,
    plateSize,
    plateSize,
    plateRadius,
  );
  context.fill();

  const scale = Math.min(
    logoBoxSize / logoImage.naturalWidth,
    logoBoxSize / logoImage.naturalHeight,
  );
  const logoWidth = logoImage.naturalWidth * scale;
  const logoHeight = logoImage.naturalHeight * scale;
  context.drawImage(
    logoImage,
    (size - logoWidth) / 2,
    (size - logoHeight) / 2,
    logoWidth,
    logoHeight,
  );

  return canvas.toDataURL("image/png");
}

export default function QRStudio() {
  const t = useTranslations("qr");
  const common = useTranslations("common");
  const [contentType, setContentType] = useState<ContentType>("url");
  const [form, setForm] = useState<FormState>(initialForm);
  const [foreground, setForeground] = useState("#16161a");
  const [background, setBackground] = useState("#ffffff");
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(3);
  const [correction, setCorrection] = useState<ErrorCorrection>("M");
  const [logo, setLogo] = useState<LogoState | null>(null);
  const [logoError, setLogoError] = useState("");
  const [logoInputKey, setLogoInputKey] = useState(0);
  const [previewState, setPreviewState] = useState({
    key: "",
    dataUrl: "",
    error: false,
  });

  const types: Array<{ value: ContentType; label: string }> = [
    { value: "url", label: t("types.url") },
    { value: "text", label: t("types.text") },
    { value: "wifi", label: t("types.wifi") },
    { value: "contact", label: t("types.contact") },
    { value: "event", label: t("types.event") },
    { value: "whatsapp", label: t("types.whatsapp") },
    { value: "email", label: t("types.email") },
  ];

  const result = useMemo(() => {
    switch (contentType) {
      case "url":
        return form.url.trim()
          ? { payload: normalizeWebUrl(form.url), error: "" }
          : { payload: "", error: t("errors.required") };
      case "text":
        return form.text.trim()
          ? { payload: form.text, error: "" }
          : { payload: "", error: t("errors.required") };
      case "wifi":
        return form.ssid.trim()
          ? {
              payload: buildWifiPayload({
                ssid: form.ssid,
                password: form.wifiPassword,
                encryption: form.encryption,
                hidden: form.hidden,
              }),
              error: "",
            }
          : { payload: "", error: t("errors.required") };
      case "contact":
        return form.name.trim()
          ? {
              payload: buildContactPayload({
                name: form.name,
                organization: form.organization,
                phone: form.phone,
                email: form.contactEmail,
                website: form.website,
              }),
              error: "",
            }
          : { payload: "", error: t("errors.required") };
      case "event":
        if (!form.eventTitle.trim()) {
          return { payload: "", error: t("errors.required") };
        }
        if (
          !form.eventStart ||
          !form.eventEnd ||
          form.eventEnd <= form.eventStart
        ) {
          return { payload: "", error: t("errors.event_dates") };
        }
        return {
          payload: buildEventPayload({
            title: form.eventTitle,
            start: form.eventStart,
            end: form.eventEnd,
            location: form.eventLocation,
            description: form.eventDescription,
          }),
          error: "",
        };
      case "whatsapp": {
        const phoneDigits = form.whatsappPhone.replace(/\D/g, "");
        if (!phoneDigits) return { payload: "", error: t("errors.required") };
        if (phoneDigits.length < 8) return { payload: "", error: t("errors.phone") };
        return {
          payload: buildWhatsAppPayload(form.whatsappPhone, form.whatsappMessage),
          error: "",
        };
      }
      case "email":
        return form.emailAddress.trim()
          ? {
              payload: buildEmailPayload({
                email: form.emailAddress,
                subject: form.subject,
                body: form.body,
              }),
              error: "",
            }
          : { payload: "", error: t("errors.required") };
    }
  }, [contentType, form, t]);

  const effectiveCorrection: ErrorCorrection = logo ? "H" : correction;
  const ratio = contrastRatio(foreground, background);
  const lowContrast = ratio < MIN_QR_CONTRAST;

  const generationKey = result.payload
    ? [
        result.payload,
        foreground,
        background,
        size,
        margin,
        effectiveCorrection,
        logo?.key ?? "",
      ].join("\u0000")
    : "";
  const preview = previewState.key === generationKey ? previewState.dataUrl : "";
  const generationError =
    previewState.key === generationKey && previewState.error;

  useEffect(() => {
    let cancelled = false;

    if (!result.payload) {
      return;
    }

    const timer = window.setTimeout(() => {
      QRCode.toDataURL(result.payload, {
        width: size,
        margin,
        errorCorrectionLevel: effectiveCorrection,
        color: { dark: foreground, light: background },
      })
        .then((dataUrl) =>
          logo
            ? addLogoToPng(dataUrl, logo.dataUrl, background, size)
            : dataUrl,
        )
        .then((dataUrl) => {
          if (!cancelled) {
            setPreviewState({ key: generationKey, dataUrl, error: false });
          }
        })
        .catch(() => {
          if (!cancelled) {
            setPreviewState({ key: generationKey, dataUrl: "", error: true });
          }
        });
    }, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    background,
    effectiveCorrection,
    foreground,
    generationKey,
    logo,
    margin,
    result.payload,
    size,
  ]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function navigateTypeTabs(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % types.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + types.length) % types.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = types.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    const nextType = types[nextIndex];
    setContentType(nextType.value);
    document.getElementById(`qr-tab-${nextType.value}`)?.focus();
  }

  async function downloadSvg() {
    if (!result.payload) return;
    const svg = await QRCode.toString(result.payload, {
      type: "svg",
      width: size,
      margin,
      errorCorrectionLevel: effectiveCorrection,
      color: { dark: foreground, light: background },
    });
    const finishedSvg = logo
      ? addLogoToSvg(svg, logo.dataUrl, background)
      : svg;
    const data = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(finishedSvg)}`;
    setDownload(data, `belluzzi-qr-${contentType}.svg`);
  }

  async function selectLogo(file?: File) {
    setLogoError("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setLogoError(t("errors.logo_type"));
      setLogoInputKey((key) => key + 1);
      return;
    }
    if (file.size > 1024 * 1024) {
      setLogoError(t("errors.logo_size"));
      setLogoInputKey((key) => key + 1);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      await loadImage(dataUrl);
      setLogo({
        dataUrl,
        key: `${file.name}:${file.size}:${file.lastModified}`,
        name: file.name,
      });
      setCorrection("H");
    } catch {
      setLogoError(t("errors.logo_read"));
      setLogoInputKey((key) => key + 1);
    }
  }

  function removeLogo() {
    setLogo(null);
    setLogoError("");
    setLogoInputKey((key) => key + 1);
  }

  function reset() {
    setForm({ ...initialForm, url: "" });
    setForeground("#16161a");
    setBackground("#ffffff");
    setSize(512);
    setMargin(3);
    setCorrection("M");
    setLogo(null);
    setLogoError("");
    setLogoInputKey((key) => key + 1);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] xl:items-start">
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">
          <p className={labelClass}>{t("types_label")}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label={t("types_label")}>
            {types.map((type, index) => (
              <button
                key={type.value}
                id={`qr-tab-${type.value}`}
                type="button"
                role="tab"
                aria-selected={contentType === type.value}
                aria-controls={`qr-panel-${type.value}`}
                tabIndex={contentType === type.value ? 0 : -1}
                onClick={() => setContentType(type.value)}
                onKeyDown={(event) => navigateTypeTabs(event, index)}
                className={`min-h-10 rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  contentType === type.value
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-bg text-muted hover:border-accent/60 hover:text-ink"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div
            id={`qr-panel-${contentType}`}
            role="tabpanel"
            aria-labelledby={`qr-tab-${contentType}`}
            tabIndex={0}
            className="mt-7 border-t border-border pt-6"
          >
            {contentType === "url" && (
              <label className="block">
                <span className={labelClass}>{t("fields.url")}</span>
                <input
                  type="url"
                  value={form.url}
                  onChange={(event) => update("url", event.target.value)}
                  placeholder={t("fields.url_placeholder")}
                  className={fieldClass}
                  autoComplete="url"
                />
              </label>
            )}

            {contentType === "text" && (
              <label className="block">
                <span className={labelClass}>{t("fields.text")}</span>
                <textarea
                  value={form.text}
                  onChange={(event) => update("text", event.target.value)}
                  placeholder={t("fields.text_placeholder")}
                  className={`${fieldClass} min-h-32 resize-y`}
                  rows={5}
                />
              </label>
            )}

            {contentType === "wifi" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelClass}>{t("fields.ssid")}</span>
                  <input
                    value={form.ssid}
                    onChange={(event) => update("ssid", event.target.value)}
                    placeholder={t("fields.ssid_placeholder")}
                    className={fieldClass}
                    autoComplete="off"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>{t("fields.encryption")}</span>
                  <select
                    value={form.encryption}
                    onChange={(event) => update("encryption", event.target.value as WifiEncryption)}
                    className={fieldClass}
                  >
                    <option value="WPA">{t("security_wpa")}</option>
                    <option value="WEP">{t("security_wep")}</option>
                    <option value="nopass">{t("security_open")}</option>
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>{t("fields.password")}</span>
                  <input
                    type="password"
                    value={form.wifiPassword}
                    onChange={(event) => update("wifiPassword", event.target.value)}
                    placeholder={t("fields.password_placeholder")}
                    className={fieldClass}
                    disabled={form.encryption === "nopass"}
                    autoComplete="new-password"
                  />
                </label>
                <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-bg px-3.5 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.hidden}
                    onChange={(event) => update("hidden", event.target.checked)}
                    className="h-4 w-4 accent-accent"
                  />
                  <span className="text-sm text-muted">{t("fields.hidden")}</span>
                </label>
              </div>
            )}

            {contentType === "contact" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelClass}>{t("fields.name")}</span>
                  <input value={form.name} onChange={(event) => update("name", event.target.value)} className={fieldClass} autoComplete="name" />
                </label>
                <label className="block">
                  <span className={labelClass}>{t("fields.organization")}</span>
                  <input value={form.organization} onChange={(event) => update("organization", event.target.value)} className={fieldClass} autoComplete="organization" />
                </label>
                <label className="block">
                  <span className={labelClass}>{t("fields.phone")}</span>
                  <input type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder={t("fields.phone_placeholder")} className={fieldClass} autoComplete="tel" />
                </label>
                <label className="block">
                  <span className={labelClass}>{t("fields.contact_email")}</span>
                  <input type="email" value={form.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} className={fieldClass} autoComplete="email" />
                </label>
                <label className="block">
                  <span className={labelClass}>{t("fields.website")}</span>
                  <input type="url" value={form.website} onChange={(event) => update("website", event.target.value)} className={fieldClass} autoComplete="url" />
                </label>
              </div>
            )}

            {contentType === "event" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelClass}>{t("fields.event_title")}</span>
                  <input
                    value={form.eventTitle}
                    onChange={(event) => update("eventTitle", event.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>{t("fields.event_start")}</span>
                  <input
                    type="datetime-local"
                    value={form.eventStart}
                    onChange={(event) => update("eventStart", event.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>{t("fields.event_end")}</span>
                  <input
                    type="datetime-local"
                    value={form.eventEnd}
                    min={form.eventStart || undefined}
                    onChange={(event) => update("eventEnd", event.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>{t("fields.event_location")}</span>
                  <input
                    value={form.eventLocation}
                    onChange={(event) => update("eventLocation", event.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>{t("fields.event_description")}</span>
                  <textarea
                    value={form.eventDescription}
                    onChange={(event) => update("eventDescription", event.target.value)}
                    className={`${fieldClass} min-h-24 resize-y`}
                    rows={3}
                  />
                </label>
              </div>
            )}

            {contentType === "whatsapp" && (
              <div className="grid gap-5">
                <label className="block">
                  <span className={labelClass}>{t("fields.whatsapp_phone")}</span>
                  <input
                    type="tel"
                    value={form.whatsappPhone}
                    onChange={(event) => update("whatsappPhone", event.target.value)}
                    placeholder={t("fields.phone_placeholder")}
                    className={fieldClass}
                    autoComplete="tel"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>{t("fields.message")}</span>
                  <textarea
                    value={form.whatsappMessage}
                    onChange={(event) => update("whatsappMessage", event.target.value)}
                    placeholder={t("fields.message_placeholder")}
                    className={`${fieldClass} min-h-28 resize-y`}
                    rows={4}
                  />
                </label>
              </div>
            )}

            {contentType === "email" && (
              <div className="grid gap-5">
                <label className="block">
                  <span className={labelClass}>{t("fields.email_address")}</span>
                  <input type="email" value={form.emailAddress} onChange={(event) => update("emailAddress", event.target.value)} className={fieldClass} autoComplete="email" />
                </label>
                <label className="block">
                  <span className={labelClass}>{t("fields.subject")}</span>
                  <input value={form.subject} onChange={(event) => update("subject", event.target.value)} className={fieldClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>{t("fields.body")}</span>
                  <textarea value={form.body} onChange={(event) => update("body", event.target.value)} className={`${fieldClass} min-h-28 resize-y`} rows={4} />
                </label>
              </div>
            )}

            {result.error && (
              <p className="mt-4 text-sm text-accent" role="status">{result.error}</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-2xl font-medium text-ink">{t("options_title")}</h2>
            <button type="button" onClick={reset} className="font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-accent">
              {t("reset")}
            </button>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>{t("foreground")}</span>
              <span className="mt-2 flex min-h-11 items-center gap-3 rounded-lg border border-border-strong bg-bg px-3">
                <input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} className="h-7 w-8 cursor-pointer border-0 bg-transparent p-0" />
                <span className="font-mono text-xs uppercase text-muted">{foreground}</span>
              </span>
            </label>
            <label className="block">
              <span className={labelClass}>{t("background")}</span>
              <span className="mt-2 flex min-h-11 items-center gap-3 rounded-lg border border-border-strong bg-bg px-3">
                <input type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="h-7 w-8 cursor-pointer border-0 bg-transparent p-0" />
                <span className="font-mono text-xs uppercase text-muted">{background}</span>
              </span>
            </label>
            <div className="sm:col-span-2" aria-live="polite">
              <p
                className={`rounded-lg border px-3.5 py-3 text-sm ${
                  lowContrast
                    ? "border-accent/40 bg-accent/5 text-accent"
                    : "border-success/30 bg-success/5 text-success"
                }`}
              >
                {t(lowContrast ? "contrast_low" : "contrast_good", {
                  ratio: ratio.toFixed(1),
                })}
              </p>
            </div>
            <label className="block sm:col-span-2">
              <span className="flex items-center justify-between gap-4">
                <span className={labelClass}>{t("size")}</span>
                <span className="font-mono text-xs text-muted">{size}px</span>
              </span>
              <input type="range" min="256" max="1024" step="64" value={size} onChange={(event) => setSize(Number(event.target.value))} className="mt-3 w-full accent-accent" />
            </label>
            <label className="block">
              <span className={labelClass}>{t("margin")}</span>
              <select value={margin} onChange={(event) => setMargin(Number(event.target.value))} className={fieldClass}>
                {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>{t("correction")}</span>
              <select
                value={effectiveCorrection}
                onChange={(event) => setCorrection(event.target.value as ErrorCorrection)}
                className={fieldClass}
                disabled={Boolean(logo)}
              >
                {(["L", "M", "Q", "H"] as const).map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <div className="rounded-xl border border-border bg-bg p-4 sm:col-span-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={labelClass}>{t("logo")}</p>
                  <p className="mt-2 text-xs leading-5 text-faint">{t("logo_hint")}</p>
                  {logo && (
                    <p className="mt-2 max-w-sm truncate font-mono text-xs text-muted">
                      {logo.name}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <label
                    htmlFor="qr-logo"
                    className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-border-strong bg-surface px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink transition-colors hover:border-accent hover:text-accent"
                  >
                    {t("logo_choose")}
                  </label>
                  <input
                    key={logoInputKey}
                    id="qr-logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) => void selectLogo(event.target.files?.[0])}
                  />
                  {logo && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="min-h-10 rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-accent"
                    >
                      {t("logo_remove")}
                    </button>
                  )}
                </div>
              </div>
              {logoError && (
                <p className="mt-3 text-sm text-accent" role="alert">
                  {logoError}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <aside className="xl:sticky xl:top-24">
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-serif text-2xl font-medium text-ink">{t("preview_title")}</h2>
              <p className="mt-1 text-xs text-faint">{t("preview_hint")}</p>
            </div>
            <span className="rounded-full bg-success/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-success">
              {common("local_processing")}
            </span>
          </div>

          <div className="editorial-grid flex min-h-[380px] items-center justify-center p-7 sm:min-h-[480px] sm:p-10">
            {preview ? (
              <div className="w-full max-w-[420px] overflow-hidden rounded-xl border border-border bg-white p-3 shadow-card">
                <Image
                  src={preview}
                  alt={t("status_ready")}
                  width={size}
                  height={size}
                  unoptimized
                  className="h-auto w-full"
                  priority
                />
              </div>
            ) : (
              <div className="max-w-xs text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface text-faint">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} aria-hidden="true">
                    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v4h-2zM14 18h4v2h-4z" />
                  </svg>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted">
                  {generationError ? t("status_error") : t("empty_preview")}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-border p-5 sm:p-6">
            <p className="mb-4 flex items-center gap-2 text-xs text-muted">
              <svg className="h-4 w-4 shrink-0 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              {t("privacy_note")}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={!preview}
                onClick={() => preview && setDownload(preview, `belluzzi-qr-${contentType}.png`)}
                className="min-h-11 rounded-lg bg-accent px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("download_png")}
              </button>
              <button
                type="button"
                disabled={!preview}
                onClick={() => void downloadSvg()}
                className="min-h-11 rounded-lg border border-border-strong bg-bg px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("download_svg")}
              </button>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
