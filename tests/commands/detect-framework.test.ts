import { detectFramework } from "../../src/framework/detect.ts";
import { describe, expect, it } from "bun:test";

describe("detectFramework", () => {
  it("detects claude-code from .claude/skills path", () => {
    const result = detectFramework("/home/user/project/.claude/skills/soulsys/scripts/soulsys.js");
    expect(result).toEqual({ framework: "claude-code", guide: "claude-code" });
  });

  it("detects openclaw from bare skills/ path", () => {
    const result = detectFramework("/home/user/project/skills/soulsys/scripts/soulsys.js");
    expect(result).toEqual({ framework: "openclaw", guide: "openclaw" });
  });

  it("detects universal agents from .agents/skills path", () => {
    const result = detectFramework("/home/user/project/.agents/skills/soulsys/scripts/soulsys.js");
    expect(result).toEqual({ framework: "universal", guide: "generic" });
  });

  it("detects antigravity from .agent/skills path", () => {
    const result = detectFramework("/home/user/project/.agent/skills/soulsys/scripts/soulsys.js");
    expect(result).toEqual({ framework: "antigravity", guide: "generic" });
  });

  it("detects windsurf from .windsurf/skills path", () => {
    const result = detectFramework(
      "/home/user/project/.windsurf/skills/soulsys/scripts/soulsys.js",
    );
    expect(result).toEqual({ framework: "windsurf", guide: "generic" });
  });

  it("detects roo from .roo/skills path", () => {
    const result = detectFramework("/home/user/project/.roo/skills/soulsys/scripts/soulsys.js");
    expect(result).toEqual({ framework: "roo", guide: "generic" });
  });

  it("handles Windows paths with backslashes", () => {
    const result = detectFramework(
      "C:\\Users\\user\\project\\.claude\\skills\\soulsys\\scripts\\soulsys.js",
    );
    expect(result).toEqual({ framework: "claude-code", guide: "claude-code" });
  });

  it("returns unknown for unrecognizable paths", () => {
    const result = detectFramework("/tmp/random/path/soulsys.js");
    expect(result).toEqual({ framework: "unknown", guide: "generic" });
  });

  it("returns unknown when skills/soulsys/scripts pattern is absent", () => {
    const result = detectFramework("/home/user/.claude/soulsys/scripts/soulsys.js");
    expect(result).toEqual({ framework: "unknown", guide: "generic" });
  });

  it("falls back to directory name for unknown dot-directories", () => {
    const result = detectFramework(
      "/home/user/project/.futureagent/skills/soulsys/scripts/soulsys.js",
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
      const result = detectFramework(`/project/${dir}/skills/soulsys/scripts/soulsys.js`);
      expect(result.framework).toBe(expected);
      expect(result.guide).toBe("generic");
    }
  });
});
