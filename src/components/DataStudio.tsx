"use client";

import { useTranslations } from "next-intl";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  csvToJson,
  DATA_INPUT_LIMIT_BYTES,
  type DataFormat,
  DataToolkitError,
  formatJson,
  jsonToCsv,
  jsonToYaml,
  minifyJson,
  parseCsv,
  yamlToJson,
} from "@/lib/data-toolkit";

type Operation =
  | "formatJson"
  | "minifyJson"
  | "jsonToYaml"
  | "jsonToCsv"
  | "yamlToJson"
  | "csvToJson";

const fieldClass =
  "mt-2 min-h-80 w-full resize-y rounded-xl border border-border-strong bg-bg p-4 font-mono text-[13px] leading-6 text-ink outline-none transition-colors placeholder:text-faint focus:border-accent";
const labelClass =
  "font-mono text-[10px] uppercase tracking-[0.14em] text-muted";

const operations: Record<DataFormat, Operation[]> = {
  json: ["formatJson", "minifyJson", "jsonToYaml", "jsonToCsv"],
  yaml: ["yamlToJson"],
  csv: ["csvToJson"],
};

const samples: Record<DataFormat, string> = {
  json: `[
  {"name":"Belluzzi Open Tools","type":"open_source","active":true},
  {"name":"Data Toolkit","type":"utility","active":true}
]`,
  yaml: `project: Belluzzi Open Tools
release: 0.4.0
features:
  - JSON
  - YAML
  - CSV
privateByDefault: true`,
  csv: `name,type,active
"Belluzzi Open Tools",open_source,true
"Data Toolkit",utility,true`,
};

const outputFormatByOperation: Record<Operation, DataFormat> = {
  formatJson: "json",
  minifyJson: "json",
  jsonToYaml: "yaml",
  jsonToCsv: "csv",
  yamlToJson: "json",
  csvToJson: "json",
};

function inputBytes(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export default function DataStudio() {
  const t = useTranslations("data");
  const [mode, setMode] = useState<DataFormat>("json");
  const [operation, setOperation] = useState<Operation>("formatJson");
  const [input, setInput] = useState(samples.json);
  const [output, setOutput] = useState("");
  const [outputFormat, setOutputFormat] = useState<DataFormat>("json");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const modes: Array<{ value: DataFormat; label: string }> = [
    { value: "json", label: "JSON" },
    { value: "yaml", label: "YAML" },
    { value: "csv", label: "CSV" },
  ];

  const preview = useMemo(() => {
    const csv = mode === "csv" ? input : outputFormat === "csv" ? output : "";
    if (!csv.trim()) return null;
    try {
      return parseCsv(csv);
    } catch {
      return null;
    }
  }, [input, mode, output, outputFormat]);

  function selectMode(nextMode: DataFormat) {
    setMode(nextMode);
    setOperation(operations[nextMode][0]);
    setInput(samples[nextMode]);
    setOutput("");
    setOutputFormat(nextMode);
    setError("");
    setCopied(false);
  }

  function navigateTabs(
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
    document.getElementById(`data-tab-${nextMode}`)?.focus();
  }

  function errorMessage(cause: unknown) {
    if (!(cause instanceof DataToolkitError)) return t("errors.unexpected");
    const message = t(`errors.${cause.code}`);
    return cause.line && cause.column
      ? `${message} ${t("errors.location", { line: cause.line, column: cause.column })}`
      : message;
  }

  function processInput() {
    try {
      const result =
        operation === "formatJson"
          ? formatJson(input)
          : operation === "minifyJson"
            ? minifyJson(input)
            : operation === "jsonToYaml"
              ? jsonToYaml(input)
              : operation === "jsonToCsv"
                ? jsonToCsv(input)
                : operation === "yamlToJson"
                  ? yamlToJson(input)
                  : csvToJson(input);
      setOutput(result);
      setOutputFormat(outputFormatByOperation[operation]);
      setError("");
      setCopied(false);
    } catch (cause) {
      setOutput("");
      setError(errorMessage(cause));
      setCopied(false);
    }
  }

  function clear() {
    setInput("");
    setOutput("");
    setError("");
    setCopied(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function loadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > DATA_INPUT_LIMIT_BYTES) {
      setError(t("errors.inputTooLarge"));
      event.target.value = "";
      return;
    }
    try {
      setInput(await file.text());
      setOutput("");
      setError("");
      setCopied(false);
    } catch {
      setError(t("errors.fileRead"));
    }
  }

  async function copyOutput() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setError(t("errors.copy"));
    }
  }

  function downloadOutput() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `belluzzi-data.${outputFormat === "yaml" ? "yaml" : outputFormat}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const bytes = inputBytes(input);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className={labelClass}>{t("format_label")}</p>
            <div
              className="mt-3 grid grid-cols-3 gap-2"
              role="tablist"
              aria-label={t("format_label")}
            >
              {modes.map((item, index) => (
                <button
                  key={item.value}
                  id={`data-tab-${item.value}`}
                  type="button"
                  role="tab"
                  aria-selected={mode === item.value}
                  aria-controls="data-editor"
                  tabIndex={mode === item.value ? 0 : -1}
                  onClick={() => selectMode(item.value)}
                  onKeyDown={(event) => navigateTabs(event, index)}
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
          </div>

          <div>
            <p className={labelClass}>{t("operation_label")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {operations[mode].map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={operation === item}
                  onClick={() => setOperation(item)}
                  className={`min-h-11 rounded-lg border px-3.5 py-2 font-mono text-[9px] uppercase tracking-wider transition-colors ${
                    operation === item
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-bg text-muted hover:border-accent/60 hover:text-ink"
                  }`}
                >
                  {t(`operations.${item}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div
        id="data-editor"
        role="tabpanel"
        aria-labelledby={`data-tab-${mode}`}
        className="grid gap-6 xl:grid-cols-2"
      >
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <label htmlFor="data-input" className={labelClass}>
                {t("input_label")}
              </label>
              <p className="mt-2 text-sm text-muted">{t("input_hint")}</p>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-faint">
              {t("size", { current: bytes, limit: DATA_INPUT_LIMIT_BYTES })}
            </span>
          </div>
          <textarea
            id="data-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setOutput("");
              setError("");
            }}
            className={fieldClass}
            spellCheck={false}
            aria-invalid={Boolean(error)}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-border-strong bg-bg px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink transition-colors hover:border-accent hover:text-accent">
              {t("choose_file")}
              <input
                ref={fileInput}
                type="file"
                accept=".json,.yaml,.yml,.csv,.txt,application/json,text/csv,text/yaml"
                onChange={loadFile}
                className="sr-only"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setInput(samples[mode]);
                setOutput("");
                setError("");
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-strong bg-bg px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink transition-colors hover:border-accent hover:text-accent"
            >
              {t("load_sample")}
            </button>
            <button
              type="button"
              onClick={clear}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-strong bg-bg px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink transition-colors hover:border-accent hover:text-accent"
            >
              {t("clear")}
            </button>
          </div>
          <button
            type="button"
            onClick={processInput}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-accent px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-accent-hover"
          >
            {t("process")}
            <span className="ml-2" aria-hidden="true">→</span>
          </button>
          {error && (
            <p role="alert" className="mt-4 text-sm leading-6 text-accent">
              {error}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">
          <div>
            <p className={labelClass}>{t("output_label")}</p>
            <p className="mt-2 text-sm text-muted">
              {output ? t("output_ready", { format: outputFormat.toUpperCase() }) : t("output_empty")}
            </p>
          </div>
          <textarea
            value={output}
            readOnly
            aria-label={t("output_label")}
            placeholder={t("output_placeholder")}
            className={`${fieldClass} bg-surface-2`}
            spellCheck={false}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copyOutput}
              disabled={!output}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-strong bg-bg px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-45"
            >
              {copied ? t("copied") : t("copy")}
            </button>
            <button
              type="button"
              onClick={downloadOutput}
              disabled={!output}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-strong bg-bg px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-45"
            >
              {t("download")}
            </button>
          </div>
        </section>
      </div>

      {preview && (
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="border-b border-border p-5 sm:px-7">
            <p className={labelClass}>{t("preview_title")}</p>
            <p className="mt-2 text-sm text-muted">
              {t("preview_hint", {
                rows: preview.rows.length,
                columns: preview.headers.length,
              })}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-surface-2 font-mono text-[9px] uppercase tracking-wider text-muted">
                <tr>
                  {preview.headers.slice(0, 12).map((header) => (
                    <th key={header} scope="col" className="border-b border-r border-border px-4 py-3 last:border-r-0">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-ink">
                {preview.rows.slice(0, 20).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border last:border-b-0">
                    {row.slice(0, 12).map((cell, cellIndex) => (
                      <td key={cellIndex} className="max-w-72 truncate border-r border-border px-4 py-3 last:border-r-0">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
        <p className="mt-5 border-t border-border pt-5 text-sm leading-6 text-muted">
          {t("safety_note")}
        </p>
      </section>
    </div>
  );
}

