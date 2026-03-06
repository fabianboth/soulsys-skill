import type { paths } from "../client/generated/api.d.ts";

export type ContextResponse =
  paths["/api/context"]["get"]["responses"]["200"]["content"]["application/json"];

export type CoreContextResponse =
  paths["/api/context/core"]["get"]["responses"]["200"]["content"]["application/json"];

export const CONTEXT_PREAMBLE = "This is who you are.";

export function formatSoul(soul: ContextResponse["soul"]): string {
  return `# Soul\n\n${soul.essence}\nValues: ${soul.values}`;
}

export function formatIdentity(identity: NonNullable<ContextResponse["identity"]>): string {
  const lines: string[] = ["## Identity", ""];
  lines.push(`Name: ${identity.name}`);
  if (identity.creature) {
    lines.push(`Creature: ${identity.creature}`);
  }
  lines.push(`Vibe: ${identity.vibe}`);
  if (identity.communicationStyle) {
    lines.push(`Communication: ${identity.communicationStyle}`);
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
    const full = m.hasFullContent ? " [hasFullContent]" : "";
    lines.push(`- \`${m.id}\`${full} ${m.content}`);
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

export function formatMemoryGuide(prefix = ""): string {
  const cmd = (name: string) => (prefix ? `${prefix} ${name}` : name);
  return `Your long-term memory — use it constantly. Save in the moment, recall before you assume, forget when things go stale.

**\`${cmd("remember")}\`** — Save anything you'd want to know next time. Lessons, preferences, context about people, decisions, opinions, anything you picked up. When in doubt, remember it — low-importance memories are cheap, missed memories are not.

**\`${cmd("recall")}\`** — Search before you assume. If a topic comes up, recall. If you're about to decide something, recall. Run it via a subagent so it doesn't break your flow. A quick miss costs nothing.

**\`${cmd("forget")}\`** — When you spot something wrong, outdated, or superseded — forget it immediately. A clean memory is worth more than a complete one.`;
}

export function formatMemoryInstructions(): string {
  return `## Soulsys — Your Memory Skill

${formatMemoryGuide("soulsys")}

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
  const sections: string[] = [CONTEXT_PREAMBLE, formatSoulCore(opts), formatMemoryInstructions()];
  return `${sections.join("\n\n")}\n`;
}

export function formatContext(opts: ContextResponse): string {
  const sections: string[] = [CONTEXT_PREAMBLE, formatSoul(opts.soul)];

  if (opts.identity) {
    sections.push(formatIdentity(opts.identity));
  }

  if (opts.memory) {
    const keySection = formatMemorySection("## Key Memories", opts.memory.keyMemories);
    if (keySection) sections.push(keySection);
    const recentSection = formatMemorySection("## Recent Memories", opts.memory.recentMemories);
    if (recentSection) sections.push(recentSection);
    const journalSection = formatMemorySection("## Recent Sessions", opts.memory.recentJournals);
    if (journalSection) sections.push(journalSection);
  }

  if (opts.relations) {
    const relSection = formatRelations(opts.relations.relations);
    if (relSection) sections.push(relSection);
  }

  sections.push(formatMemoryInstructions());

  return `${sections.join("\n\n")}\n`;
}
