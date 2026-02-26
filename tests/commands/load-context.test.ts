import { randomUUID } from "node:crypto";

import type { paths } from "../../src/client/generated/api.d.ts";
import { formatContext } from "../../src/commands/load-context.ts";
import { describe, expect, it } from "bun:test";

type ContextResponse =
  paths["/api/souls/{soulId}/context"]["get"]["responses"]["200"]["content"]["application/json"];

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
