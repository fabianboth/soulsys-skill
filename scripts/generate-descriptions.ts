import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const specPath = resolve(import.meta.dirname, "..", "openapi.json");
const outPath = resolve(import.meta.dirname, "..", "src", "client", "generated", "descriptions.ts");

interface SchemaProperty {
  type?: string | string[];
  description?: string;
  properties?: Record<string, SchemaProperty>;
}

interface Schema {
  type?: string;
  properties?: Record<string, SchemaProperty>;
}

interface PathOperation {
  requestBody?: {
    content?: { "application/json"?: { schema?: Schema } };
  };
  responses?: Record<string, { content?: { "application/json"?: { schema?: Schema } } }>;
}

interface OpenAPISpec {
  paths: Record<string, Record<string, PathOperation>>;
}

function fallbackName(field: string): string {
  return field.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

function getDescription(
  reqProps: Record<string, SchemaProperty> | undefined,
  resProps: Record<string, SchemaProperty> | undefined,
  field: string,
): string {
  return reqProps?.[field]?.description ?? resProps?.[field]?.description ?? fallbackName(field);
}

function getNestedDescription(
  reqProps: Record<string, SchemaProperty> | undefined,
  resProps: Record<string, SchemaProperty> | undefined,
  parent: string,
  field: string,
): string {
  return (
    reqProps?.[parent]?.properties?.[field]?.description ??
    resProps?.[parent]?.properties?.[field]?.description ??
    fallbackName(field)
  );
}

const spec: OpenAPISpec = JSON.parse(readFileSync(specPath, "utf-8"));

function getSchemaProps(
  op: PathOperation | undefined,
  source: "request" | "response",
): Record<string, SchemaProperty> | undefined {
  if (source === "request") {
    return op?.requestBody?.content?.["application/json"]?.schema?.properties;
  }
  const res = op?.responses?.["201"] ?? op?.responses?.["200"];
  return res?.content?.["application/json"]?.schema?.properties;
}

function extract(path: string, method: string) {
  const op = spec.paths[path]?.[method];
  const req = getSchemaProps(op, "request");
  const res = getSchemaProps(op, "response");
  return { req, res };
}

function extractOrFail(path: string, method: string) {
  if (!spec.paths[path]?.[method]) {
    throw new Error(`Missing OpenAPI path: ${method.toUpperCase()} ${path}`);
  }
  return extract(path, method);
}

const soul = extractOrFail("/api/souls", "post");
const identity = extractOrFail("/api/souls/{soulId}/identity", "post");
const memory = extractOrFail("/api/souls/{soulId}/memories", "post");
const relation = extractOrFail("/api/souls/{soulId}/relations", "post");

const descriptions = {
  SOUL_DESCRIPTIONS: {
    essence: getDescription(soul.req, soul.res, "essence"),
    values: getDescription(soul.req, soul.res, "values"),
  },
  IDENTITY_DESCRIPTIONS: {
    name: getDescription(identity.req, identity.res, "name"),
    vibe: getDescription(identity.req, identity.res, "vibe"),
    description: getDescription(identity.req, identity.res, "description"),
  },
  APPEARANCE_DESCRIPTIONS: {
    emoji: getNestedDescription(identity.req, identity.res, "appearance", "emoji"),
    avatarUrl: getNestedDescription(identity.req, identity.res, "appearance", "avatarUrl"),
  },
  MEMORY_DESCRIPTIONS: {
    content: getDescription(memory.req, memory.res, "content"),
    fullContent: getDescription(memory.req, memory.res, "fullContent"),
    emotion: getDescription(memory.req, memory.res, "emotion"),
  },
  IMPORTANCE_DESCRIPTION: getDescription(memory.req, memory.res, "importance"),
  RELATION_DESCRIPTIONS: {
    entityType: getDescription(relation.req, relation.res, "entityType"),
    name: getDescription(relation.req, relation.res, "name"),
    summary: getDescription(relation.req, relation.res, "summary"),
  },
};

function toObjectExport(name: string, obj: Record<string, string>): string {
  const entries = Object.entries(obj)
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`)
    .join("\n");
  return `export const ${name} = {\n${entries}\n} as const;`;
}

function toStringExport(name: string, value: string): string {
  return `export const ${name} = ${JSON.stringify(value)} as const;`;
}

const sections = Object.entries(descriptions).map(([name, value]) =>
  typeof value === "string" ? toStringExport(name, value) : toObjectExport(name, value),
);

const output = `// AUTO-GENERATED from openapi.json — do not edit manually\n\n${sections.join("\n\n")}\n`;

writeFileSync(outPath, output);
console.log("Generated src/client/generated/descriptions.ts");
