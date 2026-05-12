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

export type DocFormat = {
  font: string;
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

export const DEFAULT_FORMAT: DocFormat = {
  font: "Times New Roman",
  size: 14,
  bold: false,
  italic: false,
  underline: false,
};

export const FONT_OPTIONS = [
  "Times New Roman",
  "Arial",
  "Courier New",
  "Georgia",
];

export const SIZE_OPTIONS = [10, 12, 14, 16, 18, 20, 24, 28];

export function Toolbar({
  onNewNote,
  onChat,
  chatOpen,
  format,
  onFormatChange,
}: {
  onNewNote: () => void;
  onChat: () => void;
  chatOpen: boolean;
  format: DocFormat;
  onFormatChange?: (next: DocFormat) => void;
}) {
  const disabled = !onFormatChange;
  const set = <K extends keyof DocFormat>(k: K, v: DocFormat[K]) => {
    if (!onFormatChange) return;
    onFormatChange({ ...format, [k]: v });
  };
  return (
    <div className="flex items-center bg-[#C0C0C0] py-[3px] px-[6px] gap-1 border-b border-[#808080]">
      <ToolGroup>
        <ToolIcon glyph="+" title="New note" onClick={onNewNote} />
      </ToolGroup>
      <Divider />
      <Select
        width={140}
        value={format.font}
        options={FONT_OPTIONS}
        disabled={disabled}
        onChange={(v) => set("font", v)}
        title="Font"
      />
      <Select
        width={56}
        value={String(format.size)}
        options={SIZE_OPTIONS.map(String)}
        disabled={disabled}
        onChange={(v) => set("size", Number(v))}
        title="Font size"
      />
      <Divider />
      <ToolGroup>
        <ToolIcon
          glyph="B"
          bold
          title="Bold"
          active={format.bold}
          disabled={disabled}
          onClick={() => set("bold", !format.bold)}
        />
        <ToolIcon
          glyph="I"
          italic
          title="Italic"
          active={format.italic}
          disabled={disabled}
          onClick={() => set("italic", !format.italic)}
        />
        <ToolIcon
          glyph="U"
          underline
          title="Underline"
          active={format.underline}
          disabled={disabled}
          onClick={() => set("underline", !format.underline)}
        />
      </ToolGroup>
      <Divider />
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
  active,
  disabled,
  onClick,
}: {
  glyph: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  serif?: boolean;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-[22px] h-[22px] flex items-center justify-center bg-[#C0C0C0] text-black disabled:text-[#808080] disabled:cursor-not-allowed ${
        active
          ? "border border-t-[#404040] border-l-[#404040] border-b-white border-r-white"
          : `${RAISED} active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white`
      }`}
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

function Select({
  width,
  value,
  options,
  onChange,
  disabled,
  title,
}: {
  width: number;
  value: string;
  options: string[];
  onChange?: (v: string) => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <div
      style={{ width }}
      className={`relative flex items-stretch h-5 shrink-0 ${
        disabled ? "opacity-60" : ""
      }`}
      title={title}
    >
      <div
        className={`flex-1 flex items-center py-[2px] px-[6px] bg-white text-black font-chrome text-[11px] leading-[14px] truncate ${SUNKEN}`}
      >
        <span className="truncate pointer-events-none">{value}</span>
      </div>
      <div
        className={`w-4 flex items-center justify-center bg-[#C0C0C0] text-black text-[8px] leading-none shrink-0 ${RAISED}`}
      >
        ▼
      </div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      >
        {options.includes(value) ? null : <option value={value}>{value}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
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
