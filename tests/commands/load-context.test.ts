import { randomUUID } from "node:crypto";

import type { ContextResponse } from "../../src/context/format.ts";
import {
  formatContext,
  formatCoreContext,
  formatMemoryInstructions,
} from "../../src/context/format.ts";
import { describe, expect, it } from "bun:test";

function makeSoul(essence = "test"): ContextResponse["soul"] {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    version: 0,
    essence,
    values: "test-values",
    createdAt: now,
    updatedAt: now,
  };
}

function makeIdentity(): NonNullable<ContextResponse["identity"]> {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    version: 0,
    name: "Test",
    vibe: "test-vibe",
    description: null,
    appearance: {
      id: randomUUID(),
      version: 0,
      emoji: "\u{1F916}",
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    },
    createdAt: now,
    updatedAt: now,
  };
}

function makeMemory(content: string) {
  return { id: randomUUID(), content };
}

describe("memory formatting", () => {
  it("omits both memory sections when null", () => {
    const output = formatContext({
      soul: makeSoul(),
      identity: makeIdentity(),
      memory: null,
      relations: { relations: [] },
    });
    expect(output).not.toContain("Key Memories");
    expect(output).not.toContain("Recent Memories");
  });

  it("renders key and recent memories in separate sections with id and content", () => {
    const keyMemory = makeMemory("important-fact");
    const recentMemory = makeMemory("just-happened");

    const output = formatContext({
      soul: makeSoul(),
      identity: makeIdentity(),
      memory: {
        keyMemories: [keyMemory],
        recentMemories: [recentMemory],
      },
      relations: { relations: [] },
    });
    expect(output).toContain("## Key Memories");
    expect(output).toContain(`\`${keyMemory.id}\` important-fact`);
    expect(output).toContain("## Recent Memories");
    expect(output).toContain(`\`${recentMemory.id}\` just-happened`);
  });

  it("omits key memories section when empty", () => {
    const output = formatContext({
      soul: makeSoul(),
      identity: makeIdentity(),
      memory: {
        keyMemories: [],
        recentMemories: [makeMemory("something")],
      },
      relations: { relations: [] },
    });
    expect(output).not.toContain("Key Memories");
    expect(output).toContain("Recent Memories");
  });
});

describe("relation formatting", () => {
  it("formats relations as compact lines with UUIDs", () => {
    const now = new Date().toISOString();
    const relations: NonNullable<ContextResponse["relations"]>["relations"] = [
      {
        id: randomUUID(),
        entityType: "human",
        name: "Alice",
        summary: "Curious and kind",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        entityType: "agent",
        name: "Bob",
        summary: "Collaborative helper",
        createdAt: now,
        updatedAt: now,
      },
    ];

    const output = formatContext({
      soul: makeSoul(),
      identity: makeIdentity(),
      memory: null,
      relations: { relations },
    });
    expect(output).toContain(`- Alice (human) \`${relations[0].id}\`: Curious and kind`);
    expect(output).toContain(`- Bob (agent) \`${relations[1].id}\`: Collaborative helper`);
  });

  it("omits Relations section when no relations exist", () => {
    const output = formatContext({
      soul: makeSoul(),
      identity: makeIdentity(),
      memory: null,
      relations: { relations: [] },
    });
    expect(output).not.toContain("## Relations");
  });
});

describe("memory instructions", () => {
  it("full context includes ## Memory section with soulsys reference", () => {
    const output = formatContext({
      soul: makeSoul(),
      identity: makeIdentity(),
      memory: {
        keyMemories: [makeMemory("something")],
        recentMemories: [],
      },
      relations: { relations: [] },
    });
    expect(output).toContain("## Memory");
    expect(output).toContain("soulsys");
    expect(output).toContain("soulsys search-memory");
  });

  it("core context includes ## Memory instructions", () => {
    const output = formatCoreContext({
      soul: makeSoul(),
      identity: makeIdentity(),
      memory: {
        keyMemories: [makeMemory("something")],
        recentMemories: [],
      },
      relations: { relations: [] },
    });
    expect(output).toContain("## Memory");
    expect(output).toContain("soulsys");
    expect(output).toContain("soulsys search-memory");
  });

  it("memory instructions appear even when memory data is null", () => {
    const output = formatContext({
      soul: makeSoul(),
      identity: makeIdentity(),
      memory: null,
      relations: null,
    });
    expect(output).toContain("## Memory");
    expect(output).toContain("soulsys");
  });

  it("formatMemoryInstructions returns static markdown with command syntax", () => {
    const instructions = formatMemoryInstructions();
    expect(instructions).toContain("## Memory");
    expect(instructions).toContain("soulsys");
    expect(instructions).toContain("soulsys add-memory");
    expect(instructions).toContain("soulsys search-memory");
    expect(instructions).toContain("Dispatch a subagent");
    expect(instructions).toContain("Read the soulsys skill before first use");
  });
});

describe("formatCoreContext (--core flag)", () => {
  it("outputs soul, identity, and memory instructions but not memory data or relations", () => {
    const output = formatCoreContext({
      soul: makeSoul("my essence"),
      identity: makeIdentity(),
      memory: {
        keyMemories: [makeMemory("important-fact")],
        recentMemories: [makeMemory("just-happened")],
      },
      relations: {
        relations: [
          {
            id: randomUUID(),
            entityType: "human",
            name: "Alice",
            summary: "A friend",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    });
    expect(output).toContain("# Soul");
    expect(output).toContain("my essence");
    expect(output).toContain("## Identity");
    expect(output).toContain("Name: Test");
    expect(output).toContain("## Memory");
    expect(output).toContain("soulsys");
    expect(output).not.toContain("Key Memories");
    expect(output).not.toContain("Recent Memories");
    expect(output).not.toContain("important-fact");
    expect(output).not.toContain("just-happened");
    expect(output).not.toContain("Relations");
    expect(output).not.toContain("Alice");
  });

  it("handles missing identity but still includes memory instructions", () => {
    const output = formatCoreContext({
      soul: makeSoul("core essence"),
      identity: null,
      memory: null,
      relations: null,
    });
    expect(output).toContain("# Soul");
    expect(output).toContain("core essence");
    expect(output).not.toContain("## Identity");
    expect(output).toContain("## Memory");
    expect(output).toContain("soulsys search-memory");
  });
});
