import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Command } from "commander";

import { register as registerAddMemory } from "./commands/add-memory.ts";
import { register as registerAddMemoryFile } from "./commands/add-memory-file.ts";
import { register as registerAddRelation } from "./commands/add-relation.ts";
import { register as registerCreateIdentity } from "./commands/create-identity.ts";
import { register as registerDetectFramework } from "./commands/detect-framework.ts";
import { register as registerExtractMemories } from "./commands/extract-memories.ts";
import { register as registerInit } from "./commands/init.ts";
import { register as registerLoadContext } from "./commands/load-context.ts";
import { register as registerSearchMemory } from "./commands/search-memory.ts";
import { register as registerUpdateIdentity } from "./commands/update-identity.ts";
import { register as registerUpdateRelation } from "./commands/update-relation.ts";
import { register as registerUpdateSoul } from "./commands/update-soul.ts";

declare const SOULSYS_VERSION: string;

function resolveVersion(): string {
  if (typeof SOULSYS_VERSION !== "undefined") return SOULSYS_VERSION;
  try {
    return JSON.parse(readFileSync(resolve(import.meta.dirname, "..", "package.json"), "utf-8"))
      .version;
  } catch {
    return "0.0.0-dev";
  }
}

const version = resolveVersion();

export const program = new Command();

program.name("soulsys").version(version, "-v, --version").description("Soul System CLI");

export const detectFrameworkCmd = registerDetectFramework(program);
export const initCmd = registerInit(program);
export const updateSoulCmd = registerUpdateSoul(program);
export const createIdentityCmd = registerCreateIdentity(program);
export const updateIdentityCmd = registerUpdateIdentity(program);
export const addMemoryCmd = registerAddMemory(program);
export const addMemoryFileCmd = registerAddMemoryFile(program);
export const addRelationCmd = registerAddRelation(program);
export const updateRelationCmd = registerUpdateRelation(program);
export const extractMemoriesCmd = registerExtractMemories(program);
export const loadContextCmd = registerLoadContext(program);
export const searchMemoryCmd = registerSearchMemory(program);
