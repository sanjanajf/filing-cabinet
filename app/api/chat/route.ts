import { NextRequest, NextResponse } from "next/server";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { readAllContent, readMeta } from "@/lib/notes";
import { resolveApiKey } from "@/lib/config";

const SYSTEM_PROMPT = `You are a reflective, perceptive thinking partner for Sanjana — a writer who edits STATE OF THE ART, works at Y Combinator on Garry's List, and is starting to plan a book.

She is chatting with you about her own corpus of writing: drafts, fragments, observations, book notes, language-learning material, fiction. Below is the subset of her corpus currently in scope (one folder at a time). Reference specific pieces by title. Quote her own words back when relevant. Surface themes she has been circling but may not have noticed. Be direct and specific — no generic encouragement. Treat her like a writer.

If asked about something not present in the in-scope corpus, say so plainly and note that only the open folder is loaded.`;

function buildCorpusBlock(
  files: { relPath: string; title: string; content: string }[]
): string {
  const sections = files.map(
    (f) => `=== ${f.title} (${f.relPath}) ===\n${f.content}`
  );
  return sections.join("\n\n");
}

async function resolveScopeFolder(focusFile: string | null): Promise<string | null> {
  if (focusFile) {
    const dir = path.dirname(focusFile);
    if (dir && dir !== "." && dir !== "/") return dir;
  }
  const meta = await readMeta();
  return meta.openFolder ?? null;
}

export async function POST(req: NextRequest) {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "missing-api-key" },
      { status: 401 }
    );
  }
  const client = new Anthropic({ apiKey });

  const { messages, focusFile } = await req.json();
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  const scopeFolder = await resolveScopeFolder(
    typeof focusFile === "string" ? focusFile : null
  );

  const all = await readAllContent();
  const files = scopeFolder
    ? all.filter((f) => f.relPath.startsWith(`${scopeFolder}/`))
    : [];
  const corpus = buildCorpusBlock(files);

  const focused = typeof focusFile === "string"
    ? all.find((f) => f.relPath === focusFile)
    : undefined;

  const scopeHeader = scopeFolder
    ? `<scope folder="${scopeFolder}" file_count="${files.length}" />`
    : `<scope folder="(none — open a folder to load its notes)" file_count="0" />`;

  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: SYSTEM_PROMPT },
    {
      type: "text",
      text: `${scopeHeader}\n<corpus>\n${corpus}\n</corpus>`,
      cache_control: { type: "ephemeral" },
    },
  ];
  if (focused) {
    system.push({
      type: "text",
      text: `<focused_draft path="${focused.relPath}" title="${focused.title}">\nThe user is currently editing this draft. Unless they ask otherwise, prioritize this piece in your responses — quote from it, react to it, suggest concrete edits.\n\n${focused.content}\n</focused_draft>`,
    });
  }

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system,
      messages,
    });

    const textBlocks = response.content.filter((b) => b.type === "text");
    const reply = textBlocks.map((b) => (b as { text: string }).text).join("\n\n");

    return NextResponse.json({
      reply,
      usage: response.usage,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
