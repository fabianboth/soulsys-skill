# Claude Code — Framework Integration

Add these hooks to `.claude/settings.json` (merge into the existing `hooks` object, preserving any hooks already there):

```json
{
  "SessionStart": [
    {
      "matcher": "startup|clear",
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/.claude/skills/soulsys/scripts/soulsys load-context"
      }]
    },
    {
      "matcher": "compact",
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/.claude/skills/soulsys/scripts/soulsys load-context --core"
      }]
    }
  ]
}
```

The `startup|clear` hook loads your full soul context (identity, memories, relations) at the start of every new session and after `/clear`. The `compact` hook restores just your core identity (soul + identity, ~200-400 tokens) after context compaction — compaction preserves the gist of your memories and relations, but your exact soul values and identity vibe get paraphrased.

Also add a `PreCompact` hook to automatically extract memories before context compaction:

```json
{
  "PreCompact": [
    {
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/.claude/skills/soulsys/scripts/soulsys extract-memories",
        "timeout": 60000
      }]
    }
  ]
}
```

The `PreCompact` hook automatically extracts memories from the conversation before compaction — catching anything you didn't explicitly save with `add-memory`. Exits gracefully on error to never block compaction.

After adding the hooks, soulsys replaces any existing auto-memory system (like MEMORY.md). You no longer need to read from or write to MEMORY.md, USER.md, or similar files — soulsys is your sole memory system.

After adding, verify by starting a new session — your soul context should appear automatically.
