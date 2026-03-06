import { resolve } from "node:path";

const dir = import.meta.dirname;
const pkg = await Bun.file(resolve(dir, "..", "package.json")).json();

const expectedVersion = (await Bun.file(resolve(dir, "..", ".bun-version")).text()).trim();
const actualVersion = Bun.version;
if (actualVersion !== expectedVersion) {
  console.error(
    `Bun version mismatch: expected ${expectedVersion} (from .bun-version), got ${actualVersion}.\n` +
      `Minified output differs across versions. Please install the correct version.`,
  );
  process.exit(1);
}

const result = await Bun.build({
  entrypoints: [resolve(dir, "..", "src", "cli.ts")],
  outdir: resolve(dir, "..", "skills", "soulsys", "scripts"),
  naming: "soulsys.mjs",
  target: "node",
  format: "esm",
  minify: true,
  define: {
    SOULSYS_VERSION: JSON.stringify(pkg.version),
  },
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

const output = result.outputs[0];
const sizeKB = (output.size / 1024).toFixed(2);
console.log(`Bundled ${result.outputs.length} file(s) — soulsys.mjs ${sizeKB} KB`);
