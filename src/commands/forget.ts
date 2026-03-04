import type { Command } from "commander";

import { createApiClient, requireData } from "../client/client.ts";
import { resolveConfig } from "../config.ts";
import { confirm, handleError } from "../output.ts";

export function register(program: Command): Command {
  return program
    .command("forget")
    .description("Forget a memory that is no longer true — wrong, outdated, or superseded")
    .argument("<id>", "Memory UUID to forget")
    .action(async (id: string) => {
      try {
        const { client } = createApiClient(resolveConfig());
        const data = requireData(
          await client.POST("/api/memories/{memoryId}/outdate", {
            params: { path: { memoryId: id } },
          }),
        );
        confirm(`Memory ${data.id} forgotten.`);
      } catch (error) {
        handleError(error);
      }
    });
}
