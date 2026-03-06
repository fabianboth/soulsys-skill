import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { ProjectPaths } from "../../framework/detect.ts";
import type { CheckResult, FrameworkChecker } from "../types.ts";

type Hook = { type?: string; command?: string; timeout?: number };

type HookEntry = {
  matcher?: string;
  hooks?: Hook[];
};

type SettingsJson = {
  hooks?: Record<string, HookEntry[]>;
  [key: string]: unknown;
};

type ParseResult =
  | { ok: true; data: SettingsJson }
  | { ok: false; missing: true }
  | { ok: false; missing: false; error: string };

type ExpectedHook = {
  name: string;
  event: string;
  matcher: string;
  command: string;
  timeout?: number;
};

const EXPECTED_HOOKS: ExpectedHook[] = [
  {
    name: "SessionStart startup hook",
    event: "SessionStart",
    matcher: "startup|clear",
    command: "load-context",
  },
  {
    name: "SessionStart compact hook",
    event: "SessionStart",
    matcher: "compact",
    command: "load-context --core",
  },
  {
    name: "PreCompact hook",
    event: "PreCompact",
    matcher: "",
    command: "extract-memories",
    timeout: 120000,
  },
  {
    name: "UserPromptSubmit nudge hook",
    event: "UserPromptSubmit",
    matcher: "",
    command: "reminder-nudge",
  },
];

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

function findMatchingHook(
  entries: HookEntry[] | undefined,
  expectedCommand: string,
): { entry: HookEntry; hook: Hook } | null {
  if (!Array.isArray(entries)) return null;
  for (const entry of entries) {
    if (!Array.isArray(entry.hooks)) continue;
    for (const h of entry.hooks) {
      if (typeof h.command === "string" && h.command.endsWith(` ${expectedCommand}`)) {
        return { entry, hook: h };
      }
    }
  }
  return null;
}

function checkHook(parsed: ParseResult, expected: ExpectedHook, scriptPrefix: string): CheckResult {
  const base = { name: expected.name, category: "hooks" as const, fixable: true };

  if (!parsed.ok) {
    return {
      ...base,
      status: "fail",
      message: parsed.missing ? ".claude/settings.json not found" : parsed.error,
      fixable: parsed.missing,
    };
  }

  const entries = parsed.data.hooks?.[expected.event];
  const match = findMatchingHook(entries, expected.command);

  if (!match) {
    return { ...base, status: "fail", message: `Missing ${expected.command} hook` };
  }

  const expectedCommand = `${scriptPrefix} ${expected.command}`;
  if (match.hook.command !== expectedCommand) {
    return {
      ...base,
      status: "fail",
      message: `Command mismatch: got "${match.hook.command}", expected "${expectedCommand}"`,
    };
  }

  if (match.entry.matcher !== expected.matcher) {
    return {
      ...base,
      status: "fail",
      message: `Matcher mismatch: got "${match.entry.matcher}", expected "${expected.matcher}"`,
    };
  }

  if (expected.timeout !== undefined) {
    if (match.hook.timeout !== expected.timeout) {
      return {
        ...base,
        status: "fail",
        message: `Timeout mismatch: got ${match.hook.timeout ?? "unset"}, expected ${expected.timeout}`,
      };
    }
  } else if (match.hook.timeout !== undefined) {
    return {
      ...base,
      status: "fail",
      message: `Timeout mismatch: got ${match.hook.timeout}, expected unset`,
    };
  }

  return { ...base, status: "pass", message: "Configured" };
}

function fixHooks(data: SettingsJson, scriptPrefix: string): void {
  if (!data.hooks || typeof data.hooks !== "object" || Array.isArray(data.hooks)) {
    data.hooks = {};
  }

  if (Array.isArray(data.hooks.SessionStart)) {
    data.hooks.SessionStart = data.hooks.SessionStart.map((entry) => {
      if (
        typeof entry.matcher !== "string" ||
        !entry.matcher.includes("startup") ||
        !Array.isArray(entry.hooks)
      )
        return entry;
      const filtered = entry.hooks.filter(
        (h) => !(typeof h.command === "string" && h.command.endsWith(" load-context --core")),
      );
      return { ...entry, hooks: filtered };
    }).filter(
      (entry) =>
        !(typeof entry.matcher === "string" && entry.matcher.includes("startup")) ||
        (Array.isArray(entry.hooks) && entry.hooks.length > 0),
    );
  }

  for (const expected of EXPECTED_HOOKS) {
    if (!Array.isArray(data.hooks[expected.event])) {
      data.hooks[expected.event] = [];
    }

    const entries = data.hooks[expected.event];
    const match = findMatchingHook(entries, expected.command);
    const expectedCommand = `${scriptPrefix} ${expected.command}`;

    if (match) {
      match.hook.command = expectedCommand;
      match.hook.type = "command";
      if (expected.timeout !== undefined) {
        match.hook.timeout = expected.timeout;
      } else {
        delete match.hook.timeout;
      }
      match.entry.matcher = expected.matcher;
    } else {
      const hook: Hook = { type: "command", command: expectedCommand };
      if (expected.timeout !== undefined) {
        hook.timeout = expected.timeout;
      }
      entries.push({ matcher: expected.matcher, hooks: [hook] });
    }
  }
}

export const claudeCodeChecker: FrameworkChecker = {
  async check(paths: ProjectPaths): Promise<CheckResult[]> {
    const parsed = parseSettings(join(paths.projectRoot, ".claude", "settings.json"));
    const scriptPrefix = `$CLAUDE_PROJECT_DIR/${paths.parentDir}/skills/soulsys/scripts/soulsys`;
    return EXPECTED_HOOKS.map((expected) => checkHook(parsed, expected, scriptPrefix));
  },

  async fix(paths: ProjectPaths): Promise<CheckResult[]> {
    const settingsPath = join(paths.projectRoot, ".claude", "settings.json");
    const parsed = parseSettings(settingsPath);

    if (!parsed.ok && !parsed.missing) {
      return this.check(paths);
    }

    const data: SettingsJson = parsed.ok ? parsed.data : {};
    const scriptPrefix = `$CLAUDE_PROJECT_DIR/${paths.parentDir}/skills/soulsys/scripts/soulsys`;

    fixHooks(data, scriptPrefix);

    const dir = join(paths.projectRoot, ".claude");
    mkdirSync(dir, { recursive: true });
    writeFileSync(settingsPath, `${JSON.stringify(data, null, 2)}\n`);

    return this.check(paths);
  },
};
