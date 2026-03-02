import type { FrameworkAdapter } from "../adapter.ts";
import { createClaudeCodeAdapter } from "./claude-code/adapter.ts";

const ADAPTERS: Record<string, () => FrameworkAdapter> = {
  "claude-code": createClaudeCodeAdapter,
};

export function resolveFrameworkAdapter(guide: string): FrameworkAdapter | null {
  const factory = ADAPTERS[guide];
  return factory ? factory() : null;
}
