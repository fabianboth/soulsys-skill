import { formatMemory } from "../../src/commands/get-full-memory.ts";
import { describe, expect, it } from "bun:test";

const BASE = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  content: "test memory content",
  fullContent: null as string | null,
  emotion: null as string | null,
  importance: 5,
  type: "memory" as const,
  outdatedAt: null as string | null,
  createdAt: "2025-06-15T10:30:00.000Z",
  updatedAt: "2025-06-15T10:30:00.000Z",
  hasFullContent: false,
};

describe("formatMemory", () => {
  it("formats basic memory with id, metadata, and content", () => {
    const output = formatMemory(BASE);
    expect(output).toContain(`\`${BASE.id}\``);
    expect(output).toContain("[importance: 5]");
    expect(output).toContain("[memory]");
    expect(output).toContain("[2025-06-15 10:30]");
    expect(output).toContain("test memory content");
    expect(output).not.toContain("--- full content ---");
  });

  it("includes emotion when present", () => {
    const output = formatMemory({ ...BASE, emotion: "joy" });
    expect(output).toContain("[joy]");
  });

  it("includes forgotten marker when outdated", () => {
    const output = formatMemory({ ...BASE, outdatedAt: "2025-06-16T00:00:00Z" });
    expect(output).toContain("[forgotten]");
  });

  it("omits forgotten marker when not outdated", () => {
    const output = formatMemory(BASE);
    expect(output).not.toContain("[forgotten]");
  });

  it("includes full content section when present", () => {
    const output = formatMemory({
      ...BASE,
      fullContent: "detailed journal transcript here",
    });
    expect(output).toContain("--- full content ---");
    expect(output).toContain("detailed journal transcript here");
  });

  it("omits full content section when null", () => {
    const output = formatMemory(BASE);
    expect(output).not.toContain("--- full content ---");
  });

  it("shows journal type", () => {
    const output = formatMemory({ ...BASE, type: "journal" as const });
    expect(output).toContain("[journal]");
  });
});
