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
    .command("create-identity")
    .description("Create the identity (once per soul)")
    .requiredOption("--name <name>", IDENTITY_DESCRIPTIONS.name)
    .requiredOption("--vibe <text>", IDENTITY_DESCRIPTIONS.vibe)
    .option("--description <text>", IDENTITY_DESCRIPTIONS.description)
    .option("--emoji <emoji>", APPEARANCE_DESCRIPTIONS.emoji)
    .option("--avatar-url <url>", APPEARANCE_DESCRIPTIONS.avatarUrl)
    .action(
      async (options: {
        name: string;
        vibe: string;
        description?: string;
        emoji?: string;
        avatarUrl?: string;
      }) => {
        try {
          const { name, vibe, description, emoji, avatarUrl } = options;

          const appearance =
            emoji !== undefined || avatarUrl !== undefined
              ? { emoji: emoji ?? "\u{1F916}", avatarUrl }
              : undefined;

          const { client } = createApiClient(resolveConfig());
          await client.POST("/api/identity", {
            body: { name, vibe, description, appearance },
          });
          confirm("Identity created");
        } catch (error) {
          handleError(error);
        }
      },
    );
}
