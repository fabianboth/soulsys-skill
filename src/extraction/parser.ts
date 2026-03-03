import { jsonrepair } from "jsonrepair";
import * as v from "valibot";

const MemorySchema = v.pipe(
  v.object({
    content: v.pipe(
      v.string(),
      v.transform((s) => s.trim()),
      v.minLength(1),
      v.transform((s) => (s.length > 50000 ? s.slice(0, 50000) : s)),
    ),
    importance: v.pipe(v.number(), v.finite()),
    emotion: v.nullable(v.string()),
  }),
  v.transform((m) => ({
    content: m.content,
    importance: Math.max(1, Math.min(10, Math.round(m.importance))),
    emotion: m.emotion && m.emotion.trim().length > 0 ? m.emotion.trim() : null,
  })),
);

const ExtractionSchema = v.object({
  memories: v.array(v.unknown()),
});

export type ExtractedMemory = v.InferOutput<typeof MemorySchema>;

export type ParseResult = { ok: true; memories: ExtractedMemory[] } | { ok: false; error: string };

export function parseExtractionOutput(rawOutput: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonrepair(rawOutput));
  } catch (error) {
    return {
      ok: false,
      error: `failed to parse: ${error instanceof Error ? error.message : String(error)}, input: ${rawOutput.slice(0, 500)}`,
    };
  }

  const result = v.safeParse(ExtractionSchema, parsed);
  if (!result.success) {
    return { ok: false, error: `no memories field found in: ${rawOutput.slice(0, 500)}` };
  }

  const memories: ExtractedMemory[] = [];
  const skipped: string[] = [];

  for (const m of result.output.memories) {
    const memResult = v.safeParse(MemorySchema, m);
    if (memResult.success) {
      memories.push(memResult.output);
    } else {
      skipped.push(JSON.stringify(m));
    }
  }

  if (skipped.length > 0 && memories.length === 0) {
    return { ok: false, error: `all memories invalid, skipped: ${skipped.join(", ")}` };
  }

  return { ok: true, memories };
}
