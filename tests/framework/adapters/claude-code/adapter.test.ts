import { resolve } from "node:path";

import { createClaudeCodeAdapter } from "../../../../src/framework/adapters/claude-code/adapter.ts";
import { describe, expect, it } from "bun:test";

const FIXTURES = resolve(import.meta.dirname, "..", "..", "..", "fixtures");
const adapter = createClaudeCodeAdapter();

describe("Claude Code adapter", () => {
  it("has correct name", () => {
    expect(adapter.name).toBe("claude-code");
  });

  describe("readAndFormat", () => {
    it("reads and formats simple transcript", () => {
      const result = adapter.readAndFormat(resolve(FIXTURES, "transcript-simple.jsonl"));
      if (!result) throw new Error("expected non-null result");

      expect(result.messageCount).toBeGreaterThan(0);
      expect(result.content).toContain('"role":"user"');
      expect(result.content).toContain('"role":"assistant"');
    });

    it("extracts only current window from compacted transcript", () => {
      const result = adapter.readAndFormat(resolve(FIXTURES, "transcript-compacted.jsonl"));
      if (!result) throw new Error("expected non-null result");

      expect(result.content).toContain("webhook");
    });

    it("handles trivial transcript", () => {
      const result = adapter.readAndFormat(resolve(FIXTURES, "transcript-trivial.jsonl"));
      if (!result) throw new Error("expected non-null result");

      expect(result.messageCount).toBeGreaterThan(0);
    });

    it("throws for nonexistent file", () => {
      expect(() => adapter.readAndFormat("/nonexistent.jsonl")).toThrow();
    });
  });
});
