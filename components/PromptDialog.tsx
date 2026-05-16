"use client";

import { useEffect, useRef, useState } from "react";

const RAISED =
  "border border-t-white border-l-white border-b-[#404040] border-r-[#404040]";

type Props = {
  title: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

export function PromptDialog({
  title,
  label,
  initialValue = "",
  placeholder,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onSubmit,
  onCancel,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-[360px] bg-[#C0C0C0] ${RAISED}`}
        style={{ boxShadow: "2px 2px 0 #00000044" }}
      >
        <div className="flex items-center justify-between bg-[#000080] py-[3px] px-[6px] select-none">
          <span className="font-chrome font-bold text-[11px] leading-[14px] text-white">
            {title}
          </span>
          <button
            onClick={onCancel}
            aria-label="Close"
            className={`w-[18px] h-4 flex items-end justify-center pb-px bg-[#C0C0C0] text-black font-chrome font-bold text-[11px] leading-none ${RAISED}`}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3 px-4 py-4">
          <label className="font-body text-[12px] leading-[16px] text-black flex flex-col gap-2">
            {label}
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  onCancel();
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
                e.stopPropagation();
              }}
              placeholder={placeholder}
              className="bg-white text-black font-body text-[12px] leading-[16px] px-1 py-[2px] border border-t-[#404040] border-l-[#404040] border-b-white border-r-white outline-none"
            />
          </label>
          <div className="flex items-center justify-end gap-1 pt-1">
            <button
              onClick={onCancel}
              className={`py-[3px] px-3 bg-[#C0C0C0] font-chrome text-[11px] leading-[14px] text-black ${RAISED} active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white`}
            >
              {cancelLabel}
            </button>
            <button
              onClick={submit}
              disabled={!value.trim()}
              className={`py-[3px] px-3 bg-[#C0C0C0] font-chrome text-[11px] leading-[14px] text-black ${RAISED} active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white disabled:opacity-50`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
