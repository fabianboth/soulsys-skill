import { jsonrepair } from "jsonrepair";
import * as v from "valibot";

/** Must match MAX_CONTENT_LENGTH in @soulsys/types */
const MAX_SUMMARY_LENGTH = 2_000;

const JournalSchema = v.pipe(
  v.looseObject({
    summary: v.pipe(
      v.string(),
      v.transform((s) => s.trim()),
      v.minLength(1),
      v.transform((s) => (s.length > MAX_SUMMARY_LENGTH ? s.slice(0, MAX_SUMMARY_LENGTH) : s)),
    ),
    details: v.optional(
      v.nullable(
        v.pipe(
          v.string(),
          v.transform((s) => s.trim()),
        ),
      ),
    ),
  }),
  v.transform((m) => ({
    summary: m.summary,
    details: m.details && m.details.length > 0 ? m.details : null,
  })),
);

export type JournalEntry = v.InferOutput<typeof JournalSchema>;

export type ParseResult = { ok: true; entry: JournalEntry | null } | { ok: false; error: string };

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

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: `unexpected output type: ${rawOutput.slice(0, 500)}` };
  }

  if (!("summary" in parsed)) {
    return { ok: true, entry: null };
  }

  const result = v.safeParse(JournalSchema, parsed);
  if (!result.success) {
    return { ok: false, error: `invalid journal entry: ${rawOutput.slice(0, 500)}` };
  }

  return { ok: true, entry: result.output };
}
