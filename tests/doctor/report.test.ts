import { deriveOverall, formatReport } from "../../src/doctor/report.ts";
import type { CheckReport, CheckResult } from "../../src/doctor/types.ts";
import { describe, expect, it } from "bun:test";

function makeCheck(overrides: Partial<CheckResult> = {}): CheckResult {
  return {
    name: "Test check",
    category: "config",
    status: "pass",
    message: "All good",
    fixable: false,
    ...overrides,
  };
}

describe("formatReport", () => {
  it("formats an all-pass report", () => {
    const report: CheckReport = {
      framework: "claude-code",
      checks: [makeCheck({ name: "Config", message: "Found" })],
      overall: "pass",
      fixesApplied: 0,
    };
    const output = formatReport(report);
    expect(output).toContain("claude-code");
    expect(output).toContain("[PASS] Config: Found");
    expect(output).toContain("Overall: [PASS] 1 passed");
  });

  it("formats a report with failures", () => {
    const report: CheckReport = {
      framework: "claude-code",
      checks: [
        makeCheck({ name: "Config", status: "pass", message: "Found" }),
        makeCheck({ name: "Hook", status: "fail", message: "Missing", fixable: true }),
      ],
      overall: "fail",
      fixesApplied: 0,
    };
    const output = formatReport(report);
    expect(output).toContain("[FAIL] Hook: Missing (fixable)");
    expect(output).toContain("Overall: [FAIL]");
    expect(output).toContain("1 passed");
    expect(output).toContain("1 failed");
  });

  it("formats a report with warnings", () => {
    const report: CheckReport = {
      framework: "generic",
      checks: [makeCheck({ name: "Manual", status: "warn", message: "Needs setup" })],
      overall: "warn",
      fixesApplied: 0,
    };
    const output = formatReport(report);
    expect(output).toContain("[WARN]");
    expect(output).toContain("1 warnings");
  });

  it("shows fixes-applied count", () => {
    const report: CheckReport = {
      framework: "claude-code",
      checks: [makeCheck()],
      overall: "pass",
      fixesApplied: 2,
    };
    const output = formatReport(report);
    expect(output).toContain("2 fixed");
  });

  it("does not show fixable tag on passing checks", () => {
    const report: CheckReport = {
      framework: "test",
      checks: [makeCheck({ fixable: true })],
      overall: "pass",
      fixesApplied: 0,
    };
    const output = formatReport(report);
    expect(output).not.toContain("(fixable)");
  });
});

describe("deriveOverall", () => {
  it("returns pass when all pass", () => {
    expect(deriveOverall([{ status: "pass" }, { status: "pass" }])).toBe("pass");
  });

  it("returns fail when any fail", () => {
    expect(deriveOverall([{ status: "pass" }, { status: "fail" }])).toBe("fail");
  });

  it("returns warn when any warn but no fail", () => {
    expect(deriveOverall([{ status: "pass" }, { status: "warn" }])).toBe("warn");
  });

  it("returns fail over warn", () => {
    expect(deriveOverall([{ status: "warn" }, { status: "fail" }])).toBe("fail");
  });

  it("returns pass for empty array", () => {
    expect(deriveOverall([])).toBe("pass");
  });
});
