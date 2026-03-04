import type { paths } from "../client/generated/api.d.ts";

export type ContextResponse =
  paths["/api/context"]["get"]["responses"]["200"]["content"]["application/json"];

export type CoreContextResponse =
  paths["/api/context/core"]["get"]["responses"]["200"]["content"]["application/json"];

export function formatSoul(soul: ContextResponse["soul"]): string {
  return `# Soul\n\n${soul.essence}\nValues: ${soul.values}`;
}

export function formatIdentity(identity: NonNullable<ContextResponse["identity"]>): string {
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

export function formatMemorySection(
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

export function formatRelations(
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

**Recalling**: Use \`soulsys recall\` the way you'd use grep — early and often. If a topic comes up that you might have encountered before, recall. If you're about to make a decision and past experience could help, recall. A quick miss costs nothing; a missed memory that could have helped costs a lot.

Read the soulsys skill before first use for full command syntax.`;
}

export function formatSoulCore(opts: CoreContextResponse): string {
  const sections: string[] = [formatSoul(opts.soul)];
  if (opts.identity) {
    sections.push(formatIdentity(opts.identity));
  }
  return sections.join("\n\n");
}

export function formatCoreContext(opts: CoreContextResponse): string {
  return `${formatSoulCore(opts)}\n\n${formatMemoryInstructions()}\n`;
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
