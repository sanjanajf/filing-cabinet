import fs from "fs/promises";
import path from "path";
import os from "os";

const WRITING_DIR = path.join(os.homedir(), "writing");
const LAYOUT_FILE = path.join(WRITING_DIR, "layout.json");
const META_FILE = path.join(WRITING_DIR, "meta.json");
const TRASH_DIR = path.join(WRITING_DIR, "_deleted");
const FOLDER_SENTINEL = ".deleted-folder";
export const TRASH_SLUG = "__deleted__";

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
  folderOrder: string[];
  openFolder: string | null;
  highlights: string[];
  fileSummaries: Record<string, string>;
  fileFormats: Record<string, FileFormat>;
  defaultFormat: FileFormat;
  outlineVisible: boolean;
  deletedAt: Record<string, number>;
};

export type DeletedEntry = {
  key: string;
  kind: "file" | "folder";
  originalRelPath: string;
  deletedAt: number;
  displayName: string;
};

export const DEFAULT_FILE_FORMAT: FileFormat = {
  font: "Times New Roman",
  size: 14,
  bold: false,
  italic: false,
  underline: false,
};

const DEFAULT_META: Meta = {
  docTitle: "FILES",
  folderLabels: {},
  countLabels: {},
  folderOrder: [],
  openFolder: null,
  highlights: [],
  fileSummaries: {},
  fileFormats: {},
  defaultFormat: DEFAULT_FILE_FORMAT,
  outlineVisible: true,
  deletedAt: {},
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
    if (e.name.startsWith(".")) continue;
    if (e.name.startsWith("_") && e.name !== "_reflections") continue;
    const inside = await walk(path.join(WRITING_DIR, e.name));
    folders.push({
      slug: e.name,
      name: meta.folderLabels[e.name] ?? prettify(e.name),
      count: inside.length,
      countLabel: meta.countLabels[e.name] ?? `${inside.length} items`,
    });
  }
  const order = meta.folderOrder ?? [];
  const orderIndex = new Map(order.map((slug, i) => [slug, i]));
  folders.sort((a, b) => {
    const ai = orderIndex.get(a.slug);
    const bi = orderIndex.get(b.slug);
    if (ai !== undefined && bi !== undefined) return ai - bi;
    if (ai !== undefined) return -1;
    if (bi !== undefined) return 1;
    return a.slug.localeCompare(b.slug);
  });
  return folders;
}

export async function reorderFolders(order: string[]): Promise<void> {
  if (!Array.isArray(order)) throw new Error("order must be an array");
  const seen = new Set<string>();
  const clean: string[] = [];
  for (const slug of order) {
    if (typeof slug !== "string") continue;
    const safe = safeRel(slug);
    if (safe.includes("/")) continue;
    if (seen.has(safe)) continue;
    seen.add(safe);
    clean.push(safe);
  }
  await patchMeta({ folderOrder: clean });
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

export type SearchHit = {
  relPath: string;
  folder: string;
  filename: string;
  title: string;
  snippet: string;
  matchedIn: "filename" | "title" | "body";
  matchOffset: number;
  mtime: number;
};

function snippetAround(body: string, idx: number, qlen: number): string {
  const radius = 60;
  let start = Math.max(0, idx - radius);
  let end = Math.min(body.length, idx + qlen + radius);
  let text = body.slice(start, end);
  text = text.replace(/\s+/g, " ").trim();
  if (start > 0) text = "…" + text;
  if (end < body.length) text = text + "…";
  return text;
}

export async function searchAll(query: string, limit = 50): Promise<SearchHit[]> {
  const relPaths = await walk(WRITING_DIR);
  const q = query.trim().toLowerCase();
  const hits: SearchHit[] = [];
  for (const rel of relPaths) {
    const full = path.join(WRITING_DIR, rel);
    const stat = await fs.stat(full);
    const content = await fs.readFile(full, "utf-8");
    const { body } = parseFrontmatter(content);
    const title = deriveTitle(rel, content);
    const slash = rel.indexOf("/");
    const folder = slash >= 0 ? rel.slice(0, slash) : "";
    const filename = slash >= 0 ? rel.slice(slash + 1) : rel;

    if (!q) {
      hits.push({
        relPath: rel,
        folder,
        filename,
        title,
        snippet: derivePreview(content),
        matchedIn: "body",
        matchOffset: 0,
        mtime: stat.mtimeMs,
      });
      continue;
    }

    const filenameLower = filename.toLowerCase().replace(/\.md$/, "");
    const titleLower = title.toLowerCase();
    const bodyLower = body.toLowerCase();

    let matchedIn: SearchHit["matchedIn"] | null = null;
    let matchOffset = -1;
    let snippet = "";

    if (filenameLower.includes(q)) {
      matchedIn = "filename";
      matchOffset = filenameLower.indexOf(q);
      snippet = derivePreview(content);
    } else if (titleLower.includes(q)) {
      matchedIn = "title";
      matchOffset = titleLower.indexOf(q);
      snippet = derivePreview(content);
    } else {
      const i = bodyLower.indexOf(q);
      if (i >= 0) {
        matchedIn = "body";
        matchOffset = i;
        snippet = snippetAround(body, i, q.length);
      }
    }

    if (matchedIn) {
      hits.push({
        relPath: rel,
        folder,
        filename,
        title,
        snippet,
        matchedIn,
        matchOffset,
        mtime: stat.mtimeMs,
      });
    }
  }

  if (!q) {
    hits.sort((a, b) => b.mtime - a.mtime);
    return hits.slice(0, limit);
  }

  const rank = (h: SearchHit) =>
    h.matchedIn === "filename"
      ? 0
      : h.matchedIn === "title"
      ? 1
      : 2;
  hits.sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    if (a.matchOffset !== b.matchOffset) return a.matchOffset - b.matchOffset;
    return b.mtime - a.mtime;
  });
  return hits.slice(0, limit);
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

export async function getEffectiveFormat(
  relPath: string
): Promise<FileFormat> {
  const safe = safeRel(relPath);
  const meta = await readMeta();
  return meta.fileFormats[safe] ?? meta.defaultFormat ?? DEFAULT_FILE_FORMAT;
}

export async function updateDefaultFormat(format: FileFormat): Promise<void> {
  await patchMeta({ defaultFormat: format });
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

function sanitizeAssetName(name: string): string {
  const base = path.basename(name);
  const ext = path.extname(base).toLowerCase();
  const stem = base.slice(0, base.length - ext.length);
  const safeStem = stem
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, "");
  return (safeStem || "asset") + safeExt;
}

export async function writeAsset(
  buffer: Buffer,
  originalName: string
): Promise<string> {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const bucket = `${yyyy}-${mm}`;
  const dir = path.join(WRITING_DIR, "_assets", bucket);
  await fs.mkdir(dir, { recursive: true });

  const cleaned = sanitizeAssetName(originalName);
  const ext = path.extname(cleaned);
  const stem = cleaned.slice(0, cleaned.length - ext.length);

  let candidate = cleaned;
  let i = 2;
  while (i < 1000) {
    try {
      await fs.access(path.join(dir, candidate));
      candidate = `${stem}-${i}${ext}`;
      i++;
    } catch {
      break;
    }
  }
  await fs.writeFile(path.join(dir, candidate), buffer);
  return path.join("_assets", bucket, candidate);
}

export async function moveFile(
  relPath: string,
  newFolderSlug: string
): Promise<string> {
  const safe = safeRel(relPath);
  const safeFolder = safeRel(newFolderSlug);
  const filename = path.basename(safe);
  const target = path.join(safeFolder, filename);
  if (safe === target) return target;

  const fullOld = path.join(WRITING_DIR, safe);
  const fullNewDir = path.join(WRITING_DIR, safeFolder);
  const fullNew = path.join(fullNewDir, filename);

  await fs.mkdir(fullNewDir, { recursive: true });

  let finalTarget = target;
  let finalFull = fullNew;
  if (fullOld !== fullNew) {
    try {
      await fs.access(fullNew);
      const ext = path.extname(filename);
      const stem = filename.slice(0, filename.length - ext.length);
      let i = 2;
      while (i < 1000) {
        const candidate = `${stem}-${i}${ext}`;
        const candidateFull = path.join(fullNewDir, candidate);
        try {
          await fs.access(candidateFull);
          i++;
        } catch {
          finalTarget = path.join(safeFolder, candidate);
          finalFull = candidateFull;
          break;
        }
      }
    } catch {
      // destination is free
    }
    await fs.rename(fullOld, finalFull);
  }

  const meta = await readMeta();
  if (meta.fileSummaries[safe] !== undefined) {
    meta.fileSummaries[finalTarget] = meta.fileSummaries[safe];
    delete meta.fileSummaries[safe];
  }
  if (meta.fileFormats[safe] !== undefined) {
    meta.fileFormats[finalTarget] = meta.fileFormats[safe];
    delete meta.fileFormats[safe];
  }
  const hi = meta.highlights.indexOf(safe);
  if (hi >= 0) meta.highlights[hi] = finalTarget;
  await writeMeta(meta);

  return finalTarget;
}

async function allocateTrashKey(base: string): Promise<string> {
  await fs.mkdir(TRASH_DIR, { recursive: true });
  let candidate = base;
  let i = 2;
  while (i < 10_000) {
    try {
      await fs.access(path.join(TRASH_DIR, candidate));
    } catch {
      return candidate;
    }
    const ext = path.extname(base);
    const stem = base.slice(0, base.length - ext.length);
    candidate = `${stem}-${i}${ext}`;
    i++;
  }
  throw new Error("Could not allocate trash key");
}

function trashKeyForFile(relPath: string): string {
  const slash = relPath.indexOf("/");
  if (slash < 0) return `__${relPath}`;
  const folder = relPath.slice(0, slash);
  const filename = relPath.slice(slash + 1);
  return `${folder}__${filename}`;
}

function parseFileTrashKey(key: string): { folder: string; filename: string } {
  const sep = key.indexOf("__");
  if (sep < 0) return { folder: "", filename: key };
  return { folder: key.slice(0, sep), filename: key.slice(sep + 2) };
}

export async function deleteFile(relPath: string): Promise<void> {
  const safe = safeRel(relPath);
  const fullSrc = path.join(WRITING_DIR, safe);
  await fs.access(fullSrc);
  const baseKey = trashKeyForFile(safe);
  const key = await allocateTrashKey(baseKey);
  await fs.rename(fullSrc, path.join(TRASH_DIR, key));

  const meta = await readMeta();
  if (meta.fileSummaries[safe] !== undefined) delete meta.fileSummaries[safe];
  if (meta.fileFormats[safe] !== undefined) delete meta.fileFormats[safe];
  const hi = meta.highlights.indexOf(safe);
  if (hi >= 0) meta.highlights.splice(hi, 1);
  meta.deletedAt[key] = Date.now();
  await writeMeta(meta);
}

export async function deleteFolder(slug: string): Promise<void> {
  const safe = safeRel(slug);
  if (safe.includes("/")) throw new Error("Cannot delete nested folder");
  const fullSrc = path.join(WRITING_DIR, safe);
  const stat = await fs.stat(fullSrc);
  if (!stat.isDirectory()) throw new Error("Not a folder");
  const key = await allocateTrashKey(safe);
  const fullDest = path.join(TRASH_DIR, key);
  await fs.rename(fullSrc, fullDest);
  await fs.writeFile(path.join(fullDest, FOLDER_SENTINEL), "", "utf-8");

  const meta = await readMeta();
  if (meta.folderLabels[safe] !== undefined) delete meta.folderLabels[safe];
  if (meta.countLabels[safe] !== undefined) delete meta.countLabels[safe];
  if (Array.isArray(meta.folderOrder)) {
    meta.folderOrder = meta.folderOrder.filter((s) => s !== safe);
  }
  const prefix = safe + "/";
  for (const k of Object.keys(meta.fileSummaries)) {
    if (k.startsWith(prefix)) delete meta.fileSummaries[k];
  }
  for (const k of Object.keys(meta.fileFormats)) {
    if (k.startsWith(prefix)) delete meta.fileFormats[k];
  }
  meta.highlights = meta.highlights.filter((h) => !h.startsWith(prefix));
  if (meta.openFolder === safe) meta.openFolder = null;
  meta.deletedAt[key] = Date.now();
  await writeMeta(meta);
}

function safeTrashKey(key: string): string {
  if (!key || key.includes("/") || key.includes("\\") || key.includes("..")) {
    throw new Error("Invalid trash key");
  }
  return key;
}

async function isFolderTrashKey(key: string): Promise<boolean> {
  try {
    const st = await fs.stat(path.join(TRASH_DIR, key));
    return st.isDirectory();
  } catch {
    return false;
  }
}

export async function listDeleted(): Promise<DeletedEntry[]> {
  const meta = await readMeta();
  const out: DeletedEntry[] = [];
  for (const [key, ts] of Object.entries(meta.deletedAt)) {
    const folder = await isFolderTrashKey(key);
    if (folder) {
      out.push({
        key,
        kind: "folder",
        originalRelPath: key,
        deletedAt: ts,
        displayName: key,
      });
    } else {
      const { folder: f, filename } = parseFileTrashKey(key);
      const original = f ? `${f}/${filename}` : filename;
      out.push({
        key,
        kind: "file",
        originalRelPath: original,
        deletedAt: ts,
        displayName: original,
      });
    }
  }
  out.sort((a, b) => b.deletedAt - a.deletedAt);
  return out;
}

async function allocateRestorePath(
  dir: string,
  filename: string
): Promise<string> {
  const ext = path.extname(filename);
  const stem = filename.slice(0, filename.length - ext.length);
  let candidate = filename;
  let i = 2;
  while (i < 10_000) {
    try {
      await fs.access(path.join(dir, candidate));
    } catch {
      return candidate;
    }
    candidate = `${stem}-${i}${ext}`;
    i++;
  }
  throw new Error("Could not allocate restore path");
}

export async function restoreDeleted(key: string): Promise<void> {
  safeTrashKey(key);
  const meta = await readMeta();
  if (!(key in meta.deletedAt)) throw new Error("Not in trash");
  const fullSrc = path.join(TRASH_DIR, key);
  const folder = await isFolderTrashKey(key);

  if (folder) {
    let slug = key;
    let i = 2;
    while (i < 10_000) {
      try {
        await fs.access(path.join(WRITING_DIR, slug));
        slug = `${key}-${i}`;
        i++;
      } catch {
        break;
      }
    }
    const sentinel = path.join(fullSrc, FOLDER_SENTINEL);
    try {
      await fs.unlink(sentinel);
    } catch {
      // sentinel may have been removed already
    }
    await fs.rename(fullSrc, path.join(WRITING_DIR, slug));
  } else {
    const { folder: f, filename } = parseFileTrashKey(key);
    const targetDir = path.join(WRITING_DIR, f);
    await fs.mkdir(targetDir, { recursive: true });
    const finalName = await allocateRestorePath(targetDir, filename);
    await fs.rename(fullSrc, path.join(targetDir, finalName));
  }

  delete meta.deletedAt[key];
  await writeMeta(meta);
}

export async function purgeDeleted(key: string): Promise<void> {
  safeTrashKey(key);
  const full = path.join(TRASH_DIR, key);
  await fs.rm(full, { recursive: true, force: true });
  const meta = await readMeta();
  delete meta.deletedAt[key];
  await writeMeta(meta);
}

export async function emptyTrash(): Promise<void> {
  await fs.rm(TRASH_DIR, { recursive: true, force: true });
  const meta = await readMeta();
  meta.deletedAt = {};
  await writeMeta(meta);
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
