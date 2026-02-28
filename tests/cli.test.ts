import { resolve } from "node:path";

import {
  IMPORTANCE_DESCRIPTION,
  MEMORY_DESCRIPTIONS,
} from "../src/client/generated/descriptions.ts";
import { describe, expect, it } from "bun:test";

const CLI_PATH = resolve(import.meta.dirname, "..", "src", "cli.ts");

interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function run(args: string[]): Promise<CliResult> {
  const proc = Bun.spawn(["bun", CLI_PATH, ...args], {
    env: process.env,
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { stdout, stderr, exitCode };
}

describe("CLI", () => {
  it("--help lists all commands", async () => {
    const result = await run(["--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("init");
    expect(result.stdout).toContain("update-soul");
    expect(result.stdout).toContain("create-identity");
    expect(result.stdout).toContain("update-identity");
    expect(result.stdout).toContain("add-memory");
    expect(result.stdout).toContain("add-memory-file");
    expect(result.stdout).toContain("add-relation");
    expect(result.stdout).toContain("update-relation");
    expect(result.stdout).toContain("load-context");
  });

  it("--version prints version", async () => {
    const result = await run(["--version"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("-v prints version", async () => {
    const result = await run(["-v"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("unknown command prints error", async () => {
    const result = await run(["unknown-cmd"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("unknown command");
  });

  it("invalid flags print error", async () => {
    const result = await run(["update-soul", "--invalid-flag"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("unknown option");
  });

  it("command help includes generated descriptions", async () => {
    const result = await run(["add-memory", "--help"]);
    expect(result.exitCode).toBe(0);
    // Commander wraps long text across lines, so normalize whitespace before comparing
    const normalized = result.stdout.replace(/\s+/g, " ");
    expect(normalized).toContain(MEMORY_DESCRIPTIONS.content);
    expect(normalized).toContain(MEMORY_DESCRIPTIONS.emotion);
    expect(normalized).toContain(IMPORTANCE_DESCRIPTION);
  });
});
