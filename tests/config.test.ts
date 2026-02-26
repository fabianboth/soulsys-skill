import { resolveApiConfig, resolveBootstrapConfig } from "../src/config.ts";
import { loadBootstrapEnv, loadEnv } from "../src/env.ts";
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";

describe("loadEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.SOULSYS_API_URL = "http://localhost:3000/api";
    process.env.SOULSYS_SOUL_ID = "550e8400-e29b-41d4-a716-446655440000";
    process.env.SOULSYS_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns validated env when all vars are set", () => {
    const env = loadEnv();
    expect(env).toEqual({
      SOULSYS_API_URL: "http://localhost:3000/api",
      SOULSYS_SOUL_ID: "550e8400-e29b-41d4-a716-446655440000",
      SOULSYS_API_KEY: "test-key",
    });
  });

  it("exits when SOULSYS_API_URL is missing", () => {
    delete process.env.SOULSYS_API_URL;
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
    const stderrSpy = spyOn(process.stderr, "write").mockImplementation(() => true);
    expect(() => loadEnv()).toThrow("process.exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it("exits when SOULSYS_SOUL_ID is not a UUID", () => {
    process.env.SOULSYS_SOUL_ID = "not-a-uuid";
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
    const stderrSpy = spyOn(process.stderr, "write").mockImplementation(() => true);
    expect(() => loadEnv()).toThrow("process.exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it("exits when SOULSYS_API_KEY is empty", () => {
    process.env.SOULSYS_API_KEY = "";
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
    const stderrSpy = spyOn(process.stderr, "write").mockImplementation(() => true);
    expect(() => loadEnv()).toThrow("process.exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it("writes error details to stderr on failure", () => {
    delete process.env.SOULSYS_API_URL;
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
    const stderrSpy = spyOn(process.stderr, "write").mockImplementation(() => true);
    try {
      loadEnv();
    } catch {
      // expected
    }
    expect(stderrSpy).toHaveBeenCalled();
    const output = stderrSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain("Invalid environment variables");
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
  });
});

describe("loadBootstrapEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.SOULSYS_API_URL = "http://localhost:3000/api";
    process.env.SOULSYS_API_KEY = "test-key";
    delete process.env.SOULSYS_SOUL_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns validated env without requiring SOULSYS_SOUL_ID", () => {
    const env = loadBootstrapEnv();
    expect(env).toEqual({
      SOULSYS_API_URL: "http://localhost:3000/api",
      SOULSYS_API_KEY: "test-key",
    });
  });

  it("exits when SOULSYS_API_URL is missing", () => {
    delete process.env.SOULSYS_API_URL;
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
    const stderrSpy = spyOn(process.stderr, "write").mockImplementation(() => true);
    expect(() => loadBootstrapEnv()).toThrow("process.exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it("exits when SOULSYS_API_KEY is empty", () => {
    process.env.SOULSYS_API_KEY = "";
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
    const stderrSpy = spyOn(process.stderr, "write").mockImplementation(() => true);
    expect(() => loadBootstrapEnv()).toThrow("process.exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
  });
});

describe("resolveApiConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.SOULSYS_API_URL = "http://localhost:3000/api";
    process.env.SOULSYS_SOUL_ID = "550e8400-e29b-41d4-a716-446655440000";
    process.env.SOULSYS_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns ApiConfig with mapped keys", () => {
    const config = resolveApiConfig();
    expect(config).toEqual({
      apiUrl: "http://localhost:3000/api",
      soulId: "550e8400-e29b-41d4-a716-446655440000",
      apiKey: "test-key",
    });
  });
});

describe("resolveBootstrapConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.SOULSYS_API_URL = "http://localhost:3000/api";
    process.env.SOULSYS_API_KEY = "test-key";
    delete process.env.SOULSYS_SOUL_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns BootstrapConfig without soulId", () => {
    const config = resolveBootstrapConfig();
    expect(config).toEqual({
      apiUrl: "http://localhost:3000/api",
      apiKey: "test-key",
    });
  });
});
