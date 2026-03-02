import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { extractTranscriptWindow } from "../../../../src/framework/adapters/claude-code/transcript.ts";
import { describe, expect, it } from "bun:test";

const FIXTURES = resolve(import.meta.dirname, "..", "..", "..", "fixtures");

describe("extractTranscriptWindow", () => {
  it("returns all lines for transcript with no compaction boundary", () => {
    const result = extractTranscriptWindow(resolve(FIXTURES, "transcript-simple.jsonl"));
    if (!result) throw new Error("expected non-null result");

    expect(result.lineCount).toBeGreaterThan(0);
    expect(result.content).toContain('"role":"user"');
    expect(result.content).toContain('"role":"assistant"');
  });

  it("returns only lines after the last compaction boundary", () => {
    const result = extractTranscriptWindow(resolve(FIXTURES, "transcript-compacted.jsonl"));
    if (!result) throw new Error("expected non-null result");

    expect(result.content).toContain("webhook");
    expect(result.content).toContain("idempotency");
    expect(result.content).not.toContain("compact_boundary");
  });

  it("handles trivial transcript", () => {
    const result = extractTranscriptWindow(resolve(FIXTURES, "transcript-trivial.jsonl"));
    if (!result) throw new Error("expected non-null result");

    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("throws for nonexistent file", () => {
    expect(() => extractTranscriptWindow("/nonexistent.jsonl")).toThrow();
  });

  it("truncates from the past when window exceeds max chars", () => {
    const tmpPath = join(tmpdir(), `transcript-large-${Date.now()}.jsonl`);
    const lines = Array.from({ length: 1000 }, (_, i) =>
      JSON.stringify({
        type: "user",
        message: { role: "user", content: `Message ${i}: ${"x".repeat(1000)}` },
        timestamp: "2026-03-01T00:00:00.000Z",
      }),
    );

    writeFileSync(tmpPath, lines.join("\n"));

    try {
      const result = extractTranscriptWindow(tmpPath);
      if (!result) throw new Error("expected non-null result");

      expect(result.content.length).toBeLessThanOrEqual(410_000);
      expect(result.content).toContain("Message 999:");
      expect(result.content).not.toContain("Message 0:");
    } finally {
      unlinkSync(tmpPath);
    }
  });
});
