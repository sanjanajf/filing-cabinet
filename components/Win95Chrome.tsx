"use client";

import { ReactNode } from "react";

const RAISED = "border border-t-white border-l-white border-b-[#404040] border-r-[#404040]";
const SUNKEN = "border border-t-[#404040] border-l-[#404040] border-b-white border-r-white";

export function TitleBar({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between bg-[#000080] py-[3px] px-1 select-none">
      <div className="flex items-center gap-1">
        <div
          className={`w-4 h-[14px] flex items-center justify-center bg-[#C0C0C0] font-chrome font-bold text-[9px] leading-[12px] text-[#0000A0] ${RAISED}`}
        >
          W
        </div>
        <span className="font-chrome font-bold text-[11px] leading-[14px] text-white">
          {title}
        </span>
      </div>
      <div className="flex items-center gap-[2px]">
        <TitleBarButton glyph="_" />
        <TitleBarButton glyph="□" />
        <TitleBarButton glyph="×" />
      </div>
    </div>
  );
}

function TitleBarButton({ glyph }: { glyph: string }) {
  return (
    <div
      className={`w-[18px] h-4 flex items-end justify-center pb-px bg-[#C0C0C0] text-black font-chrome font-bold text-[11px] leading-none ${RAISED}`}
    >
      {glyph}
    </div>
  );
}

const MENU_ITEMS = [
  "File",
  "Edit",
  "View",
  "Insert",
  "F ormat",
  "Tools",
  "Desk",
  "Chat",
  "Window",
  "Help",
];

export function MenuBar({ activeMenu }: { activeMenu?: string }) {
  return (
    <div className="flex items-center bg-[#C0C0C0] py-[2px] px-1 border-b border-[#808080] select-none">
      {MENU_ITEMS.map((item) => {
        const active = item === activeMenu;
        return (
          <div
            key={item}
            className={`py-[2px] px-2 font-chrome text-[11px] leading-[14px] cursor-default ${
              active
                ? "bg-[#000080] text-white"
                : "text-black hover:bg-[#000080] hover:text-white"
            }`}
          >
            {item}
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
    <div className="flex items-center bg-[#C0C0C0] py-[3px] px-[6px] gap-1 border-b border-[#808080]">
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
      <Dropdown width={148} valueWidth={132} value="Heading 1" />
      <Dropdown width={128} valueWidth={112} value="Times New Roman" />
      <Dropdown width={44} valueWidth={28} value="12" />
      <Divider />
      <ToolGroup>
        <ToolIcon glyph="B" bold serif title="Bold" />
        <ToolIcon glyph="I" italic serif title="Italic" />
        <ToolIcon glyph="U" underline serif title="Underline" />
      </ToolGroup>
      <Divider />
      <ToolbarButton onClick={onNewNote} label="+ New note" />
      <ToolbarButton onClick={onChat} active={chatOpen} label="Chat..." />
    </div>
  );
}

function ToolGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-px">{children}</div>;
}

function Divider() {
  return <div className="w-px h-[22px] bg-[#808080] shrink-0" />;
}

function ToolIcon({
  glyph,
  bold,
  italic,
  underline,
  serif,
  title,
}: {
  glyph: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  serif?: boolean;
  title?: string;
}) {
  return (
    <button
      title={title}
      className={`w-[22px] h-[22px] flex items-center justify-center bg-[#C0C0C0] text-black ${RAISED} active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white`}
    >
      <span
        className={`${
          serif
            ? "font-body text-[13px] leading-4"
            : "font-chrome text-[11px] leading-none"
        } ${bold ? "font-bold" : ""} ${italic ? "italic" : ""} ${
          underline ? "underline" : ""
        }`}
      >
        {glyph}
      </span>
    </button>
  );
}

function Dropdown({
  width,
  valueWidth,
  value,
}: {
  width: number;
  valueWidth: number;
  value: string;
}) {
  return (
    <div style={{ width }} className="flex items-stretch h-5 shrink-0">
      <div
        style={{ width: valueWidth }}
        className={`flex items-center py-[2px] px-[6px] bg-white text-black font-chrome text-[11px] leading-[14px] truncate shrink-0 ${SUNKEN}`}
      >
        <span className="truncate">{value}</span>
      </div>
      <div
        className={`w-4 flex items-center justify-center bg-[#C0C0C0] text-black text-[8px] leading-none shrink-0 ${RAISED}`}
      >
        ▼
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center py-[3px] px-[10px] h-[22px] bg-[#C0C0C0] text-black font-chrome text-[11px] leading-[14px] cursor-default ${
        active ? SUNKEN : RAISED
      } active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white`}
    >
      {label}
    </button>
  );
}

const RULER_TEXT =
  "·1·····|·····2·····|·····3·····|·····4·····|·····5·····|·····6·····|·····7·····|·····8·····|·····9·····|·····";

export function Ruler() {
  return (
    <div className="flex items-center bg-[#C0C0C0] h-[18px] py-[2px] px-[60px] border-b border-[#808080] shrink-0">
      <div
        className={`flex-1 h-3 flex items-center px-[2px] bg-white ${SUNKEN}`}
      >
        <span
          className="font-chrome text-[8px] leading-[10px] text-[#404040] whitespace-pre"
          style={{ letterSpacing: "0.15em" }}
        >
          {RULER_TEXT}
        </span>
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
    <div className="flex items-center bg-[#C0C0C0] h-5 py-[2px] px-1 gap-1 border-t border-white shrink-0">
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
      className={`py-px px-[6px] font-chrome text-[11px] leading-[14px] ${SUNKEN} ${
        muted ? "text-[#808080]" : "text-black"
      } ${strong ? "font-bold" : ""}`}
    >
      {children}
    </div>
  );
}

export const Win95Button = ToolbarButton;
