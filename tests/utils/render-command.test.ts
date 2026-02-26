import { Command } from "commander";

import { renderCommand } from "../../src/utils/render-command.ts";
import { describe, expect, it } from "bun:test";

describe("renderCommand", () => {
  it("renders command with no args or options", () => {
    const cmd = new Command("exists").description("Check if a soul exists");

    expect(renderCommand(cmd)).toBe("### exists\n\nCheck if a soul exists");
  });

  it("renders required argument with angle brackets", () => {
    const cmd = new Command("create-soul")
      .description("Create a new soul")
      .argument("<essence>", "Who you are at the deepest level");

    expect(renderCommand(cmd)).toBe(
      [
        "### create-soul",
        "",
        "Create a new soul",
        "- <essence>: Who you are at the deepest level",
      ].join("\n"),
    );
  });

  it("renders optional argument with square brackets", () => {
    const cmd = new Command("test")
      .description("A test command")
      .argument("[name]", "Optional name");

    expect(renderCommand(cmd)).toBe(
      ["### test", "", "A test command", "- [name]: Optional name"].join("\n"),
    );
  });

  it("renders options and skips --help", () => {
    const cmd = new Command("update-soul")
      .description("Update the soul's essence")
      .requiredOption("--essence <text>", "Who you are at the deepest level");

    const result = renderCommand(cmd);

    expect(result).toContain("- --essence <text>: Who you are at the deepest level");
    expect(result).not.toContain("--help");
  });

  it("includes default values", () => {
    const cmd = new Command("add-memory")
      .description("Add a new memory entry")
      .argument("<content>", "The event to remember")
      .option("--importance <n>", "1-3 routine, 9-10 life-defining", "5");

    const result = renderCommand(cmd);

    expect(result).toContain('- --importance <n>: 1-3 routine, 9-10 life-defining (default: "5")');
  });

  it("renders args and options in order", () => {
    const cmd = new Command("add-relation")
      .description("Add a new relation")
      .argument("<name>", "Entity name")
      .requiredOption("--type <type>", "Entity type: human or agent")
      .requiredOption("--summary <text>", "Relationship summary");

    expect(renderCommand(cmd)).toBe(
      [
        "### add-relation",
        "",
        "Add a new relation",
        "- <name>: Entity name",
        "- --type <type>: Entity type: human or agent",
        "- --summary <text>: Relationship summary",
      ].join("\n"),
    );
  });
});
