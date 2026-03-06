import { randomUUID } from "node:crypto";

import { formatSearchResults } from "../../src/commands/recall.ts";
import { describe, expect, it } from "bun:test";

function makeResult(overrides: Partial<Parameters<typeof formatSearchResults>[0][number]> = {}) {
  return {
    id: randomUUID(),
    content: "test memory content",
    emotion: null as string | null,
    importance: 5,
    type: "memory" as const,
    hasFullContent: false,
    outdatedAt: null as string | null,
    similarity: 0.85,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("formatSearchResults", () => {
  it("formats multiple results with id and content", () => {
    const results = [
      makeResult({ content: "first memory" }),
      makeResult({ content: "second memory" }),
    ];
    const output = formatSearchResults(results);
    expect(output).toContain(`\`${results[0].id}\` first memory`);
    expect(output).toContain(`\`${results[1].id}\` second memory`);
    expect(output.split("\n")).toHaveLength(2);
  });

  it("returns 'No matching memories found.' for empty results", () => {
    const output = formatSearchResults([]);
    expect(output).toBe("No matching memories found.");
  });

  it("handles results with emotion field", () => {
    const result = makeResult({ content: "emotional memory", emotion: "joy" });
    const output = formatSearchResults([result]);
    expect(output).toContain("emotional memory");
    expect(output).toContain(`\`${result.id}\``);
  });

  it("shows hint when memory has full content", () => {
    const result = makeResult({ content: "journal entry", hasFullContent: true });
    const output = formatSearchResults([result]);
    expect(output).toContain("[hasFullContent]");
  });

  it("omits hint when memory has no full content", () => {
    const result = makeResult({ content: "simple memory", hasFullContent: false });
    const output = formatSearchResults([result]);
    expect(output).not.toContain("[hasFullContent]");
  });
});
