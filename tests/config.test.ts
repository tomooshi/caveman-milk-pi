import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

let HOME: string;

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return { ...actual, homedir: () => HOME };
});

async function importConfig() {
  return await import("../src/config.js");
}

beforeEach(() => {
  HOME = fs.mkdtempSync(path.join(os.tmpdir(), "caveman-test-"));
  delete process.env.PI_CODING_AGENT_DIR;
});

afterEach(() => {
  fs.rmSync(HOME, { recursive: true, force: true });
  delete process.env.PI_CODING_AGENT_DIR;
});

describe("config path resolution", () => {
  it("honors PI_CODING_AGENT_DIR", async () => {
    const dir = path.join(HOME, "custom-agent");
    process.env.PI_CODING_AGENT_DIR = dir;
    const { getConfigPath, loadConfig } = await importConfig();
    expect(getConfigPath()).toBe(path.join(dir, "caveman-milk-pi.json"));
    expect(loadConfig()).toEqual({ mode: "off", enabled: true, showStatus: true });
    expect(fs.existsSync(path.join(dir, "caveman-milk-pi.json"))).toBe(true);
  });

  it("defaults to ~/.pi/agent", async () => {
    const { getConfigPath } = await importConfig();
    expect(getConfigPath()).toBe(path.join(HOME, ".pi", "agent", "caveman-milk-pi.json"));
  });
});

describe("legacy migration", () => {
  it("renames ~/.config/caveman-milk-pi.json into the agent dir", async () => {
    const legacy = path.join(HOME, ".config", "caveman-milk-pi.json");
    fs.mkdirSync(path.dirname(legacy), { recursive: true });
    fs.writeFileSync(legacy, JSON.stringify({ mode: "ultra", enabled: false, showStatus: false }));
    const { loadConfig, getConfigPath } = await importConfig();
    expect(loadConfig()).toEqual({ mode: "ultra", enabled: false, showStatus: false });
    expect(fs.existsSync(getConfigPath())).toBe(true);
    expect(fs.existsSync(legacy)).toBe(false);
  });

  it("renames ~/.config/pi-caveman.json (v0.1.x) into the agent dir", async () => {
    const legacy = path.join(HOME, ".config", "pi-caveman.json");
    fs.mkdirSync(path.dirname(legacy), { recursive: true });
    fs.writeFileSync(legacy, JSON.stringify({ mode: "lite" }));
    const { loadConfig, getConfigPath } = await importConfig();
    expect(loadConfig()).toEqual({ mode: "lite", enabled: true, showStatus: true });
    expect(fs.existsSync(getConfigPath())).toBe(true);
    expect(fs.existsSync(legacy)).toBe(false);
  });

  it("does not overwrite an existing agent-dir config", async () => {
    const agentDir = path.join(HOME, ".pi", "agent");
    fs.mkdirSync(agentDir, { recursive: true });
    const current = path.join(agentDir, "caveman-milk-pi.json");
    fs.writeFileSync(current, JSON.stringify({ mode: "ste", enabled: true, showStatus: true }));
    const legacy = path.join(HOME, ".config", "caveman-milk-pi.json");
    fs.mkdirSync(path.dirname(legacy), { recursive: true });
    fs.writeFileSync(legacy, JSON.stringify({ mode: "ultra" }));
    const { loadConfig } = await importConfig();
    expect(loadConfig().mode).toBe("ste");
    expect(fs.existsSync(legacy)).toBe(true);
  });
});
