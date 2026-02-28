import * as v from "valibot";

const bootstrapEnvSchema = v.object({
  SOULSYS_API_URL: v.pipe(v.string(), v.url()),
  SOULSYS_API_KEY: v.pipe(v.string(), v.minLength(1)),
});

const envSchema = v.object({
  ...bootstrapEnvSchema.entries,
  SOULSYS_SOUL_ID: v.pipe(v.string(), v.uuid()),
});

export type BootstrapEnv = v.InferOutput<typeof bootstrapEnvSchema>;
export type Env = v.InferOutput<typeof envSchema>;

function parseEnv<T>(schema: v.GenericSchema<unknown, T>): T {
  const parsed = v.safeParse(schema, process.env);

  if (!parsed.success) {
    const flat = v.flatten(parsed.issues);
    const lines = Object.entries(flat.nested ?? {}).map(
      ([key, issues]) => `  ${key}: ${issues?.join(", ")}`,
    );
    process.stderr.write(`Error: Invalid environment variables:\n${lines.join("\n")}\n`);
    process.exit(1);
  }

  return parsed.output;
}

export function loadBootstrapEnv(): BootstrapEnv {
  return parseEnv(bootstrapEnvSchema);
}

export function loadEnv(): Env {
  return parseEnv(envSchema);
}
