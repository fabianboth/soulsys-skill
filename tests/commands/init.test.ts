import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "bun:test";

const CLI_PATH = resolve(import.meta.dirname, "..", "..", "src", "cli.ts");

async function runInit(cwd: string): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  const proc = Bun.spawn(["bun", CLI_PATH, "init"], {
    cwd,
    env: process.env,
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { stdout, stderr, exitCode };
}

describe("init command", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "soulsys-init-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("creates skills/soulsys/ with SKILL.md and BOOTSTRAP.md", async () => {
    const result = await runInit(tempDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("Initialized soulsys skill at skills/soulsys/");

    const skillDir = join(tempDir, "skills", "soulsys");
    const skillContent = await readFile(join(skillDir, "SKILL.md"), "utf-8");
    expect(skillContent).toContain("name: soulsys");
    expect(skillContent).toContain("BOOTSTRAP.md");

    const bootstrapContent = await readFile(join(skillDir, "BOOTSTRAP.md"), "utf-8");
    expect(bootstrapContent).toContain("Bootstrap");
    expect(bootstrapContent).toContain("create-identity");
  });

  it("overwrites existing skill files on re-init", async () => {
    await runInit(tempDir);
    const result = await runInit(tempDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("Initialized soulsys skill at skills/soulsys/");

    const skillContent = await readFile(join(tempDir, "skills", "soulsys", "SKILL.md"), "utf-8");
    expect(skillContent).toContain("name: soulsys");
  });
});
