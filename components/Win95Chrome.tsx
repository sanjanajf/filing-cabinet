"use client";

import { ReactNode } from "react";

export function TitleBar({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between bg-[#000080] text-white px-1 h-[22px] select-none">
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-white text-[#000080] flex items-center justify-center font-bold text-[11px] leading-none">
          W
        </div>
        <span className="font-chrome text-[11px] tracking-tight">{title}</span>
      </div>
      <div className="flex items-center gap-[2px]">
        <Win95Button square label="_" />
        <Win95Button square label="□" />
        <Win95Button square label="×" />
      </div>
    </div>
  );
}

export function Win95Button({
  label,
  square,
  active,
  onClick,
  children,
  className,
  title,
}: {
  label?: string;
  square?: boolean;
  active?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        ${square ? "w-4 h-4" : "px-2 h-[20px]"}
        bg-[#C0C0C0] text-black text-[11px] font-chrome
        flex items-center justify-center leading-none
        ${
          active
            ? "shadow-[inset_1px_1px_0_#404040,inset_-1px_-1px_0_#FFFFFF,inset_2px_2px_0_#808080,inset_-2px_-2px_0_#DFDFDF]"
            : "shadow-[inset_1px_1px_0_#FFFFFF,inset_-1px_-1px_0_#404040,inset_2px_2px_0_#DFDFDF,inset_-2px_-2px_0_#808080]"
        }
        active:shadow-[inset_1px_1px_0_#404040,inset_-1px_-1px_0_#FFFFFF,inset_2px_2px_0_#808080,inset_-2px_-2px_0_#DFDFDF]
        ${className ?? ""}
      `}
    >
      {children ?? label}
    </button>
  );
}

const MENU_ITEMS = [
  "File",
  "Edit",
  "View",
  "Insert",
  "Format",
  "Tools",
  "Desk",
  "Chat",
  "Window",
  "Help",
];

export function MenuBar({ activeMenu }: { activeMenu?: string }) {
  return (
    <div className="flex items-center bg-[#C0C0C0] h-[23px] px-1 border-b border-[#808080] select-none">
      {MENU_ITEMS.map((item) => {
        const active = item === activeMenu;
        return (
          <div
            key={item}
            className={`px-2 py-0.5 text-[11px] font-chrome leading-none ${
              active ? "bg-[#000080] text-white" : "text-black hover:bg-[#000080] hover:text-white"
            }`}
          >
            <span className="underline">{item.charAt(0)}</span>
            {item.slice(1)}
          </div>
        );
      })}
    </div>
  );
}

export function Toolbar({
  onNewNote,
  onChat,
  chatOpen,
}: {
  onNewNote: () => void;
  onChat: () => void;
  chatOpen: boolean;
}) {
  return (
    <div className="flex items-center gap-1 bg-[#C0C0C0] px-1 py-[3px] h-[29px] border-b border-[#808080]">
      <ToolGroup>
        <ToolIcon glyph="N" title="New" />
        <ToolIcon glyph="O" title="Open" />
        <ToolIcon glyph="S" title="Save" />
      </ToolGroup>
      <Divider />
      <ToolGroup>
        <ToolIcon glyph="✂" title="Cut" />
        <ToolIcon glyph="□" title="Copy" />
        <ToolIcon glyph="▭" title="Paste" />
      </ToolGroup>
      <Divider />
      <Select width={148} value="Heading 1" />
      <Select width={128} value="Times New Roman" />
      <Select width={44} value="12" />
      <Divider />
      <ToolGroup>
        <ToolIcon glyph="B" bold title="Bold" />
        <ToolIcon glyph="I" italic title="Italic" />
        <ToolIcon glyph="U" underline title="Underline" />
      </ToolGroup>
      <Divider />
      <Win95Button onClick={onNewNote} className="!h-[22px]">
        <span className="text-[#008000] mr-1">+</span> New note
      </Win95Button>
      <Win95Button onClick={onChat} active={chatOpen} className="!h-[22px]">
        Chat...
      </Win95Button>
    </div>
  );
}

function ToolGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-[2px]">{children}</div>;
}

function Divider() {
  return (
    <div className="mx-1 h-[22px] flex">
      <div className="w-px h-full bg-[#808080]" />
      <div className="w-px h-full bg-[#FFFFFF]" />
    </div>
  );
}

function ToolIcon({
  glyph,
  bold,
  italic,
  underline,
  title,
}: {
  glyph: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  title?: string;
}) {
  return (
    <Win95Button title={title} className="!w-[22px] !h-[22px] !px-0">
      <span
        className={`text-[12px] leading-none ${bold ? "font-bold" : ""} ${
          italic ? "italic" : ""
        } ${underline ? "underline" : ""}`}
      >
        {glyph}
      </span>
    </Win95Button>
  );
}

function Select({ width, value }: { width: number; value: string }) {
  return (
    <div
      style={{ width }}
      className="flex items-stretch h-[20px] bg-white shadow-[inset_1px_1px_0_#808080,inset_-1px_-1px_0_#FFFFFF,inset_2px_2px_0_#404040,inset_-2px_-2px_0_#DFDFDF] text-[11px] font-chrome"
    >
      <span className="flex-1 truncate px-1 flex items-center">{value}</span>
      <button
        type="button"
        tabIndex={-1}
        className="w-[16px] flex items-center justify-center bg-[#C0C0C0] shadow-[inset_1px_1px_0_#FFFFFF,inset_-1px_-1px_0_#404040,inset_2px_2px_0_#DFDFDF,inset_-2px_-2px_0_#808080] text-[8px] leading-none"
      >
        ▼
      </button>
    </div>
  );
}

export function Ruler() {
  const inches = 16;
  return (
    <div className="bg-[#C0C0C0] h-[18px] flex items-center px-3 border-b border-[#808080] overflow-hidden">
      <div className="bg-white flex-1 h-[14px] relative shadow-[inset_1px_1px_0_#808080,inset_-1px_-1px_0_#FFFFFF]">
        <div className="absolute inset-0 flex">
          {Array.from({ length: inches }).map((_, i) => (
            <div key={i} className="flex-1 relative">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-[#404040]" />
              <div className="absolute left-1/4 top-1/2 bottom-0 w-px bg-[#808080]" />
              <div className="absolute left-1/2 top-[3px] bottom-0 w-px bg-[#404040]" />
              <div className="absolute left-3/4 top-1/2 bottom-0 w-px bg-[#808080]" />
              <span className="absolute left-0 top-0 text-[8px] text-[#404040] leading-none pl-[3px] font-chrome">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatusBar({
  page,
  section,
  pages,
  noteCount,
  lineCount,
  clock,
  saved,
}: {
  page: number;
  section: number;
  pages: number;
  noteCount: number;
  lineCount: number;
  clock: string;
  saved: boolean;
}) {
  return (
    <div className="flex items-stretch bg-[#C0C0C0] h-[22px] border-t border-[#FFFFFF] text-[11px] font-chrome px-[2px] py-[2px] gap-[2px]">
      <StatusCell>Page {page}</StatusCell>
      <StatusCell>Sec {section}</StatusCell>
      <StatusCell>
        {page}/{pages}
      </StatusCell>
      <StatusCell>{noteCount} notes</StatusCell>
      <StatusCell>{lineCount.toLocaleString()} lines</StatusCell>
      <StatusCell>{clock}</StatusCell>
      <div className="flex-1" />
      <StatusCell muted>REC</StatusCell>
      <StatusCell muted>TRK</StatusCell>
      <StatusCell muted>EXT</StatusCell>
      <StatusCell strong>{saved ? "SAVED" : "EDITED"}</StatusCell>
    </div>
  );
}

function StatusCell({
  children,
  muted,
  strong,
}: {
  children: ReactNode;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`px-2 flex items-center shadow-[inset_1px_1px_0_#808080,inset_-1px_-1px_0_#FFFFFF] ${
        muted ? "text-[#808080]" : "text-black"
      } ${strong ? "font-bold" : ""}`}
    >
      {children}
    </div>
  );
}
