# Credits

## caveman upstream

caveman-milk-pi is a pi-native port of caveman by Julius Brussee.

- **Project:** caveman
- **Author:** Julius Brussee ([@JuliusBrussee](https://github.com/JuliusBrussee))
- **Repository:** https://github.com/JuliusBrussee/caveman
- **License:** MIT
- **Used from:** `skills/caveman/SKILL.md` — the canonical caveman ruleset

The ruleset text, intensity levels (lite/full/ultra + wenyan variants),
auto-clarity exemptions, and behavior examples are Julius's work. This
extension ports that ruleset into pi's extension system with cache-safe
injection and pi-native toggling.

### Vendored SKILL.md version

- Upstream commit: `c2ed24b3e5d412cd0c25197b2bc9af587621fd99`
- Last sync: 2026-04-16 (initial vendoring)
- Source path: `skills/caveman/SKILL.md`

Locally, the vendored `skill/SKILL.md` appends a `## Document Exemption`
section added by caveman-milk-pi (not in upstream). This exemption instructs
the model to use full prose for long-form documents when caveman is active.

To update: run `bash scripts/sync-skill.sh`, review the diff, commit.

## pi / pi-mono

Built as an extension for pi (pi-mono) by Mario Zechner:

- https://github.com/badlogic/pi-mono

Uses the documented extension API (`before_agent_start`,
`session_start`, `registerCommand`).

## Stacks cleanly with

- **condensed-milk** (`@tomooshi/condensed-milk` / pi extension) —
  tool output compression
- **pi-vcc** by sting8k (`@sting8k/pi-vcc`) —
  algorithmic conversation compaction
