"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_FORMAT,
  Ruler,
  StatusBar,
  TitleBar,
  Toolbar,
  type DocFormat,
} from "@/components/Win95Chrome";
import { FolderGrid } from "@/components/FolderGrid";
import { OpenFolder } from "@/components/OpenFolder";
import { DocHeader } from "@/components/DocHeader";
import { Editor } from "@/components/Editor";
import { Chat } from "@/components/Chat";
import type { FileMeta, FolderMeta, Meta } from "@/lib/notes";

type FilesPayload = {
  folders: FolderMeta[];
  files: FileMeta[];
  meta: Meta;
  stats: { folderCount: number; entryCount: number; lineCount: number };
  openFolder: string | null;
};

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatTime(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const BYLINE = "Sanjana Friedman";

export default function Page() {
  const [data, setData] = useState<FilesPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [format, setFormat] = useState<DocFormat>(DEFAULT_FORMAT);
  const [saved, setSaved] = useState(true);
  const now = useClock();

  const fetchData = useCallback(async (folder?: string) => {
    try {
      const url = folder ? `/api/files?folder=${encodeURIComponent(folder)}` : "/api/files";
      const res = await fetch(url);
      const payload = (await res.json()) as FilesPayload | { error: string };
      if ("error" in payload) {
        setLoadError(payload.error);
        return;
      }
      setData(payload);
      setOpenSlug(payload.openFolder);
    } catch (err) {
      setLoadError(String(err));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const folder = useMemo<FolderMeta | null>(() => {
    if (!data) return null;
    return data.folders.find((f) => f.slug === openSlug) ?? null;
  }, [data, openSlug]);

  const totalLinesInOpen = useMemo(() => {
    if (!data) return 0;
    return data.files.reduce(
      (acc, f) => acc + Math.max(1, Math.round(f.words / 9)),
      0
    );
  }, [data]);

  const ping = useCallback(
    async (body: object, reload = true) => {
      setSaved(false);
      try {
        const res = await fetch("/api/files", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Save failed");
        }
        if (reload) await fetchData(openSlug ?? undefined);
        setSaved(true);
      } catch (err) {
        setLoadError(String(err));
      }
    },
    [fetchData, openSlug]
  );

  const handleOpenFolder = useCallback(
    async (slug: string) => {
      setOpenSlug(slug);
      await ping({ op: "open-folder", slug });
    },
    [ping]
  );

  const handleRenameFolder = useCallback(
    (slug: string, name: string) => {
      ping({ op: "rename-folder", slug, name });
    },
    [ping]
  );

  const handleRenameCount = useCallback(
    (slug: string, label: string) => {
      ping({ op: "count-label", slug, label });
    },
    [ping]
  );

  const handleRenameFile = useCallback(
    async (relPath: string, filename: string) => {
      setSaved(false);
      try {
        const res = await fetch("/api/files", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "rename-file", relPath, filename }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Rename failed");
        await fetchData(openSlug ?? undefined);
        setSaved(true);
      } catch (err) {
        setLoadError(String(err));
      }
    },
    [fetchData, openSlug]
  );

  const handleEditSummary = useCallback(
    (relPath: string, summary: string) => {
      ping({ op: "summary", relPath, summary });
    },
    [ping]
  );

  const handleToggleHighlight = useCallback(
    (relPath: string) => {
      ping({ op: "toggle-highlight", relPath });
    },
    [ping]
  );

  const handleEditTitle = useCallback(
    (docTitle: string) => {
      ping({ op: "doc-title", docTitle });
    },
    [ping]
  );

  const handleNewFolder = useCallback(async () => {
    const name = window.prompt("New folder name:");
    if (!name) return;
    setSaved(false);
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "new-folder", name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      await fetchData(data.slug);
      setOpenSlug(data.slug);
      setSaved(true);
    } catch (err) {
      setLoadError(String(err));
    }
  }, [fetchData]);

  const handleNewNoteInFolder = useCallback(
    async (slug: string) => {
      setSaved(false);
      try {
        const res = await fetch("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "new-note", folder: slug }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
        setOpenSlug(slug);
        await fetchData(slug);
        setEditingFile(data.relPath);
        setSaved(true);
      } catch (err) {
        setLoadError(String(err));
      }
    },
    [fetchData]
  );

  const handleNewNote = useCallback(async () => {
    if (!openSlug) return;
    await handleNewNoteInFolder(openSlug);
  }, [handleNewNoteInFolder, openSlug]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        handleNewNote();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setChatOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNewNote]);

  return (
    <div
      className="flex flex-col w-[1408px] h-[868px] overflow-hidden bg-[#C0C0C0] font-chrome text-black border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040]"
      style={{ boxShadow: "1px 1px 0 #000000" }}
    >
      <TitleBar title="Filing cabinet" />
      <Toolbar
        onNewNote={handleNewNote}
        onChat={() => setChatOpen((v) => !v)}
        chatOpen={chatOpen}
        format={format}
        onFormatChange={editingFile ? setFormat : undefined}
      />
      <Ruler />

      <div className="flex-1 flex gap-4 bg-[#808080] py-4 px-6 overflow-hidden">
        <div
          className="flex-1 flex flex-col bg-white overflow-hidden"
          style={{ boxShadow: "2px 2px 0 #00000044" }}
        >
          {editingFile ? (
            <Editor
              slug={editingFile}
              onClose={() => setEditingFile(null)}
              format={format}
              onFormatLoaded={setFormat}
            />
          ) : (
            <div className="flex-1 flex flex-col py-5 px-8 gap-[14px] overflow-auto">
              {loadError && (
                <div className="bg-[#FFFF66] border border-black px-2 py-1 font-chrome text-[11px]">
                  {loadError}
                </div>
              )}
              {!data && !loadError && (
                <div className="text-[#808080] italic text-[13px] font-body">
                  loading…
                </div>
              )}
              {data && (
                <>
                  <DocHeader
                    docTitle={data.meta.docTitle}
                    byline={BYLINE}
                    date={formatDate(now)}
                    rootCrumb="C:\files\"
                    openCrumb={folder?.slug ?? null}
                    stats={data.stats}
                    onEditTitle={handleEditTitle}
                    onClickRoot={() => setOpenSlug(null)}
                  />
                  <FolderGrid
                    folders={data.folders}
                    openFolder={openSlug}
                    onOpen={handleOpenFolder}
                    onRenameFolder={handleRenameFolder}
                    onRenameCount={handleRenameCount}
                    onNewFolder={handleNewFolder}
                    onNewNoteInFolder={handleNewNoteInFolder}
                  />
                  <OpenFolder
                    folder={folder}
                    files={data.files}
                    totalLines={totalLinesInOpen}
                    lastOpenedLabel="2 min ago"
                    onOpenFile={(rel) => setEditingFile(rel)}
                    onRenameFile={handleRenameFile}
                    onEditSummary={handleEditSummary}
                    onToggleHighlight={handleToggleHighlight}
                    onNewNote={handleNewNote}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {chatOpen && (
          <div className="w-[320px] shrink-0">
            <Chat onClose={() => setChatOpen(false)} focusFile={editingFile} />
          </div>
        )}
      </div>

      <StatusBar
        page={1}
        section={1}
        pages={1}
        noteCount={data?.stats.entryCount ?? 0}
        lineCount={data?.stats.lineCount ?? 0}
        clock={formatTime(now)}
        saved={saved}
      />
    </div>
  );
}
