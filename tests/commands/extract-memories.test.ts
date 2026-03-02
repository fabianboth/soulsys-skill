import { resolve } from "node:path";

import { describe, expect, it } from "bun:test";

const CLI_PATH = resolve(import.meta.dirname, "..", "..", "src", "cli.ts");
const FIXTURES = resolve(import.meta.dirname, "..", "fixtures");

async function run(
  args: string[],
  env: Record<string, string> = {},
  framework = "claude-code",
): Promise<{ exitCode: number; stderr: string }> {
  const proc = Bun.spawn(["bun", CLI_PATH, "extract-memories", "--framework", framework, ...args], {
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  });

  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { exitCode, stderr };
}

describe("extract-memories command", () => {
  it("reports dry run with message count for simple transcript", async () => {
    const { exitCode, stderr } = await run([
      "--transcript",
      resolve(FIXTURES, "transcript-simple.jsonl"),
      "--dry-run",
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toContain("dry run");
    expect(stderr).toContain("messages in current window");
  });

  it("reports dry run for compacted transcript (processes only current window)", async () => {
    const { exitCode, stderr } = await run([
      "--transcript",
      resolve(FIXTURES, "transcript-compacted.jsonl"),
      "--dry-run",
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toContain("dry run");
    expect(stderr).toContain("messages in current window");
  });

  it("reports dry run for trivial transcript", async () => {
    const { exitCode, stderr } = await run([
      "--transcript",
      resolve(FIXTURES, "transcript-trivial.jsonl"),
      "--dry-run",
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toContain("dry run");
  });

  it("exits 0 with error when no transcript path is provided", async () => {
    const { exitCode, stderr } = await run(["--dry-run"]);

    expect(exitCode).toBe(0);
    expect(stderr).toContain("no transcript path");
  });

  it("exits 0 with error when transcript file does not exist", async () => {
    const { exitCode, stderr } = await run([
      "--transcript",
      "/nonexistent/path/transcript.jsonl",
      "--dry-run",
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toContain("failed to read transcript");
  });

  it("exits 0 with error for unsupported framework", async () => {
    const { exitCode, stderr } = await run(
      ["--transcript", resolve(FIXTURES, "transcript-simple.jsonl"), "--dry-run"],
      {},
      "generic",
    );

    expect(exitCode).toBe(0);
    expect(stderr).toContain("no extraction adapter");
  });
});
