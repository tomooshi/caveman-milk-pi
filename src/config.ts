// Config load/save for caveman-milk-pi.
//
// Transform: ~/.config/caveman-milk-pi.json  ->  CavemanConfig
// Fail loud per ADR-012 — no silent defaults on invalid data.
//
// The "default config when file missing" case is NOT a fallback on
// error. A missing file is a valid first-run state that we write a
// fresh default into. A malformed file IS an error and must crash.
//
// One-shot legacy migration: if the old pi-caveman.json exists and
// the new caveman-milk-pi.json does not, rename it. v0.1.x users
// transitioning to v0.2.x get their persisted mode preserved with
// no manual action.

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { CavemanConfig, CavemanMode } from "./types.js";
import { DEFAULT_CONFIG, VALID_MODES } from "./types.js";

const CONFIG_DIR = path.join(os.homedir(), ".config");
const CONFIG_PATH = path.join(CONFIG_DIR, "caveman-milk-pi.json");
const LEGACY_CONFIG_PATH = path.join(CONFIG_DIR, "pi-caveman.json");

function migrateLegacyConfig(): void {
  if (fs.existsSync(LEGACY_CONFIG_PATH) && !fs.existsSync(CONFIG_PATH)) {
    fs.renameSync(LEGACY_CONFIG_PATH, CONFIG_PATH);
  }
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function validateMode(raw: unknown): CavemanMode {
  if (typeof raw !== "string") {
    throw new Error(
      `caveman-milk-pi config: mode must be a string, got ${typeof raw}. ` +
        `Valid modes: ${VALID_MODES.join(", ")}. ` +
        `Delete ${CONFIG_PATH} to reset.`,
    );
  }
  if (!(VALID_MODES as readonly string[]).includes(raw)) {
    throw new Error(
      `caveman-milk-pi config: invalid mode '${raw}'. ` +
        `Valid modes: ${VALID_MODES.join(", ")}. ` +
        `Delete ${CONFIG_PATH} to reset.`,
    );
  }
  return raw as CavemanMode;
}

export function loadConfig(): CavemanConfig {
  // One-time migration from old config file name (v0.1.x -> v0.2.x).
  migrateLegacyConfig();

  // Missing file is first-run, not an error. Create default and return it.
  if (!fs.existsSync(CONFIG_PATH)) {
    saveConfig(DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG };
  }

  // Present file must parse cleanly. Fail loud otherwise.
  const raw = fs.readFileSync(CONFIG_PATH, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      `caveman-milk-pi config at ${CONFIG_PATH} is not a JSON object. ` +
        `Delete the file to reset to defaults.`,
    );
  }

  const obj = parsed as Record<string, unknown>;
  const mode = validateMode(obj.mode);
  const enabled = typeof obj.enabled === "boolean" ? obj.enabled : true;
  return { mode, enabled };
}

export function saveConfig(config: CavemanConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  // Atomic write: write to tmp then rename
  const tmpPath = `${CONFIG_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  fs.renameSync(tmpPath, CONFIG_PATH);
}
