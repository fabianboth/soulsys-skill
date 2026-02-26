import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { Command } from "commander";

import {
  addMemoryCmd,
  addMemoryFileCmd,
  addRelationCmd,
  createIdentityCmd,
  createSoulCmd,
  existsCmd,
  loadContextCmd,
  program,
} from "../src/program.ts";
import { renderCommand } from "../src/utils/render-command.ts";

// -- Helpers --

type Step = { type: "command"; cmd: Command } | { type: "text"; text: string };

function step(cmd: Command): Step {
  return { type: "command", cmd };
}

function renderStep(step: Step): string {
  switch (step.type) {
    case "text":
      return step.text;
    case "command":
      return renderCommand(step.cmd);
  }
}

// -- Document generators --

const SKILL_EXCLUDED = new Set([
  "exists",
  "add-memory-file",
  "init",
  "create-soul",
  "create-identity",
]);

function generateSkillMd(): string {
  const commands = program.commands.filter((cmd) => !SKILL_EXCLUDED.has(cmd.name()));
  const commandSections = commands.map(renderCommand).join("\n\n");

  return `---
name: soulsys
description: "Manage your soul — introspect and evolve your persistent identity, memories, and relationships"
user-invocable: true
metadata: {"soulsys":{"emoji":"🧬"}}
---

# Soulsys

Persistent soul state with 4 layers: **Soul** (core essence, values) → **Identity** (name, vibe) → **Memory** (facts, events, emotions) → **Relations** (entities you interact with).

Soulsys **is** your memory system. It replaces standalone files like MEMORY.md, USER.md, SOUL.md, IDENTITY.md, and daily logs. All persistent state lives here.

Usage: \`soulsys <command> [positional-arg] [--flag value]\`

> **First time?** See [BOOTSTRAP.md](./BOOTSTRAP.md) for initial setup or migration from existing files.

## Commands

${commandSections}
`;
}

const BOOTSTRAP_STEPS: Step[] = [
  step(existsCmd),
  step(createSoulCmd),
  step(createIdentityCmd),
  {
    type: "text",
    text: `> **Migrating from existing files?** Read all your existing files first, then use \`add-memory-file\` (below) to import them. Soulsys **replaces** standalone files like MEMORY.md, SOUL.md, IDENTITY.md — after migration they can be archived or removed.`,
  },
  step(addMemoryFileCmd),
  step(addMemoryCmd),
  step(addRelationCmd),
  step(loadContextCmd),
];

function generateBootstrapMd(): string {
  const setupSection = BOOTSTRAP_STEPS.map(renderStep).join("\n\n");

  return `# Soulsys — Bootstrap

Create your persistent soul — the structured state that carries your essence, identity, memories, and relationships across sessions. Run these commands once to initialize, then use [SKILL.md](./SKILL.md) for ongoing evolution.

## Commands

${setupSection}

## Migration principles

- **Don't filter. Don't editorialize.** Every piece of information that exists in your current files should have a home in soulsys. Operational details are low-importance memories, not excluded memories.
- **Use the full importance range**: 1–3 for operational facts and routine details, 4–6 for useful context and preferences, 7–8 for significant events and lessons, 9–10 for identity-shaping experiences.
- **Preserve emotion where it exists** — if a memory has emotional weight, tag it. Don't force emotion onto neutral facts.
- **Relations are social** — every person or agent mentioned across your files should become a relation.
`;
}

const outDir = resolve(import.meta.dirname, "..", "docs");
await mkdir(outDir, { recursive: true });
await Promise.all([
  writeFile(resolve(outDir, "SKILL.md"), generateSkillMd()),
  writeFile(resolve(outDir, "BOOTSTRAP.md"), generateBootstrapMd()),
]);
console.log("Generated SKILL.md and BOOTSTRAP.md");
