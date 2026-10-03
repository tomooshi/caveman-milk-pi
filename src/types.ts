// Flat data types for caveman-milk-pi. No classes, no methods.
// See ADR-015 — these shapes are part of the cache-safety invariants.

export type CavemanMode =
  | "off"
  | "lite"
  | "full"
  | "ultra"
  | "wenyan-lite"
  | "wenyan"
  | "wenyan-ultra"
  // STE-lite: clear full sentences (ASD-STE100, ~80%); its own rules file, not a caveman level.
  | "ste";

export const VALID_MODES: readonly CavemanMode[] = [
  "off",
  "lite",
  "full",
  "ultra",
  "wenyan-lite",
  "wenyan",
  "wenyan-ultra",
  "ste",
] as const;

export interface CavemanConfig {
  mode: CavemanMode;
  enabled: boolean;
  /** Publish mode to pi footer via ctx.ui.setStatus. Orthogonal to `mode`. */
  showStatus: boolean;
}

export interface InjectionCache {
  mode: CavemanMode;
  text: string;
  sourceHash: string;
}

export const DEFAULT_CONFIG: CavemanConfig = {
  mode: "off",
  enabled: true,
  showStatus: true,
};
