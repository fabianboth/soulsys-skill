import type { Command } from "commander";

import { createApiClient, requireData } from "../client/client.ts";
import { resolveConfig } from "../config.ts";
import { formatContext, formatCoreContext } from "../context/format.ts";
import { handleError } from "../output.ts";

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
