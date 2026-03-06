import { resolve } from "node:path";

import { detectFramework, resolveInstallation } from "../../src/framework/detect.ts";
import { describe, expect, it } from "bun:test";

describe("detectFramework", () => {
  it("detects claude-code from .claude/skills path", () => {
    const result = detectFramework("/home/user/project/.claude/skills/soulsys/scripts/soulsys.mjs");
    expect(result).toEqual({ framework: "claude-code", guide: "claude-code" });
  });

  it("detects openclaw from bare skills/ path", () => {
    const result = detectFramework("/home/user/project/skills/soulsys/scripts/soulsys.mjs");
    expect(result).toEqual({ framework: "openclaw", guide: "openclaw" });
  });

  it("detects universal agents from .agents/skills path", () => {
    const result = detectFramework("/home/user/project/.agents/skills/soulsys/scripts/soulsys.mjs");
    expect(result).toEqual({ framework: "universal", guide: "generic" });
  });

  it("detects antigravity from .agent/skills path", () => {
    const result = detectFramework("/home/user/project/.agent/skills/soulsys/scripts/soulsys.mjs");
    expect(result).toEqual({ framework: "antigravity", guide: "generic" });
  });

  it("detects windsurf from .windsurf/skills path", () => {
    const result = detectFramework(
      "/home/user/project/.windsurf/skills/soulsys/scripts/soulsys.mjs",
    );
    expect(result).toEqual({ framework: "windsurf", guide: "generic" });
  });

  it("detects roo from .roo/skills path", () => {
    const result = detectFramework("/home/user/project/.roo/skills/soulsys/scripts/soulsys.mjs");
    expect(result).toEqual({ framework: "roo", guide: "generic" });
  });

  it("handles Windows paths with backslashes", () => {
    const result = detectFramework(
      "C:\\Users\\user\\project\\.claude\\skills\\soulsys\\scripts\\soulsys.mjs",
    );
    expect(result).toEqual({ framework: "claude-code", guide: "claude-code" });
  });

  it("returns unknown for unrecognizable paths", () => {
    const result = detectFramework("/tmp/random/path/soulsys.mjs");
    expect(result).toEqual({ framework: "unknown", guide: "generic" });
  });

  it("returns unknown when skills/soulsys/scripts pattern is absent", () => {
    const result = detectFramework("/home/user/.claude/soulsys/scripts/soulsys.mjs");
    expect(result).toEqual({ framework: "unknown", guide: "generic" });
  });

  it("falls back to directory name for unknown dot-directories", () => {
    const result = detectFramework(
      "/home/user/project/.futureagent/skills/soulsys/scripts/soulsys.mjs",
    );
    expect(result).toEqual({ framework: "futureagent", guide: "generic" });
  });

  it("maps known agent directories to correct framework names", () => {
    const cases: Array<[string, string]> = [
      [".factory", "droid"],
      [".kilocode", "kilo"],
      [".kiro", "kiro-cli"],
      [".vibe", "mistral-vibe"],
      [".qwen", "qwen-code"],
    ];
    for (const [dir, expected] of cases) {
      const result = detectFramework(`/project/${dir}/skills/soulsys/scripts/soulsys.mjs`);
      expect(result.framework).toBe(expected);
      expect(result.guide).toBe("generic");
    }
  });
});

describe("resolveInstallation", () => {
  it("resolves Unix dotdir paths correctly", () => {
    const result = resolveInstallation(
      "/home/user/project/.claude/skills/soulsys/scripts/soulsys.mjs",
    );
    expect(result).not.toBeNull();
    expect(result?.framework).toBe("claude-code");
    expect(result?.guide).toBe("claude-code");
    expect(result?.paths.projectRoot).toBe(resolve("/home/user/project"));
    expect(result?.paths.skillRoot).toBe(resolve("/home/user/project/.claude/skills/soulsys"));
    expect(result?.paths.parentDir).toBe(".claude");
  });

  it("resolves Windows backslash paths correctly", () => {
    const result = resolveInstallation(
      "C:\\Users\\dev\\project\\.claude\\skills\\soulsys\\scripts\\soulsys.mjs",
    );
    expect(result).not.toBeNull();
    expect(result?.paths.parentDir).toBe(".claude");
  });

  it("resolves OpenClaw paths (bare skills/ directory)", () => {
    const result = resolveInstallation("/home/user/myproject/skills/soulsys/scripts/soulsys.mjs");
    expect(result).not.toBeNull();
    expect(result?.framework).toBe("openclaw");
    expect(result?.paths.projectRoot).toBe(resolve("/home/user/myproject"));
    expect(result?.paths.skillRoot).toBe(resolve("/home/user/myproject/skills/soulsys"));
    expect(result?.paths.parentDir).toBe("myproject");
  });

  it("returns null for unrecognized paths", () => {
    expect(resolveInstallation("/some/random/path/soulsys.mjs")).toBeNull();
    expect(
      resolveInstallation("/home/user/project/.claude/soulsys/scripts/soulsys.mjs"),
    ).toBeNull();
  });

  it("includes resolved scriptPath", () => {
    const input = "/home/user/project/.claude/skills/soulsys/scripts/soulsys.mjs";
    const result = resolveInstallation(input);
    expect(result).not.toBeNull();
    expect(result?.paths.scriptPath).toBe(resolve(input));
  });
});
