import { NextRequest, NextResponse } from "next/server";
import path from "path";
import {
  createFolder,
  listFolders,
  writeAsset,
  writeNote,
} from "@/lib/notes";
import {
  classify,
  docxToMarkdown,
  filenameStemToSlug,
  imageToMarkdownStub,
  pdfToMarkdown,
  textToMarkdown,
} from "@/lib/import";
import { suggestFolder, type FolderSuggestion } from "@/lib/categorize";

export const runtime = "nodejs";
export const maxDuration = 60;

type UploadResult = {
  relPath: string;
  suggestion: FolderSuggestion;
  filename: string;
};

async function ensureUniqueFilename(
  folderSlug: string,
  desiredFilename: string
): Promise<string> {
  const { listFilesInFolder } = await import("@/lib/notes");
  const files = await listFilesInFolder(folderSlug);
  const existing = new Set(files.map((f) => path.basename(f.relPath)));
  if (!existing.has(desiredFilename)) return desiredFilename;
  const ext = path.extname(desiredFilename);
  const stem = desiredFilename.slice(0, desiredFilename.length - ext.length);
  let i = 2;
  while (i < 1000) {
    const candidate = `${stem}-${i}${ext}`;
    if (!existing.has(candidate)) return candidate;
    i++;
  }
  return `${stem}-${Date.now()}${ext}`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid form data" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const targetFolder = form.get("folder");
  const explicitFolder =
    typeof targetFolder === "string" && targetFolder.trim() ? targetFolder.trim() : null;

  const filename = file.name || "imported";
  const kind = classify(filename);
  if (kind === "unsupported") {
    return NextResponse.json(
      { error: `Unsupported file type: ${filename}` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let result: { markdown: string; suggestedFilename: string };
  let extractedTextForCategorize = "";

  try {
    if (kind === "pdf") {
      const assetRel = await writeAsset(buffer, filename);
      const r = await pdfToMarkdown(buffer, filename, assetRel);
      result = r;
      extractedTextForCategorize = stripFrontmatterAndHeading(r.markdown);
    } else if (kind === "docx") {
      const r = await docxToMarkdown(buffer, filename);
      result = r;
      extractedTextForCategorize = stripFrontmatterAndHeading(r.markdown);
    } else if (kind === "image") {
      const assetRel = await writeAsset(buffer, filename);
      result = imageToMarkdownStub(filename, assetRel);
      extractedTextForCategorize = filename;
    } else {
      result = textToMarkdown(buffer, filename);
      extractedTextForCategorize = stripFrontmatterAndHeading(result.markdown);
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Extraction failed" },
      { status: 500 }
    );
  }

  const folders = await listFolders();

  let suggestion: FolderSuggestion;
  if (explicitFolder) {
    const match = folders.find((f) => f.slug === explicitFolder);
    suggestion = match
      ? { slug: match.slug, label: match.name, isNew: false }
      : { slug: explicitFolder, label: explicitFolder, isNew: true };
  } else {
    suggestion = await suggestFolder(extractedTextForCategorize, filename, folders);
  }

  let folderSlug = suggestion.slug;
  if (suggestion.isNew) {
    folderSlug = await createFolder(suggestion.slug);
    suggestion.slug = folderSlug;
  }

  const targetFilename = await ensureUniqueFilename(folderSlug, result.suggestedFilename);
  const relPath = path.join(folderSlug, targetFilename);
  await writeNote(relPath, result.markdown);

  const payload: UploadResult = {
    relPath,
    suggestion,
    filename: targetFilename,
  };
  return NextResponse.json(payload);
}

function stripFrontmatterAndHeading(md: string): string {
  let body = md;
  if (body.startsWith("---\n")) {
    const end = body.indexOf("\n---\n", 4);
    if (end >= 0) body = body.slice(end + 5);
  }
  return body.replace(/^#\s+.+\n+/, "").trim();
}
