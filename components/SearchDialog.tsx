"use client";

import { useEffect, useRef, useState } from "react";

const RAISED =
  "border border-t-white border-l-white border-b-[#404040] border-r-[#404040]";
const SUNKEN =
  "border border-t-[#404040] border-l-[#404040] border-b-white border-r-white";

type Hit = {
  relPath: string;
  folder: string;
  filename: string;
  title: string;
  snippet: string;
  matchedIn: "filename" | "title" | "body";
  matchOffset: number;
  mtime: number;
};

function highlight(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(ql, i);
    if (idx < 0) {
      nodes.push(text.slice(i));
      break;
    }
    if (idx > i) nodes.push(text.slice(i, idx));
    nodes.push(
      <span key={key++} className="bg-[#FFFF66] text-black">
        {text.slice(idx, idx + q.length)}
      </span>
    );
    i = idx + q.length;
  }
  return <>{nodes}</>;
}

export function SearchDialog({
  onClose,
  onOpenFile,
}: {
  onClose: () => void;
  onOpenFile: (relPath: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const id = ++reqId.current;
    const q = query.trim();
    setLoading(true);
    const t = setTimeout(
      () => {
        const url = q ? `/api/search?q=${encodeURIComponent(q)}` : "/api/search";
        fetch(url)
          .then((r) => r.json())
          .then((d: { hits: Hit[] }) => {
            if (id !== reqId.current) return;
            setHits(d.hits);
            setLoading(false);
            setActive(0);
          })
          .catch((e) => {
            if (id !== reqId.current) return;
            setError(String(e));
            setLoading(false);
          });
      },
      q ? 100 : 0
    );
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${active}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function commit(idx = active) {
    const r = hits[idx];
    if (!r) return;
    onOpenFile(r.relPath);
    onClose();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(hits.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-start justify-center bg-black/30 pt-20"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-[640px] bg-[#C0C0C0] ${RAISED}`}
        style={{ boxShadow: "2px 2px 0 #00000044" }}
      >
        <div className="flex items-center justify-between bg-[#000080] py-[3px] px-[6px] select-none">
          <span className="font-chrome font-bold text-[11px] leading-[14px] text-white">
            Find File
          </span>
          <button
            onClick={onClose}
            aria-label="Close search"
            className={`w-[18px] h-4 flex items-end justify-center pb-px bg-[#C0C0C0] text-black font-chrome font-bold text-[11px] leading-none ${RAISED}`}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-2 px-3 py-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search filenames, titles, content…"
            autoFocus
            className={`w-full py-[6px] px-2 bg-white font-body text-[13px] leading-[16px] text-black outline-none placeholder:text-[#808080] placeholder:italic ${SUNKEN}`}
          />

          {error && (
            <div className="font-chrome text-[11px] text-red-800 bg-[#FFFF66] px-2 py-1">
              {error}
            </div>
          )}

          <div
            ref={listRef}
            className={`bg-white max-h-[360px] overflow-auto ${SUNKEN}`}
          >
            {loading && hits.length === 0 && (
              <div className="px-3 py-4 font-body text-[12px] italic text-[#808080]">
                searching…
              </div>
            )}
            {!loading && hits.length === 0 && (
              <div className="px-3 py-4 font-body text-[12px] italic text-[#808080]">
                {query.trim() ? "no matches" : "no files yet"}
              </div>
            )}
            {hits.map((r, i) => {
              const isActive = i === active;
              return (
                <div
                  key={r.relPath}
                  data-idx={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => commit(i)}
                  className={`flex flex-col gap-[2px] px-3 py-[6px] cursor-default border-b border-[#E0E0E0] ${
                    isActive ? "bg-[#000080] text-white" : "text-black"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-body text-[13px] leading-[16px] truncate">
                      {highlight(r.title, query)}
                    </span>
                    <span
                      className={`shrink-0 font-chrome text-[10px] leading-[14px] ${
                        isActive ? "text-[#C0C0FF]" : "text-[#808080]"
                      }`}
                    >
                      {r.folder ? `C:\\files\\${r.folder}\\` : "C:\\files\\"}
                      {highlight(r.filename, query)}
                    </span>
                  </div>
                  {r.snippet && (
                    <div
                      className={`font-body text-[11px] leading-[14px] truncate ${
                        isActive ? "text-[#E0E0FF]" : "text-[#606060]"
                      }`}
                    >
                      {highlight(r.snippet, query)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between font-chrome text-[10px] leading-[14px] text-[#404040]">
            <span>↑↓ navigate · ↵ open · esc cancel</span>
            <span>
              {hits.length} result{hits.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
