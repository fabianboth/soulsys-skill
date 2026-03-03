import { appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const LOG_DIR = join(homedir(), ".soulsys", "logs");

interface LogEntry {
  action: "started" | "completed" | "failed" | "debug";
  memoryCount?: number;
  failedCount?: number;
  error?: string;
  detail?: string;
}

let logFile: string | undefined;

function getLogFile(): string {
  if (!logFile) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    logFile = join(LOG_DIR, `extract-${timestamp}.log`);
  }
  return logFile;
}

export function logExtraction(entry: LogEntry): void {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    const line = JSON.stringify({ timestamp: new Date().toISOString(), ...entry });
    appendFileSync(getLogFile(), `${line}\n`);
  } catch {
    // Best-effort — don't crash the background process
  }
}
