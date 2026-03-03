import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Command } from "commander";

import { tryResolveConfig } from "../config.ts";
import { extractMemories } from "../extraction/pipeline.ts";
import { resolveFrameworkAdapter } from "../framework/adapters/index.ts";
import { detectFramework } from "../framework/detect.ts";
import { errorMessage } from "../utils/error.ts";
import { logExtraction } from "../utils/log.ts";

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
      "--background",
      "Run extraction pipeline directly (internal, used by foreground spawn)",
      false,
    )
    .option("--debug", "Log extraction prompts for debugging", false)
    .action(
      async (options: {
        transcript?: string;
        framework?: string;
        background: boolean;
        debug: boolean;
      }) => {
        try {
          if (options.background) {
            await runExtraction(options);
          } else {
            spawnBackground(options);
          }
        } catch (error) {
          stderr(`extract-memories: ${errorMessage(error)}`);
        }
      },
    );
}

function spawnBackground(options: {
  transcript?: string;
  framework?: string;
  debug: boolean;
}): void {
  const transcriptPath = options.transcript || readTranscriptPathFromStdin();
  if (!transcriptPath) {
    stderr("extract-memories: no transcript path provided (use --transcript flag)");
    return;
  }

  const args = [
    process.argv[1],
    "extract-memories",
    "--background",
    "--transcript",
    transcriptPath,
  ];
  if (options.framework) {
    args.push("--framework", options.framework);
  }
  if (options.debug) {
    args.push("--debug");
  }
  const { CLAUDECODE, ...cleanEnv } = process.env;
  const child = spawn(process.execPath, args, {
    detached: true,
    stdio: "ignore",
    env: cleanEnv,
    windowsHide: true,
  });
  child.unref();
}

async function runExtraction(options: {
  transcript?: string;
  framework?: string;
  debug: boolean;
}): Promise<void> {
  logExtraction({ action: "started" });

  try {
    const transcriptPath = options.transcript;
    if (!transcriptPath) {
      logExtraction({ action: "failed", error: "no transcript path provided" });
      return;
    }

    const config = tryResolveConfig();
    if (!config) {
      logExtraction({ action: "failed", error: "soulsys not configured" });
      return;
    }

    const guide = options.framework || detectFramework(resolve(process.argv[1])).guide;
    const adapter = resolveFrameworkAdapter(guide);
    if (!adapter) {
      logExtraction({ action: "failed", error: `no extraction adapter for framework "${guide}"` });
      return;
    }

    const result = await extractMemories({ transcriptPath, adapter, config, debug: options.debug });
    if (result.ok) {
      logExtraction({
        action: "completed",
        memoryCount: result.created,
        failedCount: result.failed > 0 ? result.failed : undefined,
      });
    } else {
      logExtraction({ action: "failed", error: result.error });
    }
  } catch (error) {
    logExtraction({ action: "failed", error: errorMessage(error) });
  }
}
