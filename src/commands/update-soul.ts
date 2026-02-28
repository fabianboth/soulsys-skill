import type { Command } from "commander";

import { createApiClient } from "../client/client.ts";
import { SOUL_DESCRIPTIONS } from "../client/generated/descriptions.ts";
import { resolveConfig } from "../config.ts";
import { confirm, handleError } from "../output.ts";

export function register(program: Command): Command {
  return program
    .command("update-soul")
    .description("Update soul fields")
    .option("--essence <text>", SOUL_DESCRIPTIONS.essence)
    .option("--values <text>", SOUL_DESCRIPTIONS.values)
    .action(async (options: { essence?: string; values?: string }) => {
      try {
        if (options.essence === undefined && options.values === undefined) {
          process.stderr.write("Error: At least one option required\n");
          process.exit(1);
        }

        const updates: { essence?: string; values?: string } = {};
        if (options.essence !== undefined) updates.essence = options.essence;
        if (options.values !== undefined) updates.values = options.values;

        const { client } = createApiClient(resolveConfig());
        await client.PATCH("/api/soul", { body: updates });
        confirm("Soul updated");
      } catch (error) {
        handleError(error);
      }
    });
}
