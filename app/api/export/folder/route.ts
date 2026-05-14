import { NextRequest } from "next/server";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { Readable } from "stream";
import { createRequire } from "module";

const archiver = createRequire(import.meta.url)("archiver") as typeof import("archiver");

export const runtime = "nodejs";

const WRITING_DIR = path.join(os.homedir(), "writing");

function safeRel(rel: string): string {
  const norm = path.normalize(rel);
  if (!norm || norm.startsWith("..") || path.isAbsolute(norm)) {
    throw new Error("Invalid path");
  }
  return norm;
}

async function walkMd(dir: string, base = dir): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith(".") || e.name.startsWith("_")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkMd(full, base)));
    } else if (e.isFile() && e.name.endsWith(".md")) {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

export async function HEAD(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return new Response(null, { status: 400 });
  let safe: string;
  try {
    safe = safeRel(slug);
  } catch {
    return new Response(null, { status: 400 });
  }
  const mdFiles = await walkMd(path.join(WRITING_DIR, safe));
  return new Response(null, {
    headers: { "X-File-Count": String(mdFiles.length) },
  });
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return new Response("slug required", { status: 400 });
  let safe: string;
  try {
    safe = safeRel(slug);
  } catch {
    return new Response("invalid slug", { status: 400 });
  }
  const sourceDir = path.join(WRITING_DIR, safe);
  const mdFiles = await walkMd(sourceDir);

  const archive = archiver("zip", { zlib: { level: 9 } });
  for (const rel of mdFiles) {
    archive.file(path.join(sourceDir, rel), { name: rel });
  }
  archive.finalize();

  const stream = Readable.toWeb(archive) as ReadableStream<Uint8Array>;

  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${path.basename(safe)}.zip"`,
      "X-File-Count": String(mdFiles.length),
    },
  });
}
