export type Heading = {
  depth: 1 | 2 | 3;
  text: string;
  lineIndex: number;
  charOffset: number;
  slug: string;
};

export function parseHeadings(markdown: string): Heading[] {
  const lines = markdown.split("\n");
  const out: Heading[] = [];
  const seen = new Map<string, number>();
  let charOffset = 0;
  let inFrontmatter = false;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (i === 0 && line === "---") {
      inFrontmatter = true;
    } else if (inFrontmatter && line === "---") {
      inFrontmatter = false;
      charOffset += line.length + 1;
      continue;
    }

    if (!inFrontmatter && /^```/.test(line)) {
      inCodeBlock = !inCodeBlock;
    }

    if (!inFrontmatter && !inCodeBlock) {
      const m = line.match(/^(#{1,3})\s+(.+?)\s*$/);
      if (m) {
        const depth = m[1].length as 1 | 2 | 3;
        const text = m[2].trim();
        const slug = uniqueSlug(slugify(text), seen);
        out.push({ depth, text, lineIndex: i, charOffset, slug });
      }
    }

    charOffset += line.length + 1;
  }

  return out;
}

export function slugify(text: string): string {
  return (
    text
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[*_`~]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "heading"
  );
}

function uniqueSlug(base: string, seen: Map<string, number>): string {
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}
