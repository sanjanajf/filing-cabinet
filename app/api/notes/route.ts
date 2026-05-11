import { NextRequest, NextResponse } from "next/server";
import { listNotes, readNote, writeNote, readLayout } from "@/lib/notes";

export async function GET() {
  const [notes, layout] = await Promise.all([listNotes(), readLayout()]);
  return NextResponse.json({ notes, layout });
}

export async function PUT(req: NextRequest) {
  const { relPath, content } = await req.json();
  if (typeof relPath !== "string" || typeof content !== "string") {
    return NextResponse.json({ error: "relPath and content required" }, { status: 400 });
  }
  await writeNote(relPath, content);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  // Used for reading a single note's full content
  const { relPath } = await req.json();
  if (typeof relPath !== "string") {
    return NextResponse.json({ error: "relPath required" }, { status: 400 });
  }
  const content = await readNote(relPath);
  return NextResponse.json({ content });
}
