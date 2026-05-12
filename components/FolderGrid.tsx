"use client";

import type { FolderMeta } from "@/lib/notes";
import { InlineEdit } from "./InlineEdit";

type Props = {
  folders: FolderMeta[];
  openFolder: string | null;
  onOpen: (slug: string) => void;
  onRenameFolder: (slug: string, name: string) => void;
  onRenameCount: (slug: string, label: string) => void;
  onNewFolder: () => void;
  onNewNoteInFolder: (slug: string) => void;
};

export function FolderGrid({
  folders,
  openFolder,
  onOpen,
  onRenameFolder,
  onRenameCount,
  onNewFolder,
  onNewNoteInFolder,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2 py-4">
      {folders.map((f) => (
        <FolderTile
          key={f.slug}
          folder={f}
          selected={f.slug === openFolder}
          onOpen={() => onOpen(f.slug)}
          onRenameName={(name) => onRenameFolder(f.slug, name)}
          onRenameCount={(label) => onRenameCount(f.slug, label)}
          onNewNote={() => onNewNoteInFolder(f.slug)}
        />
      ))}
      <NewFolderTile onClick={onNewFolder} />
    </div>
  );
}

function FolderTile({
  folder,
  selected,
  onOpen,
  onRenameName,
  onRenameCount,
  onNewNote,
}: {
  folder: FolderMeta;
  selected: boolean;
  onOpen: () => void;
  onRenameName: (n: string) => void;
  onRenameCount: (n: string) => void;
  onNewNote: () => void;
}) {
  return (
    <div
      className={`group relative flex flex-col items-center w-24 py-1 px-1 gap-1 shrink-0 cursor-pointer ${
        selected ? "bg-[#000080] border border-dotted border-white" : ""
      }`}
      onDoubleClick={onOpen}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNewNote();
        }}
        title={`New note in ${folder.name}`}
        aria-label={`New note in ${folder.name}`}
        className="absolute top-0 right-0 w-4 h-4 bg-[#C0C0C0] text-[#008000] text-[12px] font-bold leading-none flex items-center justify-center shadow-[inset_1px_1px_0_#FFFFFF,inset_-1px_-1px_0_#404040] active:shadow-[inset_1px_1px_0_#404040,inset_-1px_-1px_0_#FFFFFF] opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        +
      </button>
      <div className="w-16 h-[52px] relative shrink-0" onClick={onOpen}>
        <div className="top-1 left-0.5 w-[26px] h-2 absolute bg-[#FFE600] border-2 border-black" />
        <div
          className={`top-[10px] left-0 w-16 h-[42px] absolute bg-[#FFE600] border-2 border-black ${
            selected
              ? "shadow-[2px_2px_0_#00000088]"
              : "shadow-[2px_2px_0_#00000055]"
          }`}
        />
        <div className="top-3 left-1 w-14 h-px absolute bg-[#FFFFAA]" />
      </div>
      <InlineEdit
        value={folder.name}
        onCommit={onRenameName}
        ariaLabel={`Rename folder ${folder.name}`}
        selectAllOnFocus
        className={`text-center font-sans text-[11px] leading-[13px] px-1 ${
          selected ? "text-white" : "text-black"
        }`}
      />
      <InlineEdit
        value={folder.countLabel}
        onCommit={onRenameCount}
        ariaLabel={`Edit ${folder.name} count label`}
        selectAllOnFocus
        className={`font-sans text-[9px] leading-[12px] px-1 ${
          selected ? "text-[#C0C0C0]" : "text-[#808080]"
        }`}
      />
    </div>
  );
}

function NewFolderTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center w-24 py-1 px-1 gap-1 shrink-0"
    >
      <div className="w-16 h-[52px] relative shrink-0">
        <div className="top-1 left-0.5 w-[26px] h-2 absolute bg-white border-2 border-dashed border-[#808080]" />
        <div className="top-[10px] left-0 w-16 h-[42px] flex items-center justify-center absolute bg-white border-2 border-dashed border-[#808080]">
          <span className="font-sans text-[#808080] text-2xl leading-none">+</span>
        </div>
      </div>
      <span className="text-center font-sans italic text-[#808080] text-[11px] leading-[13px]">
        New folder
      </span>
    </button>
  );
}
