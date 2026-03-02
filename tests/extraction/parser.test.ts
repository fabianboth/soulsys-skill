import { parseExtractionOutput } from "../../src/extraction/parser.ts";
import { describe, expect, it } from "bun:test";

describe("parseExtractionOutput", () => {
  it("parses valid output with result wrapper", () => {
    const output = JSON.stringify({
      result: JSON.stringify({
        memories: [
          { content: "User prefers TypeScript strict mode", importance: 7, emotion: null },
          { content: "Project uses Bun for testing", importance: 5, emotion: "curiosity" },
        ],
      }),
    });

    const memories = parseExtractionOutput(output);
    expect(memories).toHaveLength(2);
    expect(memories[0].content).toBe("User prefers TypeScript strict mode");
    expect(memories[0].importance).toBe(7);
    expect(memories[0].emotion).toBeNull();
    expect(memories[1].emotion).toBe("curiosity");
  });

  it("parses direct format without result wrapper", () => {
    const output = JSON.stringify({
      memories: [{ content: "Direct format memory", importance: 5, emotion: null }],
    });

    const memories = parseExtractionOutput(output);
    expect(memories).toHaveLength(1);
    expect(memories[0].content).toBe("Direct format memory");
  });

  it("returns empty array for empty memories", () => {
    const output = JSON.stringify({
      result: JSON.stringify({ memories: [] }),
    });

    const memories = parseExtractionOutput(output);
    expect(memories).toHaveLength(0);
  });

  it("returns empty array for malformed JSON", () => {
    const memories = parseExtractionOutput("not json at all");
    expect(memories).toHaveLength(0);
  });

  it("returns empty array for missing memories field", () => {
    const output = JSON.stringify({
      result: JSON.stringify({ something: "else" }),
    });

    const memories = parseExtractionOutput(output);
    expect(memories).toHaveLength(0);
  });

  it("skips memory objects with missing content", () => {
    const output = JSON.stringify({
      result: JSON.stringify({
        memories: [
          { importance: 5, emotion: null },
          { content: "Valid memory", importance: 5, emotion: null },
        ],
      }),
    });

    const memories = parseExtractionOutput(output);
    expect(memories).toHaveLength(1);
    expect(memories[0].content).toBe("Valid memory");
  });

  it("skips memory objects with empty content", () => {
    const output = JSON.stringify({
      result: JSON.stringify({
        memories: [{ content: "", importance: 5, emotion: null }],
      }),
    });

    const memories = parseExtractionOutput(output);
    expect(memories).toHaveLength(0);
  });

  it("skips memory objects with whitespace-only content", () => {
    const output = JSON.stringify({
      result: JSON.stringify({
        memories: [{ content: "   ", importance: 5, emotion: null }],
      }),
    });

    const memories = parseExtractionOutput(output);
    expect(memories).toHaveLength(0);
  });

  it("normalizes whitespace-only emotion to null", () => {
    const output = JSON.stringify({
      result: JSON.stringify({
        memories: [{ content: "Memory", importance: 5, emotion: "   " }],
      }),
    });

    const memories = parseExtractionOutput(output);
    expect(memories).toHaveLength(1);
    expect(memories[0].emotion).toBeNull();
  });

  it("skips memory objects with non-finite importance", () => {
    const output = JSON.stringify({
      result: JSON.stringify({
        memories: [{ content: "Memory", importance: "high", emotion: null }],
      }),
    });

    const memories = parseExtractionOutput(output);
    expect(memories).toHaveLength(0);
  });

  it("clamps importance to 1-10 range", () => {
    const output = JSON.stringify({
      result: JSON.stringify({
        memories: [
          { content: "Low importance", importance: -5, emotion: null },
          { content: "High importance", importance: 99, emotion: null },
        ],
      }),
    });

    const memories = parseExtractionOutput(output);
    expect(memories).toHaveLength(2);
    expect(memories[0].importance).toBe(1);
    expect(memories[1].importance).toBe(10);
  });

  it("rounds fractional importance to nearest integer", () => {
    const output = JSON.stringify({
      result: JSON.stringify({
        memories: [{ content: "Memory", importance: 7.6, emotion: null }],
      }),
    });

    const memories = parseExtractionOutput(output);
    expect(memories).toHaveLength(1);
    expect(memories[0].importance).toBe(8);
  });

  it("normalizes empty emotion string to null", () => {
    const output = JSON.stringify({
      result: JSON.stringify({
        memories: [{ content: "Memory", importance: 5, emotion: "" }],
      }),
    });

    const memories = parseExtractionOutput(output);
    expect(memories).toHaveLength(1);
    expect(memories[0].emotion).toBeNull();
  });

  it("truncates content exceeding 50000 chars", () => {
    const longContent = "x".repeat(60000);
    const output = JSON.stringify({
      result: JSON.stringify({
        memories: [{ content: longContent, importance: 5, emotion: null }],
      }),
    });

    const memories = parseExtractionOutput(output);
    expect(memories).toHaveLength(1);
    expect(memories[0].content.length).toBe(50000);
  });
});
