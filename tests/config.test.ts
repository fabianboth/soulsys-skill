import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { onboardingMessage, readConfig, resolveConfig, writeConfig } from "../src/config.ts";
import { CONFIG_FILE_NAME, DASHBOARD_URL, DEFAULT_API_URL } from "../src/constants.ts";
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";

const TEST_DIR = join(tmpdir(), `soulsys-config-test-${Date.now()}`);
const CONFIG_DIR = join(TEST_DIR, "skill-dir");

function setup() {
  mkdirSync(CONFIG_DIR, { recursive: true });
}

function teardown() {
  rmSync(TEST_DIR, { recursive: true, force: true });
}

describe("readConfig", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("returns null when config file does not exist", () => {
    expect(readConfig(CONFIG_DIR)).toBeNull();
  });

  it("parses valid config with apiKey only", () => {
    writeFileSync(join(CONFIG_DIR, CONFIG_FILE_NAME), JSON.stringify({ apiKey: "test-key" }));
    const config = readConfig(CONFIG_DIR);
    expect(config).toEqual({ apiKey: "test-key" });
  });

  it("parses valid config with apiKey and apiUrl", () => {
    writeFileSync(
      join(CONFIG_DIR, CONFIG_FILE_NAME),
      JSON.stringify({ apiKey: "test-key", apiUrl: "https://custom.api/api" }),
    );
    const config = readConfig(CONFIG_DIR);
    expect(config).toEqual({ apiKey: "test-key", apiUrl: "https://custom.api/api" });
  });

  it("returns null for corrupted JSON", () => {
    writeFileSync(join(CONFIG_DIR, CONFIG_FILE_NAME), "not-json");
    expect(readConfig(CONFIG_DIR)).toBeNull();
  });

  it("returns null for invalid schema", () => {
    writeFileSync(join(CONFIG_DIR, CONFIG_FILE_NAME), JSON.stringify({ wrong: "field" }));
    const stderrSpy = spyOn(process.stderr, "write").mockImplementation(() => true);
    expect(readConfig(CONFIG_DIR)).toBeNull();
    expect(stderrSpy).toHaveBeenCalled();
    stderrSpy.mockRestore();
  });
});

describe("writeConfig", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("writes config file with apiKey only (default URL omitted)", () => {
    writeConfig(CONFIG_DIR, { apiKey: "test-key" });
    const config = readConfig(CONFIG_DIR);
    expect(config).toEqual({ apiKey: "test-key" });
  });

  it("writes config file with custom apiUrl", () => {
    writeConfig(CONFIG_DIR, { apiKey: "test-key", apiUrl: "https://custom.api/api" });
    const config = readConfig(CONFIG_DIR);
    expect(config).toEqual({ apiKey: "test-key", apiUrl: "https://custom.api/api" });
  });

  it("omits apiUrl when it matches default", () => {
    writeConfig(CONFIG_DIR, { apiKey: "test-key", apiUrl: DEFAULT_API_URL });
    const raw = JSON.parse(readFileSync(join(CONFIG_DIR, CONFIG_FILE_NAME), "utf-8"));
    expect(raw.apiUrl).toBeUndefined();
  });

  it("creates directory if it does not exist", () => {
    const newDir = join(TEST_DIR, "new-dir");
    writeConfig(newDir, { apiKey: "test-key" });
    expect(existsSync(join(newDir, CONFIG_FILE_NAME))).toBe(true);
  });
});

describe("resolveConfig", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("resolves from env vars (priority 1)", () => {
    process.env.SOULSYS_API_KEY = "env-key";
    process.env.SOULSYS_API_URL = "https://env.api/api";
    const config = resolveConfig();
    expect(config).toEqual({ apiKey: "env-key", apiUrl: "https://env.api/api" });
  });

  it("uses default URL when only SOULSYS_API_KEY is set", () => {
    process.env.SOULSYS_API_KEY = "env-key";
    delete process.env.SOULSYS_API_URL;
    const config = resolveConfig();
    expect(config).toEqual({ apiKey: "env-key", apiUrl: DEFAULT_API_URL });
  });

  it("exits with onboarding message when no config found", () => {
    delete process.env.SOULSYS_API_KEY;
    delete process.env.SOULSYS_API_URL;
    process.env.SOULSYS_CONFIG_DIR = join(TEST_DIR, "nonexistent-config-dir");
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
    const stderrSpy = spyOn(process.stderr, "write").mockImplementation(() => true);
    expect(() => resolveConfig()).toThrow("process.exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
    const output = stderrSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain("Soulsys is not configured yet");
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
  });
});

describe("onboardingMessage", () => {
  it("contains setup instructions", () => {
    const msg = onboardingMessage();
    expect(msg).toContain("soulsys init --api-key");
    expect(msg).toContain(DASHBOARD_URL);
  });
});
