"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onCommit: (next: string) => void | Promise<void>;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  multiline?: boolean;
  selectAllOnFocus?: boolean;
  autoEdit?: boolean;
  onEditDone?: () => void;
};

export function InlineEdit({
  value,
  onCommit,
  className,
  placeholder,
  ariaLabel,
  multiline,
  selectAllOnFocus,
  autoEdit,
  onEditDone,
}: Props) {
  const [editing, setEditing] = useState(Boolean(autoEdit));
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      if (selectAllOnFocus && "select" in ref.current) {
        (ref.current as HTMLInputElement).select();
      }
    }
  }, [editing, selectAllOnFocus]);

  function commit() {
    setEditing(false);
    if (draft !== value) onCommit(draft);
    onEditDone?.();
  }
  function cancel() {
    setDraft(value);
    setEditing(false);
    onEditDone?.();
  }

  if (!editing) {
    return (
      <span
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        className={`${className ?? ""} cursor-text hover:bg-[#FFFF66]/50 inline-edit-target`}
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setEditing(true);
          }
        }}
      >
        {value || (
          <span className="opacity-50 italic">{placeholder ?? "—"}</span>
        )}
      </span>
    );
  }

  if (multiline) {
    return (
      <textarea
        ref={(el) => {
          ref.current = el;
        }}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
          }
          e.stopPropagation();
        }}
        rows={Math.max(1, Math.min(4, draft.split("\n").length))}
        className={`${className ?? ""} bg-[#FFFF66] outline outline-1 outline-[#000080] resize-none w-full`}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <input
      ref={(el) => {
        ref.current = el;
      }}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        e.stopPropagation();
      }}
      className={`${className ?? ""} bg-[#FFFF66] outline outline-1 outline-[#000080]`}
      aria-label={ariaLabel}
    />
  );
}
