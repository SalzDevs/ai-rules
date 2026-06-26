import fs from "node:fs/promises";
import path from "node:path";
import { pathExists } from "../file-system.js";
import { ensureDir } from "../preflight.js";

export async function installIntegrationFile(options: {
  targetDir: string;
  filename: string;
  content: string;
  force: boolean;
}): Promise<string> {
  await ensureDir(options.targetDir);

  const targetPath = path.join(options.targetDir, options.filename);
  if (!options.force && (await pathExists(targetPath))) {
    throw new Error(`${targetPath} already exists. Re-run with --force to overwrite it.`);
  }

  await fs.writeFile(targetPath, options.content, "utf8");
  return targetPath;
}
