import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { Command } from "commander";

import { createApiClient, requireData } from "../client/client.ts";
import { IMPORTANCE_DESCRIPTION, MEMORY_DESCRIPTIONS } from "../client/generated/descriptions.ts";
import { resolveConfig } from "../config.ts";
import { confirm, handleError } from "../output.ts";
import { parseImportance } from "../utils/parse-importance.ts";

export function register(program: Command): Command {
  return program
    .command("add-memory-file")
    .description("Add a memory entry from a file's content")
    .argument("<file>", "Path to file to import as a single memory entry")
    .option("--emotion <emotion>", MEMORY_DESCRIPTIONS.emotion)
    .option("--importance <n>", IMPORTANCE_DESCRIPTION, "5")
    .action(async (file: string, options: { emotion?: string; importance: string }) => {
      try {
        const importance = parseImportance(options.importance);

        const filePath = resolve(file);
        let content: string;
        try {
          content = await readFile(filePath, "utf-8");
        } catch {
          process.stderr.write(`Error: File not found: ${filePath}\n`);
          process.exit(1);
        }

        const { client } = createApiClient(resolveConfig());
        const data = requireData(
          await client.POST("/api/memories", {
            body: {
              content: content.trim(),
              importance,
              emotion: options.emotion,
            },
          }),
        );
        confirm(`Memory added (id: ${data.id})`);
      } catch (error) {
        handleError(error);
      }
    });
}
