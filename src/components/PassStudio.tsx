"use client";

import { wordlist as englishWordlist } from "@scure/bip39/wordlists/english.js";
import { wordlist as portugueseWordlist } from "@scure/bip39/wordlists/portuguese.js";
import { useLocale, useTranslations } from "next-intl";
import {
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  estimatePassphraseEntropy,
  estimatePasswordEntropy,
  generatePassphrase,
  generatePassword,
  strengthFromEntropy,
  type PassphraseOptions,
  type PasswordOptions,
  type PasswordStrength,
} from "@/lib/password-generator";

type Mode = "password" | "passphrase";
type GeneratedSecret = {
  value: string;
  entropy: number;
  strength: PasswordStrength;
};

const defaultPasswordOptions: PasswordOptions = {
  length: 20,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: true,
};

const defaultPassphraseOptions: PassphraseOptions = {
  wordCount: 6,
  separator: "-",
  capitalize: false,
  includeNumber: false,
};

const labelClass =
  "font-mono text-[10px] uppercase tracking-[0.14em] text-muted";
const fieldClass =
  "mt-2 min-h-11 w-full rounded-lg border border-border-strong bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent";

function createPassword(options: PasswordOptions): GeneratedSecret {
  const entropy = estimatePasswordEntropy(options);
  return {
    value: generatePassword(options),
    entropy,
    strength: strengthFromEntropy(entropy),
  };
}

function createPassphrase(
  options: PassphraseOptions,
  wordlist: readonly string[],
): GeneratedSecret {
  const entropy = estimatePassphraseEntropy(options, wordlist.length);
  return {
    value: generatePassphrase(options, wordlist),
    entropy,
    strength: strengthFromEntropy(entropy),
  };
}

export default function PassStudio() {
  const t = useTranslations("pass");
  const locale = useLocale();
  const wordlist = locale === "en" ? englishWordlist : portugueseWordlist;
  const [mode, setMode] = useState<Mode>("password");
  const [passwordOptions, setPasswordOptions] = useState(defaultPasswordOptions);
  const [passphraseOptions, setPassphraseOptions] = useState(
    defaultPassphraseOptions,
  );
  const [secret, setSecret] = useState<GeneratedSecret | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setSecret(createPassword(defaultPasswordOptions));
      } catch {
        setError(t("errors.unavailable"));
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [t]);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const modes: Array<{ value: Mode; label: string }> = [
    { value: "password", label: t("modes.password") },
    { value: "passphrase", label: t("modes.passphrase") },
  ];

  const selectedCharacterSets = [
    passwordOptions.lowercase,
    passwordOptions.uppercase,
    passwordOptions.numbers,
    passwordOptions.symbols,
  ].filter(Boolean).length;

  function generate(nextMode = mode) {
    setError("");
    setCopied(false);
    try {
      setSecret(
        nextMode === "password"
          ? createPassword(passwordOptions)
          : createPassphrase(passphraseOptions, wordlist),
      );
    } catch {
      setSecret(null);
      setError(t("errors.unavailable"));
    }
  }

  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setCopied(false);
    try {
      setSecret(
        nextMode === "password"
          ? createPassword(passwordOptions)
          : createPassphrase(passphraseOptions, wordlist),
      );
    } catch {
      setSecret(null);
      setError(t("errors.unavailable"));
    }
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
    document.getElementById(`pass-tab-${nextMode}`)?.focus();
  }

  async function copySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret.value);
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setError(t("errors.copy"));
    }
  }

  function updateCharacterOption(
    key: "lowercase" | "uppercase" | "numbers" | "symbols",
    checked: boolean,
  ) {
    setPasswordOptions((current) => ({ ...current, [key]: checked }));
  }

  const characterOptions = (
    ["lowercase", "uppercase", "numbers", "symbols"] as const
  ).map((key) => ({ key, label: t(`options.${key}`) }));

  const separators = [
    { value: "-", label: t("separators.hyphen") },
    { value: ".", label: t("separators.dot") },
    { value: "_", label: t("separators.underscore") },
    { value: " ", label: t("separators.space") },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(360px,0.96fr)] xl:items-start">
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
              id={`pass-tab-${item.value}`}
              type="button"
              role="tab"
              aria-selected={mode === item.value}
              aria-controls={`pass-panel-${item.value}`}
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
          id={`pass-panel-${mode}`}
          role="tabpanel"
          aria-labelledby={`pass-tab-${mode}`}
          tabIndex={0}
          className="mt-7 border-t border-border pt-6"
        >
          {mode === "password" ? (
            <div className="space-y-6">
              <label className="block">
                <span className={labelClass}>{t("options.length")}</span>
                <input
                  type="number"
                  min={8}
                  max={128}
                  value={passwordOptions.length}
                  onChange={(event) => {
                    const length = Math.min(
                      128,
                      Math.max(8, Number(event.target.value) || 8),
                    );
                    setPasswordOptions((current) => ({ ...current, length }));
                  }}
                  className={fieldClass}
                  inputMode="numeric"
                />
              </label>

              <fieldset>
                <legend className={labelClass}>{t("options.characters")}</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {characterOptions.map(({ key, label }) => {
                    const isLastSelected =
                      passwordOptions[key] && selectedCharacterSets === 1;
                    return (
                      <label
                        key={key}
                        className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-bg px-3.5 text-sm text-muted"
                      >
                        <input
                          type="checkbox"
                          checked={passwordOptions[key]}
                          disabled={isLastSelected}
                          onChange={(event) =>
                            updateCharacterOption(key, event.target.checked)
                          }
                          className="h-4 w-4 accent-accent"
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-bg px-3.5 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={passwordOptions.excludeAmbiguous}
                  onChange={(event) =>
                    setPasswordOptions((current) => ({
                      ...current,
                      excludeAmbiguous: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-accent"
                />
                {t("options.exclude_ambiguous")}
              </label>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>{t("options.word_count")}</span>
                <input
                  type="number"
                  min={4}
                  max={10}
                  value={passphraseOptions.wordCount}
                  onChange={(event) => {
                    const wordCount = Math.min(
                      10,
                      Math.max(4, Number(event.target.value) || 4),
                    );
                    setPassphraseOptions((current) => ({
                      ...current,
                      wordCount,
                    }));
                  }}
                  className={fieldClass}
                  inputMode="numeric"
                />
              </label>
              <label className="block">
                <span className={labelClass}>{t("options.separator")}</span>
                <select
                  value={passphraseOptions.separator}
                  onChange={(event) =>
                    setPassphraseOptions((current) => ({
                      ...current,
                      separator: event.target.value,
                    }))
                  }
                  className={fieldClass}
                >
                  {separators.map((separator) => (
                    <option key={separator.value} value={separator.value}>
                      {separator.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-bg px-3.5 text-sm text-muted sm:col-span-2">
                <input
                  type="checkbox"
                  checked={passphraseOptions.capitalize}
                  onChange={(event) =>
                    setPassphraseOptions((current) => ({
                      ...current,
                      capitalize: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-accent"
                />
                {t("options.capitalize")}
              </label>
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-bg px-3.5 text-sm text-muted sm:col-span-2">
                <input
                  type="checkbox"
                  checked={passphraseOptions.includeNumber}
                  onChange={(event) =>
                    setPassphraseOptions((current) => ({
                      ...current,
                      includeNumber: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-accent"
                />
                {t("options.include_number")}
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={() => generate()}
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-accent px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-accent-hover"
          >
            {t("generate")}
            <span className="ml-3 text-base" aria-hidden="true">↻</span>
          </button>
        </div>
      </section>

      <div className="space-y-6 xl:sticky xl:top-24">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={labelClass}>{t("result_title")}</p>
              <p className="mt-2 text-sm text-muted">{t("result_hint")}</p>
            </div>
            {secret && (
              <span className="rounded-full bg-accent/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
                {t(`strength.${secret.strength}`)}
              </span>
            )}
          </div>

          <output
            aria-live="polite"
            aria-label={t("result_title")}
            className="mt-6 block min-h-28 break-all rounded-xl border border-border-strong bg-bg p-5 font-mono text-xl leading-8 text-ink sm:text-2xl"
          >
            {secret?.value ?? t("generating")}
          </output>

          {secret && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                {t("entropy", { bits: Math.round(secret.entropy) })}
              </p>
              <button
                type="button"
                onClick={copySecret}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-strong bg-bg px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink transition-colors hover:border-accent hover:text-accent"
              >
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 text-sm leading-6 text-accent">
              {error}
            </p>
          )}
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
              {t("security_title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {t("entropy_note")}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              {t("security_note")}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
