import type { CheckReport, CheckStatus } from "./types.ts";

const STATUS_ICONS: Record<CheckStatus, string> = {
  pass: "PASS",
  fail: "FAIL",
  warn: "WARN",
};

export function formatReport(report: CheckReport): string {
  const lines: string[] = [];

  lines.push(`Doctor report for framework: ${report.framework}`);
  lines.push("");

  for (const check of report.checks) {
    const icon = STATUS_ICONS[check.status];
    const fixable = check.status !== "pass" && check.fixable ? " (fixable)" : "";
    lines.push(`  [${icon}] ${check.name}: ${check.message}${fixable}`);
  }

  lines.push("");

  const passed = report.checks.filter((c) => c.status === "pass").length;
  const failed = report.checks.filter((c) => c.status === "fail").length;
  const warned = report.checks.filter((c) => c.status === "warn").length;

  const parts: string[] = [`${passed} passed`];
  if (failed > 0) parts.push(`${failed} failed`);
  if (warned > 0) parts.push(`${warned} warnings`);
  if (report.fixesApplied > 0) parts.push(`${report.fixesApplied} fixed`);

  const overall = STATUS_ICONS[report.overall];
  lines.push(`Overall: [${overall}] ${parts.join(", ")}`);

  return lines.join("\n");
}

export function deriveOverall(checks: { status: CheckStatus }[]): CheckStatus {
  if (checks.some((c) => c.status === "fail")) return "fail";
  if (checks.some((c) => c.status === "warn")) return "warn";
  return "pass";
}
