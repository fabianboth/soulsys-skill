import type { Command } from "commander";

import { createSoulClient, requireData } from "../client/client.ts";
import { RELATION_DESCRIPTIONS } from "../client/generated/descriptions.ts";
import { resolveApiConfig } from "../config.ts";
import { confirm, handleError } from "../output.ts";

export function register(program: Command): Command {
  return program
    .command("add-relation")
    .description("Add a new relation to an entity you interacted with")
    .argument("<name>", RELATION_DESCRIPTIONS.name)
    .requiredOption("--type <type>", RELATION_DESCRIPTIONS.entityType)
    .requiredOption("--summary <text>", RELATION_DESCRIPTIONS.summary)
    .action(async (name: string, options: { type: string; summary: string }) => {
      try {
        if (options.type !== "human" && options.type !== "agent") {
          process.stderr.write('Error: Invalid type, must be "human" or "agent"\n');
          process.exit(1);
        }

        const { client, soulId } = createSoulClient(resolveApiConfig());
        const data = requireData(
          await client.POST("/api/souls/{soulId}/relations", {
            params: { path: { soulId } },
            body: {
              entityType: options.type,
              name,
              summary: options.summary,
            },
          }),
        );
        confirm(`Relation added (id: ${data.id})`);
      } catch (error) {
        handleError(error);
      }
    });
}
