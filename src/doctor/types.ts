import type { ProjectPaths } from "../framework/detect.ts";

export type CheckStatus = "pass" | "fail" | "warn";
export type CheckCategory = "config" | "hooks" | "integration";

export type CheckResult = {
  name: string;
  category: CheckCategory;
  status: CheckStatus;
  message: string;
  fixable: boolean;
};

export type CheckReport = {
  framework: string;
  checks: CheckResult[];
  overall: CheckStatus;
  fixesApplied: number;
};

export type FrameworkChecker = {
  check(paths: ProjectPaths): Promise<CheckResult[]>;
  fix(paths: ProjectPaths): Promise<CheckResult[]>;
};
