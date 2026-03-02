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

const WrappedSchema = v.object({
  result: v.string(),
});

function parseInner(raw: unknown): unknown[] {
  const direct = v.safeParse(ExtractionSchema, raw);
  if (direct.success) return direct.output.memories;

  const wrapped = v.safeParse(WrappedSchema, raw);
  if (wrapped.success) {
    try {
      const inner = JSON.parse(wrapped.output.result);
      const parsed = v.safeParse(ExtractionSchema, inner);
      if (parsed.success) return parsed.output.memories;
    } catch {
      return [];
    }
  }

  return [];
}

export type ExtractedMemory = v.InferOutput<typeof MemorySchema>;

export function parseExtractionOutput(rawOutput: string): ExtractedMemory[] {
  try {
    const outer = JSON.parse(rawOutput);
    return parseInner(outer).flatMap((m) => {
      const result = v.safeParse(MemorySchema, m);
      return result.success ? [result.output] : [];
    });
  } catch {
    return [];
  }
}
