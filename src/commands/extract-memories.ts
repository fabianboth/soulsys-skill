import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Command } from "commander";

import { createApiClient, requireData } from "../client/client.ts";
import { tryResolveConfig } from "../config.ts";
import { parseExtractionOutput } from "../extraction/parser.ts";
import { resolveFrameworkAdapter } from "../framework/adapters/index.ts";
import { detectFramework } from "../framework/detect.ts";

function stderr(message: string): void {
  process.stderr.write(`${message}\n`);
}

function readTranscriptPathFromStdin(): string | undefined {
  if (process.stdin.isTTY) return undefined;
  try {
    const input = readFileSync(process.stdin.fd, "utf-8").trim();
    if (!input) return undefined;
    const parsed = JSON.parse(input);
    return typeof parsed.transcript_path === "string" ? parsed.transcript_path : undefined;
  } catch {
    return undefined;
  }
}

export function register(program: Command): Command {
  return program
    .command("extract-memories")
    .description(
      "Extract memories from a conversation transcript — called by compaction hooks, not manually",
    )
    .option(
      "--transcript <path>",
      "Path to JSONL transcript file (auto-read from hook stdin when invoked by PreCompact)",
    )
    .option("--framework <guide>", "Override framework auto-detection (e.g., claude-code)")
    .option(
      "--dry-run",
      "Read transcript and report message count without evaluating or writing",
      false,
    )
    .action(async (options: { transcript?: string; framework?: string; dryRun: boolean }) => {
      try {
        await extractMemories(options);
      } catch (error) {
        stderr(`extract-memories: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}

async function extractMemories(options: {
  transcript?: string;
  framework?: string;
  dryRun: boolean;
}): Promise<void> {
  const transcriptPath = options.transcript || readTranscriptPathFromStdin();
  if (!transcriptPath) {
    stderr("extract-memories: no transcript path provided (use --transcript flag)");
    return;
  }

  const guide = options.framework || detectFramework(resolve(process.argv[1])).guide;
  const adapter = resolveFrameworkAdapter(guide);
  if (!adapter) {
    stderr(`extract-memories: no extraction adapter for framework "${guide}"`);
    return;
  }

  let formatted: { content: string; messageCount: number };
  try {
    const result = adapter.readAndFormat(transcriptPath);
    if (!result) {
      stderr("extract-memories: transcript is empty or has no extractable content");
      return;
    }
    formatted = result;
  } catch (error) {
    stderr(
      `extract-memories: failed to read transcript: ${error instanceof Error ? error.message : String(error)}`,
    );
    return;
  }

  if (options.dryRun) {
    stderr(
      `extract-memories: dry run — ${formatted.messageCount} messages in current window, skipping evaluation`,
    );
    return;
  }

  const config = tryResolveConfig();
  if (!config) {
    stderr("extract-memories: soulsys not configured, skipping extraction");
    return;
  }

  let rawOutput: string;
  try {
    rawOutput = await adapter.evaluate(formatted.content);
  } catch (error) {
    stderr(
      `extract-memories: evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return;
  }

  const memories = parseExtractionOutput(rawOutput);
  if (memories.length === 0) {
    stderr("extract-memories: no memories extracted");
    return;
  }

  const { client } = createApiClient(config);
  let written = 0;

  for (const memory of memories) {
    try {
      requireData(
        await client.POST("/api/memories", {
          body: {
            content: memory.content,
            importance: memory.importance,
            emotion: memory.emotion,
          },
        }),
      );
      written++;
    } catch (error) {
      stderr(
        `extract-memories: failed to write memory: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const failed = memories.length - written;
  stderr(
    `extract-memories: wrote ${written}/${memories.length} memories${failed > 0 ? ` (${failed} failed)` : ""}`,
  );
}
