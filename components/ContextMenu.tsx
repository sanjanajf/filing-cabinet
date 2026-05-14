"use client";

import { useEffect, useRef, useState } from "react";

export type ContextMenuItem = {
  label: string;
  onClick?: () => void;
  danger?: boolean;
  submenu?: ContextMenuItem[];
  disabled?: boolean;
};

type Props = {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
};

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);

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
      {items.map((it, i) => {
        const hasSubmenu = it.submenu && it.submenu.length > 0;
        return (
          <div
            key={i}
            className="relative"
            onMouseEnter={() => setOpenSubmenu(hasSubmenu ? i : null)}
          >
            <button
              type="button"
              disabled={it.disabled}
              onClick={() => {
                if (hasSubmenu) return;
                it.onClick?.();
                onClose();
              }}
              className={`flex items-center justify-between w-full text-left px-4 py-[2px] hover:bg-[#000080] hover:text-white ${
                it.danger ? "text-[#800000]" : "text-black"
              } ${it.disabled ? "opacity-50 cursor-default hover:bg-transparent hover:text-[#404040]" : ""}`}
            >
              <span>{it.label}</span>
              {hasSubmenu && <span className="ml-4 text-[10px]">▶</span>}
            </button>
            {hasSubmenu && openSubmenu === i && (
              <div className="absolute top-0 left-full -ml-px bg-[#C0C0C0] border border-t-white border-l-white border-b-[#404040] border-r-[#404040] py-1 min-w-[160px] max-h-[320px] overflow-y-auto">
                {it.submenu!.map((sub, j) => (
                  <button
                    key={j}
                    type="button"
                    disabled={sub.disabled}
                    onClick={() => {
                      sub.onClick?.();
                      onClose();
                    }}
                    className={`block w-full text-left px-4 py-[2px] hover:bg-[#000080] hover:text-white ${
                      sub.danger ? "text-[#800000]" : "text-black"
                    } ${sub.disabled ? "opacity-50 cursor-default hover:bg-transparent hover:text-[#404040]" : ""}`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
