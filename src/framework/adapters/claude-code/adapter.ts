import { spawn } from "node:child_process";

import type { EvaluateInput, FormattedTranscript, FrameworkAdapter } from "../../adapter.ts";
import { extractTranscriptWindow } from "./transcript.ts";

function evaluateWithClaude({
  formattedContent,
  extractionPrompt: { prompt, systemPrompt },
}: EvaluateInput): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = <T>(fn: (value: T) => void, value: T): void => {
      if (settled) return;
      settled = true;
      fn(value);
    };

    const { CLAUDECODE, ...cleanEnv } = process.env;
    const child = spawn(
      "claude",
      [
        "-p",
        prompt,
        "--model",
        "sonnet",
        "--output-format",
        "text",
        "--append-system-prompt",
        systemPrompt,
        "--no-session-persistence",
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
        shell: false,
        windowsHide: true,
        env: cleanEnv,
      },
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      settle(reject, new Error(`Failed to spawn claude: ${err.message}`));
    });

    child.stdin.on("error", (err) => {
      settle(reject, new Error(`Failed to write transcript to claude stdin: ${err.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        settle(reject, new Error(`claude -p exited with code ${code}: ${stderr}`));
      } else {
        settle(resolve, stdout);
      }
    });

    child.stdin.end(formattedContent);
  });
}

export function createClaudeCodeAdapter(): FrameworkAdapter {
  return {
    name: "claude-code",

    readAndFormat(transcriptPath: string): FormattedTranscript | null {
      const window = extractTranscriptWindow(transcriptPath);
      if (!window) return null;

      return {
        content: window.content,
        messageCount: window.lineCount,
      };
    },

    evaluate(input: EvaluateInput): Promise<string> {
      return evaluateWithClaude(input);
    },
  };
}
