import fs from "node:fs/promises";
import path from "node:path";
import { pathExists, readJsonIfExists } from "./file-system.js";
import type { PreflightContext, TaskKind } from "./types.js";

const taskKindKeywords: Array<[TaskKind, RegExp]> = [
  ["fix", /\b(fix|bug|broken|error|failing|regression)\b/i],
  ["refactor", /\b(refactor|cleanup|simplify|restructure|rename)\b/i],
  ["test", /\b(test|spec|coverage|assert)\b/i],
  ["docs", /\b(doc|readme|documentation|guide)\b/i],
  ["review", /\b(review|audit|inspect)\b/i],
  ["chore", /\b(chore|config|setup|scaffold|build)\b/i],
  ["feature", /\b(add|create|implement|build|support|feature)\b/i],
];

export async function preflight(task: string, cwd: string): Promise<PreflightContext> {
  const gitRoot = await findGitRoot(cwd);
  const root = gitRoot ?? cwd;
  const manifestFiles = await detectManifestFiles(root);
  const packageJson = await readJsonIfExists(path.join(root, "package.json"));

  return {
    cwd,
    gitRoot,
    mentionedPaths: extractMentionedPaths(task),
    languages: detectLanguages(task, manifestFiles, packageJson),
    frameworks: detectFrameworks(task, packageJson),
    taskKinds: detectTaskKinds(task),
    manifestFiles,
  };
}

async function findGitRoot(start: string): Promise<string | undefined> {
  let current = path.resolve(start);

  while (true) {
    if (await pathExists(path.join(current, ".git"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }

    current = parent;
  }
}

async function detectManifestFiles(root: string): Promise<string[]> {
  const candidates = [
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "next.config.js",
    "next.config.ts",
    "pyproject.toml",
    "go.mod",
    "Cargo.toml",
    "pom.xml",
  ];
  const present: string[] = [];

  for (const candidate of candidates) {
    if (await pathExists(path.join(root, candidate))) {
      present.push(candidate);
    }
  }

  return present;
}

function extractMentionedPaths(task: string): string[] {
  const matches = task.match(/(?:\.{1,2}\/|[\w.-]+\/)[\w./-]+\.\w+|(?:\.{1,2}\/|[\w.-]+\/)[\w./-]+/g);
  return Array.from(new Set(matches ?? []));
}

function detectLanguages(
  task: string,
  manifestFiles: string[],
  packageJson: Record<string, unknown> | undefined,
): string[] {
  const languages = new Set<string>();
  const lowerTask = task.toLowerCase();

  if (/\b(ts|typescript|tsx)\b/.test(lowerTask) || manifestFiles.includes("tsconfig.json")) {
    languages.add("typescript");
  }
  if (/\b(js|javascript|jsx)\b/.test(lowerTask) || packageJson) {
    languages.add("javascript");
  }
  if (/\bpython|py\b/.test(lowerTask) || manifestFiles.includes("pyproject.toml")) {
    languages.add("python");
  }
  if (/\bgo\b/.test(lowerTask) || manifestFiles.includes("go.mod")) {
    languages.add("go");
  }
  if (/\brust\b/.test(lowerTask) || manifestFiles.includes("Cargo.toml")) {
    languages.add("rust");
  }
  if (/\bjava\b/.test(lowerTask) || manifestFiles.includes("pom.xml")) {
    languages.add("java");
  }

  return Array.from(languages);
}

function detectFrameworks(task: string, packageJson: Record<string, unknown> | undefined): string[] {
  const frameworks = new Set<string>();
  const lowerTask = task.toLowerCase();
  const deps = collectPackageDependencies(packageJson);

  for (const framework of ["react", "next", "vue", "svelte", "express", "fastify", "vite", "vitest"]) {
    if (lowerTask.includes(framework) || deps.has(framework) || deps.has(framework === "next" ? "next" : framework)) {
      frameworks.add(framework);
    }
  }

  if (deps.has("@nestjs/core") || lowerTask.includes("nestjs")) {
    frameworks.add("nestjs");
  }

  return Array.from(frameworks);
}

function collectPackageDependencies(packageJson: Record<string, unknown> | undefined): Set<string> {
  const deps = new Set<string>();
  for (const key of ["dependencies", "devDependencies", "peerDependencies"]) {
    const value = packageJson?.[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      for (const dependency of Object.keys(value)) {
        deps.add(dependency);
      }
    }
  }

  return deps;
}

function detectTaskKinds(task: string): TaskKind[] {
  const kinds = taskKindKeywords.filter(([, pattern]) => pattern.test(task)).map(([kind]) => kind);
  return kinds.length > 0 ? Array.from(new Set(kinds)) : ["feature"];
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}
