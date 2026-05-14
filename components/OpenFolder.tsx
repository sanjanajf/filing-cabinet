"use client";

import { useEffect, useRef, useState } from "react";
import type { DeletedEntry, FileMeta, FolderMeta } from "@/lib/notes";
import { InlineEdit } from "./InlineEdit";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { TrashGlyph } from "./RetroIcons";

type Props = {
  folder: FolderMeta | null;
  folders: FolderMeta[];
  files: FileMeta[];
  totalLines: number;
  lastOpenedLabel: string;
  onOpenFile: (relPath: string) => void;
  onRenameFile: (relPath: string, filename: string) => void;
  onEditSummary: (relPath: string, summary: string) => void;
  onToggleHighlight: (relPath: string) => void;
  onDeleteFile: (relPath: string) => void;
  onMoveFile: (relPath: string, folderSlug: string) => void;
  onNewNote: () => void;
  onUpload: (files: FileList) => void;
  onExportFile: (relPath: string) => void;
};

export function OpenFolder({
  folder,
  folders,
  files,
  totalLines,
  lastOpenedLabel,
  onOpenFile,
  onRenameFile,
  onEditSummary,
  onToggleHighlight,
  onDeleteFile,
  onMoveFile,
  onNewNote,
  onUpload,
  onExportFile,
}: Props) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; relPath: string } | null>(
    null
  );
  if (!folder) return null;

  return (
    <div className="flex flex-col pt-4 px-1 gap-[10px] border-t border-dashed border-[#808080]">
      <div className="flex items-baseline gap-2">
        <span className="font-body font-bold text-black text-[16px] leading-5">
          <FolderGlyph />
          {"   "}
          {folder.slug}\
        </span>
        <span className="font-chrome text-[11px] leading-[14px] text-[#808080]">
          — {files.length} files, {totalLines.toLocaleString()} lines · last
          opened {lastOpenedLabel}
        </span>
      </div>

      <div className="flex flex-col pl-5 gap-[10px]">
        {files.map((f) => (
          <FileRow
            key={f.relPath}
            file={f}
            onOpen={() => onOpenFile(f.relPath)}
            onRename={(name) => onRenameFile(f.relPath, name)}
            onEditSummary={(s) => onEditSummary(f.relPath, s)}
            onToggleHighlight={() => onToggleHighlight(f.relPath)}
            onDelete={() => onDeleteFile(f.relPath)}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenu({ x: e.clientX, y: e.clientY, relPath: f.relPath });
            }}
          />
        ))}
        <div className="pt-[6px] flex flex-col gap-1">
          <button
            onClick={onNewNote}
            className="text-left font-body italic text-[12px] leading-4 text-[#808080] hover:text-[#000080]"
          >
            — [ + new note in {folder.slug}\ ] | Ctrl+N
          </button>
          <button
            onClick={() => uploadInputRef.current?.click()}
            className="text-left font-body italic text-[12px] leading-4 text-[#808080] hover:text-[#000080]"
          >
            — [ + upload to {folder.slug}\ ] (pdf, docx, md, txt, image)
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.md,.markdown,.txt,.png,.jpg,.jpeg,.gif,.webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUpload(e.target.files);
                e.target.value = "";
              }
            }}
          />
        </div>
      </div>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={fileMenuItems(menu.relPath, folder.slug, folders, {
            onOpenFile,
            onExportFile,
            onDeleteFile,
            onMoveFile,
          })}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

function fileMenuItems(
  relPath: string,
  currentFolderSlug: string,
  folders: FolderMeta[],
  handlers: {
    onOpenFile: (relPath: string) => void;
    onExportFile: (relPath: string) => void;
    onDeleteFile: (relPath: string) => void;
    onMoveFile: (relPath: string, folderSlug: string) => void;
  }
): ContextMenuItem[] {
  const otherFolders = folders.filter((f) => f.slug !== currentFolderSlug);
  const moveSubmenu: ContextMenuItem[] = otherFolders.length
    ? otherFolders.map((f) => ({
        label: f.name,
        onClick: () => handlers.onMoveFile(relPath, f.slug),
      }))
    : [{ label: "(no other folders)", disabled: true }];

  return [
    { label: "Open", onClick: () => handlers.onOpenFile(relPath) },
    { label: "Move to…", submenu: moveSubmenu },
    { label: "Export…", onClick: () => handlers.onExportFile(relPath) },
    {
      label: "Delete",
      onClick: () => handlers.onDeleteFile(relPath),
      danger: true,
    },
  ];
}

function FileRow({
  file,
  onOpen,
  onRename,
  onEditSummary,
  onToggleHighlight,
  onDelete,
  onContextMenu,
}: {
  file: FileMeta;
  onOpen: () => void;
  onRename: (n: string) => void;
  onEditSummary: (s: string) => void;
  onToggleHighlight: () => void;
  onDelete: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onContextMenu={onContextMenu}
      className={`group flex flex-col gap-px ${
        file.highlighted ? "bg-[#FFFF66] -mx-1 px-1" : ""
      }`}
    >
      <div className="flex items-baseline gap-2">
        <button
          onClick={onOpen}
          title="Open file"
          aria-label={`Open ${file.filename}`}
          className="font-body font-bold text-[14px] leading-[18px] text-black hover:text-[#000080] cursor-pointer select-none"
        >
          —
        </button>
        <FilenameLink
          filename={file.filename}
          onOpen={onOpen}
          onRename={onRename}
        />
        <span className="font-chrome text-[10px] leading-3 text-[#808080]">
          <span
            onClick={onToggleHighlight}
            className="cursor-pointer hover:bg-[#FFFF66] px-0.5"
            title={file.highlighted ? "Remove highlight" : "Highlight row"}
          >
            {file.status}
          </span>
          {" · "}
          {file.words.toLocaleString()} words
          {file.lang && (
            <>
              {" · "}
              <span className="uppercase tracking-wide">{file.lang}</span>
            </>
          )}
        </span>
        <button
          type="button"
          onClick={onDelete}
          title={`Delete ${file.filename}`}
          aria-label={`Delete ${file.filename}`}
          className="ml-1 text-[#808080] hover:text-[#800000] opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <TrashGlyph size={12} />
        </button>
      </div>
      <div className="pl-5">
        <InlineEdit
          value={file.summary}
          onCommit={onEditSummary}
          multiline
          ariaLabel={`Edit summary for ${file.filename}`}
          placeholder="(add a one-sentence summary)"
          className="block w-full font-body text-[12px] leading-[17px] text-black"
        />
      </div>
    </div>
  );
}

function FilenameLink({
  filename,
  onOpen,
  onRename,
}: {
  filename: string;
  onOpen: () => void;
  onRename: (name: string) => void;
}) {
  const stem = filename.replace(/\.md$/, "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(stem);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(stem);
  }, [stem, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft && draft !== stem) onRename(draft);
  }

  if (editing) {
    return (
      <>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setDraft(stem);
              setEditing(false);
            }
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            e.stopPropagation();
          }}
          className="font-body font-bold text-[14px] leading-[18px] text-[#000080] underline decoration-[1px] underline-offset-2 bg-[#FFFF66] outline outline-1 outline-[#000080]"
          aria-label={`Rename ${filename}`}
        />
        <span className="font-body font-bold text-[14px] leading-[18px] text-[#000080] underline decoration-[1px] underline-offset-2 select-none">
          .md
        </span>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        title={`Open ${filename}`}
        className="font-body font-bold text-[14px] leading-[18px] text-[#000080] underline decoration-[1px] underline-offset-2 hover:bg-[#FFFF66]/50 cursor-pointer text-left"
      >
        {stem}
      </button>
      <span className="font-body font-bold text-[14px] leading-[18px] text-[#000080] underline decoration-[1px] underline-offset-2 select-none">
        .md
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        title={`Rename ${filename}`}
        aria-label={`Rename ${filename}`}
        className="ml-1 font-chrome text-[10px] leading-3 text-[#808080] hover:text-[#000080] opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        [rename]
      </button>
    </>
  );
}

function FolderGlyph() {
  return (
    <span className="inline-block w-[18px] h-3 relative align-middle pixelated mr-1">
      <span className="absolute top-0 left-0 w-[7px] h-[3px] bg-[#FFE600] border border-black border-b-0" />
      <span className="absolute top-[2px] left-0 w-4 h-[10px] bg-[#FFE600] border border-black" />
    </span>
  );
}

type TrashViewProps = {
  entries: DeletedEntry[];
  onRestore: (key: string) => void;
  onPurge: (key: string) => void;
  onEmptyTrash: () => void;
};

export function TrashView({
  entries,
  onRestore,
  onPurge,
  onEmptyTrash,
}: TrashViewProps) {
  return (
    <div className="flex flex-col pt-4 px-1 gap-[10px] border-t border-dashed border-[#808080]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-body font-bold text-black text-[16px] leading-5">
          Recently Deleted
        </span>
        <button
          onClick={onEmptyTrash}
          disabled={entries.length === 0}
          className="font-chrome text-[11px] leading-[14px] text-[#800000] disabled:text-[#808080] hover:underline"
        >
          [ Empty Trash ]
        </button>
      </div>
      <div className="flex flex-col pl-5 gap-[10px]">
        {entries.length === 0 && (
          <div className="font-body italic text-[12px] text-[#808080]">
            Trash is empty.
          </div>
        )}
        {entries.map((e) => (
          <TrashRow
            key={e.key}
            entry={e}
            onRestore={() => onRestore(e.key)}
            onPurge={() => onPurge(e.key)}
          />
        ))}
      </div>
    </div>
  );
}

function TrashRow({
  entry,
  onRestore,
  onPurge,
}: {
  entry: DeletedEntry;
  onRestore: () => void;
  onPurge: () => void;
}) {
  return (
    <div className="group flex flex-col gap-px">
      <div className="flex items-baseline gap-2">
        <span className="font-body font-bold text-[14px] leading-[18px] text-black select-none">
          —
        </span>
        <span className="font-body font-bold text-[14px] leading-[18px] text-black">
          {entry.displayName}
        </span>
        <span className="font-chrome text-[10px] leading-3 text-[#808080]">
          {entry.kind} · deleted {formatRelative(entry.deletedAt)}
        </span>
        <button
          onClick={onRestore}
          className="ml-2 font-chrome text-[10px] leading-3 text-[#000080] hover:underline"
        >
          [ Restore ]
        </button>
        <button
          onClick={onPurge}
          className="font-chrome text-[10px] leading-3 text-[#800000] hover:underline"
        >
          [ Delete Permanently ]
        </button>
      </div>
    </div>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
