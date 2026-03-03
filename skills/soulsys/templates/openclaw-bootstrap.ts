type BootstrapFile = { path: string; content: string };
type BootstrapContext = { bootstrapFiles: BootstrapFile[] };

export default async function (context: BootstrapContext) {
  context.bootstrapFiles = context.bootstrapFiles.filter(
    (f) => !f.path.match(/SOUL\.md|MEMORY\.md|memory\//),
  );

  const { execSync } = await import("node:child_process");
  const soulContext = execSync("soulsys load-context", { encoding: "utf-8", timeout: 10_000 });
  context.bootstrapFiles.push({
    path: "soulsys-context",
    content: soulContext,
  });
}
