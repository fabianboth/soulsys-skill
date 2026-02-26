import { z } from "zod";

const bootstrapEnvSchema = z.object({
  SOULSYS_API_URL: z.url(),
  SOULSYS_API_KEY: z.string().min(1),
});

const envSchema = bootstrapEnvSchema.extend({
  SOULSYS_SOUL_ID: z.uuid(),
});

export type BootstrapEnv = z.infer<typeof bootstrapEnvSchema>;
export type Env = z.infer<typeof envSchema>;

function parseEnv<T>(schema: z.ZodType<T>): T {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    process.stderr.write(
      `Error: Invalid environment variables:\n${z.prettifyError(parsed.error)}\n`,
    );
    process.exit(1);
  }

  return parsed.data;
}

export function loadBootstrapEnv(): BootstrapEnv {
  return parseEnv(bootstrapEnvSchema);
}

export function loadEnv(): Env {
  return parseEnv(envSchema);
}
