#!/usr/bin/env node
/**
 * Builds docs/demo-transcript.txt from a real OpenCode export + live ai-rules CLI.
 * Usage: node scripts/record-demo.mjs [path/to/session-export.json]
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const demoProject = path.join(root, "docs", "demo-project");
const sessionPath =
  process.argv[2] ?? path.join(demoProject, "create-rule-session.json");
const airulesJs = path.join(root, "dist", "bin", "ai-rules.js");
const node = process.execPath;

function normalize(text) {
  let out = text;
  out = out.replaceAll(demoProject, "my-app");
  out = out.replaceAll(root, "my-app");
  if (process.env.HOME) {
    out = out.replaceAll(process.env.HOME, "~");
  }
  return out.trim();
}

function extractTranscript(exportText) {
  const jsonStart = exportText.indexOf("{");
  if (jsonStart < 0) throw new Error("No JSON in session export");
  const data = JSON.parse(exportText.slice(jsonStart));
  const lines = [];

  for (const message of data.messages ?? []) {
    const role = message.info?.role;
    if (role !== "user" && role !== "assistant") continue;

    const texts = (message.parts ?? [])
      .filter((part) => part.type === "text")
      .map((part) => part.text?.trim())
      .filter(Boolean)
      .filter((text) => !text.startsWith("# ai-rules: create a personal rule"));

    if (texts.length === 0) continue;

    const combined = texts.join("\n");
    if (role === "user") {
      lines.push(`you> ${normalize(combined).split("\n")[0]}`);
    } else {
      const preview = normalize(combined);
      if (preview.includes("Save, Edit, or Cancel")) {
        lines.push("agent> Preview ready. Save, Edit, or Cancel?");
        continue;
      }
      const short = preview.split("\n").slice(0, 8).join("\n");
      lines.push(`agent> ${short}${preview.split("\n").length > 8 ? "\n…" : ""}`);
    }
  }

  return lines;
}

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", cwd: demoProject, stdio: ["pipe", "pipe", "pipe"] }).trim();
}

if (!fs.existsSync(sessionPath)) {
  console.error(`Missing session export: ${sessionPath}`);
  console.error("Record one with: opencode export <session-id> > docs/demo-project/create-rule-session.json");
  process.exit(1);
}

if (!fs.existsSync(airulesJs)) {
  execSync("npm run build", { cwd: root, stdio: "inherit" });
}

const exportText = fs.readFileSync(sessionPath, "utf8");
const transcript = extractTranscript(exportText);

const setup = run(`"${node}" "${airulesJs}" setup --force`);
const compile = run(
  `"${node}" "${airulesJs}" debug compile --budget 800 --no-resolve-conflicts "Add UserCard data loading"`,
);
const select = run(
  `"${node}" "${airulesJs}" debug select "Add UserCard data loading"`,
);

const selectedId = (() => {
  try {
    const parsed = JSON.parse(select);
    return parsed.selected?.[0]?.rule?.metadata?.id ?? "react.no-direct-fetch";
  } catch {
    return "react.no-direct-fetch";
  }
})();

const out = [
  "$ cd my-app",
  "$ npx ai-rules setup",
  normalize(setup),
  "",
  "$ opencode",
  "",
  "> /create-rule no fetch directly inside React components",
  "",
  ...transcript,
  "",
  "$ ls ~/.config/ai-rules/rules/",
  `${selectedId}.md`,
  "",
  "> /airules Add UserCard data loading",
  "",
  "# OpenCode runs this shell hook from .opencode/commands/airules.md:",
  `$ ai-rules debug compile --budget 800 --no-resolve-conflicts "Add UserCard data loading"`,
  "",
  normalize(compile),
  "",
  "## User Task",
  "Add UserCard data loading",
  "",
].join("\n");

const target = path.join(root, "docs", "demo-transcript.txt");
fs.writeFileSync(target, `${out}\n`);
console.log(`Wrote ${target}`);
