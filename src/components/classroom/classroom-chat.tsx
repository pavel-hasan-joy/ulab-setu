"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { GraduationCap, Send, ShieldCheck } from "lucide-react";
import { fetchClassroomMessages, sendClassroomMessage } from "@/app/actions/classroom";
import { Avatar, Badge, Button, cn } from "../ui";

export interface ChatMessage {
  id: string;
  body: string;
  mine: boolean;
  at: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
    role: string;
    designation: string | null;
    studentId: string | null;
  };
}

export function ClassroomChat({
  classroomId,
  currentUserId,
  initialMessages,
}: {
  classroomId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom smoothly on mount and whenever messages change
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, []);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages.length]);

  // Polling every 3.5 seconds
  useEffect(() => {
    let active = true;
    const interval = setInterval(async () => {
      try {
        const fresh = await fetchClassroomMessages(classroomId);
        if (active && fresh && fresh.length > 0) {
          setMessages(fresh);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [classroomId]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      body: trimmed,
      mine: true,
      at: new Date().toISOString(),
      sender: {
        id: currentUserId,
        name: "You",
        image: null,
        role: "STUDENT",
        designation: null,
        studentId: null,
      },
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    startTransition(async () => {
      const res = await sendClassroomMessage(classroomId, trimmed);
      if (res.error) {
        // Rollback if failed
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }
      // Refresh with fresh messages from server
      const fresh = await fetchClassroomMessages(classroomId);
      if (fresh) setMessages(fresh);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex h-[620px] flex-col rounded-3xl border border-mist bg-surface shadow-soft overflow-hidden">
      {/* WhatsApp Header Bar */}
      <div className="flex items-center justify-between border-b border-mist/60 bg-paper/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-3 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-semibold text-ink">Classroom Group Chat</p>
        </div>
        <p className="text-[11px] text-ink-soft">
          {messages.length} message{messages.length === 1 ? "" : "s"} • Real-time discussion
        </p>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-paper/20">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-ink-soft">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-sky text-ulab-deep mb-3 shadow-xs">
              <GraduationCap size={24} />
            </div>
            <p className="font-heading text-sm font-semibold text-ink">No messages yet</p>
            <p className="text-xs text-ink-soft max-w-xs mt-1">
              Start the discussion! Teachers and students in this classroom can chat here anytime.
            </p>
          </div>
        ) : (
          messages.map((m, index) => {
            const isMine = m.mine;
            const isTeacher = m.sender.role === "TEACHER";

            return (
              <div
                key={m.id || index}
                className={cn("flex items-end gap-2.5", isMine ? "justify-end" : "justify-start")}
              >
                {!isMine && (
                  <Avatar
                    name={m.sender.name}
                    src={m.sender.image}
                    size={32}
                    className="shrink-0 mb-1"
                  />
                )}

                <div
                  className={cn(
                    "relative max-w-[82%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-xs transition",
                    isMine
                      ? "rounded-br-xs bg-ulab text-white"
                      : "rounded-bl-xs border border-mist/70 bg-surface text-ink"
                  )}
                >
                  {/* Sender Header for others */}
                  {!isMine && (
                    <div className="mb-1 flex flex-wrap items-center gap-1.5 pb-1 border-b border-mist/40">
                      <span className="text-xs font-bold text-ink truncate max-w-[150px]">
                        {m.sender.name}
                      </span>
                      {isTeacher ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-lilac-wash px-2 py-0.2 text-[10px] font-bold text-lilac-ink">
                          <ShieldCheck size={11} /> Faculty
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-sky px-2 py-0.2 text-[10px] font-medium text-ulab-deep">
                          Student {m.sender.studentId ? `• ${m.sender.studentId}` : ""}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Body */}
                  <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed">
                    {m.body}
                  </p>

                  {/* Timestamp */}
                  <div
                    className={cn(
                      "mt-1 flex items-center justify-end text-[10px]",
                      isMine ? "text-white/75" : "text-ink-soft/70"
                    )}
                  >
                    <span>{formatMessageTime(m.at)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-mist/60 bg-surface p-3 sm:p-4">
        <div className="flex items-end gap-2 rounded-2xl border border-mist bg-paper/40 p-1.5 focus-within:border-ulab-light focus-within:ring-4 focus-within:ring-ulab-light/15 transition">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message (Enter to send, Shift+Enter for new line)..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-xs sm:text-sm text-ink placeholder:text-ink-soft/60 focus:outline-hidden"
          />

          <Button
            type="button"
            variant="primary"
            onClick={handleSend}
            disabled={!text.trim() || isPending}
            className="size-9 shrink-0 rounded-xl p-0"
            title="Send Message"
          >
            <Send size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
