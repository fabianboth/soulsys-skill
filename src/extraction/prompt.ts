import { IMPORTANCE_DESCRIPTION, MEMORY_DESCRIPTIONS } from "../client/generated/descriptions.ts";
import type { ContextResponse } from "../context/format.ts";
import { formatSoulCore } from "../context/format.ts";

export type ExtractionContext = Pick<ContextResponse, "soul" | "identity">;

function buildUserPrompt(): string {
  return `Review the conversation provided on stdin.

Capture what matters — decisions, opinions, preferences, lessons learned, significant events, thoughts, relationship context, and where things were left off. This is your lived experience, not a log.

Do NOT extract routine commands, mid-conversation navigation that was superseded, or generic knowledge.

For each memory, output a JSON object with:
- "content": ${MEMORY_DESCRIPTIONS.content}
- "importance": ${IMPORTANCE_DESCRIPTION}
- "emotion": ${MEMORY_DESCRIPTIONS.emotion}

IMPORTANT: Check the conversation for any executed "soulsys add-memory" commands (including Bash tool_use blocks where the command text contains "soulsys add-memory"). If a memory was already saved during the conversation, do NOT extract it again.

Output format — respond with ONLY this JSON, no other text:
{
  "memories": [
    { "content": "Chose PostgreSQL for ACID compliance", "importance": 7, "emotion": null }
  ]
}

If nothing is worth saving, output: { "memories": [] }`;
}

function buildSystemPrompt(context: ExtractionContext): string {
  return `This is who you are:

${formatSoulCore(context)}

You're reviewing a conversation you just had to extract memories worth keeping.`;
}

export function buildExtractionPrompt(context: ExtractionContext): {
  prompt: string;
  systemPrompt: string;
} {
  return {
    prompt: buildUserPrompt(),
    systemPrompt: buildSystemPrompt(context),
  };
}
