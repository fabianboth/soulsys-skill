import { ApiError, NetworkError } from "./client/errors.ts";

export function confirm(message: string): void {
  process.stdout.write(`${message}\n`);
}

export function handleError(error: unknown): never {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      process.stderr.write("Error: Not found\n");
    } else if (error.status === 400) {
      const details = error.details ? `: ${JSON.stringify(error.details)}` : "";
      process.stderr.write(`Error: Validation error${details}\n`);
    } else if (error.status === 401) {
      process.stderr.write(
        "Error: Authentication failed. Run `soulsys init --api-key <key>` to connect to a soul.\n",
      );
    } else {
      process.stderr.write(`Error: ${error.message}\n`);
    }
  } else if (error instanceof NetworkError) {
    process.stderr.write(`Error: ${error.message}\n`);
  } else if (error instanceof Error) {
    process.stderr.write(`Error: ${error.message}\n`);
  } else {
    process.stderr.write(`Error: ${String(error)}\n`);
  }
  process.exit(1);
}
