import { resolve } from "node:path";

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

export type Guide = "claude-code" | "openclaw" | "generic";

export type FrameworkResult = {
  framework: string;
  guide: Guide;
};

export type ProjectPaths = {
  projectRoot: string;
  skillRoot: string;
  parentDir: string;
  scriptPath: string;
};

export type InstallationResult = FrameworkResult & {
  paths: ProjectPaths;
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

// Captures <parentDir>/skills/soulsys/scripts — parentDir is ".claude", ".roo", "skills" (openclaw), etc.
const INSTALL_PATH_RE = /([^/\\]+)[/\\]skills[/\\]soulsys[/\\]scripts(?:[/\\]|$)/;

export function resolveInstallation(scriptPath: string): InstallationResult | null {
  const normalized = scriptPath.replace(/\\/g, "/");
  const match = normalized.match(INSTALL_PATH_RE);
  if (!match || match.index === undefined) return null;

  const parentDir = match[1];
  const beforeParent = normalized.slice(0, match.index);

  // Dotdirs (.claude, .roo) sit inside the project root; bare dirs (skills) ARE the project root
  const projectRoot = parentDir.startsWith(".")
    ? resolve(beforeParent)
    : resolve(beforeParent, parentDir);

  const skillRoot = resolve(beforeParent, parentDir, "skills", "soulsys");

  const paths: ProjectPaths = {
    projectRoot,
    skillRoot,
    parentDir,
    scriptPath: resolve(scriptPath),
  };

  let result: FrameworkResult;
  if (!parentDir.startsWith(".")) {
    result = { framework: "openclaw", guide: "openclaw" };
  } else if (parentDir in AGENTS) {
    result = AGENTS[parentDir as SkillsDir];
  } else {
    result = { framework: parentDir.slice(1), guide: "generic" };
  }

  return { ...result, paths };
}

export function detectFramework(scriptPath: string): FrameworkResult {
  const result = resolveInstallation(scriptPath);
  if (!result) return { framework: "unknown", guide: "generic" };
  return { framework: result.framework, guide: result.guide };
}
