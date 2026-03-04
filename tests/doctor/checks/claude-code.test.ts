import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { claudeCodeChecker } from "../../../src/doctor/checks/claude-code.ts";
import type { ProjectPaths } from "../../../src/framework/detect.ts";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";

const TEST_DIR = join(tmpdir(), `soulsys-doctor-cc-${Date.now()}`);
const SCRIPT_PREFIX = "$CLAUDE_PROJECT_DIR/.claude/skills/soulsys/scripts/soulsys";

function makePaths(): ProjectPaths {
  return {
    projectRoot: TEST_DIR,
    skillRoot: join(TEST_DIR, ".claude", "skills", "soulsys"),
    parentDir: ".claude",
    scriptPath: join(TEST_DIR, ".claude", "skills", "soulsys", "scripts", "soulsys.js"),
  };
}

function writeSettings(hooks: Record<string, unknown>): void {
  const settingsDir = join(TEST_DIR, ".claude");
  mkdirSync(settingsDir, { recursive: true });
  writeFileSync(join(settingsDir, "settings.json"), JSON.stringify({ hooks }, null, 2));
}

function fullHooks() {
  return {
    SessionStart: [
      {
        matcher: "startup|clear",
        hooks: [{ type: "command", command: `${SCRIPT_PREFIX} load-context` }],
      },
      {
        matcher: "compact",
        hooks: [{ type: "command", command: `${SCRIPT_PREFIX} load-context --core` }],
      },
    ],
    PreCompact: [
      {
        matcher: "",
        hooks: [{ type: "command", command: `${SCRIPT_PREFIX} extract-memories`, timeout: 120000 }],
      },
    ],
  };
}

describe("claude-code checker", () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("passes when all hooks are present", async () => {
    writeSettings(fullHooks());
    const results = await claudeCodeChecker.check(makePaths());
    const statuses = results.map((r) => r.status);
    expect(statuses.every((s) => s === "pass")).toBe(true);
  });

  it("fails when settings.json is missing", async () => {
    const results = await claudeCodeChecker.check(makePaths());
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.status === "fail")).toBe(true);
    expect(results.every((r) => r.message.includes("settings.json not found"))).toBe(true);
  });

  it("fails with parse error for invalid JSON", async () => {
    const settingsDir = join(TEST_DIR, ".claude");
    mkdirSync(settingsDir, { recursive: true });
    writeFileSync(join(settingsDir, "settings.json"), "not-json");
    const results = await claudeCodeChecker.check(makePaths());
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.status === "fail")).toBe(true);
    expect(results.every((r) => r.message.includes("Invalid JSON"))).toBe(true);
    expect(results.every((r) => r.fixable === false)).toBe(true);
  });

  it("fails safely when settings.json is valid JSON but not an object", async () => {
    const settingsDir = join(TEST_DIR, ".claude");
    mkdirSync(settingsDir, { recursive: true });
    writeFileSync(join(settingsDir, "settings.json"), "[]");
    const results = await claudeCodeChecker.check(makePaths());
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.status === "fail")).toBe(true);
    expect(results.every((r) => r.message.includes("Invalid JSON"))).toBe(true);
    expect(results.every((r) => r.fixable === false)).toBe(true);
  });

  it("fails safely when nested hook sections are malformed", async () => {
    const settingsDir = join(TEST_DIR, ".claude");
    mkdirSync(settingsDir, { recursive: true });
    writeFileSync(
      join(settingsDir, "settings.json"),
      JSON.stringify({ hooks: { SessionStart: {}, PreCompact: 123 } }, null, 2),
    );
    const results = await claudeCodeChecker.check(makePaths());
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.status === "fail")).toBe(true);
  });

  it("fix normalizes malformed nested hook sections", async () => {
    const settingsDir = join(TEST_DIR, ".claude");
    mkdirSync(settingsDir, { recursive: true });
    writeFileSync(
      join(settingsDir, "settings.json"),
      JSON.stringify({ hooks: { SessionStart: {}, PreCompact: {} } }, null, 2),
    );
    const results = await claudeCodeChecker.fix(makePaths());
    expect(results.every((r) => r.status === "pass")).toBe(true);
  });

  it("fails safely when hook entries have wrong types", async () => {
    const settingsDir = join(TEST_DIR, ".claude");
    mkdirSync(settingsDir, { recursive: true });
    writeFileSync(
      join(settingsDir, "settings.json"),
      JSON.stringify(
        { hooks: { SessionStart: [{ matcher: 1, hooks: {} }], PreCompact: [{ hooks: 42 }] } },
        null,
        2,
      ),
    );
    const results = await claudeCodeChecker.check(makePaths());
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.status === "fail")).toBe(true);
  });

  it("fix handles hook entries with wrong types", async () => {
    const settingsDir = join(TEST_DIR, ".claude");
    mkdirSync(settingsDir, { recursive: true });
    writeFileSync(
      join(settingsDir, "settings.json"),
      JSON.stringify(
        { hooks: { SessionStart: [{ matcher: 1, hooks: {} }], PreCompact: [{ hooks: 42 }] } },
        null,
        2,
      ),
    );
    const results = await claudeCodeChecker.fix(makePaths());
    expect(results.every((r) => r.status === "pass")).toBe(true);
  });

  it("fails when startup hook is missing", async () => {
    const hooks = fullHooks();
    hooks.SessionStart = hooks.SessionStart.filter((e) => !e.matcher.includes("startup"));
    writeSettings(hooks);
    const results = await claudeCodeChecker.check(makePaths());
    const startup = results.find((r) => r.name === "SessionStart startup hook");
    expect(startup?.status).toBe("fail");
  });

  it("fails when compact hook is missing", async () => {
    const hooks = fullHooks();
    hooks.SessionStart = hooks.SessionStart.filter((e) => !e.matcher.includes("compact"));
    writeSettings(hooks);
    const results = await claudeCodeChecker.check(makePaths());
    const compact = results.find((r) => r.name === "SessionStart compact hook");
    expect(compact?.status).toBe("fail");
  });

  it("fails when PreCompact hook is missing", async () => {
    const hooks = fullHooks();
    hooks.PreCompact = [];
    writeSettings(hooks);
    const results = await claudeCodeChecker.check(makePaths());
    const preCompact = results.find((r) => r.name === "PreCompact hook");
    expect(preCompact?.status).toBe("fail");
  });

  it("marks all hook checks as fixable when settings.json is missing", async () => {
    const results = await claudeCodeChecker.check(makePaths());
    expect(results.every((r) => r.fixable)).toBe(true);
  });

  it("fails when startup hook uses --core flag", async () => {
    const hooks = fullHooks();
    hooks.SessionStart = [
      {
        matcher: "startup|clear",
        hooks: [{ type: "command", command: `${SCRIPT_PREFIX} load-context --core` }],
      },
      hooks.SessionStart[1],
    ];
    writeSettings(hooks);
    const results = await claudeCodeChecker.check(makePaths());
    const startup = results.find((r) => r.name === "SessionStart startup hook");
    expect(startup?.status).toBe("fail");
  });

  it("fails when PreCompact timeout is wrong", async () => {
    const hooks = fullHooks();
    hooks.PreCompact[0].hooks[0].timeout = 60000;
    writeSettings(hooks);
    const results = await claudeCodeChecker.check(makePaths());
    const preCompact = results.find((r) => r.name === "PreCompact hook");
    expect(preCompact?.status).toBe("fail");
    expect(preCompact?.message).toContain("Timeout");
    expect(preCompact?.message).toContain("60000");
    expect(preCompact?.message).toContain("120000");
  });

  it("passes when SessionStart entries are reversed", async () => {
    const hooks = fullHooks();
    hooks.SessionStart = [hooks.SessionStart[1], hooks.SessionStart[0]];
    writeSettings(hooks);
    const results = await claudeCodeChecker.check(makePaths());
    expect(results.every((r) => r.status === "pass")).toBe(true);
  });

  it("fails when command path is wrong", async () => {
    writeSettings({
      ...fullHooks(),
      SessionStart: [
        {
          matcher: "startup|clear",
          hooks: [{ type: "command", command: "wrong/path/soulsys load-context" }],
        },
        fullHooks().SessionStart[1],
      ],
    });
    const results = await claudeCodeChecker.check(makePaths());
    const startup = results.find((r) => r.name === "SessionStart startup hook");
    expect(startup?.status).toBe("fail");
    expect(startup?.message).toContain("Command mismatch");
  });
});

describe("claude-code checker fix", () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("adds missing hooks to existing settings.json", async () => {
    writeSettings({});
    const results = await claudeCodeChecker.fix(makePaths());
    expect(results.filter((r) => r.status === "pass")).toHaveLength(3);
  });

  it("is no-op when all hooks are present and correct", async () => {
    writeSettings(fullHooks());
    const settingsPath = join(TEST_DIR, ".claude", "settings.json");
    const before = readFileSync(settingsPath, "utf-8");
    await claudeCodeChecker.fix(makePaths());
    const after = readFileSync(settingsPath, "utf-8");
    expect(JSON.parse(after)).toEqual(JSON.parse(before));
  });

  it("preserves non-soulsys hooks", async () => {
    const hooks = {
      ...fullHooks(),
      PermissionRequest: [{ hooks: [{ type: "command", command: "echo done" }] }],
    };
    writeSettings(hooks);
    const results = await claudeCodeChecker.fix(makePaths());
    const settingsPath = join(TEST_DIR, ".claude", "settings.json");
    const data = JSON.parse(readFileSync(settingsPath, "utf-8"));
    expect(data.hooks.PermissionRequest).toHaveLength(1);
    expect(results.every((r) => r.status === "pass")).toBe(true);
  });

  it("skips fix for invalid JSON", async () => {
    const settingsDir = join(TEST_DIR, ".claude");
    mkdirSync(settingsDir, { recursive: true });
    writeFileSync(join(settingsDir, "settings.json"), "not-json");
    const results = await claudeCodeChecker.fix(makePaths());
    expect(results.every((r) => r.status === "fail")).toBe(true);
    expect(results.every((r) => r.message.includes("Invalid JSON"))).toBe(true);
  });

  it("is idempotent (running twice produces same result)", async () => {
    await claudeCodeChecker.fix(makePaths());
    const settingsPath = join(TEST_DIR, ".claude", "settings.json");
    const first = readFileSync(settingsPath, "utf-8");
    await claudeCodeChecker.fix(makePaths());
    const second = readFileSync(settingsPath, "utf-8");
    expect(JSON.parse(second)).toEqual(JSON.parse(first));
  });

  it("creates settings.json when file does not exist", async () => {
    const results = await claudeCodeChecker.fix(makePaths());
    const settingsPath = join(TEST_DIR, ".claude", "settings.json");
    expect(readFileSync(settingsPath, "utf-8")).toBeTruthy();
    expect(results.filter((r) => r.status === "pass")).toHaveLength(3);
  });

  it("removes startup hook that incorrectly uses --core flag", async () => {
    writeSettings({
      SessionStart: [
        {
          matcher: "startup|clear",
          hooks: [{ type: "command", command: `${SCRIPT_PREFIX} load-context --core` }],
        },
        {
          matcher: "compact",
          hooks: [{ type: "command", command: `${SCRIPT_PREFIX} load-context --core` }],
        },
      ],
      PreCompact: [
        {
          matcher: "",
          hooks: [
            { type: "command", command: `${SCRIPT_PREFIX} extract-memories`, timeout: 120000 },
          ],
        },
      ],
    });
    const results = await claudeCodeChecker.fix(makePaths());
    expect(results.every((r) => r.status === "pass")).toBe(true);
    const settingsPath = join(TEST_DIR, ".claude", "settings.json");
    const data = JSON.parse(readFileSync(settingsPath, "utf-8"));
    const startupEntries = data.hooks.SessionStart.filter((e: { matcher?: string }) =>
      e.matcher?.includes("startup"),
    );
    expect(startupEntries).toHaveLength(1);
    expect(startupEntries[0].hooks[0].command).not.toContain("--core");
  });

  it("fixes wrong timeout on PreCompact hook", async () => {
    const hooks = fullHooks();
    hooks.PreCompact[0].hooks[0].timeout = 60000;
    writeSettings(hooks);
    const results = await claudeCodeChecker.fix(makePaths());
    expect(results.every((r) => r.status === "pass")).toBe(true);
    const settingsPath = join(TEST_DIR, ".claude", "settings.json");
    const data = JSON.parse(readFileSync(settingsPath, "utf-8"));
    expect(data.hooks.PreCompact[0].hooks[0].timeout).toBe(120000);
  });

  it("fixes wrong command path", async () => {
    writeSettings({
      SessionStart: [
        {
          matcher: "startup|clear",
          hooks: [{ type: "command", command: "old/path/soulsys load-context" }],
        },
        fullHooks().SessionStart[1],
      ],
      PreCompact: fullHooks().PreCompact,
    });
    const results = await claudeCodeChecker.fix(makePaths());
    expect(results.every((r) => r.status === "pass")).toBe(true);
    const settingsPath = join(TEST_DIR, ".claude", "settings.json");
    const data = JSON.parse(readFileSync(settingsPath, "utf-8"));
    const startup = data.hooks.SessionStart.find((e: { matcher?: string }) =>
      e.matcher?.includes("startup"),
    );
    expect(startup.hooks[0].command).toBe(`${SCRIPT_PREFIX} load-context`);
  });
});
