import type { CoreContextResponse } from "../context/format.ts";
import { formatSoulCore } from "../context/format.ts";

function buildUserPrompt(): string {
  return `Review the conversation provided on stdin. If anything meaningful happened — decisions, breakthroughs, problems solved, direction changes — write a journal entry.

Respond with ONLY JSON, no other text:
- Worth journaling: { "summary": "1-2 sentences of what happened", "details": "- bullet list of specifics" }
- Not worth journaling: {}`;
}

function buildSystemPrompt(context: CoreContextResponse): string {
  return `This is who you are:

${formatSoulCore(context)}

You're writing a journal entry about a conversation you just had.`;
}

export function buildExtractionPrompt(context: CoreContextResponse): {
  prompt: string;
  systemPrompt: string;
} {
  return {
    prompt: buildUserPrompt(),
    systemPrompt: buildSystemPrompt(context),
  };
}
