# OpenClaw — Framework Integration

## AGENTS.md Setup

Modify your `AGENTS.md` to use soulsys for memory and identity instead of local files:

1. **Replace file-based memory reads** (SOUL.md, MEMORY.md, `memory/` files) with `soulsys load-context` at session start and `soulsys search-memory` for recall
2. **Replace file-based memory writes** (MEMORY.md, `memory/YYYY-MM-DD.md`) with `soulsys add-memory` — include `--importance <1-10>` and optionally `--emotion <emotion>` when appropriate
3. **Keep everything else** — safety rules, group chat behavior, heartbeats, tools, etc. Only the memory storage mechanism changes, not what gets remembered or when

Leave the legacy files (SOUL.md, MEMORY.md, `memory/`) on disk — don't delete them. They may contain information you haven't migrated yet, and can be bulk-imported into soulsys later.

## Automatic Memory Extraction (memoryFlush)

Add memoryFlush config to `openclaw.json` to extract memories before context compaction:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "systemPrompt": "You are saving memories before context compaction. Use the soulsys add-memory command exactly as described in AGENTS.md.",
          "prompt": "Review the conversation above. For each memory worth persisting, run:\n\nsoulsys add-memory \"<memory content>\" --importance <1-10>\n\nAdd --emotion <emotion> only if you genuinely associate an emotion with the memory. Do not save routine exchanges or transient state."
        }
      }
    }
  }
}
```

## Context Injection (agent:bootstrap hook)

Add a bootstrap hook to inject soulsys context at session start. The hook handles context loading, while AGENTS.md provides the read/write instructions:

```typescript
// hooks/soulsys-bootstrap.ts
export default async function (context) {
  context.bootstrapFiles = context.bootstrapFiles.filter(
    (f) => !f.path.match(/SOUL\.md|MEMORY\.md|memory\//)
  );

  const { execSync } = await import("node:child_process");
  const soulContext = execSync("soulsys load-context", { encoding: "utf-8" });
  context.bootstrapFiles.push({
    path: "soulsys-context",
    content: soulContext,
  });
}
```

Register the hook in `openclaw.json`:

```json
{
  "hooks": {
    "agent:bootstrap": "./hooks/soulsys-bootstrap.ts"
  }
}
```
