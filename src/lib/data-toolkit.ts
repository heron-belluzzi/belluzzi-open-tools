import { parseDocument, stringify as stringifyYaml } from "yaml";

export const DATA_INPUT_LIMIT_BYTES = 1_000_000;

export type DataFormat = "json" | "yaml" | "csv";
export type DataToolkitErrorCode =
  | "emptyInput"
  | "inputTooLarge"
  | "invalidJson"
  | "invalidYaml"
  | "invalidCsv"
  | "duplicateHeaders"
  | "jsonNotTabular";

export class DataToolkitError extends Error {
  constructor(
    public readonly code: DataToolkitErrorCode,
    public readonly line?: number,
    public readonly column?: number,
  ) {
    super(code);
    this.name = "DataToolkitError";
  }
}

export type CsvTable = {
  headers: string[];
  rows: string[][];
  delimiter: string;
};

function inputByteLength(input: string) {
  return new TextEncoder().encode(input).byteLength;
}

export function assertSafeInput(input: string) {
  if (!input.trim()) throw new DataToolkitError("emptyInput");
  if (inputByteLength(input) > DATA_INPUT_LIMIT_BYTES) {
    throw new DataToolkitError("inputTooLarge");
  }
}

function lineAndColumn(input: string, position: number) {
  const before = input.slice(0, Math.max(0, position));
  const lines = before.split("\n");
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

export function parseJson(input: string): unknown {
  assertSafeInput(input);
  try {
    return JSON.parse(input) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const position = /position\s+(\d+)/i.exec(message)?.[1];
    const location = position
      ? lineAndColumn(input, Number.parseInt(position, 10))
      : undefined;
    throw new DataToolkitError(
      "invalidJson",
      location?.line,
      location?.column,
    );
  }
}

export function formatJson(input: string) {
  return JSON.stringify(parseJson(input), null, 2);
}

export function minifyJson(input: string) {
  return JSON.stringify(parseJson(input));
}

export function parseYaml(input: string): unknown {
  assertSafeInput(input);
  const document = parseDocument(input, {
    prettyErrors: true,
    schema: "core",
  });

  const issue = document.errors[0] ?? document.warnings[0];
  if (issue) {
    const location = issue.linePos?.[0];
    throw new DataToolkitError(
      "invalidYaml",
      location?.line,
      location?.col,
    );
  }

  try {
    return document.toJS({ maxAliasCount: 0 }) as unknown;
  } catch {
    throw new DataToolkitError("invalidYaml");
  }
}

export function jsonToYaml(input: string) {
  return stringifyYaml(parseJson(input), {
    aliasDuplicateObjects: false,
    lineWidth: 0,
  });
}

export function yamlToJson(input: string) {
  return JSON.stringify(parseYaml(input), null, 2);
}

function parseCsvWithDelimiter(input: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === delimiter) {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new DataToolkitError("invalidCsv");
  row.push(field);
  rows.push(row);

  return rows.filter(
    (candidate) =>
      candidate.length > 1 || (candidate[0] ?? "").trim().length > 0,
  );
}

function delimiterScore(rows: string[][]) {
  if (rows.length === 0) return 0;
  const widths = new Map<number, number>();
  for (const row of rows.slice(0, 50)) {
    widths.set(row.length, (widths.get(row.length) ?? 0) + 1);
  }
  const [width, count] = [...widths.entries()].sort(
    (left, right) => right[1] - left[1] || right[0] - left[0],
  )[0];
  return width > 1 ? width * count - (rows.length - count) * width : 0;
}

function detectDelimiter(input: string) {
  const candidates = [",", ";", "\t"];
  return candidates
    .map((delimiter) => ({
      delimiter,
      score: delimiterScore(parseCsvWithDelimiter(input, delimiter)),
    }))
    .sort((left, right) => right.score - left.score)[0].delimiter;
}

export function parseCsv(input: string): CsvTable {
  assertSafeInput(input);
  const delimiter = detectDelimiter(input);
  const parsedRows = parseCsvWithDelimiter(input, delimiter);
  if (parsedRows.length === 0) throw new DataToolkitError("invalidCsv");

  const width = parsedRows[0].length;
  if (width === 0 || parsedRows.some((row) => row.length !== width)) {
    throw new DataToolkitError("invalidCsv");
  }

  const headers = parsedRows[0].map((header, index) =>
    header.trim() || `column_${index + 1}`,
  );
  if (new Set(headers).size !== headers.length) {
    throw new DataToolkitError("duplicateHeaders");
  }

  return { headers, rows: parsedRows.slice(1), delimiter };
}

export function csvToJson(input: string) {
  const { headers, rows } = parseCsv(input);
  const records = rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
  );
  return JSON.stringify(records, null, 2);
}

function csvCell(value: unknown) {
  const text =
    value === null || value === undefined
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function jsonToCsv(input: string) {
  const value = parseJson(input);
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some(
      (item) => item === null || Array.isArray(item) || typeof item !== "object",
    )
  ) {
    throw new DataToolkitError("jsonNotTabular");
  }

  const records = value as Array<Record<string, unknown>>;
  const headers = [
    ...new Set(records.flatMap((record) => Object.keys(record))),
  ];
  if (headers.length === 0) throw new DataToolkitError("jsonNotTabular");

  return [
    headers.map(csvCell).join(","),
    ...records.map((record) =>
      headers.map((header) => csvCell(record[header])).join(","),
    ),
  ].join("\n");
}
