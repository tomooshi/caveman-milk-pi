// Injection computation: SKILL.md + mode -> cached injection string.
//
// Pure function. No filesystem reads, no Date.now(), no randomness.
// See ADR-015 cache-safety invariants.
//
// Transform pipeline:
//   1. loadSkillContent() reads vendored skill/SKILL.md ONCE at session_start
//   2. computeInjection(mode, content) filters the ruleset to active mode
//   3. Result cached in closure; reused byte-identically every turn
//
// Mode aliases: "wenyan" is canonical label "wenyan-full" in the SKILL
// intensity table.

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import type { CavemanMode, InjectionCache } from "./types.js";

const FRONTMATTER_REGEX = /^---[\s\S]*?---\s*/;
const TABLE_ROW_REGEX = /^\|\s*\*\*(\S+?)\*\*\s*\|/;
const EXAMPLE_LINE_REGEX = /^- (\S+?):\s/;

function getSkillPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..", "skill", "SKILL.md");
}

export function loadSkillContent(): string {
  const skillPath = getSkillPath();
  if (!fs.existsSync(skillPath)) {
    throw new Error(
      `caveman-milk-pi could not load SKILL.md at ${skillPath}. ` +
        `Reinstall the extension or verify skill/SKILL.md exists.`,
    );
  }
  const content = fs.readFileSync(skillPath, "utf8");
  if (content.length === 0) {
    throw new Error(
      `caveman-milk-pi SKILL.md at ${skillPath} is empty. Restore via scripts/sync-skill.sh.`,
    );
  }
  if (!content.includes("## Intensity")) {
    throw new Error(
      `caveman-milk-pi SKILL.md at ${skillPath} is malformed (no "## Intensity" section). ` +
        `Restore via scripts/sync-skill.sh.`,
    );
  }
  return content;
}

function canonicalModeLabel(mode: CavemanMode): string {
  return mode === "wenyan" ? "wenyan-full" : mode;
}

function filterSkillBody(body: string, activeLabel: string): string {
  const lines = body.split("\n");
  const kept = lines.filter((line) => {
    const tableMatch = line.match(TABLE_ROW_REGEX);
    if (tableMatch) {
      // Keep only the active mode's intensity row, drop others
      return tableMatch[1] === activeLabel;
    }
    const exampleMatch = line.match(EXAMPLE_LINE_REGEX);
    if (exampleMatch) {
      // Keep only the active mode's example lines
      return exampleMatch[1] === activeLabel;
    }
    // Everything else (prose, headings, code, blank lines) stays
    return true;
  });
  return kept.join("\n");
}

export function computeInjection(
  mode: CavemanMode,
  skillContent: string,
): InjectionCache {
  if (mode === "off") {
    return { mode, text: "", sourceHash: "" };
  }

  const activeLabel = canonicalModeLabel(mode);
  const body = skillContent.replace(FRONTMATTER_REGEX, "");
  const filtered = filterSkillBody(body, activeLabel);

  const header = `CAVEMAN MODE ACTIVE — level: ${activeLabel}\n\n`;
  const text = "\n\n" + header + filtered;
  const sourceHash = crypto
    .createHash("sha256")
    .update(text)
    .digest("hex")
    .slice(0, 16);

  return { mode, text, sourceHash };
}
