// Flat data types for caveman-milk-pi. No classes, no methods.
// See ADR-015 — these shapes are part of the cache-safety invariants.

export type CavemanMode =
  | "off"
  | "lite"
  | "full"
  | "ultra"
  | "wenyan-lite"
  | "wenyan"
  | "wenyan-ultra";

export const VALID_MODES: readonly CavemanMode[] = [
  "off",
  "lite",
  "full",
  "ultra",
  "wenyan-lite",
  "wenyan",
  "wenyan-ultra",
] as const;

export interface CavemanConfig {
  mode: CavemanMode;
  enabled: boolean;
}

export interface InjectionCache {
  mode: CavemanMode;
  text: string;
  sourceHash: string;
}

export const DEFAULT_CONFIG: CavemanConfig = {
  mode: "off",
  enabled: true,
};
