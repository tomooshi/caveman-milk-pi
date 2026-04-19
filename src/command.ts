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
      "Toggle caveman terseness mode. Usage: /caveman [off|lite|full|ultra|wenyan|wenyan-lite|wenyan-ultra|status on|status off|diff]",
    handler: async (args, ctx) => {
      const trimmed = (args ?? "").trim();

      if (trimmed.length === 0) {
        const current = deps.getCache();
        const mode = current?.mode ?? "off";
        const showStatus = loadConfig().showStatus;
        ctx.ui.notify(
          `caveman: ${mode} (statusbar: ${showStatus ? "on" : "off"}). ` +
            `Run /caveman <mode> to change. Valid: ${VALID_MODES.join(", ")}. ` +
            `Statusbar: /caveman status on|off. Diagnostic: /caveman diff`,
          "info",
        );
        return;
      }

      if (trimmed.startsWith("status")) {
        const arg = trimmed.slice("status".length).trim();
        if (arg !== "on" && arg !== "off") {
          ctx.ui.notify(
            `caveman: invalid status arg '${arg}'. Usage: /caveman status on|off`,
            "warning",
          );
          return;
        }
        const show = arg === "on";
        const config: CavemanConfig = { ...loadConfig(), showStatus: show };
        deps.persist(config);
        if (show) {
          const current = deps.getCache();
          const mode = current?.mode ?? config.mode;
          ctx.ui.setStatus("caveman", `caveman: ${mode}`);
        } else {
          ctx.ui.setStatus("caveman", undefined);
        }
        ctx.ui.notify(
          show
            ? "caveman statusbar on."
            : "caveman statusbar off. Mode unchanged — /caveman to check.",
          "info",
        );
        return;
      }

      // Diagnostic: dump the cached injection text so user can verify what the model actually sees.
      if (trimmed === "diff") {
        const current = deps.getCache();
        if (!current) {
          ctx.ui.notify(
            "caveman: cache not initialized. Run /reload or restart pi.",
            "warning",
          );
          return;
        }
        const text = current.text.length === 0 ? "(mode=off — no injection)" : current.text;
        const info =
          `=== caveman-milk-pi injection diagnostic ===\n` +
          `mode: ${current.mode}\n` +
          `hash: ${current.sourceHash}\n` +
          `length: ${current.text.length} chars\n` +
          `--- injection text ---\n${text}\n--- end ---`;
        ctx.ui.notify(info, "info");
        return;
      }

      // validateMode throws on invalid input. Errors surface via pi's error listener.
      const newMode: CavemanMode = validateMode(trimmed);
      const config: CavemanConfig = { ...loadConfig(), mode: newMode };
      deps.persist(config);

      const skillContent = loadSkillContent();
      const newCache = computeInjection(newMode, skillContent);
      deps.setCache(newCache);

      if (config.showStatus) {
        ctx.ui.setStatus("caveman", `caveman: ${newMode}`);
      }
      ctx.ui.notify(
        newMode === "off"
          ? "caveman off. Next turn: normal output."
          : `caveman: ${newMode}. Takes effect on next message.`,
        "info",
      );
    },
  });
}
