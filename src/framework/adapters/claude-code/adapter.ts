import { spawn } from "node:child_process";

import { buildExtractionPrompt } from "../../../extraction/prompt.ts";
import type { FormattedTranscript, FrameworkAdapter } from "../../adapter.ts";
import { extractTranscriptWindow } from "./transcript.ts";

function evaluateWithClaude(formattedWindow: string): Promise<string> {
  const { prompt, systemPrompt } = buildExtractionPrompt();

  return new Promise((resolve, reject) => {
    const child = spawn(
      "claude",
      [
        "-p",
        prompt,
        "--model",
        "sonnet",
        "--output-format",
        "json",
        "--append-system-prompt",
        systemPrompt,
        "--no-session-persistence",
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
        shell: false,
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
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`claude -p exited with code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });

    child.stdin.write(formattedWindow);
    child.stdin.end();
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

    evaluate(formattedContent: string): Promise<string> {
      return evaluateWithClaude(formattedContent);
    },
  };
}
