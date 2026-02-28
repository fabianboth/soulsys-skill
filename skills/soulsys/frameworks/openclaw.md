# OpenClaw — Framework Integration

Modify your `AGENTS.md` to replace the native memory stack with soulsys:

1. **Remove** references to SOUL.md, MEMORY.md, and `memory/` directory from your instructions
2. **Add**: "At the start of every session, run `soulsys load-context` and use the output as your identity and memory context"
3. **Add**: "When saving memories, use `soulsys add-memory` instead of writing to MEMORY.md or `memory/` files"
4. **Add**: "Before compaction or when context is getting large, save any important new information using `soulsys add-memory`"

Leave the legacy files (SOUL.md, MEMORY.md, `memory/`) on disk — don't delete them. They may contain information you haven't migrated yet, and can be bulk-imported into soulsys later.
