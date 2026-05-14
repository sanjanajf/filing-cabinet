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
import { OpenFolder, TrashView } from "@/components/OpenFolder";
import { DocHeader } from "@/components/DocHeader";
import { Editor } from "@/components/Editor";
import { PlacementConfirm, type Placement } from "@/components/PlacementConfirm";
import { SettingsDialog } from "@/components/SettingsDialog";
import { SearchDialog } from "@/components/SearchDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { DeletedEntry, FileMeta, FolderMeta, Meta } from "@/lib/notes";
import { quoteOfDay } from "@/lib/quotes";
import { exportDocument, exportFolder, isElectron, tildify } from "@/lib/electron";

type FilesPayload = {
  folders: FolderMeta[];
  files: FileMeta[];
  meta: Meta;
  stats: { folderCount: number; entryCount: number; lineCount: number };
  openFolder: string | null;
  deleted: DeletedEntry[];
};

const TRASH_SLUG = "__deleted__";

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
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

export default function Page() {
  const [data, setData] = useState<FilesPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [defaultFormat, setDefaultFormat] = useState<DocFormat>(DEFAULT_FORMAT);
  const [noteFormat, setNoteFormat] = useState<DocFormat>(DEFAULT_FORMAT);
  const [saved, setSaved] = useState(true);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [outlineVisible, setOutlineVisible] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast((t) => (t === message ? null : t));
    }, 4000);
  }, []);

  const handleExportFile = useCallback(
    async (relPath: string) => {
      if (!isElectron()) {
        setLoadError("Export is only available in the desktop app");
        return;
      }
      try {
        const dest = await exportDocument(relPath);
        if (dest) showToast(`Exported to ${tildify(dest)}`);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : String(err));
      }
    },
    [showToast]
  );

  const handleExportFolder = useCallback(
    async (slug: string) => {
      if (!isElectron()) {
        setLoadError("Export is only available in the desktop app");
        return;
      }
      try {
        const result = await exportFolder(slug);
        if (!result) return;
        if (result.fileCount === 0) {
          showToast("Folder is empty");
        } else {
          showToast(`Exported to ${tildify(result.path)}`);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : String(err));
      }
    },
    [showToast]
  );

  const activeFormat = editingFile ? noteFormat : defaultFormat;

  const handleFormatChange = useCallback(
    (next: DocFormat) => {
      if (editingFile) {
        setNoteFormat(next);
        return;
      }
      setDefaultFormat(next);
      fetch("/api/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "default-format", format: next }),
      }).catch(() => {});
    },
    [editingFile]
  );
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
      if (payload.meta?.defaultFormat) {
        setDefaultFormat({ ...DEFAULT_FORMAT, ...payload.meta.defaultFormat });
      }
      if (typeof payload.meta?.outlineVisible === "boolean") {
        setOutlineVisible(payload.meta.outlineVisible);
      }
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
      setSaved(false);
      try {
        const res = await fetch("/api/files", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "open-folder", slug }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Save failed");
        }
        await fetchData(slug);
        setSaved(true);
      } catch (err) {
        setLoadError(String(err));
      }
    },
    [fetchData]
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

  const handleDeleteFile = useCallback(
    async (relPath: string) => {
      if (editingFile === relPath) setEditingFile(null);
      await ping({ op: "delete-file", relPath });
    },
    [editingFile, ping]
  );

  const handleDeleteFolder = useCallback(
    (slug: string) => {
      setConfirm({
        title: "Delete folder",
        message: `Move "${slug}" and all its files to Recently Deleted?`,
        confirmLabel: "Delete",
        onConfirm: async () => {
          setConfirm(null);
          const wasOpen = openSlug === slug;
          if (wasOpen) setOpenSlug(null);
          if (editingFile && editingFile.startsWith(slug + "/")) {
            setEditingFile(null);
          }
          setSaved(false);
          try {
            const res = await fetch("/api/files", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ op: "delete-folder", slug }),
            });
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || "Delete failed");
            }
            await fetchData(wasOpen ? undefined : openSlug ?? undefined);
            setSaved(true);
          } catch (err) {
            setLoadError(String(err));
          }
        },
      });
    },
    [editingFile, fetchData, openSlug]
  );

  const handleOpenTrash = useCallback(() => {
    setOpenSlug(TRASH_SLUG);
    setEditingFile(null);
  }, []);

  const handleRestore = useCallback(
    async (key: string) => {
      await ping({ op: "restore", key });
    },
    [ping]
  );

  const handlePurge = useCallback(
    (key: string) => {
      setConfirm({
        title: "Delete permanently",
        message: `Permanently delete "${key}"? This cannot be undone.`,
        confirmLabel: "Delete",
        onConfirm: async () => {
          setConfirm(null);
          await ping({ op: "purge", key });
        },
      });
    },
    [ping]
  );

  const handleEmptyTrash = useCallback(() => {
    setConfirm({
      title: "Empty Trash",
      message: "Permanently delete everything in Recently Deleted? This cannot be undone.",
      confirmLabel: "Empty Trash",
      onConfirm: async () => {
        setConfirm(null);
        await ping({ op: "empty-trash" });
      },
    });
  }, [ping]);

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
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNewNote]);

  const uploadFile = useCallback(
    async (file: File, targetFolder?: string) => {
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        if (targetFolder) form.append("folder", targetFolder);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        const placement: Placement = {
          relPath: data.relPath,
          filename: data.filename,
          suggestion: data.suggestion,
        };
        setPlacements((p) => [...p, placement]);
        const placedFolder = placement.suggestion.slug;
        setOpenSlug(placedFolder);
        await fetchData(placedFolder);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : String(err));
      } finally {
        setUploading(false);
      }
    },
    [fetchData]
  );

  const handleUploadFiles = useCallback(
    async (files: FileList | File[], targetFolder?: string) => {
      const list = Array.from(files);
      for (const f of list) {
        await uploadFile(f, targetFolder);
      }
    },
    [uploadFile]
  );

  const handleOutlineToggle = useCallback(() => {
    setOutlineVisible((v) => {
      const next = !v;
      fetch("/api/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "outline-visible", visible: next }),
      }).catch(() => {});
      return next;
    });
  }, []);

  useEffect(() => {
    let depth = 0;
    function hasFiles(e: DragEvent) {
      return Array.from(e.dataTransfer?.types ?? []).includes("Files");
    }
    function onDragEnter(e: DragEvent) {
      if (!hasFiles(e)) return;
      depth++;
      setDragging(true);
    }
    function onDragLeave(e: DragEvent) {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    }
    function onDragOver(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
    }
    function onDrop(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleUploadFiles(files, editingFile ? undefined : openSlug ?? undefined);
      }
    }
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [handleUploadFiles, editingFile, openSlug]);

  const handlePlacementConfirm = useCallback(
    (id: string) => {
      setPlacements((p) => p.filter((x) => x.relPath !== id));
      fetchData(openSlug ?? undefined).catch(() => {});
    },
    [fetchData, openSlug]
  );

  const handlePlacementChange = useCallback(
    (id: string, newRelPath: string) => {
      setPlacements((p) =>
        p.map((x) =>
          x.relPath === id ? { ...x, relPath: newRelPath, filename: newRelPath.split("/").pop() ?? x.filename } : x
        )
      );
      const newFolder = newRelPath.includes("/") ? newRelPath.split("/")[0] : undefined;
      if (newFolder) setOpenSlug(newFolder);
      fetchData(newFolder ?? openSlug ?? undefined).catch(() => {});
    },
    [fetchData, openSlug]
  );

  const handlePlacementDismiss = useCallback(
    (id: string) => {
      setPlacements((p) => p.filter((x) => x.relPath !== id));
    },
    []
  );

  return (
    <div
      className="relative flex flex-col w-[1408px] h-[868px] overflow-hidden bg-[#C0C0C0] font-chrome text-black border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040]"
      style={{ boxShadow: "1px 1px 0 #000000" }}
    >
      <TitleBar title="Workspace" />
      {placements.length > 0 && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-1 items-center">
          {placements.map((p) => (
            <PlacementConfirm
              key={p.relPath}
              placement={p}
              folders={data?.folders ?? []}
              onConfirm={handlePlacementConfirm}
              onChange={handlePlacementChange}
              onDismiss={handlePlacementDismiss}
            />
          ))}
        </div>
      )}
      {dragging && (
        <div className="absolute inset-0 z-40 bg-[#000080]/20 border-4 border-dashed border-[#000080] flex items-center justify-center pointer-events-none">
          <div className="bg-white border-2 border-black px-6 py-3 font-sans text-[14px] font-bold text-[#000080] shadow-[2px_2px_0_#00000044]">
            drop to import
          </div>
        </div>
      )}
      {uploading && (
        <div className="absolute top-2 right-2 z-50 bg-[#FFFFE0] border border-black px-2 py-1 font-sans text-[11px]">
          uploading…
        </div>
      )}
      <Toolbar
        onNewNote={handleNewNote}
        onSettings={() => setSettingsOpen(true)}
        format={activeFormat}
        onFormatChange={handleFormatChange}
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
              format={noteFormat}
              onFormatLoaded={setNoteFormat}
              outlineVisible={outlineVisible}
              onOutlineToggle={handleOutlineToggle}
              onExport={handleExportFile}
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
                    quote={quoteOfDay(now)}
                    rootCrumb="C:\files\"
                    openCrumb={folder?.slug ?? null}
                    stats={data.stats}
                    onEditTitle={handleEditTitle}
                    onClickRoot={() => setOpenSlug(null)}
                  />
                  <FolderGrid
                    folders={data.folders}
                    openFolder={openSlug}
                    trashCount={data.deleted?.length ?? 0}
                    onOpen={handleOpenFolder}
                    onOpenTrash={handleOpenTrash}
                    onRenameFolder={handleRenameFolder}
                    onRenameCount={handleRenameCount}
                    onNewFolder={handleNewFolder}
                    onNewNoteInFolder={handleNewNoteInFolder}
                    onDeleteFolder={handleDeleteFolder}
                    onExportFolder={handleExportFolder}
                  />
                  {openSlug === TRASH_SLUG ? (
                    <TrashView
                      entries={data.deleted ?? []}
                      onRestore={handleRestore}
                      onPurge={handlePurge}
                      onEmptyTrash={handleEmptyTrash}
                    />
                  ) : (
                    <OpenFolder
                      folder={folder}
                      files={data.files}
                      totalLines={totalLinesInOpen}
                      lastOpenedLabel="2 min ago"
                      onOpenFile={(rel) => setEditingFile(rel)}
                      onRenameFile={handleRenameFile}
                      onEditSummary={handleEditSummary}
                      onToggleHighlight={handleToggleHighlight}
                      onDeleteFile={handleDeleteFile}
                      onNewNote={handleNewNote}
                      onUpload={(fl) => handleUploadFiles(fl, folder?.slug)}
                      onExportFile={handleExportFile}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>

      </div>

      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {searchOpen && (
        <SearchDialog
          onClose={() => setSearchOpen(false)}
          onOpenFile={(relPath) => {
            const slash = relPath.indexOf("/");
            const folder = slash >= 0 ? relPath.slice(0, slash) : null;
            if (folder) setOpenSlug(folder);
            setEditingFile(relPath);
          }}
        />
      )}

      {toast && (
        <div className="absolute bottom-7 right-3 z-50 bg-[#FFFFE0] border border-black px-2 py-1 font-sans text-[11px] text-black shadow-[1px_1px_0_#00000044]">
          {toast}
        </div>
      )}
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
