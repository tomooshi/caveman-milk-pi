// Real-data tests per DOD rule #14.
// No fixtures — run against the actual vendored skill/SKILL.md.

import { describe, it, expect } from "vitest";
import {
  loadSkillContent,
  computeInjection,
} from "../src/injection.js";
import { validateMode } from "../src/config.js";
import { VALID_MODES } from "../src/types.js";

describe("loadSkillContent", () => {
  it("loads the vendored SKILL.md", () => {
    const content = loadSkillContent();
    expect(content.length).toBeGreaterThan(1000);
    expect(content).toContain("## Intensity");
    expect(content).toContain("## Document Exemption");
  });
});

describe("computeInjection determinism (cache-safety invariant #1)", () => {
  const content = loadSkillContent();

  for (const mode of VALID_MODES) {
    it(`mode=${mode}: same input produces same output`, () => {
      const a = computeInjection(mode, content);
      const b = computeInjection(mode, content);
      expect(a.text).toBe(b.text);
      expect(a.sourceHash).toBe(b.sourceHash);
    });
  }

  it("10-turn stability: hash identical across many calls", () => {
    const hashes = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const result = computeInjection("full", content);
      hashes.add(result.sourceHash);
    }
    expect(hashes.size).toBe(1);
  });
});

describe("computeInjection mode filtering", () => {
  const content = loadSkillContent();

  it("off mode produces empty text (zero-cost skip)", () => {
    const result = computeInjection("off", content);
    expect(result.text).toBe("");
    expect(result.sourceHash).toBe("");
  });

  it("full mode includes full row, excludes ultra row", () => {
    const result = computeInjection("full", content);
    expect(result.text).toContain("| **full** |");
    expect(result.text).not.toContain("| **ultra** |");
    expect(result.text).not.toContain("| **lite** |");
  });

  it("ultra mode includes ultra row, excludes full row", () => {
    const result = computeInjection("ultra", content);
    expect(result.text).toContain("| **ultra** |");
    expect(result.text).not.toContain("| **full** |");
  });

  it("wenyan alias resolves to wenyan-full", () => {
    const result = computeInjection("wenyan", content);
    expect(result.text).toContain("| **wenyan-full** |");
    expect(result.text).not.toContain("| **wenyan-lite** |");
    expect(result.text).not.toContain("| **wenyan-ultra** |");
  });

  it("Document Exemption section present in every non-off mode", () => {
    const modes: ReadonlyArray<"lite" | "full" | "ultra" | "wenyan"> = [
      "lite",
      "full",
      "ultra",
      "wenyan",
    ];
    for (const mode of modes) {
      const result = computeInjection(mode, content);
      expect(result.text, `mode=${mode}`).toContain("## Document Exemption");
    }
  });

  it("header line includes canonical mode label", () => {
    const full = computeInjection("full", content);
    expect(full.text).toContain("CAVEMAN MODE ACTIVE — level: full");
    const wenyan = computeInjection("wenyan", content);
    expect(wenyan.text).toContain("CAVEMAN MODE ACTIVE — level: wenyan-full");
  });
});

describe("validateMode (fail-loud per ADR-012)", () => {
  it("accepts all valid modes", () => {
    for (const mode of VALID_MODES) {
      expect(validateMode(mode)).toBe(mode);
    }
  });

  it("throws on unknown mode with valid list in message", () => {
    expect(() => validateMode("bogus")).toThrow(/invalid mode 'bogus'/);
    expect(() => validateMode("bogus")).toThrow(/off, lite, full/);
  });

  it("throws on non-string input", () => {
    expect(() => validateMode(42)).toThrow(/must be a string/);
    expect(() => validateMode(null)).toThrow(/must be a string/);
    expect(() => validateMode(undefined)).toThrow(/must be a string/);
  });
});
