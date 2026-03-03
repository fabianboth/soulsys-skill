import { resolve } from "node:path";

import { describe, expect, it } from "bun:test";

const CLI_PATH = resolve(import.meta.dirname, "..", "..", "src", "cli.ts");

async function run(
  args: string[],
  framework = "claude-code",
): Promise<{ exitCode: number; stderr: string }> {
  const proc = Bun.spawn(["bun", CLI_PATH, "extract-memories", "--framework", framework, ...args], {
    env: process.env,
    stdout: "pipe",
    stderr: "pipe",
  });

  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { exitCode, stderr };
}

describe("extract-memories command", () => {
  it("exits 0 with error when no transcript path is provided", async () => {
    const { exitCode, stderr } = await run([]);

    expect(exitCode).toBe(0);
    expect(stderr).toContain("no transcript path");
  });
});
