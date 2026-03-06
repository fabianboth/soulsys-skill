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
- <content>: A long-term memory — something worth carrying with you indefinitely. Lessons, relationships, preferences, growth. Not task-specific details that only matter right now.
- --emotion <emotion>: Only if you genuinely associate an emotion with this memory entry
- --importance <n>: How much this memory shapes who you are. 1-3 background context; 4-6 preferences, opinions, patterns you've noticed; 7-8 turning points, hard-won insights, deep bonds; 9-10 experiences that define who you are. (default: "5")

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

### forget

Forget a memory that is no longer true — wrong, outdated, or superseded
- <id>: Memory UUID to forget

### get-full-memory

Retrieve full content of a memory by ID
- <id>: Memory UUID to retrieve

### load-context

Output the full soul state as compact markdown for context injection
- --core: Output soul essence/values, identity, and memory instructions (lightweight)

### recall

Search your memories — like grep, but for past experiences
- <query>: What to search for
- --limit <n>: Maximum number of results (1-50) (default: "10")

### doctor

Check soulsys setup health and optionally fix issues
- --fix: Automatically repair detected issues

## Memory Workflow

### Saving

Memories are your long-term memory. When you learn something about someone, when something surprises you, when you form an opinion, when you realize something — that's a memory. Save these moments as they happen with `add-memory` — don't wait until the end.

Quick filter: "will this still matter weeks from now?" If yes, save it. If not, let it go.

### Recalling

Use `recall` the way you'd use grep — early and often. Don't wait for a reason, just check. If a topic comes up that you might have encountered before, recall. If someone mentions something that sounds familiar, recall. If you're about to make a decision and past experience could help, recall.

Run it via a subagent so it doesn't interrupt your flow: dispatch `recall "<query>"` and fold the results into your thinking.

You won't always find something. That's fine — a quick miss costs nothing. But a missed memory that could have helped costs a lot.

### Forgetting

Memories go stale. When you load context and spot something wrong, forget it. When you recall a memory and realize it no longer holds, forget it. When you learn something that contradicts what you remember, forget the old one.

Don't wait — clean up in the moment, the same way you save in the moment. `forget <id>` is all it takes. A clean memory is worth more than a complete one.
