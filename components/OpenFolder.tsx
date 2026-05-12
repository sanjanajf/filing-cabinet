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
          />
        ))}
        <div className="pt-[6px]">
          <button
            onClick={onNewNote}
            className="font-body italic text-[12px] leading-4 text-[#808080] hover:text-[#000080]"
          >
            — [ + new note in {folder.slug}\ ] | Ctrl+N
          </button>
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
      className={`flex flex-col gap-px ${
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
        <InlineEdit
          value={file.filename.replace(/\.md$/, "")}
          onCommit={(n) => onRename(n)}
          ariaLabel={`Rename ${file.filename}`}
          selectAllOnFocus
          className="font-body font-bold text-[14px] leading-[18px] text-[#000080] underline decoration-[1px] underline-offset-2"
        />
        <span className="font-body font-bold text-[14px] leading-[18px] text-[#000080] underline decoration-[1px] underline-offset-2 select-none">
          .md
        </span>
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

function FolderGlyph() {
  return (
    <span className="inline-block w-[18px] h-3 relative align-middle pixelated mr-1">
      <span className="absolute top-0 left-0 w-[7px] h-[3px] bg-[#FFE600] border border-black border-b-0" />
      <span className="absolute top-[2px] left-0 w-4 h-[10px] bg-[#FFE600] border border-black" />
    </span>
  );
}
