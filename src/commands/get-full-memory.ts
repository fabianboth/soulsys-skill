import type { Command } from "commander";

import { createApiClient, requireData } from "../client/client.ts";
import type { paths } from "../client/generated/api.d.ts";
import { resolveConfig } from "../config.ts";
import { handleError } from "../output.ts";

type MemoryEntry =
  paths["/api/memories/{memoryId}"]["get"]["responses"]["200"]["content"]["application/json"];

export function formatMemory(memory: MemoryEntry): string {
  const meta = [
    `[importance: ${memory.importance}]`,
    `[${memory.type}]`,
    memory.emotion ? `[${memory.emotion}]` : null,
    memory.outdatedAt ? "[forgotten]" : null,
    memory.createdAt
      ? `[${new Date(memory.createdAt).toISOString().slice(0, 16).replace("T", " ")}]`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  const lines = [`\`${memory.id}\` ${meta}`, memory.content];

  if (memory.fullContent) {
    lines.push("", "--- full content ---", memory.fullContent);
  }

  return lines.join("\n");
}

export function register(program: Command): Command {
  return program
    .command("get-full-memory")
    .description("Retrieve full content of a memory by ID")
    .argument("<id>", "Memory UUID to retrieve")
    .action(async (id: string) => {
      try {
        const { client } = createApiClient(resolveConfig());
        const data = requireData(
          await client.GET("/api/memories/{memoryId}", {
            params: { path: { memoryId: id } },
          }),
        );
        process.stdout.write(`${formatMemory(data)}\n`);
      } catch (error) {
        handleError(error);
      }
    });
}
