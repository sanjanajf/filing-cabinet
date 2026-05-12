"use client";

import type { Heading } from "@/lib/outline";

type Props = {
  headings: Heading[];
  visible: boolean;
  onToggle: () => void;
  onJump: (heading: Heading) => void;
};

export function Outline({ headings, visible, onToggle, onJump }: Props) {
  if (!visible) {
    return (
      <div className="w-3 border-r border-black bg-[#C0C0C0] flex items-start justify-center pt-2 shrink-0">
        <button
          onClick={onToggle}
          title="Show outline"
          className="text-[10px] font-sans text-[#404040] hover:text-black writing-mode-vertical"
          style={{ writingMode: "vertical-rl" }}
        >
          ▸
        </button>
      </div>
    );
  }

  return (
    <div className="w-48 border-r border-black bg-[#F4F4F4] shrink-0 flex flex-col">
      <div className="flex items-center justify-between px-2 py-1 border-b border-black bg-[#C0C0C0]">
        <span className="text-[11px] font-sans font-bold text-[#000080]">
          outline
        </span>
        <button
          onClick={onToggle}
          title="Hide outline"
          className="text-[10px] font-sans text-[#404040] hover:text-black px-1"
        >
          ◂
        </button>
      </div>
      <div className="flex-1 overflow-auto py-1">
        {headings.length === 0 ? (
          <div className="px-2 py-2 text-[11px] font-sans text-[#808080] italic">
            no headings yet — add{" "}
            <code className="font-mono text-[10px] bg-[#E0E0E0] px-1">#</code> or{" "}
            <code className="font-mono text-[10px] bg-[#E0E0E0] px-1">##</code>
          </div>
        ) : (
          <ul>
            {headings.map((h, i) => (
              <li key={i}>
                <button
                  onClick={() => onJump(h)}
                  className="block w-full text-left text-[11px] font-sans px-2 py-[2px] hover:bg-[#000080] hover:text-white truncate"
                  style={{ paddingLeft: `${4 + (h.depth - 1) * 10}px` }}
                  title={h.text}
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
