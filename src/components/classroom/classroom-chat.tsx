"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Download,
  FileText,
  GraduationCap,
  Paperclip,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { fetchClassroomMessages, sendClassroomMessage } from "@/app/actions/classroom";
import { Avatar, Button, cn } from "../ui";

export interface ChatMessage {
  id: string;
  body: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: string | null;
  attachmentType?: string | null;
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
  const [file, setFile] = useState<{
    name: string;
    size: string;
    type: string;
    url: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileError(null);

    // 15MB limit
    if (f.size > 15 * 1024 * 1024) {
      setFileError("File exceeds 15MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const sizeStr =
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(f.size / 1024)} KB`;
      setFile({
        name: f.name,
        size: sizeStr,
        type: f.type || "file",
        url: reader.result as string,
      });
    };
    reader.onerror = () => {
      setFileError("Error reading file.");
    };
    reader.readAsDataURL(f);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && !file) || isPending) return;

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      body: trimmed,
      attachmentUrl: file?.url || null,
      attachmentName: file?.name || null,
      attachmentSize: file?.size || null,
      attachmentType: file?.type || null,
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

    const currentFile = file;
    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    startTransition(async () => {
      const res = await sendClassroomMessage(classroomId, trimmed, currentFile);
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
    <div className="flex h-[640px] flex-col rounded-3xl border border-mist bg-surface shadow-soft overflow-hidden">
      {/* WhatsApp Header Bar */}
      <div className="flex items-center justify-between border-b border-mist/60 bg-paper/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-3 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-semibold text-ink">Classroom Discussion & File Sharing</p>
        </div>
        <p className="text-[11px] text-ink-soft">
          {messages.length} message{messages.length === 1 ? "" : "s"} • Real-time WhatsApp sync
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
              Start the discussion! Share questions, study notes, or PDF files with your classroom.
            </p>
          </div>
        ) : (
          messages.map((m, index) => {
            const isMine = m.mine;
            const isTeacher = m.sender.role === "TEACHER";
            const isPdf = m.attachmentName?.toLowerCase().endsWith(".pdf");

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
                    "relative max-w-[84%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-xs transition",
                    isMine
                      ? "rounded-br-xs bg-ulab text-white"
                      : "rounded-bl-xs border border-mist/70 bg-surface text-ink"
                  )}
                >
                  {/* Sender Header for others */}
                  {!isMine && (
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5 pb-1 border-b border-mist/40">
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

                  {/* Attached File Inside Chat Bubble */}
                  {m.attachmentUrl && (
                    <div
                      className={cn(
                        "mb-2 flex items-center justify-between gap-3 rounded-xl p-2.5 text-xs transition",
                        isMine
                          ? "bg-black/20 text-white"
                          : "border border-mist/80 bg-paper/80 text-ink"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText
                          size={18}
                          className={isMine ? "text-white" : isPdf ? "text-rose" : "text-ulab"}
                        />
                        <div className="min-w-0">
                          <p className="font-bold truncate max-w-[160px] sm:max-w-[220px]">
                            {m.attachmentName || "Attached Document"}
                          </p>
                          {m.attachmentSize && (
                            <p className="text-[10px] opacity-75">{m.attachmentSize}</p>
                          )}
                        </div>
                      </div>
                      <a
                        href={m.attachmentUrl}
                        download={m.attachmentName || "document.pdf"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "rounded-lg p-1.5 transition active:scale-95 shrink-0",
                          isMine
                            ? "bg-white/20 hover:bg-white/30 text-white"
                            : "bg-sky hover:bg-ulab hover:text-white text-ulab-deep"
                        )}
                        title="Download / View Attachment"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  )}

                  {/* Message Body */}
                  {m.body && (
                    <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed">
                      {m.body}
                    </p>
                  )}

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
      <div className="border-t border-mist/60 bg-surface p-3 sm:p-4 space-y-2">
        {fileError && (
          <p className="text-xs text-rose font-medium">{fileError}</p>
        )}

        {/* Selected file preview chip */}
        {file && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-sage/40 bg-sage-wash/60 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={15} className="text-sage shrink-0" />
              <span className="truncate max-w-xs font-semibold text-ink">{file.name}</span>
              <span className="text-[10px] text-ink-soft">({file.size})</span>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-ink-soft hover:text-rose p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 rounded-2xl border border-mist bg-paper/40 p-1.5 focus-within:border-ulab-light focus-within:ring-4 focus-within:ring-ulab-light/15 transition">
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file (PDF, PPT, DOC, Image)"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-ink-soft hover:bg-sky hover:text-ulab-deep transition"
          >
            <Paperclip size={17} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.png,.jpg,.jpeg,.txt"
            className="hidden"
          />

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
            className="flex-1 resize-none bg-transparent px-2 py-2 text-xs sm:text-sm text-ink placeholder:text-ink-soft/60 focus:outline-hidden"
          />

          <Button
            type="button"
            variant="primary"
            onClick={handleSend}
            disabled={(!text.trim() && !file) || isPending}
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
