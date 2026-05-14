"use client";

import { useEffect, useRef } from "react";

const RAISED =
  "border border-t-white border-l-white border-b-[#404040] border-r-[#404040]";

export type ContextMenuItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

type Props = {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
};

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`fixed z-50 min-w-[140px] bg-[#C0C0C0] ${RAISED} py-1`}
      style={{ left: x, top: y, boxShadow: "2px 2px 0 #00000055" }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`w-full text-left px-3 py-[3px] font-chrome text-[11px] leading-[14px] hover:bg-[#000080] hover:text-white ${
            item.danger ? "text-[#800000]" : "text-black"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
