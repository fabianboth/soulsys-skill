import type { Command } from "commander";

import { createSoulClient } from "../client/client.ts";
import { ApiError } from "../client/errors.ts";
import { resolveApiConfig } from "../config.ts";
import { handleError } from "../output.ts";

export function register(program: Command): Command {
  return program
    .command("exists")
    .description("Check if a soul exists at the configured API")
    .action(async () => {
      try {
        const { client, soulId } = createSoulClient(resolveApiConfig());
        try {
          await client.GET("/api/souls/{soulId}", {
            params: { path: { soulId } },
          });
          process.stdout.write("true\n");
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) {
            process.stdout.write("false\n");
          } else {
            throw error;
          }
        }
      } catch (error) {
        handleError(error);
      }
    });
}
