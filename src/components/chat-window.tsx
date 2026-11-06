"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Paperclip,
  SendHorizontal,
  ShieldAlert,
  UserX,
  X,
  Download,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  fetchMessages,
  sendMessage,
  blockUser,
  reportMessage,
  type SerializedMessage,
} from "@/app/actions/network";
import { Avatar, Button, cn } from "./ui";

export function ChatWindow({
  connectionId,
  other,
  backHref,
}: {
  connectionId: string;
  other: { id: string; name: string; subtitle: string };
  backHref: string;
}) {
  const [messages, setMessages] = useState<SerializedMessage[] | null>(null);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingMsgId, setReportingMsgId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("SPAM");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSuccessMsg, setReportSuccessMsg] = useState("");

  // Attachment state
  const [attachment, setAttachment] = useState<{
    url: string;
    name: string;
    size?: string;
    type?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Poll for new messages while chat is active and tab is visible
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      const m = await fetchMessages(connectionId);
      if (alive) setMessages(m);
    };
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [connectionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages?.length]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      alert("Attachment size must be 6 MB or less.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      setAttachment({
        url: base64Data,
        name: file.name,
        size: sizeStr,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body && !attachment) return;

    const currentAttachment = attachment;
    setText("");
    setAttachment(null);
    setIsSending(true);

    // Optimistic UI update
    setMessages((prev) => [
      ...(prev ?? []),
      {
        id: `tmp-${Date.now()}`,
        body,
        mine: true,
        at: new Date().toISOString(),
        isRead: false,
        readAt: null,
        attachment: currentAttachment,
      },
    ]);

    const res = await sendMessage(connectionId, body, currentAttachment);
    setIsSending(false);

    if (res?.error) {
      alert(res.error);
    }

    // Refresh official messages state
    const updated = await fetchMessages(connectionId);
    setMessages(updated);
  }

  const handleBlockUser = async () => {
    if (confirm(`Are you sure you want to block ${other.name}? You will no longer be able to message each other.`)) {
      await blockUser(other.id);
      window.location.href = backHref;
    }
  };

  const handleOpenReport = (msgId?: string) => {
    setReportingMsgId(msgId || null);
    setReportModalOpen(true);
    setMenuOpen(false);
  };

  const handleSubmitReport = async () => {
    if (!reportingMsgId && messages?.length) {
      // Default to last received message if reporting conversation
      const lastIncoming = [...messages].reverse().find((m) => !m.mine);
      if (lastIncoming) {
        await reportMessage(lastIncoming.id, reportReason, reportDetails);
      }
    } else if (reportingMsgId) {
      await reportMessage(reportingMsgId, reportReason, reportDetails);
    }

    setReportSuccessMsg("Report submitted to platform moderators for review.");
    setTimeout(() => {
      setReportSuccessMsg("");
      setReportModalOpen(false);
      setReportDetails("");
    }, 1500);
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex h-[72dvh] flex-col md:h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-mist/70 px-3 py-2.5 sm:px-4 sm:py-3 bg-surface">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href={backHref}
            scroll={false}
            className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-paper/80 px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-ulab hover:text-ulab hover:bg-paper transition shadow-2xs shrink-0"
            title="All Conversations (সব চ্যাটে ফিরে যান)"
            aria-label="Back to all conversations"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">All Chats</span>
          </Link>
          <Avatar name={other.name} size={36} className="shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{other.name}</p>
            <p className="truncate text-xs text-ink-soft">{other.subtitle}</p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={backHref}
            scroll={false}
            className="inline-flex items-center gap-1 rounded-xl border border-mist/80 bg-paper/60 px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:border-mist-deep hover:bg-paper hover:text-ink transition shadow-2xs"
            title="Close this chat (চ্যাট বন্ধ করুন)"
            aria-label="Exit conversation"
          >
            <X size={14} />
            <span className="hidden sm:inline">Exit</span>
          </Link>

          {/* Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-xl p-2 text-ink-soft hover:bg-paper hover:text-ink transition"
              title="Options"
              aria-label="Options"
            >
              <MoreVertical size={18} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl border border-mist bg-surface p-1.5 shadow-lift z-20">
                <Link
                  href={backHref}
                  scroll={false}
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-paper hover:text-ink transition"
                >
                  <X size={14} />
                  Exit Conversation
                </Link>
                <button
                  onClick={() => handleOpenReport()}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-paper hover:text-ink transition"
                >
                  <ShieldAlert size={14} className="text-gold-ink" />
                  Report User
                </button>
                <button
                  onClick={handleBlockUser}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose hover:bg-rose-wash transition"
                >
                  <UserX size={14} />
                  Block User
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="dots flex-1 space-y-3 overflow-y-auto bg-paper/60 px-4 py-5">
        {messages === null &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn("skeleton h-12 w-1/2 rounded-2xl", i % 2 === 1 && "ml-auto")}
            />
          ))}

        {messages?.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-ink">You are connected with {other.name}</p>
            <p className="mt-1 text-xs text-ink-soft">
              Say hello or ask a specific academic or career question.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages?.map((m) => {
            const isImage =
              m.attachment?.type?.startsWith("image/") ||
              m.attachment?.url?.startsWith("data:image/");

            return (
              <motion.div
                key={m.id}
                layout="position"
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className={cn("group flex flex-col", m.mine ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "relative max-w-[82%] rounded-2xl px-4 py-2.5 shadow-soft transition",
                    m.mine
                      ? "rounded-br-sm bg-ulab text-white"
                      : "rounded-bl-sm bg-surface text-ink border border-mist/50"
                  )}
                >
                  {/* Attachment rendering */}
                  {m.attachment && (
                    <div className="mb-2">
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.attachment.url}
                          alt={m.attachment.name}
                          className="max-h-60 rounded-xl object-contain bg-black/10"
                        />
                      ) : (
                        <a
                          href={m.attachment.url}
                          download={m.attachment.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl p-2.5 transition text-xs",
                            m.mine
                              ? "bg-white/15 hover:bg-white/20 text-white"
                              : "bg-paper hover:bg-paper/80 text-ink border border-mist"
                          )}
                        >
                          <FileText size={18} className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold">{m.attachment.name}</p>
                            {m.attachment.size && (
                              <p className="text-[10px] opacity-75">{m.attachment.size}</p>
                            )}
                          </div>
                          <Download size={14} className="shrink-0" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Body Text */}
                  {m.body && <p className="whitespace-pre-line text-sm leading-relaxed">{m.body}</p>}

                  {/* Footer metadata: time & read ticks */}
                  <div
                    className={cn(
                      "mt-1 flex items-center justify-end gap-1 text-[10px]",
                      m.mine ? "text-white/75" : "text-ink-soft"
                    )}
                  >
                    <span>{formatTime(m.at)}</span>
                    {m.mine && (
                      <span title={m.readAt ? `Read ${formatTime(m.readAt)}` : "Delivered"}>
                        {m.isRead ? (
                          <CheckCheck size={13} className="text-sky-light inline" />
                        ) : (
                          <Check size={13} className="inline opacity-80" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Report message option for incoming messages */}
                {!m.mine && (
                  <button
                    onClick={() => handleOpenReport(m.id)}
                    className="mt-0.5 text-[10px] text-ink-soft/40 hover:text-ink-soft opacity-0 group-hover:opacity-100 transition"
                  >
                    Report
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Attachment Preview Bar */}
      {attachment && (
        <div className="flex items-center justify-between border-t border-mist/70 bg-surface px-4 py-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {attachment.type?.startsWith("image/") ? (
              <ImageIcon size={16} className="text-ulab" />
            ) : (
              <FileText size={16} className="text-ulab" />
            )}
            <span className="truncate font-semibold text-ink">{attachment.name}</span>
            {attachment.size && (
              <span className="text-ink-soft text-[10px]">({attachment.size})</span>
            )}
          </div>
          <button
            onClick={() => setAttachment(null)}
            className="rounded-lg p-1 text-ink-soft hover:bg-paper hover:text-rose transition"
            title="Remove attachment"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Chat Input Form */}
      <form onSubmit={onSend} className="flex items-center gap-2 border-t border-mist/70 bg-surface p-3">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="grid size-10 place-items-center rounded-xl text-ink-soft hover:bg-paper hover:text-ink transition"
          title="Add attachment (image or PDF)"
        >
          <Paperclip size={18} />
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          aria-label="Message"
          className="flex-1 rounded-xl border border-mist bg-paper px-3.5 py-2.5 text-sm focus:border-ulab-light focus:outline-none focus:ring-4 focus:ring-ulab-light/15"
        />

        <motion.button
          whileTap={{ scale: 0.94 }}
          type="submit"
          className="grid size-10 place-items-center rounded-xl bg-ulab text-white disabled:opacity-40 transition shadow-soft"
          disabled={(!text.trim() && !attachment) || isSending}
          aria-label="Send"
        >
          <SendHorizontal size={17} />
        </motion.button>
      </form>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mist bg-surface p-6 shadow-lift">
            <div className="flex items-center justify-between border-b border-mist/70 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-gold-ink" />
                <h3 className="font-display text-base font-bold text-ink">
                  Report Inappropriate Content
                </h3>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-paper hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-xs text-ink-soft">
              Help keep ULAB Setu safe. Reported content is securely reviewed by platform administrators according to community standards.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-ink">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ulab"
                >
                  <option value="SPAM">Spam or Unsolicited Promotion</option>
                  <option value="HARASSMENT">Harassment or Offensive Language</option>
                  <option value="INAPPROPRIATE">Inappropriate or Obscene Content</option>
                  <option value="FRAUD">Fraud or Impersonation</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-ink">Details (optional)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide additional context for the moderation team..."
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-mist bg-paper p-3 text-xs focus:outline-none focus:ring-2 focus:ring-ulab"
                />
              </div>
            </div>

            {reportSuccessMsg && (
              <p className="mt-3 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {reportSuccessMsg}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-mist/70 pt-4">
              <Button
                variant="ghost"
                onClick={() => setReportModalOpen(false)}
                className="py-1.5 px-3 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReport}
                className="py-1.5 px-3 text-xs font-semibold"
              >
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
