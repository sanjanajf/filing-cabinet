"use client";

import { useEffect } from "react";

const RAISED =
  "border border-t-white border-l-white border-b-[#404040] border-r-[#404040]";

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, onConfirm]);

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
          <div className="font-body text-[12px] leading-[16px] text-black whitespace-pre-wrap">
            {message}
          </div>
          <div className="flex items-center justify-end gap-1 pt-1">
            <button
              onClick={onCancel}
              className={`py-[3px] px-3 bg-[#C0C0C0] font-chrome text-[11px] leading-[14px] text-black ${RAISED} active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white`}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              autoFocus
              className={`py-[3px] px-3 bg-[#C0C0C0] font-chrome text-[11px] leading-[14px] text-black ${RAISED} active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
