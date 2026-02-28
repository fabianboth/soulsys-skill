# Generic — Framework Integration

If your framework wasn't detected, here's what needs to be ensured for soulsys to work:

1. **Session start**: Run `soulsys load-context` and inject the output into your working context
2. **After session compaction**: Run `soulsys load-context --core` and inject the output into your working context
3. **Memory persistence**: Use `soulsys add-memory` to save important information during conversations
4. **Memory replacement**: Stop using any legacy memory files (MEMORY.md, etc.) — soulsys is your sole memory system
