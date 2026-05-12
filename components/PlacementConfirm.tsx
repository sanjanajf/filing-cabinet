"use client";

import { useEffect, useState } from "react";
import type { FolderMeta } from "@/lib/notes";

export type Placement = {
  relPath: string;
  filename: string;
  suggestion: { slug: string; label: string; isNew: boolean };
};

type Props = {
  placement: Placement;
  folders: FolderMeta[];
  onConfirm: (id: string) => void;
  onChange: (id: string, newRelPath: string) => void;
  onDismiss: (id: string) => void;
};

const AUTO_ACCEPT_MS = 6000;

export function PlacementConfirm({
  placement,
  folders,
  onConfirm,
  onChange,
  onDismiss,
}: Props) {
  const [selected, setSelected] = useState<string>(placement.suggestion.slug);
  const [remainingMs, setRemainingMs] = useState(AUTO_ACCEPT_MS);
  const [paused, setPaused] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRelPath, setCurrentRelPath] = useState(placement.relPath);

  const placementId = placement.relPath;

  useEffect(() => {
    if (paused || working) return;
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const next = Math.max(0, AUTO_ACCEPT_MS - elapsed);
      setRemainingMs(next);
      if (next === 0) {
        clearInterval(tick);
        onConfirm(placementId);
      }
    }, 100);
    return () => clearInterval(tick);
  }, [paused, working, placementId, onConfirm]);

  async function applyChangeAndConfirm() {
    if (selected === currentSlugFromPath(currentRelPath)) {
      onConfirm(placementId);
      return;
    }
    setWorking(true);
    setError(null);
    try {
      let folderSlug = selected;
      const isNewFolder = !folders.some((f) => f.slug === selected);
      if (isNewFolder) {
        const res = await fetch("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "new-folder", name: selected }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create folder");
        folderSlug = data.slug;
      }
      const res = await fetch("/api/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "move-file", relPath: currentRelPath, folder: folderSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to move");
      setCurrentRelPath(data.relPath);
      onChange(placementId, data.relPath);
      onConfirm(placementId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setWorking(false);
    }
  }

  const secondsLeft = Math.ceil(remainingMs / 1000);
  const isNewSelected = !folders.some((f) => f.slug === selected);

  return (
    <div
      className="bg-[#FFFFE0] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] shadow-[2px_2px_0_#00000044] px-3 py-2 flex items-center gap-2 font-sans text-[11px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="text-[#404040]">imported</span>
      <span className="font-bold">{placement.filename}</span>
      <span className="text-[#404040]">→</span>
      <select
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);
          setPaused(true);
        }}
        className="bg-white border border-[#404040] px-1 py-px font-sans text-[11px]"
      >
        {placement.suggestion.isNew && !folders.some((f) => f.slug === placement.suggestion.slug) && (
          <option value={placement.suggestion.slug}>
            new: {placement.suggestion.label}
          </option>
        )}
        {folders.map((f) => (
          <option key={f.slug} value={f.slug}>
            {f.name}
          </option>
        ))}
      </select>
      {isNewSelected && (
        <span className="text-[#000080] text-[10px]">new folder</span>
      )}
      <button
        onClick={applyChangeAndConfirm}
        disabled={working}
        className="px-2 py-px border border-t-white border-l-white border-b-[#404040] border-r-[#404040] bg-[#C0C0C0] active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white disabled:opacity-50"
      >
        {working ? "moving…" : `confirm (${secondsLeft})`}
      </button>
      <button
        onClick={() => onDismiss(placementId)}
        disabled={working}
        className="text-[#404040] hover:text-black px-1"
        title="Dismiss"
      >
        ✕
      </button>
      {error && (
        <span className="text-red-700 text-[10px] ml-2 max-w-[200px] truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}

function currentSlugFromPath(relPath: string): string {
  const idx = relPath.indexOf("/");
  return idx < 0 ? relPath : relPath.slice(0, idx);
}
