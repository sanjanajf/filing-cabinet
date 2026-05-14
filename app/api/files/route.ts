import { NextRequest, NextResponse } from "next/server";
import {
  listFolders,
  listFilesInFolder,
  readMeta,
  patchMeta,
  globalStats,
  renameFolder,
  renameFile,
  moveFile,
  updateSummary,
  updateDefaultFormat,
  createFolder,
  createNote,
  deleteFile,
  deleteFolder,
  listDeleted,
  restoreDeleted,
  purgeDeleted,
  emptyTrash,
} from "@/lib/notes";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const folder = sp.get("folder");
  const [folders, meta, stats, deleted] = await Promise.all([
    listFolders(),
    readMeta(),
    globalStats(),
    listDeleted(),
  ]);
  const requested = folder ?? meta.openFolder ?? folders[0]?.slug ?? null;
  const isTrash = requested === "__deleted__";
  const open = isTrash ? null : requested;
  const files = open ? await listFilesInFolder(open) : [];
  return NextResponse.json({
    folders,
    files,
    meta,
    stats,
    openFolder: requested,
    deleted,
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const op = body.op as string;
  try {
    if (op === "rename-folder") {
      await renameFolder(body.slug, body.name);
    } else if (op === "rename-file") {
      const next = await renameFile(body.relPath, body.filename);
      return NextResponse.json({ ok: true, relPath: next });
    } else if (op === "move-file") {
      const next = await moveFile(body.relPath, body.folder);
      return NextResponse.json({ ok: true, relPath: next });
    } else if (op === "outline-visible") {
      await patchMeta({ outlineVisible: Boolean(body.visible) });
    } else if (op === "summary") {
      await updateSummary(body.relPath, body.summary);
    } else if (op === "doc-title") {
      await patchMeta({ docTitle: body.docTitle });
    } else if (op === "open-folder") {
      await patchMeta({ openFolder: body.slug });
    } else if (op === "count-label") {
      const meta = await readMeta();
      meta.countLabels[body.slug] = body.label;
      await patchMeta({ countLabels: meta.countLabels });
    } else if (op === "default-format") {
      if (!body.format) {
        return NextResponse.json({ error: "format required" }, { status: 400 });
      }
      await updateDefaultFormat(body.format);
    } else if (op === "delete-file") {
      await deleteFile(body.relPath);
    } else if (op === "delete-folder") {
      await deleteFolder(body.slug);
    } else if (op === "restore") {
      await restoreDeleted(body.key);
    } else if (op === "purge") {
      await purgeDeleted(body.key);
    } else if (op === "empty-trash") {
      await emptyTrash();
    } else if (op === "toggle-highlight") {
      const meta = await readMeta();
      const idx = meta.highlights.indexOf(body.relPath);
      if (idx >= 0) meta.highlights.splice(idx, 1);
      else meta.highlights.push(body.relPath);
      await patchMeta({ highlights: meta.highlights });
    } else {
      return NextResponse.json({ error: `unknown op: ${op}` }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const op = body.op as string;
  try {
    if (op === "new-folder") {
      const slug = await createFolder(body.name ?? "new folder");
      return NextResponse.json({ ok: true, slug });
    }
    if (op === "new-note") {
      const relPath = await createNote(body.folder);
      return NextResponse.json({ ok: true, relPath });
    }
    return NextResponse.json({ error: `unknown op: ${op}` }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
