import { readFileSync } from "node:fs";

import type { Command } from "commander";

import { REMINDER_MESSAGE, reminderNudge } from "../nudge/nudge.ts";

export function register(program: Command): Command {
  return program
    .command("reminder-nudge")
    .description("Emit periodic memory reminder (hook-only, not for manual use)")
    .action(() => {
      try {
        if (process.stdin.isTTY) return;

        const raw = readFileSync(process.stdin.fd, "utf-8");
        const input: unknown = JSON.parse(raw);
        if (!input || typeof input !== "object" || !("session_id" in input)) return;

        const sessionId = (input as { session_id: unknown }).session_id;
        if (typeof sessionId !== "string" || sessionId.length === 0) return;

        const result = reminderNudge(sessionId);
        if (result.shouldNudge) {
          process.stdout.write(
            JSON.stringify({
              hookSpecificOutput: {
                hookEventName: "UserPromptSubmit",
                additionalContext: REMINDER_MESSAGE,
              },
            }),
          );
        }
      } catch {
        // fail-open: any error → silent exit
      }
    });
}
