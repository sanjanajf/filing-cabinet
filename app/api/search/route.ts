import { NextRequest, NextResponse } from "next/server";
import { searchAll } from "@/lib/notes";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const hits = await searchAll(q);
  return NextResponse.json({ hits });
}
