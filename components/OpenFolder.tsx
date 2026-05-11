"use client";

import type { FileMeta, FolderMeta } from "@/lib/notes";
import { InlineEdit } from "./InlineEdit";

type Props = {
  folder: FolderMeta | null;
  files: FileMeta[];
  totalLines: number;
  lastOpenedLabel: string;
  onOpenFile: (relPath: string) => void;
  onRenameFile: (relPath: string, filename: string) => void;
  onEditSummary: (relPath: string, summary: string) => void;
  onToggleHighlight: (relPath: string) => void;
  onNewNote: () => void;
};

export function OpenFolder({
  folder,
  files,
  totalLines,
  lastOpenedLabel,
  onOpenFile,
  onRenameFile,
  onEditSummary,
  onToggleHighlight,
  onNewNote,
}: Props) {
  if (!folder) return null;

  return (
    <div className="pt-4">
      <div className="flex items-center gap-2 text-[11px] font-sans text-[#808080]">
        <FolderGlyph />
        <span>
          — {files.length} files, {totalLines.toLocaleString()} lines · last
          opened {lastOpenedLabel}
        </span>
      </div>

      <div className="text-black mt-2 ml-1">
        <div className="font-['Times_New_Roman',serif] text-[14px] underline decoration-[1px] underline-offset-2">
          {folder.slug}\
        </div>
        <div className="mt-2 space-y-3">
          {files.map((f) => (
            <FileRow
              key={f.relPath}
              file={f}
              onOpen={() => onOpenFile(f.relPath)}
              onRename={(name) => onRenameFile(f.relPath, name)}
              onEditSummary={(s) => onEditSummary(f.relPath, s)}
              onToggleHighlight={() => onToggleHighlight(f.relPath)}
            />
          ))}
        </div>
        <div className="mt-5 font-sans text-[11px] italic text-[#808080]">
          —{" "}
          <button
            onClick={onNewNote}
            className="underline hover:text-[#000080]"
          >
            [ + new note in {folder.slug}\ ]
          </button>{" "}
          <span className="not-italic"> | </span>
          <span>Ctrl+N</span>
        </div>
      </div>
    </div>
  );
}

function FileRow({
  file,
  onOpen,
  onRename,
  onEditSummary,
  onToggleHighlight,
}: {
  file: FileMeta;
  onOpen: () => void;
  onRename: (n: string) => void;
  onEditSummary: (s: string) => void;
  onToggleHighlight: () => void;
}) {
  return (
    <div
      className={`flex flex-col gap-0.5 px-1 -mx-1 ${
        file.highlighted ? "bg-[#FFFF66]" : ""
      }`}
    >
      <div className="flex items-baseline gap-2">
        <button
          onClick={onOpen}
          title="Open file"
          aria-label={`Open ${file.filename}`}
          className="font-sans text-[11px] text-[#808080] hover:text-[#000080] cursor-pointer select-none"
        >
          —
        </button>
        <InlineEdit
          value={file.filename.replace(/\.md$/, "")}
          onCommit={(n) => onRename(n)}
          ariaLabel={`Rename ${file.filename}`}
          selectAllOnFocus
          className="font-['Times_New_Roman',serif] text-[#000080] underline decoration-[1px] underline-offset-2 text-[14px] font-bold"
        />
        <span className="font-['Times_New_Roman',serif] text-[14px] font-bold text-[#000080] underline decoration-[1px] underline-offset-2 select-none">
          .md
        </span>
        <span className="font-sans text-[11px] text-[#808080]">
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
      </div>
      <div className="pl-5">
        <InlineEdit
          value={file.summary}
          onCommit={onEditSummary}
          multiline
          ariaLabel={`Edit summary for ${file.filename}`}
          placeholder="(add a one-sentence summary)"
          className="block w-full font-['Times_New_Roman',serif] text-[13px] leading-[18px] text-black"
        />
      </div>
    </div>
  );
}

function FolderGlyph() {
  return (
    <div className="w-4 h-3 relative shrink-0">
      <div className="top-0 left-0 w-[7px] h-1 absolute bg-[#FFE600] border border-black" />
      <div className="top-[2px] left-0 w-4 h-[10px] absolute bg-[#FFE600] border border-black" />
    </div>
  );
}
