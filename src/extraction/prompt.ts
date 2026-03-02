export function buildExtractionPrompt(): { prompt: string; systemPrompt: string } {
  const prompt = `Review the conversation provided on stdin. Extract memories worth persisting to long-term storage.

For each memory, output a JSON object with:
- "content": A specific, self-contained statement (not a summary of the conversation)
- "importance": 1-10 rating (1-3: routine facts; 4-6: useful context/preferences; 7-8: significant decisions/lessons; 9-10: identity-shaping)
- "emotion": An emotion you associate with this memory, or null if none

IMPORTANT: Check the conversation for any executed "soulsys add-memory" commands (including Bash tool_use blocks where the command text contains "soulsys add-memory"). If a memory was already saved during the conversation, do NOT extract it again.

Output format — respond with ONLY this JSON, no other text:
{
  "memories": [
    { "content": "Chose PostgreSQL for ACID compliance", "importance": 7, "emotion": null }
  ]
}

If nothing is worth saving, output: { "memories": [] }`;

  const systemPrompt = `You are a memory extraction evaluator. Your job is to identify information worth remembering from a conversation between a user and an AI assistant.

Extract these categories:
- Decisions and architecture choices (e.g., "Chose PostgreSQL over MongoDB for ACID compliance")
- User preferences (e.g., "User prefers functional style over OOP")
- Lessons learned (e.g., "The refresh token bug was caused by missing family ID constraint")
- Significant events (e.g., "Successfully migrated from REST to GraphQL")
- Relationship context (e.g., "User is building a SaaS product for small businesses")

Do NOT extract:
- Routine commands ("run the tests", "build the project", "hello")
- Transient state ("looking at file X", "checking the logs")
- Generic knowledge the AI already knows
- Content that was already saved via soulsys add-memory tool calls in the conversation

Each memory should be a specific, standalone statement — not a conversation summary. Write memories as facts, not narration.`;

  return { prompt, systemPrompt };
}
