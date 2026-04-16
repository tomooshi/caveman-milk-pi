// Config load/save for pi-caveman.
//
// Transform: ~/.config/pi-caveman.json  ->  CavemanConfig
// Fail loud per ADR-012 — no silent defaults on invalid data.
//
// The "default config when file missing" case is NOT a fallback on
// error. A missing file is a valid first-run state that we write a
// fresh default into. A malformed file IS an error and must crash.

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { CavemanConfig, CavemanMode } from "./types.js";
import { DEFAULT_CONFIG, VALID_MODES } from "./types.js";

const CONFIG_DIR = path.join(os.homedir(), ".config");
const CONFIG_PATH = path.join(CONFIG_DIR, "pi-caveman.json");

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function validateMode(raw: unknown): CavemanMode {
  if (typeof raw !== "string") {
    throw new Error(
      `pi-caveman config: mode must be a string, got ${typeof raw}. ` +
        `Valid modes: ${VALID_MODES.join(", ")}. ` +
        `Delete ${CONFIG_PATH} to reset.`,
    );
  }
  if (!(VALID_MODES as readonly string[]).includes(raw)) {
    throw new Error(
      `pi-caveman config: invalid mode '${raw}'. ` +
        `Valid modes: ${VALID_MODES.join(", ")}. ` +
        `Delete ${CONFIG_PATH} to reset.`,
    );
  }
  return raw as CavemanMode;
}

export function loadConfig(): CavemanConfig {
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
      `pi-caveman config at ${CONFIG_PATH} is not a JSON object. ` +
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
