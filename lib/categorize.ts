import Anthropic from "@anthropic-ai/sdk";
import type { FolderMeta } from "./notes";
import { resolveApiKey } from "./config";

export type FolderSuggestion = {
  slug: string;
  label: string;
  isNew: boolean;
};

const SYSTEM = `You place a captured note into a personal writing filing cabinet for Sanjana — a writer.
Look at the filename and the first chunk of content. Pick the single best EXISTING folder.

Reply with ONLY a single JSON object on one line, no prose, no markdown fence:
{"slug":"folder-slug","label":"Display Label","isNew":false}

Rules:
- STRONGLY prefer an existing folder. Even a loose thematic match is better than a new folder.
- Set isNew=false and use one of the existing slugs verbatim whenever any existing folder is a plausible home — including broad catch-alls like "inbox", "notes", "misc", "drafts", or "research" if one exists.
- Only set isNew=true when NO existing folder is even tangentially related AND the document represents a clearly distinct ongoing topic (not a one-off). When in doubt, pick an existing folder.
- If proposing a new folder is truly justified, use a 2-3 word kebab-case slug.`;

export async function suggestFolder(
  text: string,
  filename: string,
  folders: FolderMeta[]
): Promise<FolderSuggestion> {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return defaultSuggestion(folders);
  }

  const client = new Anthropic({ apiKey });
  const folderList =
    folders.length > 0
      ? folders.map((f) => `- ${f.slug} (label: "${f.name}")`).join("\n")
      : "(no folders exist yet)";

  const snippet = text.slice(0, 2000);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      system: [
        { type: "text", text: SYSTEM },
        {
          type: "text",
          text: `Existing folders:\n${folderList}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Filename: ${filename}\n\nFirst chars:\n${snippet}`,
        },
      ],
    });
    const block = response.content.find((b) => b.type === "text");
    const raw = block ? (block as { text: string }).text.trim() : "";
    const parsed = parseSuggestion(raw);
    if (parsed) return reconcile(parsed, folders);
  } catch {
    // fall through to default
  }
  return defaultSuggestion(folders);
}

function parseSuggestion(raw: string): FolderSuggestion | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    if (typeof obj.slug !== "string") return null;
    return {
      slug: slugify(obj.slug),
      label: typeof obj.label === "string" && obj.label.trim() ? obj.label : prettify(obj.slug),
      isNew: Boolean(obj.isNew),
    };
  } catch {
    return null;
  }
}

function reconcile(
  suggestion: FolderSuggestion,
  folders: FolderMeta[]
): FolderSuggestion {
  const match = folders.find((f) => f.slug === suggestion.slug);
  if (match) {
    return { slug: match.slug, label: match.name, isNew: false };
  }
  return { ...suggestion, isNew: true };
}

function defaultSuggestion(folders: FolderMeta[]): FolderSuggestion {
  if (folders.length === 0) {
    return { slug: "inbox", label: "Inbox", isNew: true };
  }
  const inbox = folders.find((f) => f.slug === "inbox");
  if (inbox) return { slug: inbox.slug, label: inbox.name, isNew: false };
  return { slug: folders[0].slug, label: folders[0].name, isNew: false };
}

function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function prettify(slug: string): string {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
