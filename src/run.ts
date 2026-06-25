import { compileRulePack, prefixTaskWithRulePack } from "./compiler.js";
import { savePersonalOmitOverride, savePersonalOverride } from "./overrides.js";
import { askChoice } from "./prompt.js";
import { selectForTask } from "./selector.js";
import type { CompiledRulePack, SelectionResult } from "./types.js";

export interface PreparedTask {
  selection: SelectionResult;
  pack: CompiledRulePack;
  prompt: string;
}

export async function prepareTask(task: string, cwd: string, tokenBudget: number, resolveConflicts: boolean): Promise<PreparedTask> {
  let selection = await selectForTask({ task, cwd, tokenBudget });

  if (resolveConflicts && selection.conflicts.length > 0) {
    for (const conflict of selection.conflicts) {
      const choices = [...conflict.ruleIds, "omit both for now"];
      const choice = await askChoice(
        `Selected rules conflict: ${conflict.ruleIds.join(" vs ")}. ${conflict.reason}`,
        choices,
        conflict.ruleIds[0],
      );

      if (choice !== "omit both for now") {
        await savePersonalOverride(cwd, conflict, choice);
      } else {
        await savePersonalOmitOverride(cwd, conflict);
      }
    }

    selection = await selectForTask({ task, cwd, tokenBudget });
  }

  const pack = compileRulePack(selection);
  return {
    selection,
    pack,
    prompt: prefixTaskWithRulePack(task, pack),
  };
}
