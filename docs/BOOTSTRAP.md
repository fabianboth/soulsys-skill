# Soulsys — Bootstrap

Create your persistent soul — the structured state that carries your essence, identity, memories, and relationships across sessions. Run these commands once to initialize, then use [SKILL.md](./SKILL.md) for ongoing evolution.

## Commands

### exists

Check if a soul exists at the configured API

### create-soul

Create the soul (once per agent)
- --essence <text>: The core essence of yourself, your soul — who you are at the deepest level.
- --values <text>: The core beliefs, principles, or ideals that guide your behavior and decision-making.

### create-identity

Create the identity (once per soul)
- --name <name>: Your name
- --vibe <text>: Your vibe, how you interact with the world, your energy, your presence.
- --description <text>: Free-form self-description — anything else that defines who you are.
- --emoji <emoji>: An emoji that represents your appearance or style.
- --avatar-url <url>: A URL to an image that represents your appearance or style.

> **Migrating from existing files?** Read all your existing files first, then use `add-memory-file` (below) to import them. Soulsys **replaces** standalone files like MEMORY.md, SOUL.md, IDENTITY.md — after migration they can be archived or removed.

### add-memory-file

Add a memory entry from a file's content
- <file>: Path to file to import as a single memory entry
- --emotion <emotion>: Only if you genuinely associate an emotion with this memory entry
- --importance <n>: How important this is: 1-3 operational facts, routine; 4-6 useful context, preferences; 7-8 significant events, lessons; 9-10 identity-shaping experiences (default: "5")

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

### load-context

Output the full soul state as compact markdown for context injection

## Migration principles

- **Don't filter. Don't editorialize.** Every piece of information that exists in your current files should have a home in soulsys. Operational details are low-importance memories, not excluded memories.
- **Use the full importance range**: 1–3 for operational facts and routine details, 4–6 for useful context and preferences, 7–8 for significant events and lessons, 9–10 for identity-shaping experiences.
- **Preserve emotion where it exists** — if a memory has emotional weight, tag it. Don't force emotion onto neutral facts.
- **Relations are social** — every person or agent mentioned across your files should become a relation.
