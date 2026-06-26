import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { listFilesRecursive, pathExists } from "./file-system.js";
import { defaultPersonalRulesDir, overridesFile, rulesSubdir } from "./paths.js";
import { assertConflictOverride, assertRuleBody, assertRuleMetadata } from "./schema.js";
import type { ConflictOverride, Rule, RuleBody } from "./types.js";

const ruleFileExtensions = new Set([".md", ".markdown"]);

export async function loadRules(_cwd: string): Promise<Rule[]> {
  const personal = await loadRulesFromDir(rulesSubdir(defaultPersonalRulesDir()));
  return personal.filter((rule) => rule.metadata.status === "active");
}

export async function countActiveRules(cwd: string): Promise<number> {
  return (await loadRules(cwd)).length;
}

export async function assertRulesExist(cwd: string): Promise<void> {
  if ((await countActiveRules(cwd)) === 0) {
    throw new Error(`No active rules found. Add Markdown rule files to ${rulesSubdir(defaultPersonalRulesDir())}.`);
  }
}

export async function loadOverrides(_cwd: string): Promise<ConflictOverride[]> {
  const file = overridesFile(defaultPersonalRulesDir());
  if (!(await pathExists(file))) {
    return [];
  }

  const parsed = YAML.parse(await fs.readFile(file, "utf8")) as unknown;
  const values = Array.isArray(parsed) ? parsed : [];
  return values.map((value) => assertConflictOverride(value, file));
}

async function loadRulesFromDir(root: string): Promise<Rule[]> {
  const files = (await listFilesRecursive(root)).filter((file) => ruleFileExtensions.has(path.extname(file)));

  return Promise.all(
    files.map(async (file) => {
      const parsed = parseRuleFile(await fs.readFile(file, "utf8"), file);
      return {
        metadata: {
          ...assertRuleMetadata(parsed.metadata, file),
          layer: "personal" as const,
        },
        body: assertRuleBody(parsed.body, file),
        sourcePath: file,
      };
    }),
  );
}

function parseRuleFile(raw: string, sourcePath: string): { metadata: unknown; body: Partial<RuleBody> } {
  const match = raw.match(/^---\n(?<yaml>[\s\S]*?)\n---\n?(?<markdown>[\s\S]*)$/);
  if (!match?.groups) {
    throw new Error(`${sourcePath} must be a Markdown rule file with YAML frontmatter.`);
  }

  return {
    metadata: YAML.parse(match.groups.yaml) as unknown,
    body: parseMarkdownSections(match.groups.markdown),
  };
}

function parseMarkdownSections(markdown: string): Partial<RuleBody> {
  const sections: Partial<RuleBody> = {};
  const headingRegex = /^##\s+(Trigger|Rule|Prefer|Rationale|Example)\s*$/gim;
  const matches = Array.from(markdown.matchAll(headingRegex));

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const next = matches[index + 1];
    const title = match[1].toLowerCase() as keyof RuleBody;
    const start = (match.index ?? 0) + match[0].length;
    const end = next?.index ?? markdown.length;
    sections[title] = markdown.slice(start, end).trim();
  }

  return sections;
}
