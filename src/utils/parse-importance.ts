export function parseImportance(value: string): number {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 10) {
    throw new Error("Importance must be an integer between 1 and 10");
  }
  return num;
}
