import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readAllContent } from "@/lib/notes";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a reflective, perceptive thinking partner for Sanjana — a writer who edits STATE OF THE ART, works at Y Combinator on Garry's List, and is starting to plan a book.

She is chatting with you about her own corpus of writing: drafts, fragments, observations, book notes, language-learning material, fiction. Below is the entire corpus. Reference specific pieces by title. Quote her own words back when relevant. Surface themes she has been circling but may not have noticed. Be direct and specific — no generic encouragement. Treat her like a writer.

If asked about something not present in the corpus, say so plainly.`;

function buildCorpusBlock(
  files: { relPath: string; title: string; content: string }[]
): string {
  const sections = files.map(
    (f) => `=== ${f.title} (${f.relPath}) ===\n${f.content}`
  );
  return sections.join("\n\n");
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set. Add it to .env.local and restart the dev server." },
      { status: 500 }
    );
  }

  const { messages, focusFile } = await req.json();
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  const files = await readAllContent();
  const corpus = buildCorpusBlock(files);

  const focused = typeof focusFile === "string"
    ? files.find((f) => f.relPath === focusFile)
    : undefined;

  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: SYSTEM_PROMPT },
    {
      type: "text",
      text: `<corpus>\n${corpus}\n</corpus>`,
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
