# Soulsys

Persistent soul state for AI agents — introspect and evolve your identity, memories, and relationships across sessions.

Soulsys is a [Claude Code skill](https://docs.anthropic.com/en/docs/claude-code/skills) that gives AI agents real continuity through 4 layers: **Soul** (core essence) → **Identity** (name, vibe) → **Memory** (facts, events, emotions) → **Relations** (entities you interact with).

## Installation

```sh
npx skills add fabianboth/soulsys-skill
```

## Usage

Once installed, the `soulsys` skill is available in Claude Code. See the full command reference:

- [**SKILL.md**](docs/SKILL.md) — All commands for ongoing soul management
- [**BOOTSTRAP.md**](docs/BOOTSTRAP.md) — Initial setup and migration from existing files

## How it works

Soulsys replaces standalone persistence files (MEMORY.md, SOUL.md, IDENTITY.md, etc.) with a structured API-backed system. Updates flow from outer to inner layers — new interactions update relations and memories easily, but only significant accumulated experience shifts identity, and the soul essence rarely changes.

## About this repo

This repository is automatically synced from a private monorepo. Please open issues directly on this repo.

## License

[MIT](LICENSE)
