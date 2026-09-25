"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fetchMessages, sendMessage } from "@/app/actions/network";
import { Avatar, cn } from "./ui";

type Msg = { id: string; body: string; mine: boolean; at: string };

export function ChatWindow({ connectionId, other, backHref }: { connectionId: string; other: { name: string; subtitle: string }; backHref: string }) {
  const [messages, setMessages] = useState<Msg[] | null>(null);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Poll for new messages every 4 seconds while the chat is open.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const m = await fetchMessages(connectionId);
      if (alive) setMessages(m);
    };
    load();
    const t = setInterval(load, 4000);
    return () => { alive = false; clearInterval(t); };
  }, [connectionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages?.length]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    setMessages((m) => [...(m ?? []), { id: `tmp-${Date.now()}`, body, mine: true, at: new Date().toISOString() }]);
    await sendMessage(connectionId, body);
    setMessages(await fetchMessages(connectionId));
  }

  return (
    <div className="flex h-[70dvh] flex-col md:h-full">
      <div className="flex items-center gap-3 border-b border-mist/70 px-4 py-3">
        <Link href={backHref} className="rounded-lg p-1.5 text-ink-soft md:hidden" aria-label="Back"><ArrowLeft size={18} /></Link>
        <Avatar name={other.name} size={36} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{other.name}</p>
          <p className="truncate text-xs text-ink-soft">{other.subtitle}</p>
        </div>
      </div>

      <div className="dots flex-1 space-y-2 overflow-y-auto bg-paper/60 px-4 py-5">
        {messages === null && Array.from({ length: 3 }).map((_, i) => <div key={i} className={cn("skeleton h-10 w-1/2", i % 2 === 1 && "ml-auto")} />)}
        {messages?.length === 0 && <p className="pt-10 text-center text-sm text-ink-soft">You&apos;re connected. Start with a specific question.</p>}
        <AnimatePresence initial={false}>
          {messages?.map((m) => (
            <motion.div
              key={m.id}
              layout="position"
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={cn("flex", m.mine ? "justify-end" : "justify-start")}
            >
              <p className={cn("max-w-[78%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-soft",
                m.mine ? "rounded-br-md bg-ulab text-white" : "rounded-bl-md bg-surface text-ink")}>
                {m.body}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <form onSubmit={onSend} className="flex items-center gap-2 border-t border-mist/70 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message"
          aria-label="Message"
          className="flex-1 rounded-xl border border-mist bg-paper px-3.5 py-2.5 text-sm focus:border-ulab-light focus:outline-none focus:ring-4 focus:ring-ulab-light/15"
        />
        <motion.button whileTap={{ scale: 0.9 }} className="grid size-10 place-items-center rounded-xl bg-ulab text-white disabled:opacity-50" disabled={!text.trim()} aria-label="Send">
          <SendHorizontal size={17} />
        </motion.button>
      </form>
    </div>
  );
}
