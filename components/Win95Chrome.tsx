"use client";

import { ReactNode } from "react";

export function TitleBar({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between bg-[#000080] text-white px-1 h-[22px] select-none">
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-white text-[#000080] flex items-center justify-center font-bold text-[11px] leading-none">
          W
        </div>
        <span className="text-[11px] font-bold tracking-tight">{title}</span>
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
        bg-[#C0C0C0] text-black text-[11px] font-sans
        flex items-center justify-center leading-none
        ${
          active
            ? "shadow-[inset_1px_1px_0_#404040,inset_-1px_-1px_0_#FFFFFF]"
            : "shadow-[inset_1px_1px_0_#FFFFFF,inset_-1px_-1px_0_#404040]"
        }
        active:shadow-[inset_1px_1px_0_#404040,inset_-1px_-1px_0_#FFFFFF]
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
            className={`px-2 py-0.5 text-[11px] font-sans leading-none ${
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
  return <div className="w-px h-[22px] bg-[#808080] mx-0.5" />;
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
      className="flex items-center justify-between h-[20px] bg-white border border-[#808080] shadow-[inset_1px_1px_0_#404040,inset_-1px_-1px_0_#FFFFFF] px-1 text-[11px] font-sans"
    >
      <span className="truncate">{value}</span>
      <span className="text-[8px]">▼</span>
    </div>
  );
}

export function Ruler() {
  return (
    <div className="bg-[#C0C0C0] h-[18px] flex items-center px-3 border-b border-[#808080] overflow-hidden">
      <div className="bg-white flex-1 h-[12px] relative shadow-[inset_1px_1px_0_#404040,inset_-1px_-1px_0_#FFFFFF]">
        <div className="absolute inset-0 flex items-center text-[8px] text-[#404040]">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-[#808080] text-center"
            >
              {i + 1}
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
    <div className="flex items-center bg-[#C0C0C0] h-[20px] border-t border-[#808080] text-[11px] font-sans">
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
      className={`px-2 h-[18px] flex items-center border-r border-[#808080] shadow-[inset_1px_1px_0_#FFFFFF,inset_-1px_-1px_0_#404040] ${
        muted ? "text-[#808080]" : "text-black"
      } ${strong ? "font-bold" : ""}`}
    >
      {children}
    </div>
  );
}
