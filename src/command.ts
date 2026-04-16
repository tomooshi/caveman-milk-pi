// /caveman slash command: display status or switch mode.
//
// Mode changes are the only legitimate cache-invalidation trigger
// (ADR-015). Takes effect on the NEXT before_agent_start call.

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { CavemanConfig, CavemanMode, InjectionCache } from "./types.js";
import { VALID_MODES } from "./types.js";
import { validateMode, loadConfig } from "./config.js";
import { computeInjection, loadSkillContent } from "./injection.js";

export interface CommandDeps {
  getCache: () => InjectionCache | null;
  setCache: (cache: InjectionCache) => void;
  persist: (config: CavemanConfig) => void;
}

export function registerCavemanCommand(pi: ExtensionAPI, deps: CommandDeps): void {
  pi.registerCommand("caveman", {
    description:
      "Toggle caveman terseness mode. Usage: /caveman [off|lite|full|ultra|wenyan|wenyan-lite|wenyan-ultra]",
    handler: async (args, ctx) => {
      const trimmed = (args ?? "").trim();

      if (trimmed.length === 0) {
        const current = deps.getCache();
        const mode = current?.mode ?? "off";
        ctx.ui.notify(
          `caveman: ${mode}. Run /caveman <mode> to change. Valid: ${VALID_MODES.join(", ")}`,
          "info",
        );
        return;
      }

      // validateMode throws on invalid input. Errors surface via pi's error listener.
      const newMode: CavemanMode = validateMode(trimmed);
      const config: CavemanConfig = { ...loadConfig(), mode: newMode };
      deps.persist(config);

      const skillContent = loadSkillContent();
      const newCache = computeInjection(newMode, skillContent);
      deps.setCache(newCache);

      ctx.ui.setStatus("caveman", `caveman: ${newMode}`);
      ctx.ui.notify(
        newMode === "off"
          ? "caveman off. Next turn: normal output."
          : `caveman: ${newMode}. Takes effect on next message.`,
        "info",
      );
    },
  });
}
