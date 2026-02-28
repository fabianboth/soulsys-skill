import type { Command } from "commander";

import { createApiClient, requireData } from "../client/client.ts";
import type { paths } from "../client/generated/api.d.ts";
import { resolveConfig } from "../config.ts";
import { handleError } from "../output.ts";

type SearchResult =
  paths["/api/memories/search"]["post"]["responses"]["200"]["content"]["application/json"]["results"][number];

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return "No matching memories found.";
  return results.map((r) => `- \`${r.id}\` [importance: ${r.importance}] ${r.content}`).join("\n");
}

export function register(program: Command): Command {
  return program
    .command("search-memory")
    .description("Search memories by semantic similarity")
    .argument("<query>", "Search query text")
    .option("--limit <n>", "Maximum number of results (1-50)", "10")
    .action(async (query: string, options: { limit: string }) => {
      try {
        const topK = Number.parseInt(options.limit, 10);
        if (Number.isNaN(topK) || topK < 1 || topK > 50) {
          process.stderr.write("Error: --limit must be a number between 1 and 50\n");
          process.exit(1);
        }
        const { client } = createApiClient(resolveConfig());
        const data = requireData(
          await client.POST("/api/memories/search", {
            body: { query, topK },
          }),
        );
        process.stdout.write(`${formatSearchResults(data.results)}\n`);
      } catch (error) {
        handleError(error);
      }
    });
}
