"use client";

import { Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_FORMAT, type DocFormat } from "./Win95Chrome";
import { Outline } from "./Outline";
import { parseHeadings, type Heading } from "@/lib/outline";

type Props = {
  slug: string;
  onClose: () => void;
  format: DocFormat;
  onFormatLoaded: (format: DocFormat) => void;
  outlineVisible: boolean;
  onOutlineToggle: () => void;
};

type Mode = "read" | "edit";

export function Editor({
  slug,
  onClose,
  format,
  onFormatLoaded,
  outlineVisible,
  onOutlineToggle,
}: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [savedContent, setSavedContent] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("read");
  const savedFormatRef = useRef<DocFormat>(format);
  const readRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const headings = useMemo<Heading[]>(
    () => (content === null ? [] : parseHeadings(content)),
    [content]
  );

  const handleJump = useCallback(
    (h: Heading) => {
      if (mode === "read") {
        const el = readRef.current?.querySelector<HTMLElement>(`#${cssEscape(h.slug)}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.selectionStart = ta.selectionEnd = h.charOffset;
      const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || format.size * 1.55;
      ta.scrollTop = Math.max(0, h.lineIndex * lineHeight - 40);
    },
    [mode, format.size]
  );

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ relPath: slug }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setStatus("error");
        } else {
          setContent(data.content);
          setSavedContent(data.content);
          const loaded: DocFormat = { ...DEFAULT_FORMAT, ...(data.format ?? {}) };
          savedFormatRef.current = loaded;
          onFormatLoaded(loaded);
          setStatus("idle");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(String(err));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (status !== "idle") return;
    if (sameFormat(format, savedFormatRef.current)) return;
    const id = setTimeout(() => {
      fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "format", relPath: slug, format }),
      })
        .then((r) => {
          if (r.ok) savedFormatRef.current = format;
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(id);
  }, [format, slug, status]);

  const saveContent = useCallback(
    async (next: string) => {
      setStatus("saving");
      try {
        const res = await fetch("/api/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ relPath: slug, content: next }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Save failed");
          setStatus("error");
          return;
        }
        setSavedContent(next);
        setStatus("idle");
      } catch (err) {
        setError(String(err));
        setStatus("error");
      }
    },
    [slug]
  );

  async function saveOnBlur() {
    if (content === null || content === savedContent) return;
    await saveContent(content);
  }

  function toggleHighlight() {
    if (content === null) return;
    const sel = typeof window !== "undefined" ? window.getSelection() : null;
    const text = sel?.toString() ?? "";
    if (!text.trim()) return;
    if (readRef.current && sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (!readRef.current.contains(range.commonAncestorContainer)) return;
    }
    const next = applyHighlight(content, text);
    if (next === content) return;
    setContent(next);
    sel?.removeAllRanges();
    saveContent(next);
  }

  const dirty = content !== null && content !== savedContent;

  const docStyle = {
    fontFamily: `"${format.font}", serif`,
    fontSize: `${format.size}px`,
    lineHeight: `${Math.round(format.size * 1.55)}px`,
    fontWeight: format.bold ? 700 : 400,
    fontStyle: format.italic ? "italic" : "normal",
    textDecoration: format.underline ? "underline" : "none",
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-2 py-1 border-b border-black gap-2">
        <button
          onClick={onClose}
          className="text-[#000080] underline text-[11px] font-sans hover:text-[#0000FF] shrink-0"
        >
          ← back to folder
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <ModeButton
            label="read"
            active={mode === "read"}
            onClick={() => setMode("read")}
          />
          <ModeButton
            label="edit"
            active={mode === "edit"}
            onClick={() => setMode("edit")}
          />
          <button
            onClick={toggleHighlight}
            disabled={mode !== "read" || content === null}
            title="Highlight selected text (Cmd+H)"
            className="text-[11px] font-sans px-2 py-px border border-t-white border-l-white border-b-[#404040] border-r-[#404040] bg-[#FFFF66] disabled:opacity-50 disabled:cursor-not-allowed active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white"
          >
            highlight
          </button>
        </div>
        <div className="font-sans text-[11px] text-[#404040] truncate flex-1 text-center">
          {slug}
        </div>
        <span className="text-[11px] font-sans shrink-0">
          {status === "loading" && <span className="text-[#808080]">loading…</span>}
          {status === "saving" && <span className="text-[#808080]">saving…</span>}
          {status === "error" && <span className="text-red-700">error</span>}
          {status === "idle" && dirty && <span className="text-[#404040]">unsaved</span>}
          {status === "idle" && !dirty && <span className="text-[#404040]">saved</span>}
        </span>
      </div>
      {error && (
        <div className="px-3 py-1 bg-[#FFFF66] text-red-800 text-[11px] font-sans border-b border-black">
          {error}
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        <Outline
          headings={headings}
          visible={outlineVisible}
          onToggle={onOutlineToggle}
          onJump={handleJump}
        />
        {mode === "edit" ? (
          <textarea
            ref={textareaRef}
            value={content ?? ""}
            onChange={(e) => setContent(e.target.value)}
            onBlur={saveOnBlur}
            disabled={content === null}
            style={docStyle}
            className="flex-1 p-6 resize-none outline-none w-full text-black"
            placeholder={content === null ? "" : "Start writing…"}
            spellCheck={true}
          />
        ) : (
          <div
            ref={readRef}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "h") {
                e.preventDefault();
                toggleHighlight();
              }
            }}
            tabIndex={0}
            style={docStyle}
            className="flex-1 px-10 py-8 overflow-auto outline-none text-black max-w-[760px] mx-auto w-full"
          >
            {content !== null && renderMarkdown(stripFrontmatter(content), headings)}
            {content === null && (
              <span className="text-[#808080] italic">loading…</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function cssEscape(s: string): string {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(s);
  return s.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] font-sans px-2 py-px ${
        active
          ? "border border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-[#E0E0E0]"
          : "border border-t-white border-l-white border-b-[#404040] border-r-[#404040] bg-[#C0C0C0]"
      }`}
    >
      {label}
    </button>
  );
}

function sameFormat(a: DocFormat, b: DocFormat) {
  return (
    a.font === b.font &&
    a.size === b.size &&
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.underline === b.underline
  );
}

function stripFrontmatter(content: string): string {
  if (!content.startsWith("---\n")) return content;
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) return content;
  return content.slice(end + 5).replace(/^\n+/, "");
}

function applyHighlight(content: string, selected: string): string {
  const text = selected.trim();
  if (!text) return content;
  const wrapped = `==${text}==`;
  const wrappedIdx = content.indexOf(wrapped);
  if (wrappedIdx >= 0) {
    return (
      content.slice(0, wrappedIdx) +
      text +
      content.slice(wrappedIdx + wrapped.length)
    );
  }
  const idx = content.indexOf(text);
  if (idx < 0) return content;
  return content.slice(0, idx) + `==${text}==` + content.slice(idx + text.length);
}

function renderMarkdown(text: string, headings: Heading[] = []): ReactNode {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\n+/);
  let headingCursor = 0;
  const nextSlug = (): string | undefined => {
    const h = headings[headingCursor++];
    return h?.slug;
  };
  return blocks.map((rawBlock, i) => {
    const block = rawBlock.trim();
    if (!block) return null;
    const h3 = block.match(/^###\s+(.+)$/);
    if (h3) {
      return (
        <h3 key={i} id={nextSlug()} className="font-bold text-[1.1em] mt-3 mb-1 scroll-mt-2">
          {renderInline(h3[1])}
        </h3>
      );
    }
    const h2 = block.match(/^##\s+(.+)$/);
    if (h2) {
      return (
        <h2 key={i} id={nextSlug()} className="font-bold text-[1.25em] mt-4 mb-2 scroll-mt-2">
          {renderInline(h2[1])}
        </h2>
      );
    }
    const h1 = block.match(/^#\s+(.+)$/);
    if (h1) {
      return (
        <h1 key={i} id={nextSlug()} className="font-bold text-[1.5em] mt-4 mb-2 scroll-mt-2">
          {renderInline(h1[1])}
        </h1>
      );
    }
    const lines = block.split("\n");
    return (
      <p key={i} className="mb-[1em] whitespace-pre-wrap">
        {lines.map((line, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {renderInline(line)}
          </Fragment>
        ))}
      </p>
    );
  });
}

const INLINE_RE = /(==[^=\n]+==)|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)|(`[^`\n]+`)/g;

function renderInline(text: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > lastIndex) tokens.push(text.slice(lastIndex, m.index));
    const match = m[0];
    if (match.startsWith("==")) {
      tokens.push(
        <mark key={key++} className="bg-[#FFFF66] px-px">
          {match.slice(2, -2)}
        </mark>
      );
    } else if (match.startsWith("**")) {
      tokens.push(<strong key={key++}>{match.slice(2, -2)}</strong>);
    } else if (match.startsWith("*")) {
      tokens.push(<em key={key++}>{match.slice(1, -1)}</em>);
    } else if (match.startsWith("`")) {
      tokens.push(
        <code key={key++} className="font-mono bg-[#F0F0F0] px-1 rounded-sm text-[0.95em]">
          {match.slice(1, -1)}
        </code>
      );
    }
    lastIndex = INLINE_RE.lastIndex;
  }
  if (lastIndex < text.length) tokens.push(text.slice(lastIndex));
  return tokens;
}
