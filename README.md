# pi-caveman

A [pi](https://github.com/badlogic/pi-mono) extension that injects [caveman](https://github.com/JuliusBrussee/caveman) terseness rules into pi's system prompt. Shorter chat output, without breaking the prompt cache.

Cache-safe. Opt-in. Designed to stack cleanly with [condensed-milk](https://github.com/tomooshi/condensed-milk-pi) and [pi-vcc](https://github.com/sting8k/pi-vcc).

## What it does

Caveman is a prompt-engineering technique that reduces assistant chat output by dropping filler, articles, and pleasantries while preserving technical substance. pi-caveman brings this into pi as a native extension with programmatic toggling.

Upstream caveman benchmarks claim ~30–70% reduction depending on prompt type. pi-caveman has not yet performed independent benchmarks; observed terseness on Opus 4.7 in live sessions is qualitative and noticeable but not yet quantified.

| Feature | Status |
|--------|--------|
| **Cache-safe** | Injection bytes are static per mode (verified by 18 deterministic tests). Live observation: cached prefix reusable across turns. Controlled A/B not yet measured. |
| **Opt-in** | Default mode is `off`. Baseline pi behavior unchanged on install. |
| **Tool-args exempt** | Code, file contents, tool arguments, and thinking traces are never terse-ified by design. Not yet stress-tested with v0.1.1. |
| **Document exemption** | Long-form prose drafts produce full grammar (v0.1.1 narrowed the rule scope after v0.1.0 over-exempted technical Q&A). Not 100% reliable; manual workflow available as fallback. |
| **Plays nicely** | Uses only documented pi extension hooks. Zero overlap with condensed-milk or pi-vcc, verified by reading pi-mono source. Three-way stack run successfully for ~10 turns. |

## Quick Start

```bash
pi install npm:@tomooshi/pi-caveman
# or from source:
pi install https://github.com/tomooshi/caveman-milk-pi
```

Then inside pi:

```
/caveman full
```

That's it. Your next chat turn will be terse. Run `/caveman off` to disable.

## Modes

```
/caveman               # show current mode and usage
/caveman off           # disable injection (default on install)
/caveman lite          # drop filler, keep full sentences and grammar
/caveman full          # classic caveman — fragments, short synonyms
/caveman ultra         # maximum compression, abbreviations, arrows
/caveman wenyan-lite   # semi-classical Chinese terseness
/caveman wenyan        # full 文言文 — classical literary Chinese
/caveman wenyan-ultra  # extreme classical abbreviation
```

Your mode persists to `~/.config/pi-caveman.json` and survives pi restarts and `/reload`.

### Examples

**"Why is my React component re-rendering?"**

- `lite`: *"Your component re-renders because you create a new object reference each render. Wrap it in `useMemo`."*
- `full`: *"New object ref each render. Inline object prop = new ref = re-render. Wrap in `useMemo`."*
- `ultra`: *"Inline obj prop → new ref → re-render. `useMemo`."*

Same answer. You pick how many words.

## Default is `off` (differs from upstream caveman)

Upstream caveman auto-activates on install. pi-caveman does not. We prefer explicit consent — the baseline pi experience is unchanged until you type `/caveman full`. Your mode persists after that, so it's a one-time decision.

If you want caveman always-on across all sessions, run `/caveman full` once. The config file records your preference and every future session starts with caveman active at that level.

## Document drafting

Long-form documents (READMEs, ADRs, design docs, tutorials, emails) should use full grammar, not caveman style. pi-caveman's vendored SKILL.md includes an explicit Document Exemption rule that tells the model to produce normal prose for these tasks even when caveman is active.

**This works most of the time, but it is not 100% reliable.** The exemption depends on the model honoring an instruction in its system prompt. Opus 4.7's stricter instruction following makes compliance more consistent than on earlier models, but you may occasionally see a model produce a gruntified document anyway.

If that happens, use the manual workflow:

```
/caveman off
# ... draft your document ...
/caveman full
```

Each switch causes exactly one cache miss at the system prompt breakpoint, then cache hits resume. The cost is negligible compared to a long drafting session.

Tool call arguments (contents of `Write(...)`, `Edit(...)`) are always normal code or prose regardless of caveman mode. This is enforced by both caveman's ruleset and by how models treat structured tool arguments.

### v0.1.1 exemption scope

The Document Exemption rule was tightened in v0.1.1 after live dogfooding showed the v0.1.0 rule was too permissive (it treated most technical Q&A as exempt, defeating caveman's persistence for chat). The current rule:

- **Exempts:** explicit document drafts, markdown files written to disk, extended tutorials the user explicitly requests (>3 paragraphs of instructional prose), emails or PR descriptions the user asks to draft, content inside Write/Edit tool arguments
- **Does NOT exempt:** technical Q&A ("what do you think", "is this correct", "explain X"), comparisons, recommendations, code review, debugging analysis, status updates

If you observe verbose chat responses despite caveman being active, run `/caveman diff` first to confirm the v0.1.1 SKILL is loaded (look for the "Persistence Anchor — Bottom" section in the output).

## What caveman does NOT affect

- **Thinking / reasoning tokens** — caveman is a system prompt rule, applied only to final chat output. Thinking traces are untouched (confirmed by upstream caveman docs and pi-ai's separate handling of `thinking` blocks).
- **Tool arguments** — `Write`, `Edit`, `Bash` commands are designed to receive normal content. The vendored SKILL explicitly says "Code/commits/PRs: write normal" and "Content inside Write/Edit tool call arguments — always normal prose." Not yet independently stress-tested in this fork; report regressions if you see them.
- **Tool results you read** — file contents, bash output, and search results pass through unchanged. (For compression of those, see condensed-milk.)
- **Error messages and confirmations** — caveman's auto-clarity exemption kicks in for security warnings and irreversible-action prompts.

## What we verified

Claims in this README that are backed by actual measurement on this fork (Opus 4.7, full caveman + condensed-milk + pi-vcc stack):

| Claim | How verified |
|-------|--------------|
| Injection bytes are deterministic per mode | 18 unit tests pass, all asserting byte-identical output across repeated calls |
| Injection bytes contain expected mode-specific intensity row | 18 unit tests covering all 7 modes |
| Cache prefix remains reusable with caveman active | Live `/compress-stats` over 9 turns showed a diagnostic turn at 100% cache hit with caveman injection in the cached prefix |
| Code written via Write tool is full prose, not gruntified | Wrote a real Python file with caveman=full active; docstrings + comments rendered as full grammar (test-fib.py with Args/Returns/Raises sections) |
| `/caveman diff` reports current injection state correctly | Live verification: diff output showed correct mode, hash, and full SKILL content |
| Document Exemption v0.1.1 rule produces terse chat for technical Q&A | Live verification: after the v0.1.1 fix, technical questions consistently produced caveman-style fragmented responses |
| Zero handler conflict with enforcement extensions that also use `before_agent_start` | Source audit confirmed: maintainer's enforcement extension explicitly avoids modifying systemPrompt for caching reasons. caveman is the only systemPrompt mutator in the documented stack |
| Compatibility with condensed-milk and pi-vcc | Three-way stack ran cleanly for ~10+ turns with no crashes, command collisions, or extension errors |

## Not yet verified

Claims that are architecturally sound but not yet backed by measurement:

| Claim | What's needed |
|-------|---------------|
| Cache hit-rate delta with caveman active vs off is under 1% | Controlled A/B: matched 5-turn sessions, one at `caveman=off`, one at `caveman=full`, identical prompts. Compare `/compress-stats` numbers per-turn. |
| Wenyan modes produce correct classical Chinese output | One session per wenyan variant. Verify SKILL filter, terminal CJK rendering, model output quality. |
| Caveman persistence holds across 30+ turn sessions | Real long-session work with sample points at turn 5, 15, 30. Score caveman compliance against a 5-point rubric. |
| Tool-call quality holds in `ultra` mode (more aggressive than `full`) | Same Write/Edit test as v0.2.0-01 but with `/caveman ultra` |
| Larger files (500+ lines) don't trigger caveman drift in tool args | Write or Edit a substantial file with caveman=full. Inspect for fragmentation. |

If you run any of these tests, results are welcome as PRs to the upstream caveman project or as issues here.

## Compatibility with other extensions

pi-caveman operates on the system prompt via pi's `before_agent_start` hook. It does not touch tool results, message history, or compaction. This means it stacks cleanly with:

### condensed-milk

Compresses tool output (bash, reads, grep, build logs, test runners) and stale history messages. Runs on `tool_execution_end` and `context` hooks — entirely different from caveman's hook. Zero overlap. Different commands (`/compress-stats`, `/compress-config` vs `/caveman`).

### pi-vcc

Algorithmic conversation compactor. Runs on `session_before_compact` — not touched by caveman. Bonus property: pi-vcc replaces pi's default LLM-based summarization, which means caveman cannot affect summary quality even in degenerate cases. Running all three together is strictly safer than running caveman with pi's default compactor.

### The full stack

| Layer | Extension |
|-------|-----------|
| System prompt | pi-caveman |
| Tool output (write-time) | condensed-milk |
| Message history (retroactive) | condensed-milk |
| Compaction summary | pi-vcc |

Each owns one event, one transform, one concern. None share state.

## Cache safety

pi-caveman is designed around one invariant: the injected text is a pure function of `(mode, SKILL.md)`. Nothing else influences injection bytes — no timestamps, no turn counters, no session IDs, no per-request filesystem reads.

This means Anthropic's prompt cache stays warm across turns. Mode changes cause exactly one cache miss (expected, user-initiated), then cache hits resume.

**Status of empirical verification:** 18 deterministic unit tests confirm that the injection bytes are byte-identical per mode and stable across repeated computations. Live-session observation over 9 turns on Opus 4.7 with the full caveman/condensed-milk/pi-vcc stack showed the cached prefix remained reusable (a diagnostic turn returned 100% cache hit with the caveman injection present in the cached prefix). A controlled A/B comparison between matched caveman=off and caveman=full sessions has not yet been performed, so the exact hit-rate delta under identical workloads is not yet measured. The architectural guarantee — static injection bytes per mode, no per-request variation — holds either way.

The full set of invariants:

1. Injection is a pure function of `(mode, SKILL.md)` — no timestamps, counters, or per-request content
2. Mode change is the only valid cache invalidation trigger
3. No filesystem reads during `before_agent_start` — injection cached in memory
4. No conditional content varying per request
5. Config file changes take effect at next session start, not mid-session
6. No `cache_control` manipulation — pi-ai owns placement
7. No `anthropic-beta` header injection
8. SKILL.md content is append-only to systemPrompt

## Diagnostic: `/caveman diff`

If caveman seems to not be reducing your output tokens as expected, run:

```
/caveman diff
```

This prints the current mode, the cached injection hash, and the full text that is being appended to your system prompt. Use this to verify the extension is active and that the injection content matches what you expect for your mode.

If the injection text is empty (mode=off) or shows a mode other than what you set, run `/caveman <mode>` to correct it. If `/caveman diff` says the cache is not initialized, run `/reload` or restart pi.

## Troubleshooting

**`pi-caveman could not load SKILL.md at <path>`**

The vendored SKILL.md is missing. Reinstall the extension or verify `skill/SKILL.md` exists in the extension directory.

**`pi-caveman SKILL.md ... is empty`** or **`is malformed`**

The vendored file was corrupted. Restore via `bash scripts/sync-skill.sh`, review the diff, and commit.

**`pi-caveman config: invalid mode 'X'`**

The config file has an unknown mode. Delete `~/.config/pi-caveman.json` to reset to defaults, or edit it to use one of the valid modes.

**`pi-caveman config ... is not a JSON object`**

The config file is corrupted. Delete `~/.config/pi-caveman.json` to reset.

**Extension not activating on new session**

pi-caveman only runs when pi's extension loader discovers it. Verify the install path with `pi install --list` or check that `@tomooshi/pi-caveman` is in your pi settings `packages` array.

## Credits

Based on [caveman](https://github.com/JuliusBrussee/caveman) by Julius Brussee (MIT). The ruleset, intensity levels, and exemption concepts are Julius's work — this extension ports them into pi's extension system with cache-safe injection and native toggling. See [CREDITS.md](./CREDITS.md) for the pinned upstream SHA.

pi extension system by [Mario Zechner](https://github.com/badlogic/pi-mono).

## License

MIT, matching upstream caveman.
