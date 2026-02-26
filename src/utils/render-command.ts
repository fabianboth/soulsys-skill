import type { Command } from "commander";

export function renderCommand(cmd: Command): string {
  const lines: string[] = [cmd.description()];

  for (const arg of cmd.registeredArguments) {
    const bracket = arg.required ? `<${arg.name()}>` : `[${arg.name()}]`;
    lines.push(`- ${bracket}: ${arg.description}`);
  }

  for (const opt of cmd.options) {
    if (opt.flags.includes("--help")) continue;
    let line = `- ${opt.flags}: ${opt.description}`;
    if (opt.defaultValue !== undefined) line += ` (default: ${JSON.stringify(opt.defaultValue)})`;
    lines.push(line);
  }

  return `### ${cmd.name()}\n\n${lines.join("\n")}`;
}
