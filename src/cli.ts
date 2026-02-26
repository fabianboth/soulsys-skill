#!/usr/bin/env bun

import { program } from "./program.ts";

await program.parseAsync(process.argv);
