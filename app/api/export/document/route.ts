import { NextRequest } from "next/server";
import path from "path";
import os from "os";
import fs from "fs/promises";

export const runtime = "nodejs";

const WRITING_DIR = path.join(os.homedir(), "writing");

function safeRel(rel: string): string {
  const norm = path.normalize(rel);
  if (!norm || norm.startsWith("..") || path.isAbsolute(norm)) {
    throw new Error("Invalid path");
  }
  return norm;
}

export async function GET(req: NextRequest) {
  const relPath = req.nextUrl.searchParams.get("relPath");
  if (!relPath) return new Response("relPath required", { status: 400 });
  let safe: string;
  try {
    safe = safeRel(relPath);
  } catch {
    return new Response("invalid relPath", { status: 400 });
  }
  let data: Buffer;
  try {
    data = await fs.readFile(path.join(WRITING_DIR, safe));
  } catch {
    return new Response("not found", { status: 404 });
  }
  const filename = path.basename(safe);
  const body = new Uint8Array(data);
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(body.byteLength),
    },
  });
}
