import fs from "fs/promises";
import path from "path";
import os from "os";

const WRITING_DIR = path.join(os.homedir(), "writing");
const LAYOUT_FILE = path.join(WRITING_DIR, "layout.json");
const META_FILE = path.join(WRITING_DIR, "meta.json");

export type NoteMeta = {
  slug: string;
  relPath: string;
  title: string;
  preview: string;
  mtime: number;
};

export type Position = { x: number; y: number };
export type Layout = Record<string, Position>;

export type FolderMeta = {
  slug: string;
  name: string;
  count: number;
  countLabel: string;
};

export type FileMeta = {
  relPath: string;
  filename: string;
  summary: string;
  status: string;
  lang: string | null;
  words: number;
  highlighted: boolean;
};

export type FileFormat = {
  font: string;
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

export type Meta = {
  docTitle: string;
  folderLabels: Record<string, string>;
  countLabels: Record<string, string>;
  openFolder: string | null;
  highlights: string[];
  fileSummaries: Record<string, string>;
  fileFormats: Record<string, FileFormat>;
};

const DEFAULT_META: Meta = {
  docTitle: "FILES",
  folderLabels: {},
  countLabels: {},
  openFolder: null,
  highlights: [],
  fileSummaries: {},
  fileFormats: {},
};

function safeRel(rel: string): string {
  const norm = path.normalize(rel);
  if (norm.startsWith("..") || path.isAbsolute(norm)) {
    throw new Error("Invalid path");
  }
  return norm;
}

async function walk(dir: string, base = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    if (e.name.startsWith(".") || e.name.startsWith("_")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await walk(full, base)));
    } else if (e.isFile() && e.name.endsWith(".md")) {
      files.push(path.relative(base, full));
    }
  }
  return files;
}

function parseFrontmatter(content: string): {
  data: Record<string, string>;
  body: string;
} {
  if (!content.startsWith("---\n")) return { data: {}, body: content };
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) return { data: {}, body: content };
  const raw = content.slice(4, end);
  const body = content.slice(end + 5);
  const data: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      data[m[1]] = v;
    }
  }
  return { data, body };
}

function serializeFrontmatter(
  data: Record<string, string>,
  body: string
): string {
  const keys = Object.keys(data).filter((k) => data[k] !== "");
  if (keys.length === 0) return body;
  const lines = keys.map((k) => {
    const v = data[k];
    const needsQuote = /[:#&*!|>%@`,\[\]{}]/.test(v) || /^\s|\s$/.test(v);
    return `${k}: ${needsQuote ? JSON.stringify(v) : v}`;
  });
  return `---\n${lines.join("\n")}\n---\n${body}`;
}

function deriveTitle(relPath: string, content: string): string {
  const { body } = parseFrontmatter(content);
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  const base = path.basename(relPath, ".md");
  return base.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function derivePreview(content: string): string {
  const { body } = parseFrontmatter(content);
  const text = body
    .replace(/^#+\s+.+$/gm, "")
    .replace(/\*\*|__|\*|_|`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
  return text.slice(0, 140);
}

function countWords(content: string): number {
  const { body } = parseFrontmatter(content);
  const text = body.replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>\-\[\]()]/g, " ");
  return (text.match(/\S+/g) || []).length;
}

function fallbackSummary(content: string): string {
  const { body } = parseFrontmatter(content);
  const text = body
    .replace(/^#+\s+.+$/gm, "")
    .replace(/\*\*|__|\*|_|`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
  const firstSentence = text.split(/(?<=[.!?])\s+/)[0] ?? text;
  return firstSentence.slice(0, 160);
}

export async function readMeta(): Promise<Meta> {
  try {
    const raw = await fs.readFile(META_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_META, ...parsed };
  } catch {
    return { ...DEFAULT_META };
  }
}

export async function writeMeta(meta: Meta): Promise<void> {
  await fs.mkdir(WRITING_DIR, { recursive: true });
  await fs.writeFile(META_FILE, JSON.stringify(meta, null, 2), "utf-8");
}

export async function patchMeta(patch: Partial<Meta>): Promise<Meta> {
  const meta = await readMeta();
  const next: Meta = { ...meta, ...patch };
  await writeMeta(next);
  return next;
}

export async function listFolders(): Promise<FolderMeta[]> {
  await fs.mkdir(WRITING_DIR, { recursive: true });
  const meta = await readMeta();
  const entries = await fs.readdir(WRITING_DIR, { withFileTypes: true });
  const folders: FolderMeta[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith(".") || e.name.startsWith("_")) continue;
    const inside = await walk(path.join(WRITING_DIR, e.name));
    folders.push({
      slug: e.name,
      name: meta.folderLabels[e.name] ?? prettify(e.name),
      count: inside.length,
      countLabel: meta.countLabels[e.name] ?? `${inside.length} items`,
    });
  }
  folders.sort((a, b) => a.slug.localeCompare(b.slug));
  return folders;
}

function prettify(slug: string): string {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function listFilesInFolder(slug: string): Promise<FileMeta[]> {
  const safe = safeRel(slug);
  const dir = path.join(WRITING_DIR, safe);
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const meta = await readMeta();
  const files: FileMeta[] = [];
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(".md")) continue;
    if (e.name.startsWith(".") || e.name.startsWith("_")) continue;
    const rel = path.join(safe, e.name);
    const full = path.join(WRITING_DIR, rel);
    const content = await fs.readFile(full, "utf-8");
    const { data } = parseFrontmatter(content);
    files.push({
      relPath: rel,
      filename: e.name,
      summary:
        meta.fileSummaries[rel] ??
        data.summary ??
        fallbackSummary(content),
      status: data.status ?? "draft",
      lang: data.lang ?? null,
      words: countWords(content),
      highlighted: meta.highlights.includes(rel),
    });
  }
  files.sort((a, b) => a.filename.localeCompare(b.filename));
  return files;
}

export type GlobalStats = {
  folderCount: number;
  entryCount: number;
  lineCount: number;
};

export async function globalStats(): Promise<GlobalStats> {
  const folders = await listFolders();
  let entries = 0;
  let lines = 0;
  for (const f of folders) {
    const files = await listFilesInFolder(f.slug);
    entries += files.length;
    for (const file of files) {
      const content = await fs.readFile(
        path.join(WRITING_DIR, file.relPath),
        "utf-8"
      );
      lines += content.split("\n").length;
    }
  }
  return {
    folderCount: folders.length,
    entryCount: entries,
    lineCount: lines,
  };
}

export async function listNotes(): Promise<NoteMeta[]> {
  const relPaths = await walk(WRITING_DIR);
  const notes: NoteMeta[] = [];
  for (const rel of relPaths) {
    const full = path.join(WRITING_DIR, rel);
    const stat = await fs.stat(full);
    const content = await fs.readFile(full, "utf-8");
    notes.push({
      slug: rel,
      relPath: rel,
      title: deriveTitle(rel, content),
      preview: derivePreview(content),
      mtime: stat.mtimeMs,
    });
  }
  return notes;
}

export async function readNote(relPath: string): Promise<string> {
  const full = path.join(WRITING_DIR, safeRel(relPath));
  return fs.readFile(full, "utf-8");
}

export async function writeNote(relPath: string, content: string): Promise<void> {
  const full = path.join(WRITING_DIR, safeRel(relPath));
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, "utf-8");
}

export async function renameFolder(
  oldSlug: string,
  newName: string
): Promise<void> {
  const safe = safeRel(oldSlug);
  const meta = await readMeta();
  meta.folderLabels[safe] = newName;
  await writeMeta(meta);
}

export async function renameFile(
  relPath: string,
  newFilename: string
): Promise<string> {
  const safe = safeRel(relPath);
  if (newFilename.includes("/") || newFilename.includes("\\")) {
    throw new Error("Invalid filename");
  }
  const cleaned = newFilename.endsWith(".md") ? newFilename : `${newFilename}.md`;
  const dir = path.dirname(safe);
  const target = path.join(dir, cleaned);
  const fullOld = path.join(WRITING_DIR, safe);
  const fullNew = path.join(WRITING_DIR, target);
  if (fullOld === fullNew) return target;
  await fs.rename(fullOld, fullNew);

  const meta = await readMeta();
  if (meta.fileSummaries[safe] !== undefined) {
    meta.fileSummaries[target] = meta.fileSummaries[safe];
    delete meta.fileSummaries[safe];
  }
  if (meta.fileFormats[safe] !== undefined) {
    meta.fileFormats[target] = meta.fileFormats[safe];
    delete meta.fileFormats[safe];
  }
  const hi = meta.highlights.indexOf(safe);
  if (hi >= 0) meta.highlights[hi] = target;
  await writeMeta(meta);

  return target;
}

export async function updateSummary(
  relPath: string,
  summary: string
): Promise<void> {
  const safe = safeRel(relPath);
  const meta = await readMeta();
  meta.fileSummaries[safe] = summary;
  await writeMeta(meta);
}

export async function updateFormat(
  relPath: string,
  format: FileFormat
): Promise<void> {
  const safe = safeRel(relPath);
  const meta = await readMeta();
  meta.fileFormats[safe] = format;
  await writeMeta(meta);
}

export async function getFormat(
  relPath: string
): Promise<FileFormat | null> {
  const safe = safeRel(relPath);
  const meta = await readMeta();
  return meta.fileFormats[safe] ?? null;
}

export async function createFolder(slug: string): Promise<string> {
  const cleaned = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  if (!cleaned) throw new Error("Invalid folder name");
  const safe = safeRel(cleaned);
  await fs.mkdir(path.join(WRITING_DIR, safe), { recursive: true });
  return safe;
}

export async function createNote(folderSlug: string): Promise<string> {
  const safe = safeRel(folderSlug);
  const dir = path.join(WRITING_DIR, safe);
  await fs.mkdir(dir, { recursive: true });
  let i = 1;
  while (i < 1000) {
    const name = `new-note-${i}.md`;
    const full = path.join(dir, name);
    try {
      await fs.access(full);
      i++;
    } catch {
      await fs.writeFile(full, "# new note\n\n", "utf-8");
      return path.join(safe, name);
    }
  }
  throw new Error("Could not allocate new note name");
}

export async function readLayout(): Promise<Layout> {
  try {
    const raw = await fs.readFile(LAYOUT_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function writeLayout(layout: Layout): Promise<void> {
  await fs.writeFile(LAYOUT_FILE, JSON.stringify(layout, null, 2), "utf-8");
}

export async function readAllContent(): Promise<
  { relPath: string; title: string; content: string }[]
> {
  const relPaths = await walk(WRITING_DIR);
  const out = [];
  for (const rel of relPaths) {
    const full = path.join(WRITING_DIR, rel);
    const content = await fs.readFile(full, "utf-8");
    out.push({ relPath: rel, title: deriveTitle(rel, content), content });
  }
  return out;
}

export { parseFrontmatter, serializeFrontmatter };
