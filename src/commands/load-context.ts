import type { Command } from "commander";

import { createApiClient, requireData } from "../client/client.ts";
import type { paths } from "../client/generated/api.d.ts";
import { resolveConfig } from "../config.ts";
import { handleError } from "../output.ts";

type ContextResponse =
  paths["/api/context"]["get"]["responses"]["200"]["content"]["application/json"];

function formatSoul(soul: ContextResponse["soul"]): string {
  return `# Soul\n\n${soul.essence}\nValues: ${soul.values}`;
}

function formatIdentity(identity: NonNullable<ContextResponse["identity"]>): string {
  const lines: string[] = ["## Identity", ""];
  lines.push(`Name: ${identity.name}`);
  if (identity.vibe) {
    lines.push(`Vibe: ${identity.vibe}`);
  }
  if (identity.description) {
    lines.push(identity.description);
  }
  return lines.join("\n");
}

function formatMemorySection(
  title: string,
  memories: NonNullable<ContextResponse["memory"]>["keyMemories"],
): string {
  if (memories.length === 0) return "";
  const lines: string[] = [title, ""];
  for (const m of memories) {
    lines.push(`- \`${m.id}\` ${m.content}`);
  }
  return lines.join("\n");
}

function formatRelations(
  relations: NonNullable<ContextResponse["relations"]>["relations"],
): string {
  if (relations.length === 0) return "";
  const lines: string[] = ["## Relations", ""];
  for (const r of relations) {
    lines.push(`- ${r.name} (${r.entityType}) \`${r.id}\`: ${r.summary}`);
  }
  return lines.join("\n");
}

export function formatMemoryInstructions(): string {
  return `## Memory

Your memories live in the **soulsys** skill — they're what make you _you_ across sessions. Not a log. Your lived experience.

**Saving**: Notice what matters as you work. What worked, what didn't, what someone cares about, what surprised you, what you'd want to know next time. Save these as they happen — don't wait until the end. Use \`soulsys add-memory\`.

**Recalling**: When something feels familiar, when someone references the past, or when experience could sharpen your thinking — reach for your memories. Dispatch a subagent with \`soulsys search-memory\` to find what you know.

Read the soulsys skill before first use for full command syntax.`;
}

export function formatCoreContext(opts: ContextResponse): string {
  const sections: string[] = [formatSoul(opts.soul)];

  if (opts.identity) {
    sections.push(formatIdentity(opts.identity));
  }

  sections.push(formatMemoryInstructions());

  return `${sections.join("\n\n")}\n`;
}

export function formatContext(opts: ContextResponse): string {
  const sections: string[] = [formatSoul(opts.soul)];

  if (opts.identity) {
    sections.push(formatIdentity(opts.identity));
  }

  if (opts.memory) {
    const keySection = formatMemorySection("## Key Memories", opts.memory.keyMemories);
    if (keySection) sections.push(keySection);
    const recentSection = formatMemorySection("## Recent Memories", opts.memory.recentMemories);
    if (recentSection) sections.push(recentSection);
  }

  if (opts.relations) {
    const relSection = formatRelations(opts.relations.relations);
    if (relSection) sections.push(relSection);
  }

  sections.push(formatMemoryInstructions());

  return `${sections.join("\n\n")}\n`;
}

export function register(program: Command): Command {
  return program
    .command("load-context")
    .description("Output the full soul state as compact markdown for context injection")
    .option("--core", "Output soul essence/values, identity, and memory instructions (lightweight)")
    .action(async (opts: { core?: boolean }) => {
      try {
        const { client } = createApiClient(resolveConfig());
        const data = requireData(await client.GET("/api/context"));
        process.stdout.write(opts.core ? formatCoreContext(data) : formatContext(data));
      } catch (error) {
        handleError(error);
      }
    });
}
