import { parseExtractionOutput } from "../../src/extraction/parser.ts";
import { describe, expect, it } from "bun:test";

describe("parseExtractionOutput", () => {
  it("parses valid memories JSON", () => {
    const result = parseExtractionOutput(
      JSON.stringify({
        memories: [
          { content: "User prefers TypeScript strict mode", importance: 7, emotion: null },
          { content: "Project uses Bun for testing", importance: 5, emotion: "curiosity" },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.memories).toHaveLength(2);
    expect(result.memories[0].content).toBe("User prefers TypeScript strict mode");
    expect(result.memories[0].importance).toBe(7);
    expect(result.memories[0].emotion).toBeNull();
    expect(result.memories[1].emotion).toBe("curiosity");
  });

  it("returns ok with empty array for empty memories", () => {
    const result = parseExtractionOutput(JSON.stringify({ memories: [] }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.memories).toHaveLength(0);
  });

  it("returns error for malformed JSON", () => {
    const result = parseExtractionOutput("not json at all");
    expect(result.ok).toBe(false);
  });

  it("returns error for missing memories field", () => {
    const result = parseExtractionOutput(JSON.stringify({ something: "else" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("no memories field");
  });

  it("skips invalid memories but succeeds when some are valid", () => {
    const result = parseExtractionOutput(
      JSON.stringify({
        memories: [
          { importance: 5, emotion: null },
          { content: "Valid memory", importance: 5, emotion: null },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].content).toBe("Valid memory");
  });

  it("returns error when all memories are invalid", () => {
    const result = parseExtractionOutput(
      JSON.stringify({ memories: [{ importance: 5, emotion: null }] }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("all memories invalid");
  });

  it("skips memory objects with empty content", () => {
    const result = parseExtractionOutput(
      JSON.stringify({ memories: [{ content: "", importance: 5, emotion: null }] }),
    );
    expect(result.ok).toBe(false);
  });

  it("skips memory objects with whitespace-only content", () => {
    const result = parseExtractionOutput(
      JSON.stringify({ memories: [{ content: "   ", importance: 5, emotion: null }] }),
    );
    expect(result.ok).toBe(false);
  });

  it("normalizes whitespace-only emotion to null", () => {
    const result = parseExtractionOutput(
      JSON.stringify({ memories: [{ content: "Memory", importance: 5, emotion: "   " }] }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.memories[0].emotion).toBeNull();
  });

  it("skips memory objects with non-finite importance", () => {
    const result = parseExtractionOutput(
      JSON.stringify({ memories: [{ content: "Memory", importance: "high", emotion: null }] }),
    );
    expect(result.ok).toBe(false);
  });

  it("clamps importance to 1-10 range", () => {
    const result = parseExtractionOutput(
      JSON.stringify({
        memories: [
          { content: "Low importance", importance: -5, emotion: null },
          { content: "High importance", importance: 99, emotion: null },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.memories[0].importance).toBe(1);
    expect(result.memories[1].importance).toBe(10);
  });

  it("rounds fractional importance to nearest integer", () => {
    const result = parseExtractionOutput(
      JSON.stringify({ memories: [{ content: "Memory", importance: 7.6, emotion: null }] }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.memories[0].importance).toBe(8);
  });

  it("normalizes empty emotion string to null", () => {
    const result = parseExtractionOutput(
      JSON.stringify({ memories: [{ content: "Memory", importance: 5, emotion: "" }] }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.memories[0].emotion).toBeNull();
  });

  it("parses output wrapped in markdown code fences", () => {
    const result = parseExtractionOutput(
      '```json\n{\n  "memories": [\n    { "content": "Fenced memory", "importance": 4, "emotion": null }\n  ]\n}\n```',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].content).toBe("Fenced memory");
  });

  it("parses output wrapped in bare code fences (no language tag)", () => {
    const result = parseExtractionOutput(
      '```\n{"memories": [{"content": "Bare fenced", "importance": 5, "emotion": null}]}\n```',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.memories[0].content).toBe("Bare fenced");
  });

  it("parses output wrapped in code fences without newlines", () => {
    const result = parseExtractionOutput(
      '```{"memories": [{"content": "No newlines", "importance": 5, "emotion": null}]}```',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.memories[0].content).toBe("No newlines");
  });

  it("truncates content exceeding 50000 chars", () => {
    const longContent = "x".repeat(60000);
    const result = parseExtractionOutput(
      JSON.stringify({ memories: [{ content: longContent, importance: 5, emotion: null }] }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.memories[0].content.length).toBe(50000);
  });
});
