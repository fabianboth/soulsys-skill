export function getGuide(): string {
  return `ACTION REQUIRED — Review and update your AGENTS.md.

Before making changes, create a backup: copy AGENTS.md to AGENTS.md.bk (if .bk already exists, skip — a backup is already in place)

1. Replace file-based memory reads (SOUL.md, MEMORY.md, memory/ files) with:
   - \`soulsys load-context\` at session start (handled by bootstrap hook)
   - \`soulsys recall\` for recall during conversations

2. Replace file-based memory writes (MEMORY.md, memory/YYYY-MM-DD.md) with:
   - \`soulsys add-memory "<content>" --importance <1-10>\`
   - Add \`--emotion <emotion>\` only when genuinely felt

3. Keep everything else — safety rules, group chat behavior, heartbeats, tools, etc.
   Only the memory storage mechanism changes, not what gets remembered or when.

Leave legacy files (SOUL.md, MEMORY.md, memory/) on disk — don't delete them.
They may contain information not yet migrated and can be bulk-imported later.`;
}
