import { randomUUID } from "node:crypto";

import { formatSearchResults } from "../../src/commands/search-memory.ts";
import { describe, expect, it } from "bun:test";

function makeResult(overrides: Partial<Parameters<typeof formatSearchResults>[0][number]> = {}) {
  return {
    id: randomUUID(),
    content: "test memory content",
    emotion: null as string | null,
    importance: 5,
    similarity: 0.85,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("formatSearchResults", () => {
  it("formats multiple results with id, importance, and content", () => {
    const results = [
      makeResult({ content: "first memory", importance: 7 }),
      makeResult({ content: "second memory", importance: 3 }),
    ];
    const output = formatSearchResults(results);
    expect(output).toContain(`\`${results[0].id}\` [importance: 7] first memory`);
    expect(output).toContain(`\`${results[1].id}\` [importance: 3] second memory`);
    expect(output.split("\n")).toHaveLength(2);
  });

  it("returns 'No matching memories found.' for empty results", () => {
    const output = formatSearchResults([]);
    expect(output).toBe("No matching memories found.");
  });

  it("handles results with emotion field", () => {
    const result = makeResult({ content: "emotional memory", emotion: "joy", importance: 8 });
    const output = formatSearchResults([result]);
    expect(output).toContain("[importance: 8] emotional memory");
    expect(output).toContain(`\`${result.id}\``);
  });

  it("includes importance and content for each result", () => {
    const results = [
      makeResult({ content: "low importance", importance: 1 }),
      makeResult({ content: "high importance", importance: 10 }),
    ];
    const output = formatSearchResults(results);
    expect(output).toContain("[importance: 1] low importance");
    expect(output).toContain("[importance: 10] high importance");
  });
});
