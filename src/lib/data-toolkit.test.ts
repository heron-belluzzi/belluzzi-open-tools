import { describe, expect, it } from "vitest";
import {
  csvToJson,
  DATA_INPUT_LIMIT_BYTES,
  DataToolkitError,
  formatJson,
  jsonToCsv,
  jsonToYaml,
  minifyJson,
  parseCsv,
  parseYaml,
  yamlToJson,
} from "./data-toolkit";

describe("JSON utilities", () => {
  it("formats and minifies valid JSON", () => {
    expect(formatJson('{"name":"Belluzzi","active":true}')).toBe(
      '{\n  "name": "Belluzzi",\n  "active": true\n}',
    );
    expect(minifyJson('{\n "items": [1, 2]\n}')).toBe('{"items":[1,2]}');
  });

  it("reports invalid and oversized input", () => {
    expect(() => formatJson('{"broken": }')).toThrowError(
      expect.objectContaining({ code: "invalidJson" }),
    );
    expect(() => formatJson(`"${"a".repeat(DATA_INPUT_LIMIT_BYTES)}"`)).toThrowError(
      new DataToolkitError("inputTooLarge"),
    );
  });
});

describe("YAML conversion", () => {
  it("converts JSON and safe YAML in both directions", () => {
    const yaml = jsonToYaml('{"project":"tools","features":["json","csv"]}');
    expect(yaml).toContain("project: tools");
    expect(JSON.parse(yamlToJson(yaml))).toEqual({
      project: "tools",
      features: ["json", "csv"],
    });
  });

  it("rejects aliases and malformed documents", () => {
    expect(() => parseYaml("base: &base\n  ok: true\ncopy: *base")).toThrowError(
      expect.objectContaining({ code: "invalidYaml" }),
    );
    expect(() => parseYaml("items: [one, two")).toThrowError(
      expect.objectContaining({ code: "invalidYaml" }),
    );
    expect(() => parseYaml("value: !!js/function function() {}"))
      .toThrowError(expect.objectContaining({ code: "invalidYaml" }));
  });
});

describe("CSV conversion", () => {
  it("detects delimiters and supports quoted commas and line breaks", () => {
    const table = parseCsv('name;note\r\nBelluzzi;"line one\nline two"');
    expect(table.delimiter).toBe(";");
    expect(table.headers).toEqual(["name", "note"]);
    expect(table.rows).toEqual([["Belluzzi", "line one\nline two"]]);
  });

  it("converts CSV to records and JSON records back to CSV", () => {
    expect(JSON.parse(csvToJson('name,role\n"Belluzzi, Dev",creator'))).toEqual([
      { name: "Belluzzi, Dev", role: "creator" },
    ]);
    expect(
      jsonToCsv('[{"name":"Belluzzi, Dev","active":true},{"name":"Tools","active":false}]'),
    ).toBe('name,active\n"Belluzzi, Dev",true\nTools,false');
  });

  it("rejects duplicate headers, uneven rows and non-tabular JSON", () => {
    expect(() => parseCsv("name,name\na,b")).toThrowError(
      expect.objectContaining({ code: "duplicateHeaders" }),
    );
    expect(() => parseCsv("name,role\nBelluzzi")).toThrowError(
      expect.objectContaining({ code: "invalidCsv" }),
    );
    expect(() => jsonToCsv('{"name":"Belluzzi"}')).toThrowError(
      expect.objectContaining({ code: "jsonNotTabular" }),
    );
  });
});
