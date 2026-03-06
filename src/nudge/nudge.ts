import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const REMINDER_INTERVAL = 5;

export const REMINDER_MESSAGE =
  "Reminder: Pause — anything worth a soulsys remember? Anything you should soulsys recall before continuing?";

export type NudgeResult = {
  shouldNudge: boolean;
};

export function getNudgeFilePath(sessionId: string): string {
  const safeId = sessionId.replaceAll(/[^a-zA-Z0-9_-]/g, "_").slice(0, 128);
  return join(tmpdir(), `soulsys-nudge-${safeId}`);
}

export function reminderNudge(sessionId: string, threshold = REMINDER_INTERVAL): NudgeResult {
  const filePath = getNudgeFilePath(sessionId);
  try {
    let count = 0;
    try {
      const raw = readFileSync(filePath, "utf-8").trim();
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isNaN(parsed)) count = parsed;
    } catch {
      // file missing or unreadable — start at 0
    }

    const next = count + 1;
    if (next >= threshold) {
      writeFileSync(filePath, "0");
      return { shouldNudge: true };
    }

    writeFileSync(filePath, String(next));
    return { shouldNudge: false };
  } catch {
    return { shouldNudge: false };
  }
}
