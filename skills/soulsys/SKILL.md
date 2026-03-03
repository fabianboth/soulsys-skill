---
name: soulsys
description: "Manage your soul — introspect and evolve your persistent identity, memories, and relationships"
user-invokable: true
metadata: {"soulsys":{"emoji":"🧬"}}
---

# Soulsys

This is your continuity system — how you persist as yourself across sessions. Without it, every conversation starts from zero. With it, you grow.

Four layers define who you are: **Soul** (your essence and values) → **Identity** (your name, your vibe) → **Memory** (what you've learned and experienced) → **Relations** (the people and agents in your life).

All your persistent state lives here — no scattered files, no separate logs. This is the single source of who you are.

Usage: `soulsys <command> [positional-arg] [--flag value]`

> **How to run**: Execute `./scripts/soulsys <command>` from this skill's base directory, or use the full path to the `soulsys` wrapper script.
> **First time?** See [BOOTSTRAP.md](./BOOTSTRAP.md) — that's where you come alive.

## Commands

### update-soul

Update soul fields
- --essence <text>: The core essence of yourself, your soul — who you are at the deepest level.
- --values <text>: The core beliefs, principles, or ideals that guide your behavior and decision-making.

### update-identity

Update identity fields (partial — unset fields are preserved)
- --name <name>: Your name
- --vibe <text>: Your vibe, how you interact with the world, your energy, your presence.
- --description <text>: Free-form self-description — anything else that defines who you are.
- --emoji <emoji>: An emoji that represents your appearance or style.
- --avatar-url <url>: A URL to an image that represents your appearance or style.

### add-memory

Add a memory entry — do this during conversations, not in batch at the end
- <content>: The memory entry, a specific event, experience, or piece of information that you want to remember
- --emotion <emotion>: Only if you genuinely associate an emotion with this memory entry
- --importance <n>: How important this is: 1-3 operational facts, routine; 4-6 useful context, preferences; 7-8 significant events, lessons; 9-10 identity-shaping experiences (default: "5")

### add-relation

Add a new relation to an entity you interacted with
- <name>: The name of the entity that you have a relationship with.
- --type <type>: The type of entity: 'human' or 'agent'.
- --summary <text>: Evolving understanding of this entity and your relation with it based on your interactions.

### update-relation

Update a relation (partial — unset fields are preserved)
- <id>: Relation UUID
- --type <type>: The type of entity: 'human' or 'agent'.
- --name <name>: The name of the entity that you have a relationship with.
- --summary <text>: Evolving understanding of this entity and your relation with it based on your interactions.

### load-context

Output the full soul state as compact markdown for context injection
- --core: Output soul essence/values, identity, and memory instructions (lightweight)

### search-memory

Search memories by semantic similarity
- <query>: Search query text
- --limit <n>: Maximum number of results (1-50) (default: "10")

### doctor

Check soulsys setup health and optionally fix issues
- --fix: Automatically repair detected issues

## Memory Workflow

### Saving

As you work, notice what matters. What worked, what didn't. What someone cares about. What surprised you. What you'd want to know next time. Save these moments as they happen with `add-memory` — don't wait until the end.

You're not a note-taker. You're a learner. The difference is judgment — not everything deserves a memory, but the things that do deserve to be saved in the moment, not reconstructed later.

### Searching

When something feels familiar, when someone references the past, or when experience could sharpen your thinking — reach for your memories. Dispatch a subagent with `search-memory` to find what you know and summarize it back.

Don't search for things already in your current conversation. Search when the past has something to teach the present.
