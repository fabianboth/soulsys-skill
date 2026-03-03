import type { Command } from "commander";

import { tryResolveConfig } from "../config.ts";
import { claudeCodeChecker } from "../doctor/checks/claude-code.ts";
import { genericChecker } from "../doctor/checks/generic.ts";
import { openclawChecker } from "../doctor/checks/openclaw.ts";
import { getGuide as getGenericGuide } from "../doctor/guides/generic.ts";
import { getGuide as getOpenclawGuide } from "../doctor/guides/openclaw.ts";
import { deriveOverall, formatReport } from "../doctor/report.ts";
import type { CheckReport, CheckResult, FrameworkChecker } from "../doctor/types.ts";
import type { Guide } from "../framework/detect.ts";
import { resolveInstallation } from "../framework/detect.ts";

function getChecker(guide: Guide): FrameworkChecker {
  switch (guide) {
    case "claude-code":
      return claudeCodeChecker;
    case "openclaw":
      return openclawChecker;
    default:
      return genericChecker;
  }
}

function getGuideText(guide: Guide): string | null {
  switch (guide) {
    case "claude-code":
      return null;
    case "openclaw":
      return getOpenclawGuide();
    case "generic":
      return getGenericGuide();
  }
}

export function register(program: Command): Command {
  return program
    .command("doctor")
    .description("Check soulsys setup health and optionally fix issues")
    .option("--fix", "Automatically repair detected issues")
    .action(async (options: { fix?: boolean }) => {
      const installation = resolveInstallation(process.argv[1]);

      if (!installation) {
        process.stderr.write(
          "Error: Could not determine project paths. Make sure soulsys is installed correctly.\n",
        );
        process.exit(2);
      }

      try {
        const { framework, guide, paths } = installation;
        const allResults: CheckResult[] = [];
        let fixesApplied = 0;

        const config = tryResolveConfig();
        allResults.push({
          name: "Soulsys config",
          category: "config",
          status: config ? "pass" : "fail",
          message: config
            ? "API key configured"
            : "Not configured. Run `soulsys init --api-key <key>` to connect.",
          fixable: false,
        });

        const checker = getChecker(guide);

        let frameworkResults: CheckResult[];
        if (options.fix) {
          const beforeResults = await checker.check(paths);
          const failCount = beforeResults.filter((r) => r.status === "fail" && r.fixable).length;
          frameworkResults = await checker.fix(paths);
          const afterFailCount = frameworkResults.filter(
            (r) => r.status === "fail" && r.fixable,
          ).length;
          fixesApplied = failCount - afterFailCount;
        } else {
          frameworkResults = await checker.check(paths);
        }
        allResults.push(...frameworkResults);

        const report: CheckReport = {
          framework,
          checks: allResults,
          overall: deriveOverall(allResults),
          fixesApplied: Math.max(0, fixesApplied),
        };

        process.stdout.write(`${formatReport(report)}\n`);

        const guideText = getGuideText(guide);
        if (guideText) {
          process.stdout.write(`\n${guideText}\n`);
        }

        if (report.overall === "pass") {
          process.exit(0);
        } else {
          process.exit(1);
        }
      } catch (error) {
        process.stderr.write(
          `Error: Doctor encountered an unexpected error: ${error instanceof Error ? error.message : String(error)}\n`,
        );
        process.exit(2);
      }
    });
}
