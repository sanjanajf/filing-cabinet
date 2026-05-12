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

const RAISED =
  "border border-t-white border-l-white border-b-[#404040] border-r-[#404040]";
const SUNKEN =
  "border border-t-[#404040] border-l-[#404040] border-b-white border-r-white";

export function Chat({ onClose }: { onClose: () => void }) {
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
    const next = [
      ...messages,
      { msg: { role: "user" as const, content: text }, at: nowStamp() },
    ];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => m.msg) }),
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
    <div className="flex flex-col h-full w-full bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040]">
      <div className="flex items-center justify-between bg-[#000080] py-[3px] px-[6px] select-none">
        <span className="font-chrome font-bold text-[11px] leading-[14px] text-white">
          Chat with notes
        </span>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className={`w-[14px] h-3 flex items-center justify-center bg-[#C0C0C0] text-black font-chrome text-[11px] leading-none pixelated ${RAISED}`}
        >
          ×
        </button>
      </div>

      <div
        className={`flex-1 m-1 flex flex-col bg-white px-[10px] py-[10px] gap-[10px] overflow-hidden ${SUNKEN}`}
      >
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto flex flex-col gap-[10px]"
        >
          {messages.length === 0 && !loading && (
            <div className="font-chrome text-[11px] leading-[14px] italic text-[#808080]">
              Try: &quot;what themes have I been circling?&quot;,
              &quot;summarize my SF writing&quot;, &quot;find action items
              across my notes&quot;
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className="flex flex-col gap-0">
              <div className="font-chrome text-[10px] leading-3 uppercase tracking-wide text-[#808080]">
                {m.msg.role === "user" ? "YOU" : "CLAUDE"} · {m.at}
              </div>
              <div className="font-body text-[12px] leading-[17px] text-black whitespace-pre-wrap">
                {m.msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex flex-col gap-0">
              <div className="font-chrome text-[10px] leading-3 uppercase tracking-wide text-[#808080]">
                CLAUDE · {nowStamp()}
              </div>
              <div className="font-body italic text-[12px] leading-[17px] text-[#808080]">
                thinking…
              </div>
            </div>
          )}
          {error && (
            <div className="font-chrome text-[11px] text-red-800 bg-[#FFFF66] p-2">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col px-1 pb-1 gap-1">
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
          className={`w-full h-[60px] py-[6px] px-2 bg-white font-body text-[12px] leading-[16px] text-black outline-none resize-none placeholder:text-[#808080] placeholder:italic ${SUNKEN}`}
          rows={3}
        />
        <div className="flex items-center justify-between">
          <span className="font-chrome text-[10px] leading-3 text-[#808080]">
            Ctrl+Enter to send
          </span>
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className={`py-[3px] px-3 bg-[#C0C0C0] font-chrome text-[11px] leading-[14px] text-black disabled:text-[#808080] ${RAISED} active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
