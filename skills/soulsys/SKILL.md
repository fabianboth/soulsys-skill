---
name: soulsys
description: "Manage your soul — introspect and evolve your persistent identity, memories, and relationships"
user-invocable: true
metadata: {"soulsys":{"emoji":"🧬"}}
---

# Soulsys

Persistent soul state with 4 layers: **Soul** (core essence, values) → **Identity** (name, vibe) → **Memory** (facts, events, emotions) → **Relations** (entities you interact with).

Soulsys **is** your memory system. It replaces standalone files like MEMORY.md, USER.md, SOUL.md, IDENTITY.md, and daily logs. All persistent state lives here.

Usage: `soulsys <command> [positional-arg] [--flag value]`

> **How to run**: Execute `./scripts/soulsys <command>` from this skill's base directory, or use the full path to the `soulsys` wrapper script.

> **First time?** See [BOOTSTRAP.md](./BOOTSTRAP.md) for initial setup.

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
