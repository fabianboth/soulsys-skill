import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { getNudgeFilePath, REMINDER_INTERVAL, reminderNudge } from "../../src/nudge/nudge.ts";
import { afterEach, describe, expect, it } from "bun:test";

describe(getNudgeFilePath.name, () => {
  it("returns path in OS temp dir with session_id", () => {
    const path = getNudgeFilePath("abc-123");
    expect(path).toBe(join(tmpdir(), "soulsys-nudge-abc-123"));
  });

  it("returns different paths for different session IDs", () => {
    const pathA = getNudgeFilePath("session-a");
    const pathB = getNudgeFilePath("session-b");
    expect(pathA).not.toBe(pathB);
  });
});

describe(reminderNudge.name, () => {
  const sessionId = `test-${Date.now()}`;

  afterEach(() => {
    const filePath = getNudgeFilePath(sessionId);
    try {
      rmSync(filePath, { force: true });
    } catch {
      // ignore
    }
  });

  it("creates marker file on first call and returns shouldNudge: false", () => {
    const result = reminderNudge(sessionId);
    expect(result.shouldNudge).toBe(false);
    const filePath = getNudgeFilePath(sessionId);
    expect(existsSync(filePath)).toBe(true);
    expect(readFileSync(filePath, "utf-8").trim()).toBe("1");
  });

  it("increments count on subsequent calls and returns false until threshold", () => {
    for (let i = 0; i < REMINDER_INTERVAL - 1; i++) {
      const result = reminderNudge(sessionId);
      expect(result.shouldNudge).toBe(false);
    }
  });

  it("returns shouldNudge: true on the threshold call and resets counter", () => {
    // First call initializes counter to 1
    reminderNudge(sessionId);
    // Calls 2..(threshold-1) increment
    for (let i = 0; i < REMINDER_INTERVAL - 2; i++) {
      reminderNudge(sessionId);
    }
    // Threshold call should trigger nudge
    const result = reminderNudge(sessionId);
    expect(result.shouldNudge).toBe(true);

    // Counter should be reset to 0
    const filePath = getNudgeFilePath(sessionId);
    expect(readFileSync(filePath, "utf-8").trim()).toBe("0");
  });

  it("starts a new cycle after reset", () => {
    // Complete one full cycle
    for (let i = 0; i < REMINDER_INTERVAL; i++) {
      reminderNudge(sessionId);
    }

    // Next call after reset should return false
    const result = reminderNudge(sessionId);
    expect(result.shouldNudge).toBe(false);
  });

  it("treats corrupted marker file (non-numeric) as count 0", () => {
    const filePath = getNudgeFilePath(sessionId);
    writeFileSync(filePath, "garbage-data");
    const result = reminderNudge(sessionId);
    expect(result.shouldNudge).toBe(false);
    // Should have written "1" (0 + 1)
    expect(readFileSync(filePath, "utf-8").trim()).toBe("1");
  });

  it("handles empty marker file as count 0", () => {
    const filePath = getNudgeFilePath(sessionId);
    writeFileSync(filePath, "");
    const result = reminderNudge(sessionId);
    expect(result.shouldNudge).toBe(false);
    expect(readFileSync(filePath, "utf-8").trim()).toBe("1");
  });

  it("supports custom threshold", () => {
    const customThreshold = 3;
    // Call 1: initializes counter to 1
    reminderNudge(sessionId, customThreshold);
    // Call 2: counter goes to 2
    reminderNudge(sessionId, customThreshold);
    // Call 3: counter reaches threshold, should nudge
    const result = reminderNudge(sessionId, customThreshold);
    expect(result.shouldNudge).toBe(true);
  });
});

describe(`${reminderNudge.name} — parallel session isolation`, () => {
  const sessionA = `parallel-a-${Date.now()}`;
  const sessionB = `parallel-b-${Date.now()}`;

  afterEach(() => {
    try {
      rmSync(getNudgeFilePath(sessionA), { force: true });
    } catch {
      // ignore
    }
    try {
      rmSync(getNudgeFilePath(sessionB), { force: true });
    } catch {
      // ignore
    }
  });

  it("maintains independent counters for different session IDs", () => {
    const halfInterval = Math.floor(REMINDER_INTERVAL / 2);

    // Advance session A partway through the interval
    for (let i = 0; i < halfInterval; i++) {
      reminderNudge(sessionA);
    }

    // Session B should start fresh
    const resultB = reminderNudge(sessionB);
    expect(resultB.shouldNudge).toBe(false);

    // Session A's file should still have its count
    const fileA = getNudgeFilePath(sessionA);
    const countA = Number.parseInt(readFileSync(fileA, "utf-8").trim(), 10);
    expect(countA).toBe(halfInterval);

    // Session B's file should have 1 (first call increments from 0 to 1)
    const fileB = getNudgeFilePath(sessionB);
    const countB = Number.parseInt(readFileSync(fileB, "utf-8").trim(), 10);
    expect(countB).toBe(1);
  });

  it("incrementing one session does not affect the other", () => {
    // Both start (each gets count 1)
    reminderNudge(sessionA);
    reminderNudge(sessionB);

    // Advance session A to threshold
    for (let i = 0; i < REMINDER_INTERVAL - 1; i++) {
      reminderNudge(sessionA);
    }

    // Session A should have nudged and reset
    const fileA = getNudgeFilePath(sessionA);
    expect(readFileSync(fileA, "utf-8").trim()).toBe("0");

    // Session B should still be at 1 (only the initial call)
    const fileB = getNudgeFilePath(sessionB);
    expect(readFileSync(fileB, "utf-8").trim()).toBe("1");
  });
});
