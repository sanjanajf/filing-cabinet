"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

function nowStamp(): string {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

export function Chat({
  onClose,
  focusFile,
}: {
  onClose: () => void;
  focusFile?: string | null;
}) {
  const [messages, setMessages] = useState<{ msg: Message; at: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    const next = [...messages, { msg: { role: "user" as const, content: text }, at: nowStamp() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => m.msg),
          focusFile: focusFile ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Chat failed");
        return;
      }
      setMessages([
        ...next,
        { msg: { role: "assistant", content: data.reply }, at: nowStamp() },
      ]);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#C0C0C0]">
      <div className="flex items-center justify-between bg-[#000080] text-white px-1 h-[22px] select-none">
        <span className="text-[11px] font-bold truncate">
          {focusFile ? `Chat — ${focusFile}` : "Chat with notes"}
        </span>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="w-4 h-4 bg-[#C0C0C0] text-black text-[11px] flex items-center justify-center leading-none shadow-[inset_1px_1px_0_#FFFFFF,inset_-1px_-1px_0_#404040] shrink-0"
        >
          ×
        </button>
      </div>
      {focusFile && (
        <div className="bg-[#FFFF66] border-b border-black px-2 py-1 text-[10px] font-sans text-black">
          Focused on <span className="font-bold">{focusFile}</span> — Claude will prioritize this draft.
        </div>
      )}

      <div className="bg-white flex-1 flex flex-col m-1 shadow-[inset_1px_1px_0_#404040,inset_-1px_-1px_0_#FFFFFF] overflow-hidden">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-[12px]"
        >
          {messages.length === 0 && !loading && (
            <div className="text-[11px] text-[#808080] italic font-sans">
              Try: &quot;what themes have I been circling?&quot;,
              &quot;summarize my SF writing&quot;, &quot;find action items
              across my notes&quot;
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i}>
              <div className="text-[10px] uppercase tracking-wide text-[#808080] font-sans mb-0.5">
                {m.msg.role === "user" ? "YOU" : "CLAUDE"} · {m.at}
              </div>
              <div className="whitespace-pre-wrap leading-[16px] text-black font-['Times_New_Roman',serif]">
                {m.msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[#808080] font-sans mb-0.5">
                CLAUDE · {nowStamp()}
              </div>
              <div className="text-[#808080] italic font-['Times_New_Roman',serif]">
                thinking…
              </div>
            </div>
          )}
          {error && (
            <div className="text-[11px] text-red-700 bg-[#FFFF66] p-2 font-sans">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="m-1 mt-0 flex flex-col gap-1">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask anything about your notes…"
          className="w-full bg-white text-[12px] p-1 outline-none font-['Times_New_Roman',serif] resize-none shadow-[inset_1px_1px_0_#404040,inset_-1px_-1px_0_#FFFFFF]"
          rows={3}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#404040] font-sans">
            Ctrl+Enter to send
          </span>
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-[#C0C0C0] text-black text-[11px] px-3 h-[20px] font-sans shadow-[inset_1px_1px_0_#FFFFFF,inset_-1px_-1px_0_#404040] active:shadow-[inset_1px_1px_0_#404040,inset_-1px_-1px_0_#FFFFFF] disabled:text-[#808080]"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
