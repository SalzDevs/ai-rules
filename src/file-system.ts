import fs from "node:fs/promises";
import path from "node:path";

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function listFilesRecursive(root: string): Promise<string[]> {
  if (!(await pathExists(root))) {
    return [];
  }

  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(root, entry.name);
      if (entry.isDirectory()) {
        return listFilesRecursive(fullPath);
      }

      return [fullPath];
    }),
  );

  return files.flat().sort();
}

export async function readJsonIfExists(filePath: string): Promise<Record<string, unknown> | undefined> {
  if (!(await pathExists(filePath))) {
    return undefined;
  }

  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}
