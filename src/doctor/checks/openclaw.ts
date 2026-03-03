import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { ProjectPaths } from "../../framework/detect.ts";
import type { CheckResult, FrameworkChecker } from "../types.ts";

type OpenClawJson = {
  hooks?: { "agent:bootstrap"?: string; [key: string]: unknown };
  agents?: {
    defaults?: {
      compaction?: {
        memoryFlush?: unknown;
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

function parseOpenClawJson(filePath: string): ParseResult {
  if (!existsSync(filePath)) return { ok: false, missing: true };
  try {
    return { ok: true, data: JSON.parse(readFileSync(filePath, "utf-8")) };
  } catch {
    return { ok: false, missing: false, error: "Invalid JSON in openclaw.json" };
  }
}

function checkBootstrapConfig(parsed: ParseResult): CheckResult {
  if (!parsed.ok) {
    return {
      name: "Bootstrap hook config",
      category: "integration",
      status: "fail",
      message: parsed.missing ? "openclaw.json not found" : parsed.error,
      fixable: parsed.missing,
    };
  }
  const hookValue = parsed.data.hooks?.["agent:bootstrap"];
  const hasBootstrap = typeof hookValue === "string" && hookValue.includes("soulsys-bootstrap");
  return {
    name: "Bootstrap hook config",
    category: "integration",
    status: hasBootstrap ? "pass" : "fail",
    message: hasBootstrap
      ? "Configured"
      : "Missing agent:bootstrap hook referencing soulsys-bootstrap",
    fixable: true,
  };
}

function checkMemoryFlushConfig(parsed: ParseResult): CheckResult {
  if (!parsed.ok) {
    return {
      name: "Memory flush config",
      category: "integration",
      status: "fail",
      message: parsed.missing ? "openclaw.json not found" : parsed.error,
      fixable: parsed.missing,
    };
  }
  const hasMemoryFlush = parsed.data.agents?.defaults?.compaction?.memoryFlush != null;
  return {
    name: "Memory flush config",
    category: "integration",
    status: hasMemoryFlush ? "pass" : "fail",
    message: hasMemoryFlush
      ? "Configured"
      : "Missing agents.defaults.compaction.memoryFlush config",
    fixable: true,
  };
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
    const hookValue = data.hooks["agent:bootstrap"];
    if (typeof hookValue !== "string" || !hookValue.includes("soulsys-bootstrap")) {
      data.hooks["agent:bootstrap"] = "./hooks/soulsys-bootstrap.ts";
    }

    if (!data.agents) data.agents = {};
    if (!data.agents.defaults) data.agents.defaults = {};
    if (!data.agents.defaults.compaction) data.agents.defaults.compaction = {};
    if (data.agents.defaults.compaction.memoryFlush == null) {
      data.agents.defaults.compaction.memoryFlush = {
        systemPrompt:
          "You are saving memories before context compaction. Use the soulsys add-memory command exactly as described in AGENTS.md.",
        prompt:
          'Review the conversation above. For each memory worth persisting, run:\n\nsoulsys add-memory "<memory content>" --importance <1-10>\n\nAdd --emotion <emotion> only if you genuinely associate an emotion with the memory. Do not save routine exchanges or transient state.',
      };
    }

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
