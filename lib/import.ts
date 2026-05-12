import { serializeFrontmatter } from "./notes";

type Frontmatter = {
  source?: string;
  imported: string;
  type: string;
  status: string;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function titleFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, "");
  return stem.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildBody(title: string, parts: string[]): string {
  const trimmed = parts.map((p) => p.trim()).filter(Boolean);
  return `# ${title}\n\n${trimmed.join("\n\n")}\n`;
}

export async function pdfToMarkdown(
  buffer: Buffer,
  filename: string,
  assetRelPath: string
): Promise<{ markdown: string; suggestedFilename: string }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const text = await page.getTextContent();
    const lines: string[] = [];
    let line = "";
    let lastY: number | null = null;
    for (const item of text.items) {
      const it = item as { str: string; transform?: number[]; hasEOL?: boolean };
      const y = it.transform ? it.transform[5] : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
        if (line.trim()) lines.push(line.trim());
        line = "";
      }
      line += it.str;
      if (it.hasEOL) {
        if (line.trim()) lines.push(line.trim());
        line = "";
      }
      lastY = y;
    }
    if (line.trim()) lines.push(line.trim());
    const pageText = lines.join("\n");
    if (pageText.trim()) pages.push(pageText);
  }
  await doc.destroy();

  const title = titleFromFilename(filename);
  const body = buildBody(title, pages);

  const fm: Frontmatter = {
    source: assetRelPath,
    imported: todayISO(),
    type: "pdf",
    status: "imported",
  };
  const markdown = serializeFrontmatter(fm as unknown as Record<string, string>, body);

  const suggestedFilename = filenameStemToSlug(filename) + ".md";
  return { markdown, suggestedFilename };
}

export async function docxToMarkdown(
  buffer: Buffer,
  filename: string
): Promise<{ markdown: string; suggestedFilename: string }> {
  const mammothMod = await import("mammoth");
  const mammoth = (mammothMod.default ?? mammothMod) as unknown as {
    convertToMarkdown: (input: { buffer: Buffer }) => Promise<{ value: string }>;
  };
  const result = await mammoth.convertToMarkdown({ buffer });
  const title = titleFromFilename(filename);
  const body = `# ${title}\n\n${(result.value || "").trim()}\n`;

  const fm: Frontmatter = {
    imported: todayISO(),
    type: "docx",
    status: "imported",
  };
  const markdown = serializeFrontmatter(fm as unknown as Record<string, string>, body);
  const suggestedFilename = filenameStemToSlug(filename) + ".md";
  return { markdown, suggestedFilename };
}

export function imageToMarkdownStub(
  filename: string,
  assetRelPath: string
): { markdown: string; suggestedFilename: string } {
  const title = titleFromFilename(filename);
  const body = `# ${title}\n\n![${title}](../${assetRelPath})\n`;
  const fm: Frontmatter = {
    source: assetRelPath,
    imported: todayISO(),
    type: "image",
    status: "imported",
  };
  const markdown = serializeFrontmatter(fm as unknown as Record<string, string>, body);
  const suggestedFilename = filenameStemToSlug(filename) + ".md";
  return { markdown, suggestedFilename };
}

export function textToMarkdown(
  buffer: Buffer,
  filename: string
): { markdown: string; suggestedFilename: string } {
  const raw = buffer.toString("utf-8");
  const isMarkdown = /\.md$/i.test(filename);
  const content = isMarkdown ? raw : `# ${titleFromFilename(filename)}\n\n${raw}`;

  const hasFrontmatter = content.startsWith("---\n");
  const markdown = hasFrontmatter
    ? content
    : serializeFrontmatter(
        {
          imported: todayISO(),
          type: isMarkdown ? "md" : "txt",
          status: "imported",
        } as Record<string, string>,
        content
      );
  const suggestedFilename = filenameStemToSlug(filename) + ".md";
  return { markdown, suggestedFilename };
}

export function filenameStemToSlug(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, "");
  return (
    stem
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "imported"
  );
}

export type ImportKind = "pdf" | "docx" | "image" | "text" | "unsupported";

export function classify(filename: string): ImportKind {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  if (["md", "txt", "markdown"].includes(ext)) return "text";
  return "unsupported";
}
