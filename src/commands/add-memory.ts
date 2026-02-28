import type { Command } from "commander";

import { createApiClient, requireData } from "../client/client.ts";
import { IMPORTANCE_DESCRIPTION, MEMORY_DESCRIPTIONS } from "../client/generated/descriptions.ts";
import { resolveConfig } from "../config.ts";
import { confirm, handleError } from "../output.ts";
import { parseImportance } from "../utils/parse-importance.ts";

export function register(program: Command): Command {
  return program
    .command("add-memory")
    .description("Add a memory entry — do this during conversations, not in batch at the end")
    .argument("<content>", MEMORY_DESCRIPTIONS.content)
    .option("--emotion <emotion>", MEMORY_DESCRIPTIONS.emotion)
    .option("--importance <n>", IMPORTANCE_DESCRIPTION, "5")
    .action(async (content: string, options: { emotion?: string; importance: string }) => {
      try {
        const importance = parseImportance(options.importance);

        const { client } = createApiClient(resolveConfig());
        const data = requireData(
          await client.POST("/api/memories", {
            body: {
              content,
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
