import { NextRequest, NextResponse } from "next/server";
import {
  listNotes,
  readNote,
  writeNote,
  readLayout,
  getEffectiveFormat,
  updateFormat,
  type FileFormat,
} from "@/lib/notes";

export async function GET() {
  const [notes, layout] = await Promise.all([listNotes(), readLayout()]);
  return NextResponse.json({ notes, layout });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (body.op === "format") {
    const { relPath, format } = body as { relPath: string; format: FileFormat };
    if (typeof relPath !== "string" || !format) {
      return NextResponse.json({ error: "relPath and format required" }, { status: 400 });
    }
    await updateFormat(relPath, format);
    return NextResponse.json({ ok: true });
  }
  const { relPath, content } = body;
  if (typeof relPath !== "string" || typeof content !== "string") {
    return NextResponse.json({ error: "relPath and content required" }, { status: 400 });
  }
  await writeNote(relPath, content);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const { relPath } = await req.json();
  if (typeof relPath !== "string") {
    return NextResponse.json({ error: "relPath required" }, { status: 400 });
  }
  const [content, format] = await Promise.all([
    readNote(relPath),
    getEffectiveFormat(relPath),
  ]);
  return NextResponse.json({ content, format });
}
