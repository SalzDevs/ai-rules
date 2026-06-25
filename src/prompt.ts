import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

let activeReadline: readline.Interface | undefined;
let pipedLines: string[] | undefined;

export async function ask(question: string, fallback?: string): Promise<string> {
  const suffix = fallback ? ` (${fallback})` : "";

  if (!process.stdin.isTTY) {
    output.write(`${question}${suffix}: `);
    const lines = await readPipedLines();
    const answer = lines.shift()?.trim() ?? "";
    return answer || fallback || "";
  }

  const answer = await getReadline().question(`${question}${suffix}: `);
  return answer.trim() || fallback || "";
}

export function closePrompts(): void {
  activeReadline?.close();
  activeReadline = undefined;
}

export async function askChoice(question: string, choices: string[], fallback: string): Promise<string> {
  const renderedChoices = choices.map((choice, index) => `${index + 1}. ${choice}`).join("\n");
  const answer = await ask(`${question}\n${renderedChoices}\nChoose`, fallback);
  const byNumber = Number.parseInt(answer, 10);

  if (Number.isInteger(byNumber) && byNumber >= 1 && byNumber <= choices.length) {
    return choices[byNumber - 1];
  }

  return choices.includes(answer) ? answer : fallback;
}

export async function readStdinIfAvailable(): Promise<string> {
  if (process.stdin.isTTY) {
    return "";
  }

  const lines = await readPipedLines();
  const value = lines.join("\n").trim();
  lines.length = 0;
  return value;
}

async function readPipedLines(): Promise<string[]> {
  if (pipedLines) {
    return pipedLines;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  pipedLines = Buffer.concat(chunks).toString("utf8").split(/\r?\n/);
  return pipedLines;
}

function getReadline(): readline.Interface {
  activeReadline ??= readline.createInterface({ input, output });
  return activeReadline;
}
