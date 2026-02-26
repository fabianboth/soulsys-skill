import type { Command } from "commander";

import { createSoulClient } from "../client/client.ts";
import type { paths } from "../client/generated/api.js";
import { RELATION_DESCRIPTIONS } from "../client/generated/descriptions.ts";
import { resolveApiConfig } from "../config.ts";
import { confirm, handleError } from "../output.ts";

type UpdateRelationInput = NonNullable<
  paths["/api/souls/{soulId}/relations/{relationId}"]["patch"]["requestBody"]
>["content"]["application/json"];

export function register(program: Command): Command {
  return program
    .command("update-relation")
    .description("Update a relation (partial — unset fields are preserved)")
    .argument("<id>", "Relation UUID")
    .option("--type <type>", RELATION_DESCRIPTIONS.entityType)
    .option("--name <name>", RELATION_DESCRIPTIONS.name)
    .option("--summary <text>", RELATION_DESCRIPTIONS.summary)
    .action(async (id: string, options: { type?: string; name?: string; summary?: string }) => {
      try {
        if (
          options.type === undefined &&
          options.name === undefined &&
          options.summary === undefined
        ) {
          process.stderr.write("Error: At least one option required\n");
          process.exit(1);
        }

        const updates: UpdateRelationInput = {};
        if (options.type !== undefined) {
          if (options.type !== "human" && options.type !== "agent") {
            process.stderr.write('Error: Invalid type, must be "human" or "agent"\n');
            process.exit(1);
          }
          updates.entityType = options.type;
        }
        if (options.name !== undefined) updates.name = options.name;
        if (options.summary !== undefined) updates.summary = options.summary;

        const { client, soulId } = createSoulClient(resolveApiConfig());
        await client.PATCH("/api/souls/{soulId}/relations/{relationId}", {
          params: { path: { soulId, relationId: id } },
          body: updates,
        });
        confirm(`Relation updated (id: ${id})`);
      } catch (error) {
        handleError(error);
      }
    });
}
