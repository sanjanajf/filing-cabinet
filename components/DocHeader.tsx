"use client";

import { InlineEdit } from "./InlineEdit";
import { formatQuote, type Quote } from "@/lib/quotes";

type Props = {
  docTitle: string;
  quote: Quote;
  rootCrumb: string;
  openCrumb: string | null;
  stats: { folderCount: number; entryCount: number; lineCount: number };
  onEditTitle: (s: string) => void;
  onClickRoot: () => void;
};

export function DocHeader({
  docTitle,
  quote,
  rootCrumb,
  openCrumb,
  stats,
  onEditTitle,
  onClickRoot,
}: Props) {
  return (
    <div className="flex flex-col pb-3 border-b border-black">
      <div className="flex items-baseline gap-4">
        <InlineEdit
          value={docTitle}
          onCommit={onEditTitle}
          selectAllOnFocus
          ariaLabel="Edit document title"
          className="shrink-0 font-body font-bold text-black text-[22px] leading-[28px] tracking-[0.04em]"
        />
        <div
          lang={quote.lang}
          className="grow text-right font-chrome text-black text-[11px] leading-[14px] max-w-[60%] ml-auto"
        >
          {formatQuote(quote)} — {quote.author}
        </div>
      </div>
      <div className="flex items-center pt-2 gap-2 font-chrome text-[11px] leading-[14px]">
        <button
          onClick={onClickRoot}
          className="text-[#000080] underline decoration-[1px] underline-offset-2 hover:text-[#0000FF]"
        >
          {rootCrumb}
        </button>
        {openCrumb && (
          <>
            <span className="text-black">{">"}</span>
            <span className="text-[#000080] underline decoration-[1px] underline-offset-2">
              {openCrumb}\
            </span>
          </>
        )}
        <span className="text-black">|</span>
        <span className="text-[#808080]">
          — {stats.folderCount} folders, {stats.entryCount} entries · {" "}
          {stats.lineCount.toLocaleString()} lines
        </span>
      </div>
    </div>
  );
}
