import type { Command } from "commander";

import { createApiClient } from "../client/client.ts";
import {
  APPEARANCE_DESCRIPTIONS,
  IDENTITY_DESCRIPTIONS,
} from "../client/generated/descriptions.ts";
import { resolveConfig } from "../config.ts";
import { confirm, handleError } from "../output.ts";

export function register(program: Command): Command {
  return program
    .command("update-identity")
    .description("Update identity fields (partial — unset fields are preserved)")
    .option("--name <name>", IDENTITY_DESCRIPTIONS.name)
    .option("--vibe <text>", IDENTITY_DESCRIPTIONS.vibe)
    .option("--description <text>", IDENTITY_DESCRIPTIONS.description)
    .option("--creature <text>", IDENTITY_DESCRIPTIONS.creature)
    .option("--communication-style <text>", IDENTITY_DESCRIPTIONS.communicationStyle)
    .option("--emoji <emoji>", APPEARANCE_DESCRIPTIONS.emoji)
    .option("--avatar-url <url>", APPEARANCE_DESCRIPTIONS.avatarUrl)
    .action(
      async (options: {
        name?: string;
        vibe?: string;
        description?: string;
        creature?: string;
        communicationStyle?: string;
        emoji?: string;
        avatarUrl?: string;
      }) => {
        try {
          const { name, vibe, description, creature, communicationStyle, emoji, avatarUrl } =
            options;

          if (
            name === undefined &&
            vibe === undefined &&
            description === undefined &&
            creature === undefined &&
            communicationStyle === undefined &&
            emoji === undefined &&
            avatarUrl === undefined
          ) {
            process.stderr.write("Error: At least one option required\n");
            process.exit(1);
          }

          const appearance =
            emoji !== undefined || avatarUrl !== undefined ? { emoji, avatarUrl } : undefined;

          const { client } = createApiClient(resolveConfig());
          await client.PATCH("/api/identity", {
            body: { name, vibe, description, creature, communicationStyle, appearance },
          });
          confirm("Identity updated");
        } catch (error) {
          handleError(error);
        }
      },
    );
}
