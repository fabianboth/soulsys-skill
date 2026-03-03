import type { ProjectPaths } from "../../framework/detect.ts";
import type { CheckResult, FrameworkChecker } from "../types.ts";

export const genericChecker: FrameworkChecker = {
  async check(_paths: ProjectPaths): Promise<CheckResult[]> {
    return [
      {
        name: "Session start context",
        category: "integration",
        status: "warn",
        message: "Run `soulsys load-context` at session start and inject into working context",
        fixable: false,
      },
      {
        name: "Post-compaction context",
        category: "integration",
        status: "warn",
        message:
          "Run `soulsys load-context --core` after compaction and inject into working context",
        fixable: false,
      },
      {
        name: "Memory persistence",
        category: "integration",
        status: "warn",
        message: "Use `soulsys add-memory` to save important information during conversations",
        fixable: false,
      },
    ];
  },

  async fix(paths: ProjectPaths): Promise<CheckResult[]> {
    return this.check(paths);
  },
};
