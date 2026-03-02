import { resolve } from "node:path";

import type { Command } from "commander";

import { detectFramework } from "../framework/detect.ts";
import { handleError } from "../output.ts";

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
