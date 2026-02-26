import type { Command } from "commander";

import { createBootstrapClient, requireData } from "../client/client.ts";
import { SOUL_DESCRIPTIONS } from "../client/generated/descriptions.ts";
import { resolveBootstrapConfig } from "../config.ts";
import { confirm, handleError } from "../output.ts";

export function register(program: Command): Command {
  return program
    .command("create-soul")
    .description("Create the soul (once per agent)")
    .requiredOption("--essence <text>", SOUL_DESCRIPTIONS.essence)
    .requiredOption("--values <text>", SOUL_DESCRIPTIONS.values)
    .action(async (options: { essence: string; values: string }) => {
      try {
        const { client } = createBootstrapClient(resolveBootstrapConfig());
        const data = requireData(
          await client.POST("/api/souls", {
            body: { essence: options.essence, values: options.values },
          }),
        );
        confirm(`Soul created (id: ${data.id})`);
      } catch (error) {
        handleError(error);
      }
    });
}
