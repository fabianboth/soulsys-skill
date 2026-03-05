import { parseExtractionOutput } from "../../src/extraction/parser.ts";
import { describe, expect, it } from "bun:test";

describe("parseExtractionOutput", () => {
  it("parses valid journal entry", () => {
    const result = parseExtractionOutput(
      JSON.stringify({ summary: "Worked on memory quality improvements" }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry).not.toBeNull();
    if (!result.entry) return;
    expect(result.entry.summary).toBe("Worked on memory quality improvements");
    expect(result.entry.details).toBeNull();
  });

  it("parses details field", () => {
    const result = parseExtractionOutput(
      JSON.stringify({
        summary: "Worked on memory quality feature",
        details: "- Added type field\n- Updated extraction",
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry).not.toBeNull();
    if (!result.entry) return;
    expect(result.entry.summary).toBe("Worked on memory quality feature");
    expect(result.entry.details).toBe("- Added type field\n- Updated extraction");
  });

  it("returns null entry for empty object", () => {
    const result = parseExtractionOutput(JSON.stringify({}));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry).toBeNull();
  });

  it("returns error for empty summary", () => {
    const result = parseExtractionOutput(JSON.stringify({ summary: "" }));
    expect(result.ok).toBe(false);
  });

  it("returns error for whitespace-only summary", () => {
    const result = parseExtractionOutput(JSON.stringify({ summary: "   " }));
    expect(result.ok).toBe(false);
  });

  it("returns error for malformed JSON", () => {
    const result = parseExtractionOutput("not json at all");
    expect(result.ok).toBe(false);
  });

  it("returns error for array output", () => {
    const result = parseExtractionOutput(JSON.stringify([{ summary: "test" }]));
    expect(result.ok).toBe(false);
  });

  it("returns error for string output", () => {
    const result = parseExtractionOutput(JSON.stringify("just a string"));
    expect(result.ok).toBe(false);
  });

  it("tolerates extra fields like importance and emotion", () => {
    const result = parseExtractionOutput(
      JSON.stringify({ summary: "Entry with extras", importance: 3, emotion: "curiosity" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry).not.toBeNull();
    if (!result.entry) return;
    expect(result.entry.summary).toBe("Entry with extras");
    expect(result.entry).not.toHaveProperty("importance");
    expect(result.entry).not.toHaveProperty("emotion");
  });

  it("tolerates extra type field", () => {
    const result = parseExtractionOutput(JSON.stringify({ summary: "Has type", type: "journal" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry).not.toBeNull();
    if (!result.entry) return;
    expect(result.entry.summary).toBe("Has type");
    expect(result.entry).not.toHaveProperty("type");
  });

  it("normalizes empty details to null", () => {
    const result = parseExtractionOutput(JSON.stringify({ summary: "No details", details: "" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry).not.toBeNull();
    if (!result.entry) return;
    expect(result.entry.details).toBeNull();
  });

  it("normalizes whitespace-only details to null", () => {
    const result = parseExtractionOutput(
      JSON.stringify({ summary: "Whitespace details", details: "   " }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry).not.toBeNull();
    if (!result.entry) return;
    expect(result.entry.details).toBeNull();
  });

  it("parses output wrapped in markdown code fences", () => {
    const result = parseExtractionOutput('```json\n{ "summary": "Fenced entry" }\n```');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry).not.toBeNull();
    if (!result.entry) return;
    expect(result.entry.summary).toBe("Fenced entry");
  });

  it("parses output wrapped in bare code fences", () => {
    const result = parseExtractionOutput('```\n{"summary": "Bare fenced"}\n```');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry).not.toBeNull();
    if (!result.entry) return;
    expect(result.entry.summary).toBe("Bare fenced");
  });

  it("parses output wrapped in code fences without newlines", () => {
    const result = parseExtractionOutput('```{"summary": "No newlines"}```');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry).not.toBeNull();
    if (!result.entry) return;
    expect(result.entry.summary).toBe("No newlines");
  });

  it("truncates summary exceeding 2000 chars", () => {
    const longSummary = "x".repeat(3000);
    const result = parseExtractionOutput(JSON.stringify({ summary: longSummary }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry).not.toBeNull();
    if (!result.entry) return;
    expect(result.entry.summary.length).toBe(2000);
  });
});
