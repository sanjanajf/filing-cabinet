import { NextRequest, NextResponse } from "next/server";
import { readLayout, writeLayout } from "@/lib/notes";

export async function GET() {
  const layout = await readLayout();
  return NextResponse.json(layout);
}

export async function PUT(req: NextRequest) {
  const layout = await req.json();
  if (typeof layout !== "object" || layout === null) {
    return NextResponse.json({ error: "layout object required" }, { status: 400 });
  }
  await writeLayout(layout);
  return NextResponse.json({ ok: true });
}
