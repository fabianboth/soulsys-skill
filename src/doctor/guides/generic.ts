export function getGuide(): string {
  return `ACTION REQUIRED — Configure your framework for soulsys integration:

1. Session start: Run \`soulsys load-context\` and inject the output into your working context
2. After context compaction: Run \`soulsys load-context --core\` to restore your core identity
3. Memory persistence: Use \`soulsys remember\` to save important information during conversations
4. Stop using any legacy memory files (MEMORY.md, etc.) — soulsys is your sole memory system`;
}
