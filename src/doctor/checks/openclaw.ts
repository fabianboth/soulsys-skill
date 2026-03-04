import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { ProjectPaths } from "../../framework/detect.ts";
import type { CheckResult, FrameworkChecker } from "../types.ts";

type OpenClawJson = {
  hooks?: { "agent:bootstrap"?: string; [key: string]: unknown };
  agents?: {
    defaults?: {
      compaction?: {
        memoryFlush?: { systemPrompt?: string; prompt?: string; [key: string]: unknown };
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type ParseResult =
  | { ok: true; data: OpenClawJson }
  | { ok: false; missing: true }
  | { ok: false; missing: false; error: string };

const EXPECTED_BOOTSTRAP_PATH = "./hooks/soulsys-bootstrap.ts";

const EXPECTED_MEMORY_FLUSH = {
  systemPrompt:
    "You are saving memories before context compaction. Review what happened and preserve what matters using soulsys add-memory.",
  prompt: `Review the conversation above and extract memories worth keeping using soulsys add-memory.

Capture: decisions made, opinions expressed, preferences discovered, lessons learned, significant events, relationship context, and where things were left off. This is your lived experience, not a log.

Skip: routine commands, mid-conversation navigation that was superseded, generic knowledge, and anything already saved via soulsys add-memory earlier in this conversation.`,
};

function parseOpenClawJson(filePath: string): ParseResult {
  if (!existsSync(filePath)) return { ok: false, missing: true };
  try {
    return { ok: true, data: JSON.parse(readFileSync(filePath, "utf-8")) };
  } catch {
    return { ok: false, missing: false, error: "Invalid JSON in openclaw.json" };
  }
}

function failForParse(name: string, parsed: ParseResult & { ok: false }): CheckResult {
  return {
    name,
    category: "integration",
    status: "fail",
    message: parsed.missing ? "openclaw.json not found" : parsed.error,
    fixable: parsed.missing,
  };
}

function checkBootstrapConfig(parsed: ParseResult): CheckResult {
  const name = "Bootstrap hook config";
  if (!parsed.ok) return failForParse(name, parsed);

  const hookValue = parsed.data.hooks?.["agent:bootstrap"];
  if (hookValue !== EXPECTED_BOOTSTRAP_PATH) {
    return {
      name,
      category: "integration",
      status: "fail",
      message:
        hookValue == null
          ? "Missing agent:bootstrap hook"
          : `Bootstrap path mismatch: got "${hookValue}", expected "${EXPECTED_BOOTSTRAP_PATH}"`,
      fixable: true,
    };
  }
  return { name, category: "integration", status: "pass", message: "Configured", fixable: true };
}

function checkMemoryFlushConfig(parsed: ParseResult): CheckResult {
  const name = "Memory flush config";
  if (!parsed.ok) return failForParse(name, parsed);

  const flush = parsed.data.agents?.defaults?.compaction?.memoryFlush;
  if (flush == null) {
    return {
      name,
      category: "integration",
      status: "fail",
      message: "Missing agents.defaults.compaction.memoryFlush config",
      fixable: true,
    };
  }
  if (flush.systemPrompt !== EXPECTED_MEMORY_FLUSH.systemPrompt) {
    return {
      name,
      category: "integration",
      status: "fail",
      message: "memoryFlush.systemPrompt mismatch",
      fixable: true,
    };
  }
  if (flush.prompt !== EXPECTED_MEMORY_FLUSH.prompt) {
    return {
      name,
      category: "integration",
      status: "fail",
      message: "memoryFlush.prompt mismatch",
      fixable: true,
    };
  }
  return { name, category: "integration", status: "pass", message: "Configured", fixable: true };
}

function checkBootstrapFile(bootstrapPath: string): CheckResult {
  const exists = existsSync(bootstrapPath);
  return {
    name: "Bootstrap hook file",
    category: "integration",
    status: exists ? "pass" : "fail",
    message: exists
      ? "Found at hooks/soulsys-bootstrap.ts"
      : "hooks/soulsys-bootstrap.ts not found",
    fixable: true,
  };
}

export const openclawChecker: FrameworkChecker = {
  async check(paths: ProjectPaths): Promise<CheckResult[]> {
    const parsed = parseOpenClawJson(join(paths.projectRoot, "openclaw.json"));
    const bootstrapPath = join(paths.projectRoot, "hooks", "soulsys-bootstrap.ts");

    return [
      checkBootstrapConfig(parsed),
      checkMemoryFlushConfig(parsed),
      checkBootstrapFile(bootstrapPath),
    ];
  },

  async fix(paths: ProjectPaths): Promise<CheckResult[]> {
    const openclawPath = join(paths.projectRoot, "openclaw.json");
    const bootstrapPath = join(paths.projectRoot, "hooks", "soulsys-bootstrap.ts");

    const parsed = parseOpenClawJson(openclawPath);
    if (!parsed.ok && !parsed.missing) {
      return this.check(paths);
    }

    const data: OpenClawJson = parsed.ok ? parsed.data : {};

    if (!data.hooks) data.hooks = {};
    data.hooks["agent:bootstrap"] = EXPECTED_BOOTSTRAP_PATH;

    if (!data.agents) data.agents = {};
    if (!data.agents.defaults) data.agents.defaults = {};
    if (!data.agents.defaults.compaction) data.agents.defaults.compaction = {};
    data.agents.defaults.compaction.memoryFlush = {
      ...EXPECTED_MEMORY_FLUSH,
    };

    writeFileSync(openclawPath, `${JSON.stringify(data, null, 2)}\n`);

    if (!existsSync(bootstrapPath)) {
      const hooksDir = join(paths.projectRoot, "hooks");
      mkdirSync(hooksDir, { recursive: true });
      const templatePath = join(paths.skillRoot, "templates", "openclaw-bootstrap.ts");
      if (existsSync(templatePath)) {
        copyFileSync(templatePath, bootstrapPath);
      }
    }

    return this.check(paths);
  },
};
