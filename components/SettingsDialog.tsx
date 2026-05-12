"use client";

import { useEffect, useState } from "react";

const RAISED =
  "border border-t-white border-l-white border-b-[#404040] border-r-[#404040]";
const SUNKEN =
  "border border-t-[#404040] border-l-[#404040] border-b-white border-r-white";

type Status = {
  hasKey: boolean;
  maskedKey: string | null;
};

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((s: Status) => setStatus(s))
      .catch(() => setStatus({ hasKey: false, maskedKey: null }));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    const key = input.trim();
    if (!key) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      setStatus(data);
      setInput("");
      setSavedAt(Date.now());
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "" }),
      });
      const data = await res.json();
      setStatus(data);
      setSavedAt(Date.now());
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-[420px] bg-[#C0C0C0] ${RAISED}`}
        style={{ boxShadow: "2px 2px 0 #00000044" }}
      >
        <div className="flex items-center justify-between bg-[#000080] py-[3px] px-[6px] select-none">
          <span className="font-chrome font-bold text-[11px] leading-[14px] text-white">
            Settings
          </span>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className={`w-[18px] h-4 flex items-end justify-center pb-px bg-[#C0C0C0] text-black font-chrome font-bold text-[11px] leading-none ${RAISED}`}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="font-chrome text-[11px] leading-[14px] text-black">
            Anthropic API key
          </div>
          <div className="font-body text-[12px] leading-[16px] text-[#404040]">
            {status === null
              ? "Loading…"
              : status.hasKey
              ? `Current: ${status.maskedKey}`
              : "No API key set. Chat and auto-categorization need a key."}
          </div>

          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
            placeholder="sk-ant-..."
            autoFocus
            className={`w-full py-[6px] px-2 bg-white font-body text-[12px] leading-[16px] text-black outline-none placeholder:text-[#808080] placeholder:italic ${SUNKEN}`}
          />

          {error && (
            <div className="font-chrome text-[11px] text-red-800 bg-[#FFFF66] px-2 py-1">
              {error}
            </div>
          )}
          {savedAt && !error && (
            <div className="font-chrome text-[11px] text-[#404040]">
              Saved to ~/.workspace/config.json
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={clear}
              disabled={saving || !status?.hasKey}
              className={`py-[3px] px-3 bg-[#C0C0C0] font-chrome text-[11px] leading-[14px] text-black disabled:text-[#808080] ${RAISED} active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white`}
            >
              Clear
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={onClose}
                className={`py-[3px] px-3 bg-[#C0C0C0] font-chrome text-[11px] leading-[14px] text-black ${RAISED} active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white`}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !input.trim()}
                className={`py-[3px] px-3 bg-[#C0C0C0] font-chrome text-[11px] leading-[14px] text-black disabled:text-[#808080] ${RAISED} active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
