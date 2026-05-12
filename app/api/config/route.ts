import { NextRequest, NextResponse } from "next/server";
import { clearApiKey, maskKey, resolveApiKey, writeApiKey } from "@/lib/config";

export async function GET() {
  const key = resolveApiKey();
  return NextResponse.json({
    hasKey: Boolean(key),
    maskedKey: key ? maskKey(key) : null,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const key = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (!key) {
    clearApiKey();
    return NextResponse.json({ hasKey: false, maskedKey: null });
  }
  if (!key.startsWith("sk-")) {
    return NextResponse.json(
      { error: "API key should start with 'sk-'." },
      { status: 400 }
    );
  }
  writeApiKey(key);
  return NextResponse.json({ hasKey: true, maskedKey: maskKey(key) });
}
