import { resolve } from "node:path";

import type { Command } from "commander";

import { handleError } from "../output.ts";

type SkillsDir =
  | ".adal"
  | ".agent"
  | ".agents"
  | ".augment"
  | ".claude"
  | ".codebuddy"
  | ".commandcode"
  | ".continue"
  | ".cortex"
  | ".crush"
  | ".factory"
  | ".goose"
  | ".iflow"
  | ".junie"
  | ".kilocode"
  | ".kiro"
  | ".kode"
  | ".mcpjam"
  | ".mux"
  | ".neovate"
  | ".openhands"
  | ".pi"
  | ".pochi"
  | ".qoder"
  | ".qwen"
  | ".roo"
  | ".trae"
  | ".vibe"
  | ".windsurf"
  | ".zencoder";

type Guide = "claude-code" | "openclaw" | "generic";

export type FrameworkResult = {
  framework: string;
  guide: Guide;
};

const AGENTS: Record<SkillsDir, FrameworkResult> = {
  ".adal": { framework: "adal", guide: "generic" },
  ".agent": { framework: "antigravity", guide: "generic" },
  ".agents": { framework: "universal", guide: "generic" },
  ".augment": { framework: "augment", guide: "generic" },
  ".claude": { framework: "claude-code", guide: "claude-code" },
  ".codebuddy": { framework: "codebuddy", guide: "generic" },
  ".commandcode": { framework: "command-code", guide: "generic" },
  ".continue": { framework: "continue", guide: "generic" },
  ".cortex": { framework: "cortex", guide: "generic" },
  ".crush": { framework: "crush", guide: "generic" },
  ".factory": { framework: "droid", guide: "generic" },
  ".goose": { framework: "goose", guide: "generic" },
  ".iflow": { framework: "iflow-cli", guide: "generic" },
  ".junie": { framework: "junie", guide: "generic" },
  ".kilocode": { framework: "kilo", guide: "generic" },
  ".kiro": { framework: "kiro-cli", guide: "generic" },
  ".kode": { framework: "kode", guide: "generic" },
  ".mcpjam": { framework: "mcpjam", guide: "generic" },
  ".mux": { framework: "mux", guide: "generic" },
  ".neovate": { framework: "neovate", guide: "generic" },
  ".openhands": { framework: "openhands", guide: "generic" },
  ".pi": { framework: "pi", guide: "generic" },
  ".pochi": { framework: "pochi", guide: "generic" },
  ".qoder": { framework: "qoder", guide: "generic" },
  ".qwen": { framework: "qwen-code", guide: "generic" },
  ".roo": { framework: "roo", guide: "generic" },
  ".trae": { framework: "trae", guide: "generic" },
  ".vibe": { framework: "mistral-vibe", guide: "generic" },
  ".windsurf": { framework: "windsurf", guide: "generic" },
  ".zencoder": { framework: "zencoder", guide: "generic" },
};

const INSTALL_PATH_RE = /([^/\\]+)[/\\]skills[/\\]soulsys[/\\]scripts(?:[/\\]|$)/;

export function detectFramework(scriptPath: string): FrameworkResult {
  const match = scriptPath.match(INSTALL_PATH_RE);
  if (!match) return { framework: "unknown", guide: "generic" };

  const parent = match[1];

  if (!parent.startsWith(".")) {
    return { framework: "openclaw", guide: "openclaw" };
  }

  if (parent in AGENTS) {
    return AGENTS[parent as SkillsDir];
  }

  return { framework: parent.slice(1), guide: "generic" };
}

export function register(program: Command): Command {
  return program
    .command("detect-framework")
    .description("Detect the current agent framework from the skill's installation path")
    .action(() => {
      try {
        const result = detectFramework(resolve(process.argv[1]));
        process.stdout.write(`${JSON.stringify(result)}\n`);
      } catch (error) {
        handleError(error);
      }
    });
}
