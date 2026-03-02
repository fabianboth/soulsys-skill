import { readFileSync } from "node:fs";

const MAX_WINDOW_CHARS = 400_000;
const COMPACTION_MARKER = '"compact_boundary"';

export type TranscriptWindow = {
  content: string;
  lineCount: number;
};

export function extractTranscriptWindow(filePath: string): TranscriptWindow | null {
  const raw = readFileSync(filePath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length === 0) return null;

  let startIndex = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes(COMPACTION_MARKER)) {
      startIndex = i + 1;
      break;
    }
  }

  if (startIndex >= lines.length) return null;

  let totalChars = 0;
  for (let i = startIndex; i < lines.length; i++) {
    totalChars += lines[i].length + 1;
  }

  while (totalChars > MAX_WINDOW_CHARS && startIndex < lines.length - 1) {
    totalChars -= lines[startIndex].length + 1;
    startIndex++;
  }

  const windowLines = lines.slice(startIndex);
  return {
    content: windowLines.join("\n"),
    lineCount: windowLines.length,
  };
}
