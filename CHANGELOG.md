# Changelog

All notable changes to pi-caveman are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2026-04-16

### Verified

- **`wenyan-full` mode validated.** Live test on Opus 4.7 confirmed: SKILL parser correctly filters to only the `wenyan-full` intensity row (no leakage from other modes), CJK content survives injection round-trip, model output matches classical register criteria (verb-object order, classical particles 之/故, technical terms preserved as English, ~70% character density vs English equivalent). SKILL.md file-level integrity confirmed for all three wenyan variants (storage layer is fine for all of them).

### Changed

- **README "What we verified" table.** Added wenyan-full row with the validation criteria above.
- **README "Not yet verified" table.** Replaced the generic "wenyan modes" entry with a more precise note that `wenyan-lite` and `wenyan-ultra` runtime behavior are still pending — file-level integrity already confirmed for all three.

## [0.1.3] - 2026-04-16

### Verified

- **Cache safety claim now measured.** Controlled A/B with identical 5-prompt scripted workload (Opus 4.7, full caveman + condensed-milk + pi-vcc stack) showed a **−1% cache-hit delta on the caveman activation turn** (92% with caveman=full vs 93% with caveman=off), well within the ±1% architectural target. The injection lands after the cacheable prefix breakpoint and does not invalidate prior cached context. Steady-state showed +10.8% mean hit-rate improvement, but this is a second-order brevity effect (shorter outputs → smaller cache-write tails), not a cache-architecture property. Total A/B session cost dropped 55% with caveman=full.

### Changed

- **README cache-safety section.** Replaced soft "designed to be cache-safe" wording with measured P1 −1% delta plus the brevity-effect caveat, so users understand both the architectural property and the secondary cost win.
- **README "What we verified" table.** Updated cache row from "diagnostic turn at 100% hit" to the controlled A/B P1 activation-turn delta.
- **README "Not yet verified" table.** Removed the now-measured A/B claim; replaced with the more honest residual: tool-heavy long-form workloads (e.g. very large bash returns or file reads) have not been A/B'd and may show different cache dynamics.

## [0.1.2] - 2026-04-16

### Added

- **CHANGELOG.md.** Version history for v0.1.0 and v0.1.1, surfacing what was previously buried in git log.
- **README "What we verified" section.** Lists the empirical tests that have actually been run against this fork, so users can distinguish measured claims from architectural ones.
- **README "Not yet verified" section.** Honest list of validation work pending for v0.2.0 (controlled A/B cache measurement, wenyan mode validation, long-session drift check).

### Changed

- No behavior changes. Documentation only.

## [0.1.1] - 2026-04-16

### Fixed

- **Document Exemption rule was too permissive.** The v0.1.0 SKILL.md included an "Explanations the user asks for in detail" bullet that caused the model to treat most technical Q&A as exempt from caveman terseness. Live dogfooding confirmed the bug: caveman appeared inactive on chat responses despite mode=full. The rule has been narrowed to only exempt explicit document drafting requests. A new explicit DO-NOT-exempt list covers technical questions, comparisons, recommendations, code review, and debugging.
- **Persistence drift over long sessions.** Added a second "Persistence Anchor — Bottom" section at the end of the SKILL so the rule is reinforced by recency bias on each model read.

### Added

- **`/caveman diff` diagnostic command.** Prints the current mode, cached injection hash, character length, and full injection text. Useful for verifying the extension is active, the correct mode is loaded, and the SKILL content matches expectations.
- **Mixed-response example in SKILL.** Demonstrates how to handle a request that combines document drafting (full prose) with technical explanation (caveman). Helps the model understand the boundary.

### Changed

- **README cache-safety claim softened.** The v0.1.0 README claimed "Measured impact on cache hit rate with caveman active versus off: under 1% difference." That number was architectural, not measured. The README now states the architectural guarantee (verified by 18 deterministic tests) and notes that controlled A/B measurement against a matched no-caveman session is pending.
- **README ADR links removed.** The v0.1.0 README linked to ADR files that exist only in the maintainer's private vault. Public users got broken relative paths. The 8 cache-safety invariants are now inlined directly in the README.

## [0.1.0] - 2026-04-16

### Added

- Initial release.
- pi extension that injects caveman terseness rules into the system prompt via the `before_agent_start` hook.
- Seven intensity modes: `off`, `lite`, `full`, `ultra`, `wenyan-lite`, `wenyan`, `wenyan-ultra`.
- `/caveman <mode>` command for runtime mode switching.
- Default mode `off` (opt-in, differs from upstream caveman's auto-activate behavior).
- Document Exemption rule for long-form prose tasks.
- Vendored caveman SKILL.md with sync script (`scripts/sync-skill.sh`).
- Cache safety: injection bytes are a pure function of `(mode, SKILL.md)` — no per-request variation, no filesystem reads in the hot path.
- Fail-loud error handling: missing or malformed SKILL.md crashes with actionable error messages.
- 18 unit tests against the real vendored SKILL.md (no fixtures).
- Stacks cleanly with [condensed-milk](https://github.com/tomooshi/condensed-milk-pi) (tool output compression) and [pi-vcc](https://github.com/sting8k/pi-vcc) (algorithmic compaction).

### Credits

Based on [caveman](https://github.com/JuliusBrussee/caveman) by Julius Brussee.
