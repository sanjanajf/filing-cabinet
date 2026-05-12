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
};

export function FolderGrid({
  folders,
  openFolder,
  onOpen,
  onRenameFolder,
  onRenameCount,
  onNewFolder,
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
}: {
  folder: FolderMeta;
  selected: boolean;
  onOpen: () => void;
  onRenameName: (n: string) => void;
  onRenameCount: (n: string) => void;
}) {
  return (
    <div
      className={`flex flex-col items-center w-24 py-1 px-1 gap-1 shrink-0 cursor-pointer ${
        selected ? "bg-[#000080] border border-dotted border-white" : ""
      }`}
      onDoubleClick={onOpen}
    >
      <div className="w-16 h-[52px] relative shrink-0 pixelated" onClick={onOpen}>
        <div className="top-1 left-0 w-[28px] h-[8px] absolute bg-[#FFE600] border-[2px] border-black border-b-0" />
        <div className="top-[8px] left-0 w-16 h-[44px] absolute bg-[#FFE600] border-[2px] border-black shadow-[2px_2px_0_#000000]" />
        <div className="top-[10px] left-[2px] w-[60px] h-px absolute bg-[#FFFFFF]" />
        <div className="top-[11px] left-[2px] w-[60px] h-px absolute bg-[#FFFFAA]" />
      </div>
      <InlineEdit
        value={folder.name}
        onCommit={onRenameName}
        ariaLabel={`Rename folder ${folder.name}`}
        selectAllOnFocus
        className={`text-center font-chrome text-[11px] leading-[13px] px-1 ${
          selected ? "text-white" : "text-black"
        }`}
      />
      <InlineEdit
        value={folder.countLabel}
        onCommit={onRenameCount}
        ariaLabel={`Edit ${folder.name} count label`}
        selectAllOnFocus
        className={`font-chrome text-[9px] leading-[12px] px-1 ${
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
      <div className="w-16 h-[52px] relative shrink-0 pixelated">
        <div className="top-1 left-0 w-[28px] h-[8px] absolute bg-white border-[2px] border-dashed border-[#808080] border-b-0" />
        <div className="top-[8px] left-0 w-16 h-[44px] flex items-center justify-center absolute bg-white border-[2px] border-dashed border-[#808080]">
          <span className="font-chrome text-[#808080] text-2xl leading-none">+</span>
        </div>
      </div>
      <span className="text-center font-chrome italic text-[#808080] text-[11px] leading-[13px]">
        New folder
      </span>
    </button>
  );
}
