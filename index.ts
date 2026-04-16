// pi-caveman — inject caveman terseness rules into pi's system prompt.
//
// Architecture:
//   - session_start: load config + SKILL.md, compute injection, cache it
//   - before_agent_start: append cached injection to systemPrompt (or skip if mode=off)
//   - /caveman <mode>: update config, recompute cached injection, persist
//
// Cache safety (ADR-015):
//   - Injection bytes are a pure function of (mode, SKILL.md)
//   - Mode change is the ONLY valid invalidation trigger
//   - No per-request filesystem reads, no dynamic content, no branching
//
// See knowledge/decisions/ADR-009 through ADR-015 for full rationale.

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig, saveConfig } from "./src/config.js";
import { loadSkillContent, computeInjection } from "./src/injection.js";
import { registerCavemanCommand } from "./src/command.js";
import type { InjectionCache } from "./src/types.js";

export default (pi: ExtensionAPI) => {
  // Mutable closure state: the cached injection. Written only by
  // session_start (once per session/reload) and by /caveman (on mode change).
  // Read by before_agent_start (every user turn).
  let cache: InjectionCache | null = null;

  pi.on("session_start", async (_event, ctx) => {
    const config = loadConfig();
    const skillContent = loadSkillContent();
    cache = computeInjection(config.mode, skillContent);
    ctx.ui.setStatus("caveman", `caveman: ${config.mode}`);
  });

  pi.on("before_agent_start", async (event) => {
    if (!cache || cache.mode === "off") return undefined;
    return { systemPrompt: event.systemPrompt + cache.text };
  });

  registerCavemanCommand(pi, {
    getCache: () => cache,
    setCache: (newCache) => {
      cache = newCache;
    },
    persist: saveConfig,
  });
};
