import { parseImportance } from "../src/utils/parse-importance.ts";
import { describe, expect, test } from "bun:test";

describe("parseImportance", () => {
  test("parses valid integer", () => {
    expect(parseImportance("7")).toBe(7);
  });

  test("parses boundary values", () => {
    expect(parseImportance("1")).toBe(1);
    expect(parseImportance("10")).toBe(10);
  });

  test("throws for zero", () => {
    expect(() => parseImportance("0")).toThrow("Importance must be an integer between 1 and 10");
  });

  test("throws for value above 10", () => {
    expect(() => parseImportance("11")).toThrow("Importance must be an integer between 1 and 10");
  });

  test("throws for float", () => {
    expect(() => parseImportance("5.5")).toThrow("Importance must be an integer between 1 and 10");
  });

  test("throws for non-numeric string", () => {
    expect(() => parseImportance("abc")).toThrow("Importance must be an integer between 1 and 10");
  });

  test("throws for empty string", () => {
    expect(() => parseImportance("")).toThrow("Importance must be an integer between 1 and 10");
  });
});
