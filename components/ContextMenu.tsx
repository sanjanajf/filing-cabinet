"use client";

import { useEffect, useRef } from "react";

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
    function onAway(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("mousedown", onAway);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onAway);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ top: y, left: x }}
      className="fixed z-[60] bg-[#C0C0C0] border border-t-white border-l-white border-b-[#404040] border-r-[#404040] font-chrome text-[11px] py-1 min-w-[160px]"
    >
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            it.onClick();
            onClose();
          }}
          className={`block w-full text-left px-4 py-[2px] hover:bg-[#000080] hover:text-white ${
            it.danger ? "text-[#800000]" : "text-black"
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
