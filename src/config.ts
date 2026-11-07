// Config load/save for caveman-milk-pi.
//
// Transform: <agent dir>/caveman-milk-pi.json  ->  CavemanConfig
// Fail loud per ADR-012 — no silent defaults on invalid data.
//
// The "default config when file missing" case is NOT a fallback on
// error. A missing file is a valid first-run state that we write a
// fresh default into. A malformed file IS an error and must crash.
//
// The config lives in pi's agent dir (PI_CODING_AGENT_DIR, default
// ~/.pi/agent) so it follows the same installation as the extension.
//
// One-shot legacy migration: pre-0.4.0 releases stored the config in
// ~/.config. If a legacy file (pi-caveman.json or caveman-milk-pi.json)
// exists there and the agent-dir config does not, rename it. Users
// transitioning get their persisted mode preserved with no manual action.

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { CavemanConfig, CavemanMode } from "./types.js";
import { DEFAULT_CONFIG, VALID_MODES } from "./types.js";

function agentDir(): string {
  return process.env.PI_CODING_AGENT_DIR || path.join(os.homedir(), ".pi", "agent");
}

function legacyConfigPath(): string | null {
  const legacyDir = path.join(os.homedir(), ".config");
  const v02 = path.join(legacyDir, "caveman-milk-pi.json");
  if (fs.existsSync(v02)) return v02;
  const v01 = path.join(legacyDir, "pi-caveman.json");
  if (fs.existsSync(v01)) return v01;
  return null;
}

function migrateLegacyConfig(): void {
  const legacy = legacyConfigPath();
  if (legacy && !fs.existsSync(getConfigPath())) {
    fs.mkdirSync(agentDir(), { recursive: true });
    fs.renameSync(legacy, getConfigPath());
  }
}

export function getConfigPath(): string {
  return path.join(agentDir(), "caveman-milk-pi.json");
}

export function validateMode(raw: unknown): CavemanMode {
  if (typeof raw !== "string") {
    throw new Error(
      `caveman-milk-pi config: mode must be a string, got ${typeof raw}. ` +
        `Valid modes: ${VALID_MODES.join(", ")}. ` +
        `Delete ${getConfigPath()} to reset.`,
    );
  }
  if (!(VALID_MODES as readonly string[]).includes(raw)) {
    throw new Error(
      `caveman-milk-pi config: invalid mode '${raw}'. ` +
        `Valid modes: ${VALID_MODES.join(", ")}. ` +
        `Delete ${getConfigPath()} to reset.`,
    );
  }
  return raw as CavemanMode;
}

export function loadConfig(): CavemanConfig {
  // One-time migration from old config file name (v0.1.x -> v0.2.x).
  migrateLegacyConfig();

  // Missing file is first-run, not an error. Create default and return it.
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    saveConfig(DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG };
  }

  // Present file must parse cleanly. Fail loud otherwise.
  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      `caveman-milk-pi config at ${configPath} is not a JSON object. ` +
        `Delete the file to reset to defaults.`,
    );
  }

  const obj = parsed as Record<string, unknown>;
  const mode = validateMode(obj.mode);
  const enabled = typeof obj.enabled === "boolean" ? obj.enabled : true;
  const showStatus = typeof obj.showStatus === "boolean" ? obj.showStatus : true;
  return { mode, enabled, showStatus };
}

export function saveConfig(config: CavemanConfig): void {
  const configPath = getConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  // Atomic write: write to tmp then rename
  const tmpPath = `${configPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  fs.renameSync(tmpPath, configPath);
}
