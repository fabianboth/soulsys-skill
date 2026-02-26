import { loadBootstrapEnv, loadEnv } from "./env.ts";

export type BootstrapConfig = {
  apiUrl: string;
  apiKey: string;
};

export type ApiConfig = BootstrapConfig & {
  soulId: string;
};

export function resolveBootstrapConfig(): BootstrapConfig {
  const env = loadBootstrapEnv();
  return { apiUrl: env.SOULSYS_API_URL, apiKey: env.SOULSYS_API_KEY };
}

export function resolveApiConfig(): ApiConfig {
  const env = loadEnv();
  return {
    apiUrl: env.SOULSYS_API_URL,
    soulId: env.SOULSYS_SOUL_ID,
    apiKey: env.SOULSYS_API_KEY,
  };
}
