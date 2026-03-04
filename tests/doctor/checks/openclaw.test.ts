import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { openclawChecker } from "../../../src/doctor/checks/openclaw.ts";
import type { ProjectPaths } from "../../../src/framework/detect.ts";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";

const TEST_DIR = join(tmpdir(), `soulsys-doctor-oc-${Date.now()}`);
const TEMPLATE_CONTENT = "export default async function() { /* template */ }";

function makePaths(): ProjectPaths {
  return {
    projectRoot: TEST_DIR,
    skillRoot: join(TEST_DIR, "skills", "soulsys"),
    parentDir: "skills",
    scriptPath: join(TEST_DIR, "skills", "soulsys", "scripts", "soulsys.js"),
  };
}

function fullOpenClawConfig() {
  return {
    hooks: { "agent:bootstrap": "./hooks/soulsys-bootstrap.ts" },
    agents: {
      defaults: {
        compaction: {
          memoryFlush: {
            systemPrompt:
              "You are saving memories before context compaction. Review what happened and preserve what matters using soulsys add-memory.",
            prompt: `Review the conversation above and extract memories worth keeping using soulsys add-memory.

Capture: decisions made, opinions expressed, preferences discovered, lessons learned, significant events, relationship context, and where things were left off. This is your lived experience, not a log.

Skip: routine commands, mid-conversation navigation that was superseded, generic knowledge, and anything already saved via soulsys add-memory earlier in this conversation.`,
          },
        },
      },
    },
  };
}

function writeOpenClaw(config: Record<string, unknown>): void {
  writeFileSync(join(TEST_DIR, "openclaw.json"), JSON.stringify(config, null, 2));
}

function writeBootstrapHook(): void {
  const hooksDir = join(TEST_DIR, "hooks");
  mkdirSync(hooksDir, { recursive: true });
  writeFileSync(join(hooksDir, "soulsys-bootstrap.ts"), "export default async function() {}");
}

describe("openclaw checker", () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("passes when all config is present", async () => {
    writeOpenClaw(fullOpenClawConfig());
    writeBootstrapHook();
    const results = await openclawChecker.check(makePaths());
    expect(results.every((r) => r.status === "pass")).toBe(true);
  });

  it("fails when openclaw.json is missing", async () => {
    writeBootstrapHook();
    const results = await openclawChecker.check(makePaths());
    const bootstrapConfig = results.find((r) => r.name === "Bootstrap hook config");
    const memoryFlush = results.find((r) => r.name === "Memory flush config");
    expect(bootstrapConfig?.status).toBe("fail");
    expect(memoryFlush?.status).toBe("fail");
  });

  it("fails when bootstrap hook file is missing", async () => {
    writeOpenClaw(fullOpenClawConfig());
    const results = await openclawChecker.check(makePaths());
    const hookFile = results.find((r) => r.name === "Bootstrap hook file");
    expect(hookFile?.status).toBe("fail");
  });

  it("fails with parse error for invalid JSON", async () => {
    writeFileSync(join(TEST_DIR, "openclaw.json"), "not-json");
    writeBootstrapHook();
    const results = await openclawChecker.check(makePaths());
    const bootstrapConfig = results.find((r) => r.name === "Bootstrap hook config");
    expect(bootstrapConfig?.status).toBe("fail");
    expect(bootstrapConfig?.message).toContain("Invalid JSON");
    expect(bootstrapConfig?.fixable).toBe(false);
  });

  it("fails when bootstrap hook not registered in openclaw.json", async () => {
    writeOpenClaw({ agents: fullOpenClawConfig().agents });
    writeBootstrapHook();
    const results = await openclawChecker.check(makePaths());
    const bootstrapConfig = results.find((r) => r.name === "Bootstrap hook config");
    expect(bootstrapConfig?.status).toBe("fail");
  });

  it("fails when bootstrap path is wrong", async () => {
    const config = fullOpenClawConfig();
    config.hooks["agent:bootstrap"] = "./wrong/path.ts";
    writeOpenClaw(config);
    writeBootstrapHook();
    const results = await openclawChecker.check(makePaths());
    const bootstrapConfig = results.find((r) => r.name === "Bootstrap hook config");
    expect(bootstrapConfig?.status).toBe("fail");
    expect(bootstrapConfig?.message).toContain("mismatch");
  });

  it("fails when memoryFlush prompt is wrong", async () => {
    const config = fullOpenClawConfig();
    config.agents.defaults.compaction.memoryFlush.prompt = "wrong prompt";
    writeOpenClaw(config);
    writeBootstrapHook();
    const results = await openclawChecker.check(makePaths());
    const memoryFlush = results.find((r) => r.name === "Memory flush config");
    expect(memoryFlush?.status).toBe("fail");
    expect(memoryFlush?.message).toContain("prompt mismatch");
  });

  it("fails when memoryFlush is missing from openclaw.json", async () => {
    writeOpenClaw({ hooks: fullOpenClawConfig().hooks });
    writeBootstrapHook();
    const results = await openclawChecker.check(makePaths());
    const memoryFlush = results.find((r) => r.name === "Memory flush config");
    expect(memoryFlush?.status).toBe("fail");
  });
});

function setupTemplate(): void {
  const templateDir = join(TEST_DIR, "skills", "soulsys", "templates");
  mkdirSync(templateDir, { recursive: true });
  writeFileSync(join(templateDir, "openclaw-bootstrap.ts"), TEMPLATE_CONTENT);
}

describe("openclaw checker fix", () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    setupTemplate();
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("adds missing config to openclaw.json", async () => {
    writeOpenClaw({});
    writeBootstrapHook();
    const results = await openclawChecker.fix(makePaths());
    const bootstrapConfig = results.find((r) => r.name === "Bootstrap hook config");
    const memoryFlush = results.find((r) => r.name === "Memory flush config");
    expect(bootstrapConfig?.status).toBe("pass");
    expect(memoryFlush?.status).toBe("pass");
  });

  it("creates bootstrap hook file from template when missing", async () => {
    writeOpenClaw(fullOpenClawConfig());
    await openclawChecker.fix(makePaths());
    const hookPath = join(TEST_DIR, "hooks", "soulsys-bootstrap.ts");
    expect(existsSync(hookPath)).toBe(true);
    expect(readFileSync(hookPath, "utf-8")).toBe(TEMPLATE_CONTENT);
  });

  it("does not overwrite existing bootstrap hook file", async () => {
    writeOpenClaw(fullOpenClawConfig());
    writeBootstrapHook();
    const originalContent = readFileSync(join(TEST_DIR, "hooks", "soulsys-bootstrap.ts"), "utf-8");
    await openclawChecker.fix(makePaths());
    const afterContent = readFileSync(join(TEST_DIR, "hooks", "soulsys-bootstrap.ts"), "utf-8");
    expect(afterContent).toBe(originalContent);
  });

  it("preserves existing openclaw.json content", async () => {
    writeOpenClaw({ customKey: "value", ...fullOpenClawConfig() });
    writeBootstrapHook();
    await openclawChecker.fix(makePaths());
    const data = JSON.parse(readFileSync(join(TEST_DIR, "openclaw.json"), "utf-8"));
    expect(data.customKey).toBe("value");
  });

  it("is idempotent (running twice produces same result)", async () => {
    await openclawChecker.fix(makePaths());
    const first = {
      openclaw: readFileSync(join(TEST_DIR, "openclaw.json"), "utf-8"),
      bootstrap: readFileSync(join(TEST_DIR, "hooks", "soulsys-bootstrap.ts"), "utf-8"),
    };
    await openclawChecker.fix(makePaths());
    const second = {
      openclaw: readFileSync(join(TEST_DIR, "openclaw.json"), "utf-8"),
      bootstrap: readFileSync(join(TEST_DIR, "hooks", "soulsys-bootstrap.ts"), "utf-8"),
    };
    expect(JSON.parse(second.openclaw)).toEqual(JSON.parse(first.openclaw));
    expect(second.bootstrap).toBe(first.bootstrap);
  });

  it("creates all files from scratch (fresh install)", async () => {
    const results = await openclawChecker.fix(makePaths());
    expect(results.every((r) => r.status === "pass")).toBe(true);
    expect(existsSync(join(TEST_DIR, "openclaw.json"))).toBe(true);
    expect(existsSync(join(TEST_DIR, "hooks", "soulsys-bootstrap.ts"))).toBe(true);
  });

  it("fixes wrong bootstrap path and memoryFlush prompt", async () => {
    const config = fullOpenClawConfig();
    config.hooks["agent:bootstrap"] = "./wrong/path.ts";
    config.agents.defaults.compaction.memoryFlush.prompt = "wrong";
    writeOpenClaw(config);
    writeBootstrapHook();
    const results = await openclawChecker.fix(makePaths());
    expect(results.every((r) => r.status === "pass")).toBe(true);
    const data = JSON.parse(readFileSync(join(TEST_DIR, "openclaw.json"), "utf-8"));
    expect(data.hooks["agent:bootstrap"]).toBe("./hooks/soulsys-bootstrap.ts");
    expect(data.agents.defaults.compaction.memoryFlush.prompt).toContain("soulsys add-memory");
  });

  it("skips bootstrap hook creation when template is missing", async () => {
    rmSync(join(TEST_DIR, "skills"), { recursive: true, force: true });
    writeOpenClaw(fullOpenClawConfig());
    await openclawChecker.fix(makePaths());
    expect(existsSync(join(TEST_DIR, "hooks", "soulsys-bootstrap.ts"))).toBe(false);
  });
});
