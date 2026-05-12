"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_FORMAT, type DocFormat } from "./Win95Chrome";

type Props = {
  slug: string;
  onClose: () => void;
  format: DocFormat;
  onFormatLoaded: (format: DocFormat) => void;
};

export function Editor({ slug, onClose, format, onFormatLoaded }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [savedContent, setSavedContent] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const savedFormatRef = useRef<DocFormat>(format);

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

  async function save() {
    if (content === null || content === savedContent) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relPath: slug, content }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Save failed");
        setStatus("error");
        return;
      }
      setSavedContent(content);
      setStatus("idle");
    } catch (err) {
      setError(String(err));
      setStatus("error");
    }
  }

  const dirty = content !== null && content !== savedContent;

  const textareaStyle = {
    fontFamily: `"${format.font}", serif`,
    fontSize: `${format.size}px`,
    lineHeight: `${Math.round(format.size * 1.45)}px`,
    fontWeight: format.bold ? 700 : 400,
    fontStyle: format.italic ? "italic" : "normal",
    textDecoration: format.underline ? "underline" : "none",
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-2 py-1 border-b border-black">
        <button
          onClick={onClose}
          className="text-[#000080] underline text-[11px] font-sans hover:text-[#0000FF]"
        >
          ← back to folder
        </button>
        <div className="font-sans text-[11px] text-[#404040] truncate ml-2">
          {slug}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-sans">
            {status === "loading" && <span className="text-[#808080]">loading…</span>}
            {status === "saving" && <span className="text-[#808080]">saving…</span>}
            {status === "error" && <span className="text-red-700">error</span>}
            {status === "idle" && dirty && <span className="text-[#404040]">unsaved</span>}
            {status === "idle" && !dirty && <span className="text-[#404040]">saved</span>}
          </span>
        </div>
      </div>
      {error && (
        <div className="px-3 py-1 bg-[#FFFF66] text-red-800 text-[11px] font-sans border-b border-black">
          {error}
        </div>
      )}
      <textarea
        value={content ?? ""}
        onChange={(e) => setContent(e.target.value)}
        onBlur={save}
        disabled={content === null}
        style={textareaStyle}
        className="flex-1 p-6 resize-none outline-none w-full text-black"
        placeholder={content === null ? "" : "Start writing…"}
        spellCheck={true}
      />
    </div>
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
