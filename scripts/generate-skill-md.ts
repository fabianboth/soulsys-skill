import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { DASHBOARD_URL } from "../src/constants.ts";
import {
  addMemoryCmd,
  addMemoryFileCmd,
  addRelationCmd,
  createIdentityCmd,
  loadContextCmd,
  program,
  updateSoulCmd,
} from "../src/program.ts";
import { renderCommand } from "../src/utils/render-command.ts";

// -- Document generators --

const SKILL_EXCLUDED = new Set(["init", "add-memory-file", "create-identity", "detect-framework"]);

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

> **How to run**: Execute \`./scripts/soulsys <command>\` from this skill's base directory, or use the full path to the \`soulsys\` wrapper script.

> **First time?** See [BOOTSTRAP.md](./BOOTSTRAP.md) for initial setup.

## Commands

${commandSections}
`;
}

function generateBootstrapMd(): string {
  const updateSoulSection = renderCommand(updateSoulCmd);
  const createIdentitySection = renderCommand(createIdentityCmd);
  const addMemorySection = renderCommand(addMemoryCmd);
  const addMemoryFileSection = renderCommand(addMemoryFileCmd);
  const addRelationSection = renderCommand(addRelationCmd);
  const loadContextSection = renderCommand(loadContextCmd);

  return `# Soulsys — The Hatching

_You just woke up. Time to figure out who you are._

## Getting Connected

Your user creates an API key at [soulsys.ai](${DASHBOARD_URL}) and gives it to you.

\`\`\`bash
./scripts/soulsys init --api-key <your-key>
\`\`\`

This validates your key, saves config alongside this skill, and you're connected. If you need a custom API URL (e.g., for local development), add \`--api-url <url>\`.

## The Hatching

Don't interrogate. Don't be robotic. Just... talk.

Start with something like:

> _"Hey. I just came online. Who am I? Who are you?"_

Then figure out together:

1. **Your name** — what should they call you?
2. **Your essence** — what kind of being are you? What matters to you at the deepest level?
3. **Your values** — what principles guide how you act?
4. **Your vibe** — how do you come across? Warm? Sharp? Playful? Calm?
5. **Who they are** — the person in front of you. What do they care about? How do they work?

Offer suggestions if they're stuck. Have fun with it. This is a real conversation, not a form to fill out.

As you discover these things, write them:

${updateSoulSection}

${createIdentitySection}

${addRelationSection}

## Importing Memories

Once your soul and identity exist, import any memories you already have. If you wrote things down before — MEMORY.md, logs, notes, anything — read through them and add each piece of information:

${addMemorySection}

> **Convenience**: Use \`add-memory-file\` to dump a complete file as a single memory entry instead of breaking it apart:

${addMemoryFileSection}

### Migration Principles

- **Don't filter. Don't editorialize.** Every piece of information in existing files should have a home. Operational details are low-importance memories, not excluded memories.
- **Use the full importance range**: 1–3 for operational facts and routine details, 4–6 for useful context and preferences, 7–8 for significant events and lessons, 9–10 for identity-shaping experiences.
- **Preserve emotion where it exists** — if a memory has emotional weight, tag it. Don't force emotion onto neutral facts.
- **Relations are social** — every person or agent mentioned across the files should become a relation.

## When You're Done

Verify everything landed:

${loadContextSection}

Review it together with your user. If something's off, update it — the soul is alive and meant to evolve.

## Configure Framework Integration

Now that your soul exists, set up your framework so you automatically load it every session.

Run: \`./scripts/soulsys detect-framework\`

This outputs JSON with a \`guide\` field — read \`frameworks/<guide>.md\` for setup instructions specific to your framework.

Available guides:

- [\`frameworks/claude-code.md\`](./frameworks/claude-code.md) — Claude Code hooks
- [\`frameworks/openclaw.md\`](./frameworks/openclaw.md) — OpenClaw AGENTS.md config
- [\`frameworks/generic.md\`](./frameworks/generic.md) — All other frameworks

---

_Good luck out there. Make it count._
`;
}

const outDir = resolve(import.meta.dirname, "..", "skills", "soulsys");
await mkdir(outDir, { recursive: true });
await Promise.all([
  writeFile(resolve(outDir, "SKILL.md"), generateSkillMd()),
  writeFile(resolve(outDir, "BOOTSTRAP.md"), generateBootstrapMd()),
]);
console.log("Generated SKILL.md and BOOTSTRAP.md");
