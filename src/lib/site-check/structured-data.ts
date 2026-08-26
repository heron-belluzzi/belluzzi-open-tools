type JsonLdObject = Record<string, unknown>;

export type StructuredDataAnalysis = {
  valid: number;
  invalid: number;
  types: string[];
};

function objects(value: unknown): JsonLdObject[] {
  if (Array.isArray(value)) return value.flatMap(objects);
  if (!value || typeof value !== "object") return [];
  const object = value as JsonLdObject;
  const graph = Array.isArray(object["@graph"]) ? object["@graph"].flatMap(objects) : [];
  return [object, ...graph];
}

function schemaTypes(value: unknown) {
  return (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
}

function hasInvalidUrl(object: JsonLdObject) {
  return ["url", "@id"].some((key) => {
    const value = object[key];
    if (typeof value !== "string") return false;
    try {
      return !["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return true;
    }
  });
}

export function analyzeStructuredData(blocks: string[]): StructuredDataAnalysis {
  let valid = 0;
  let invalid = 0;
  const types = new Set<string>();

  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block) as unknown;
      const candidates = objects(parsed);
      const typed = candidates.filter((candidate) => schemaTypes(candidate["@type"]).length > 0);
      const contextPresent = candidates.some((candidate) => typeof candidate["@context"] === "string");
      if (!typed.length || !contextPresent || candidates.some(hasInvalidUrl)) {
        invalid += 1;
        continue;
      }
      typed.flatMap((candidate) => schemaTypes(candidate["@type"])).forEach((type) => types.add(type));
      valid += 1;
    } catch {
      invalid += 1;
    }
  }

  return { valid, invalid, types: [...types].sort() };
}
