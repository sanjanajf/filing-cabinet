import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { resolveApiKey } from "./config";

const WRITING_DIR = path.join(os.homedir(), "writing");
const SNIPPET_CHARS = 500;
const TOTAL_CHAR_CAP = 150_000;

const SYSTEM = `You are reading a writer's private notebook. Identify 3-5 recurring themes or threads the writer has been circling. For each theme, give a 1-sentence framing and 2-3 supporting note titles. Output as markdown with ## headings per theme. No preamble, no conclusion.`;

type VaultNote = {
  relPath: string;
  title: string;
  snippet: string;
  mtime: number;
};

async function collectVault(): Promise<VaultNote[]> {
  const notes: VaultNote[] = [];
  async function walk(dir: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") || e.name.startsWith("_")) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.isFile() && e.name.endsWith(".md")) {
        const rel = path.relative(WRITING_DIR, full);
        const stat = await fs.stat(full);
        const content = await fs.readFile(full, "utf-8");
        notes.push({
          relPath: rel,
          title: deriveTitle(rel, content),
          snippet: deriveSnippet(content),
          mtime: stat.mtimeMs,
        });
      }
    }
  }
  await walk(WRITING_DIR);
  return notes;
}

function deriveTitle(relPath: string, content: string): string {
  const body = stripFrontmatter(content);
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  const base = path.basename(relPath, ".md");
  return base.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function deriveSnippet(content: string): string {
  const body = stripFrontmatter(content)
    .replace(/^#+\s+.+$/gm, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\*\*|__|\*|_|`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return body.slice(0, SNIPPET_CHARS);
}

function stripFrontmatter(content: string): string {
  if (!content.startsWith("---\n")) return content;
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) return content;
  return content.slice(end + 5);
}

function buildUserContent(notes: VaultNote[]): string {
  const sorted = [...notes].sort((a, b) => b.mtime - a.mtime);
  const parts: string[] = [];
  let total = 0;
  for (const n of sorted) {
    const block = `=== ${n.relPath} ===\n# ${n.title}\n\n${n.snippet}\n`;
    if (total + block.length > TOTAL_CHAR_CAP) break;
    parts.push(block);
    total += block.length;
  }
  return parts.join("\n");
}

export class NoApiKeyError extends Error {
  constructor() {
    super("No Anthropic API key configured");
    this.name = "NoApiKeyError";
  }
}

export class EmptyVaultError extends Error {
  constructor() {
    super("No notes found to reflect on");
    this.name = "EmptyVaultError";
  }
}

export async function reflectOnVault(): Promise<string> {
  const apiKey = resolveApiKey();
  if (!apiKey) throw new NoApiKeyError();

  const notes = await collectVault();
  if (notes.length === 0) throw new EmptyVaultError();

  const client = new Anthropic({ apiKey });
  const userContent = buildUserContent(notes);

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2000,
    system: [
      {
        type: "text",
        text: SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Here are the notes from the writer's vault:\n\n${userContent}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  const text = block ? (block as { text: string }).text.trim() : "";
  if (!text) throw new Error("Empty response from Claude");
  return text;
}

export function reflectionFilename(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}-${hh}${mm}.md`;
}
