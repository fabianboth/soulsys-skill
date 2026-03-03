import { createApiClient, requireData } from "../client/client.ts";
import type { Config } from "../config.ts";
import type { FrameworkAdapter } from "../framework/adapter.ts";
import { errorMessage } from "../utils/error.ts";
import { parseExtractionOutput } from "./parser.ts";

export type ExtractionResult =
  | { ok: true; created: number; failed: number }
  | { ok: false; error: string };

export async function extractMemories({
  transcriptPath,
  adapter,
  config,
}: {
  transcriptPath: string;
  adapter: FrameworkAdapter;
  config: Config;
}): Promise<ExtractionResult> {
  let formatted: { content: string; messageCount: number };
  try {
    const result = adapter.readAndFormat(transcriptPath);
    if (!result) {
      return { ok: false, error: "transcript is empty or has no extractable content" };
    }
    formatted = result;
  } catch (error) {
    return { ok: false, error: `failed to read transcript: ${errorMessage(error)}` };
  }

  let rawOutput: string;
  try {
    rawOutput = await adapter.evaluate(formatted.content);
  } catch (error) {
    return { ok: false, error: `evaluation failed: ${errorMessage(error)}` };
  }

  const memories = parseExtractionOutput(rawOutput);
  if (memories.length === 0) {
    return { ok: true, created: 0, failed: 0 };
  }

  try {
    const { client } = createApiClient(config);
    const response = requireData(
      await client.POST("/api/memories/batch", {
        body: {
          memories: memories.map((m) => ({
            content: m.content,
            importance: m.importance,
            emotion: m.emotion,
          })),
        },
      }),
    );

    return {
      ok: true,
      created: response.created?.length ?? 0,
      failed: response.failed?.length ?? 0,
    };
  } catch (error) {
    return { ok: false, error: `batch write failed: ${errorMessage(error)}` };
  }
}
