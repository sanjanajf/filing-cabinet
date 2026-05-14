"use client";

import { useState } from "react";
import type { FolderMeta } from "@/lib/notes";
import { InlineEdit } from "./InlineEdit";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";

type Props = {
  folders: FolderMeta[];
  openFolder: string | null;
  onOpen: (slug: string) => void;
  onRenameFolder: (slug: string, name: string) => void;
  onRenameCount: (slug: string, label: string) => void;
  onNewFolder: () => void;
  onNewNoteInFolder: (slug: string) => void;
  onExportFolder: (slug: string) => void;
};

export function FolderGrid({
  folders,
  openFolder,
  onOpen,
  onRenameFolder,
  onRenameCount,
  onNewFolder,
  onNewNoteInFolder,
  onExportFolder,
}: Props) {
  const [menu, setMenu] = useState<{ x: number; y: number; slug: string } | null>(
    null
  );

  return (
    <div className="flex flex-wrap py-[18px] gap-2">
      {folders.map((f) => (
        <FolderTile
          key={f.slug}
          folder={f}
          selected={f.slug === openFolder}
          onOpen={() => onOpen(f.slug)}
          onRenameName={(name) => onRenameFolder(f.slug, name)}
          onRenameCount={(label) => onRenameCount(f.slug, label)}
          onNewNote={() => onNewNoteInFolder(f.slug)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenu({ x: e.clientX, y: e.clientY, slug: f.slug });
          }}
        />
      ))}
      <NewFolderTile onClick={onNewFolder} />
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={
            [
              {
                label: "Export folder…",
                onClick: () => onExportFolder(menu.slug),
              },
            ] satisfies ContextMenuItem[]
          }
          onClose={() => setMenu(null)}
        />
      )}
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
  onContextMenu,
}: {
  folder: FolderMeta;
  selected: boolean;
  onOpen: () => void;
  onRenameName: (n: string) => void;
  onRenameCount: (n: string) => void;
  onNewNote: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`group relative flex flex-col items-center w-24 gap-1 shrink-0 cursor-pointer ${
        selected
          ? "py-1 px-[2px] bg-[#000080] border border-dotted border-white"
          : "py-[6px] px-1"
      }`}
      onClick={onOpen}
      onContextMenu={onContextMenu}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNewNote();
        }}
        title={`New note in ${folder.name}`}
        aria-label={`New note in ${folder.name}`}
        className="absolute top-0 right-0 w-4 h-4 bg-[#C0C0C0] text-[#008000] text-[12px] font-bold leading-none flex items-center justify-center border border-t-white border-l-white border-b-[#404040] border-r-[#404040] active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        +
      </button>
      <div className="w-16 h-[52px] relative shrink-0 pixelated">
        <div className="absolute top-1 left-[2px] w-[26px] h-2 bg-[#FFE600] border-2 border-black" />
        <div className="absolute top-[10px] left-0 w-16 h-[42px] bg-[#FFE600] border-2 border-black shadow-[2px_2px_0_#00000055]" />
        <div className="absolute top-3 left-1 w-14 h-px bg-[#FFFFAA]" />
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
          selected ? "text-white" : "text-[#808080]"
        }`}
      />
    </div>
  );
}

function NewFolderTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center w-24 py-[6px] px-1 gap-1 shrink-0"
    >
      <div className="w-16 h-[52px] relative shrink-0 pixelated">
        <div className="absolute top-1 left-[2px] w-[26px] h-2 bg-white border-2 border-dashed border-[#808080]" />
        <div className="absolute top-[10px] left-0 w-16 h-[42px] flex items-center justify-center bg-white border-2 border-dashed border-[#808080]">
          <span className="font-chrome text-[#808080] text-[30px] leading-none">+</span>
        </div>
      </div>
      <span className="text-center font-chrome italic text-[#808080] text-[11px] leading-[13px]">
        New folder
      </span>
    </button>
  );
}
