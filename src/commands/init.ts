import type { Command } from "commander";

import { createApiClient, requireData } from "../client/client.ts";
import { ApiError, NetworkError } from "../client/errors.ts";
import { findConfigDir, writeConfig } from "../config.ts";
import { DEFAULT_API_URL } from "../constants.ts";
import { confirm } from "../output.ts";

export function register(program: Command): Command {
  return program
    .command("init")
    .description("Initialize soulsys with your API key")
    .requiredOption("--api-key <key>", "Your soulsys API key")
    .option("--api-url <url>", `API URL (default: ${DEFAULT_API_URL})`)
    .action(async (options: { apiKey: string; apiUrl?: string }) => {
      const apiUrl = options.apiUrl || process.env.SOULSYS_API_URL || DEFAULT_API_URL;

      let hasSoul = false;
      try {
        const { client } = createApiClient({ apiUrl, apiKey: options.apiKey });
        const soul = requireData(await client.GET("/api/soul"));
        hasSoul = Boolean(soul.essence);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          process.stderr.write("Error: Invalid API key. Check your key and try again.\n");
          process.exit(1);
        }
        if (error instanceof NetworkError) {
          process.stderr.write(`Error: Could not connect to ${apiUrl}\n`);
          process.exit(1);
        }
        throw error;
      }

      const configDir = findConfigDir();
      if (!configDir) {
        process.stderr.write(
          "Error: Could not determine config directory. Make sure you run soulsys via the wrapper script (./scripts/soulsys), not soulsys.mjs directly.\n",
        );
        process.exit(1);
      }

      writeConfig(configDir, {
        apiKey: options.apiKey,
        apiUrl: apiUrl !== DEFAULT_API_URL ? apiUrl : undefined,
      });

      if (hasSoul) {
        confirm("Connected. Run `soulsys load-context` to check your soul state.");
      } else {
        const bootstrapPath = `${configDir}/BOOTSTRAP.md`;
        confirm(`Connected. Your soul is empty — read ${bootstrapPath} to begin the hatching.`);
      }
    });
}
