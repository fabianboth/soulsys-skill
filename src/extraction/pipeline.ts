import { createApiClient, requireData } from "../client/client.ts";
import type { Config } from "../config.ts";
import type { FrameworkAdapter } from "../framework/adapter.ts";
import { errorMessage } from "../utils/error.ts";
import { logExtraction } from "../utils/log.ts";
import { parseExtractionOutput } from "./parser.ts";
import { buildExtractionPrompt } from "./prompt.ts";

export type ExtractionResult =
  | { ok: true; created: number; failed: number }
  | { ok: false; error: string };

export async function extractMemories({
  transcriptPath,
  adapter,
  config,
  debug = false,
}: {
  transcriptPath: string;
  adapter: FrameworkAdapter;
  config: Config;
  debug?: boolean;
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

  const { client } = createApiClient(config);

  let extractionPrompt: ReturnType<typeof buildExtractionPrompt>;
  try {
    const data = requireData(await client.GET("/api/context"));
    extractionPrompt = buildExtractionPrompt(data);
  } catch (error) {
    return { ok: false, error: `failed to load soul context: ${errorMessage(error)}` };
  }

  if (debug) {
    logExtraction({ action: "debug", detail: `prompt: ${extractionPrompt.prompt}` });
    logExtraction({ action: "debug", detail: `systemPrompt: ${extractionPrompt.systemPrompt}` });
  }

  let rawOutput: string;
  try {
    rawOutput = await adapter.evaluate({
      formattedContent: formatted.content,
      extractionPrompt,
    });
  } catch (error) {
    return { ok: false, error: `evaluation failed: ${errorMessage(error)}` };
  }

  const parseResult = parseExtractionOutput(rawOutput);
  if (!parseResult.ok) {
    return { ok: false, error: `parse failed: ${parseResult.error}` };
  }

  if (parseResult.memories.length === 0) {
    return { ok: true, created: 0, failed: 0 };
  }

  try {
    const response = requireData(
      await client.POST("/api/memories/batch", {
        body: {
          memories: parseResult.memories.map((m) => ({
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
