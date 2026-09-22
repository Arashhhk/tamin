"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { MessageCircle, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  senderRole: "buyer" | "seller";
  isMine: boolean;
  body: string;
  createdAt: string;
}

/**
 * Simple poll-every-4s chat rather than a websocket/SSE setup — no
 * realtime infra exists in this project yet, and for a two-person
 * post-selection coordination thread (not a high-frequency support
 * inbox) a few seconds of latency is an acceptable trade for not
 * introducing a new moving part. If this ever needs to feel instant,
 * swapping the interval for a websocket/SSE connection only touches
 * this one component — the API route's shape doesn't need to change.
 */
export default function RfqChat({ rfqId, closed = false }: { rfqId: string; closed?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/rfq/${rfqId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      // silent — next poll will retry
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    fetchMessages();
    if (closed) return; // no point polling a conversation nothing can add to anymore
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqId, closed]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function send() {
    const body = text.trim();
    if (!body) return;
    setError(null);
    setText("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/rfq/${rfqId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "ارسال پیام ناموفق بود");
        }
        fetchMessages();
      } catch (err: any) {
        setError(err.message);
        setText(body); // give it back so the user doesn't retype it
      }
    });
  }

  return (
    <div className="flex flex-col rounded-xl2 border border-line bg-white">
      <h3 className="flex items-center gap-2 border-b border-line px-4 py-3 text-sm font-extrabold text-ink-900">
        <MessageCircle className="h-4 w-4 text-camel-500" />
        گفتگو با طرف معامله
      </h3>

      <div ref={listRef} className="flex max-h-80 min-h-[10rem] flex-col gap-2 overflow-y-auto p-4">
        {loaded && messages.length === 0 && (
          <p className="m-auto text-xs text-ink-400">
            هنوز پیامی رد و بدل نشده. برای هماهنگی تحویل کالا پیام بفرستید.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-xl2 px-3 py-2 text-xs leading-6 ${
              m.isMine
                ? "self-start bg-camel-500 text-white"
                : "self-end bg-sand text-ink-800"
            }`}
          >
            {m.body}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-line p-3">
        {closed ? (
          <p className="w-full py-1.5 text-center text-xs font-bold text-ink-400">
            این گفتگو بسته شده است.
          </p>
        ) : (
          <>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="پیام خود را بنویسید..."
              className="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-camel-400"
            />
            <button
              onClick={send}
              disabled={isSending || !text.trim()}
              aria-label="ارسال"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-camel-500 text-white transition hover:bg-camel-600 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      {error && <p className="px-3 pb-2 text-[11px] font-bold text-danger">{error}</p>}
    </div>
  );
}
