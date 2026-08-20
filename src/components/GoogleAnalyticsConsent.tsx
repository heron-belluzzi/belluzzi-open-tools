"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useState, useSyncExternalStore } from "react";

type AnalyticsConsent = "granted" | "denied";

type Props = {
  gaId: string;
  locale: string;
};

const STORAGE_KEY = "belluzzi:analytics-consent:v1";
const CONSENT_EVENT = "belluzzi:analytics-consent-change";

function getStoredConsent(): AnalyticsConsent | null {
  try {
    const storedConsent = window.localStorage.getItem(STORAGE_KEY);
    return storedConsent === "granted" || storedConsent === "denied"
      ? storedConsent
      : null;
  } catch {
    return null;
  }
}

function subscribeToConsent(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CONSENT_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CONSENT_EVENT, onStoreChange);
  };
}

function subscribeToHydration() {
  return () => undefined;
}

const copy = {
  pt: {
    title: "Analytics opcional",
    description:
      "Usamos o Google Analytics para entender visitas e melhorar esta experiência. A tag só é carregada se você aceitar; o conteúdo processado nas ferramentas não é enviado.",
    accept: "Aceitar analytics",
    reject: "Recusar",
    settings: "Privacidade",
    label: "Preferências de analytics",
  },
  en: {
    title: "Optional analytics",
    description:
      "We use Google Analytics to understand visits and improve this experience. The tag only loads if you accept; content processed by the tools is not sent.",
    accept: "Accept analytics",
    reject: "Decline",
    settings: "Privacy",
    label: "Analytics preferences",
  },
} as const;

export default function GoogleAnalyticsConsent({ gaId, locale }: Props) {
  const storedConsent = useSyncExternalStore(
    subscribeToConsent,
    getStoredConsent,
    () => null,
  );
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [fallbackConsent, setFallbackConsent] = useState<AnalyticsConsent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const consent = fallbackConsent ?? storedConsent;
  const content = locale === "pt" ? copy.pt : copy.en;

  function saveConsent(nextConsent: AnalyticsConsent) {
    const shouldReload = consent === "granted" && nextConsent === "denied";

    try {
      window.localStorage.setItem(STORAGE_KEY, nextConsent);
      window.dispatchEvent(new Event(CONSENT_EVENT));
    } catch {
      setFallbackConsent(nextConsent);
    }

    setIsOpen(false);

    if (shouldReload) {
      window.location.reload();
    }
  }

  if (!isHydrated) {
    return null;
  }

  return (
    <>
      {consent === "granted" ? <GoogleAnalytics gaId={gaId} /> : null}

      {consent === null || isOpen ? (
        <section
          aria-label={content.label}
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-border-strong bg-surface p-5 shadow-2xl shadow-black/20 sm:p-6"
          role="dialog"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2 className="font-serif text-xl font-medium text-ink">{content.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{content.description}</p>
            </div>
            <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row">
              <button
                className="min-h-11 rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                onClick={() => saveConsent("denied")}
                type="button"
              >
                {content.reject}
              </button>
              <button
                className="min-h-11 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                onClick={() => saveConsent("granted")}
                type="button"
              >
                {content.accept}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {consent !== null && !isOpen ? (
        <button
          aria-label={content.label}
          className="fixed bottom-3 left-3 z-[90] rounded-full border border-border bg-surface/95 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted shadow-sm backdrop-blur transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          {content.settings}
        </button>
      ) : null}
    </>
  );
}
