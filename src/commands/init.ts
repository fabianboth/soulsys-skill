import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { Command } from "commander";

import { confirm, handleError } from "../output.ts";

export function register(program: Command): Command {
  return program
    .command("init")
    .description("Initialize soulsys skill files in the current project")
    .action(async () => {
      try {
        const pkgRoot = resolve(import.meta.dirname, "..", "..");
        const targetDir = resolve(process.cwd(), "skills", "soulsys");

        await mkdir(targetDir, { recursive: true });

        const docsDir = resolve(pkgRoot, "docs");
        const [skillMd, bootstrapMd] = await Promise.all([
          readFile(resolve(docsDir, "SKILL.md"), "utf-8"),
          readFile(resolve(docsDir, "BOOTSTRAP.md"), "utf-8"),
        ]);
        await Promise.all([
          writeFile(resolve(targetDir, "SKILL.md"), skillMd),
          writeFile(resolve(targetDir, "BOOTSTRAP.md"), bootstrapMd),
        ]);

        confirm("Initialized soulsys skill at skills/soulsys/");
      } catch (error) {
        handleError(error);
      }
    });
}
