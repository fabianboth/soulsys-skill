import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import * as v from "valibot";

import { CONFIG_FILE_NAME, DASHBOARD_URL, DEFAULT_API_URL } from "./constants.ts";

const configFileSchema = v.object({
  apiKey: v.pipe(v.string(), v.minLength(1)),
  apiUrl: v.optional(v.pipe(v.string(), v.url())),
});

export type Config = {
  apiUrl: string;
  apiKey: string;
};

export function findConfigDir(): string | null {
  return process.env.SOULSYS_CONFIG_DIR || null;
}

export function readConfig(configDir: string): v.InferOutput<typeof configFileSchema> | null {
  const configPath = join(configDir, CONFIG_FILE_NAME);
  if (!existsSync(configPath)) return null;

  try {
    const raw = JSON.parse(readFileSync(configPath, "utf-8"));
    const result = v.safeParse(configFileSchema, raw);
    if (!result.success) {
      process.stderr.write(`Warning: Invalid config at ${configPath}\n`);
      return null;
    }
    return result.output;
  } catch {
    return null;
  }
}

export function writeConfig(configDir: string, config: { apiKey: string; apiUrl?: string }): void {
  mkdirSync(configDir, { recursive: true });
  const configPath = join(configDir, CONFIG_FILE_NAME);
  const data: Record<string, string> = { apiKey: config.apiKey };
  if (config.apiUrl && config.apiUrl !== DEFAULT_API_URL) {
    data.apiUrl = config.apiUrl;
  }
  writeFileSync(configPath, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
}

export function resolveConfig(): Config {
  const envApiKey = process.env.SOULSYS_API_KEY;
  const envApiUrl = process.env.SOULSYS_API_URL;

  if (envApiKey) {
    return {
      apiKey: envApiKey,
      apiUrl: envApiUrl || DEFAULT_API_URL,
    };
  }

  const configDir = findConfigDir();
  if (configDir) {
    const fileConfig = readConfig(configDir);
    if (fileConfig) {
      return {
        apiKey: fileConfig.apiKey,
        apiUrl: envApiUrl || fileConfig.apiUrl || DEFAULT_API_URL,
      };
    }
  }

  process.stderr.write(onboardingMessage());
  process.exit(1);
}

export function onboardingMessage(): string {
  return `Soulsys is not configured yet.

To get started:
  1. Create a soul at ${DASHBOARD_URL}
  2. Generate an API key from your dashboard
  3. Run: soulsys init --api-key <your-key>
`;
}
