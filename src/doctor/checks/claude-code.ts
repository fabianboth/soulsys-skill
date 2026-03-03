import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { ProjectPaths } from "../../framework/detect.ts";
import type { CheckResult, FrameworkChecker } from "../types.ts";

type HookEntry = {
  matcher?: string;
  hooks?: { type?: string; command?: string; timeout?: number }[];
};

type SettingsJson = {
  hooks?: Record<string, HookEntry[]>;
  [key: string]: unknown;
};

type ParseResult =
  | { ok: true; data: SettingsJson }
  | { ok: false; missing: true }
  | { ok: false; missing: false; error: string };

function parseSettings(settingsPath: string): ParseResult {
  if (!existsSync(settingsPath)) return { ok: false, missing: true };
  try {
    const parsed: unknown = JSON.parse(readFileSync(settingsPath, "utf-8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, missing: false, error: "Invalid JSON in .claude/settings.json" };
    }
    return { ok: true, data: parsed as SettingsJson };
  } catch {
    return { ok: false, missing: false, error: "Invalid JSON in .claude/settings.json" };
  }
}

function findHookEntry(
  entries: HookEntry[] | undefined,
  matcherContains: string | null,
  commandContains: string,
): boolean {
  if (!Array.isArray(entries)) return false;
  return entries.some((entry) => {
    const matcherOk =
      matcherContains === null ||
      (typeof entry.matcher === "string" && entry.matcher.includes(matcherContains));
    if (!matcherOk || !Array.isArray(entry.hooks)) return false;
    return entry.hooks.some(
      (h) => typeof h.command === "string" && h.command.includes(commandContains),
    );
  });
}

function checkStartupHook(parsed: ParseResult): CheckResult {
  if (!parsed.ok) {
    return {
      name: "SessionStart startup hook",
      category: "hooks",
      status: "fail",
      message: parsed.missing ? ".claude/settings.json not found" : parsed.error,
      fixable: parsed.missing,
    };
  }
  const hooks = parsed.data.hooks;
  const hasStartup = findHookEntry(hooks?.SessionStart, "startup", "soulsys load-context");
  const hasCore =
    hasStartup && findHookEntry(hooks?.SessionStart, "startup", "soulsys load-context --core");
  return {
    name: "SessionStart startup hook",
    category: "hooks",
    status: hasStartup && !hasCore ? "pass" : "fail",
    message:
      hasStartup && !hasCore
        ? "Configured"
        : hasStartup
          ? "Startup hook should not use --core flag"
          : "Missing soulsys load-context hook for startup|clear",
    fixable: true,
  };
}

function checkCompactHook(parsed: ParseResult): CheckResult {
  if (!parsed.ok) {
    return {
      name: "SessionStart compact hook",
      category: "hooks",
      status: "fail",
      message: parsed.missing ? ".claude/settings.json not found" : parsed.error,
      fixable: parsed.missing,
    };
  }
  const hasCompact = findHookEntry(
    parsed.data.hooks?.SessionStart,
    "compact",
    "soulsys load-context --core",
  );
  return {
    name: "SessionStart compact hook",
    category: "hooks",
    status: hasCompact ? "pass" : "fail",
    message: hasCompact ? "Configured" : "Missing soulsys load-context --core hook for compact",
    fixable: true,
  };
}

function checkPreCompactHook(parsed: ParseResult): CheckResult {
  if (!parsed.ok) {
    return {
      name: "PreCompact hook",
      category: "hooks",
      status: "fail",
      message: parsed.missing ? ".claude/settings.json not found" : parsed.error,
      fixable: parsed.missing,
    };
  }
  const hasPreCompact = findHookEntry(
    parsed.data.hooks?.PreCompact,
    null,
    "soulsys extract-memories",
  );
  return {
    name: "PreCompact hook",
    category: "hooks",
    status: hasPreCompact ? "pass" : "fail",
    message: hasPreCompact ? "Configured" : "Missing soulsys extract-memories hook for PreCompact",
    fixable: true,
  };
}

export const claudeCodeChecker: FrameworkChecker = {
  async check(paths: ProjectPaths): Promise<CheckResult[]> {
    const parsed = parseSettings(join(paths.projectRoot, ".claude", "settings.json"));
    return [checkStartupHook(parsed), checkCompactHook(parsed), checkPreCompactHook(parsed)];
  },

  async fix(paths: ProjectPaths): Promise<CheckResult[]> {
    const settingsPath = join(paths.projectRoot, ".claude", "settings.json");
    const parsed = parseSettings(settingsPath);

    if (!parsed.ok && !parsed.missing) {
      return this.check(paths);
    }

    const data: SettingsJson = parsed.ok ? parsed.data : {};
    if (!data.hooks || typeof data.hooks !== "object" || Array.isArray(data.hooks)) {
      data.hooks = {};
    }

    const scriptPrefix = `$CLAUDE_PROJECT_DIR/${paths.parentDir}/skills/soulsys/scripts/soulsys`;

    if (!Array.isArray(data.hooks.SessionStart)) data.hooks.SessionStart = [];

    // Remove --core hooks from startup entries, preserving unrelated hooks in the same entry
    data.hooks.SessionStart = data.hooks.SessionStart.map((entry) => {
      if (
        typeof entry.matcher !== "string" ||
        !entry.matcher.includes("startup") ||
        !Array.isArray(entry.hooks)
      )
        return entry;
      const filtered = entry.hooks.filter(
        (h) =>
          !(typeof h.command === "string" && h.command.includes("soulsys load-context --core")),
      );
      return { ...entry, hooks: filtered };
    }).filter(
      (entry) =>
        !(typeof entry.matcher === "string" && entry.matcher.includes("startup")) ||
        (Array.isArray(entry.hooks) && entry.hooks.length > 0),
    );

    if (!findHookEntry(data.hooks.SessionStart, "startup", "soulsys load-context")) {
      data.hooks.SessionStart.push({
        matcher: "startup|clear",
        hooks: [{ type: "command", command: `${scriptPrefix} load-context` }],
      });
    }

    if (!findHookEntry(data.hooks.SessionStart, "compact", "soulsys load-context --core")) {
      data.hooks.SessionStart.push({
        matcher: "compact",
        hooks: [{ type: "command", command: `${scriptPrefix} load-context --core` }],
      });
    }

    if (!Array.isArray(data.hooks.PreCompact)) data.hooks.PreCompact = [];

    if (!findHookEntry(data.hooks.PreCompact, null, "soulsys extract-memories")) {
      data.hooks.PreCompact.push({
        matcher: "",
        hooks: [{ type: "command", command: `${scriptPrefix} extract-memories`, timeout: 60000 }],
      });
    }

    const dir = join(paths.projectRoot, ".claude");
    mkdirSync(dir, { recursive: true });
    writeFileSync(settingsPath, `${JSON.stringify(data, null, 2)}\n`);

    return this.check(paths);
  },
};
