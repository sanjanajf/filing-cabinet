import { NextResponse } from "next/server";
import path from "path";
import { writeNote } from "@/lib/notes";
import {
  EmptyVaultError,
  NoApiKeyError,
  reflectOnVault,
  reflectionFilename,
} from "@/lib/reflect";

export const runtime = "nodejs";
export const maxDuration = 120;

const REFLECTIONS_FOLDER = "_reflections";

export async function POST(): Promise<NextResponse> {
  let body: string;
  try {
    body = await reflectOnVault();
  } catch (err) {
    if (err instanceof NoApiKeyError) {
      return NextResponse.json(
        { error: "No Anthropic API key configured. Open Settings to add one.", code: "NO_API_KEY" },
        { status: 400 }
      );
    }
    if (err instanceof EmptyVaultError) {
      return NextResponse.json(
        { error: "No notes to reflect on yet.", code: "EMPTY_VAULT" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reflection failed" },
      { status: 500 }
    );
  }

  const filename = reflectionFilename(new Date());
  const relPath = path.join(REFLECTIONS_FOLDER, filename);
  const content = `# Reflection ${filename.replace(/\.md$/, "")}\n\n${body}\n`;
  await writeNote(relPath, content);

  return NextResponse.json({ relPath, filename });
}
