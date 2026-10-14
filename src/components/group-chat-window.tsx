"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Download,
  FileText,
  ImageIcon,
  Info,
  Paperclip,
  SendHorizontal,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  fetchGroupMessages,
  getGroupDetails,
  sendGroupMessage,
  type GroupAttachment,
} from "@/app/actions/group";
import { Avatar, cn } from "./ui";
import { GroupInfoModal } from "./group-info-modal";

interface GroupMsg {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderSubtitle: string;
  mine: boolean;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentSize: string | null;
  attachmentType: string | null;
  at: string;
}

interface Person {
  id: string;
  name: string;
  role: string;
  subtitle: string;
}

interface GroupChatWindowProps {
  groupId: string;
  groupName: string;
  memberCount: number;
  backHref: string;
  currentUserId: string;
  availablePeople: Person[];
}

export function GroupChatWindow({
  groupId,
  groupName,
  memberCount,
  backHref,
  currentUserId,
  availablePeople,
}: GroupChatWindowProps) {
  const [messages, setMessages] = useState<GroupMsg[] | null>(null);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<GroupAttachment | null>(null);
  const [sending, setSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [groupDetails, setGroupDetails] = useState<Awaited<
    ReturnType<typeof getGroupDetails>
  > | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load group details for modal
  const loadDetails = async () => {
    const details = await getGroupDetails(groupId);
    if (details) setGroupDetails(details);
  };

  useEffect(() => {
    loadDetails();
  }, [groupId]);

  // Poll for messages every 3.5s
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const ms = await fetchGroupMessages(groupId);
      if (alive) setMessages(ms);
    };
    load();
    const interval = setInterval(load, 3500);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [groupId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages?.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("File size must be under 8 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const formattedSize =
        file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      setAttachment({
        url: reader.result as string,
        name: file.name,
        size: formattedSize,
        type: file.type || "application/octet-stream",
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body && !attachment) return;

    const currentAtt = attachment;
    setText("");
    setAttachment(null);
    setSending(true);

    // Optimistic UI update
    setMessages((prev) => [
      ...(prev ?? []),
      {
        id: `tmp-${Date.now()}`,
        body: body || (currentAtt ? `Sent an attachment: ${currentAtt.name}` : ""),
        senderId: currentUserId,
        senderName: "You",
        senderRole: "STUDENT",
        senderSubtitle: "",
        mine: true,
        attachmentUrl: currentAtt?.url || null,
        attachmentName: currentAtt?.name || null,
        attachmentSize: currentAtt?.size || null,
        attachmentType: currentAtt?.type || null,
        at: new Date().toISOString(),
      },
    ]);

    await sendGroupMessage(groupId, body, currentAtt || undefined);
    const updated = await fetchGroupMessages(groupId);
    setMessages(updated);
    setSending(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "TEACHER":
        return (
          <span className="rounded bg-emerald-500/15 px-1 py-0.2 text-[10px] font-bold text-emerald-700">
            Faculty
          </span>
        );
      case "ALUMNI":
        return (
          <span className="rounded bg-purple-500/15 px-1 py-0.2 text-[10px] font-bold text-purple-700">
            Alumni
          </span>
        );
      default:
        return (
          <span className="rounded bg-sky px-1 py-0.2 text-[10px] font-semibold text-ulab-deep">
            Student
          </span>
        );
    }
  };

  return (
    <div className="flex h-[75dvh] flex-col md:h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-mist/70 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={backHref}
            className="rounded-lg p-1.5 text-ink-soft md:hidden"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-ulab to-ulab-light text-xs font-bold text-white shadow-soft">
            {groupName.slice(0, 2).toUpperCase()}
          </div>
          <button
            onClick={() => setShowInfo(true)}
            className="text-left min-w-0 transition hover:opacity-80"
          >
            <p className="truncate text-sm font-bold text-ink">{groupName}</p>
            <p className="truncate text-xs text-ink-soft">
              {groupDetails ? `${groupDetails.members.length} members` : `${memberCount} members`} • Tap for info
            </p>
          </button>
        </div>

        <button
          onClick={() => setShowInfo(true)}
          className="rounded-xl border border-mist/80 p-2 text-ink-soft transition hover:border-ulab-light hover:bg-sky hover:text-ulab"
          title="Group Info"
          aria-label="Group Info"
        >
          <Info size={18} />
        </button>
      </div>

      {/* Message Feed */}
      <div className="dots flex-1 space-y-3.5 overflow-y-auto bg-paper/60 px-4 py-5">
        {messages === null &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn("skeleton h-12 w-2/3 rounded-2xl", i % 2 === 1 && "ml-auto")}
            />
          ))}

        {messages?.length === 0 && (
          <div className="pt-12 text-center">
            <p className="text-sm font-semibold text-ink">Welcome to {groupName}!</p>
            <p className="mt-1 text-xs text-ink-soft">
              Say hello or share attachments with everyone in this group.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages?.map((m) => {
            const isSystem =
              m.body.startsWith("🎉 Created the group") ||
              m.body.startsWith("➕ Added") ||
              m.body.startsWith("🚫 Removed") ||
              m.body.startsWith("👋");

            if (isSystem) {
              return (
                <div key={m.id} className="flex justify-center my-2">
                  <span className="rounded-full bg-mist/60 px-3 py-1 text-[11px] font-medium text-ink-soft">
                    {m.body}
                  </span>
                </div>
              );
            }

            const isImage = m.attachmentType?.startsWith("image/");

            return (
              <motion.div
                key={m.id}
                layout="position"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className={cn("flex gap-2.5", m.mine ? "justify-end" : "justify-start")}
              >
                {!m.mine && (
                  <div className="shrink-0 self-end">
                    <Avatar name={m.senderName} size={28} />
                  </div>
                )}

                <div
                  className={cn(
                    "flex flex-col max-w-[82%]",
                    m.mine ? "items-end" : "items-start"
                  )}
                >
                  {!m.mine && (
                    <div className="mb-1 flex items-center gap-1.5 pl-1">
                      <span className="text-[11px] font-semibold text-ink">
                        {m.senderName}
                      </span>
                      {getRoleBadge(m.senderRole)}
                    </div>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl p-3 text-sm leading-relaxed shadow-soft",
                      m.mine
                        ? "rounded-br-sm bg-ulab text-white"
                        : "rounded-bl-sm bg-surface text-ink border border-mist/50"
                    )}
                  >
                    {/* Attachment rendering */}
                    {m.attachmentUrl && (
                      <div className="mb-2">
                        {isImage ? (
                          <div className="overflow-hidden rounded-xl">
                            <img
                              src={m.attachmentUrl}
                              alt={m.attachmentName || "Attached image"}
                              className="max-h-60 w-auto rounded-xl object-contain"
                            />
                          </div>
                        ) : (
                          <a
                            href={m.attachmentUrl}
                            download={m.attachmentName || "attachment"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "flex items-center gap-3 rounded-xl p-2.5 transition",
                              m.mine
                                ? "bg-white/15 hover:bg-white/25 text-white"
                                : "bg-paper hover:bg-mist/40 text-ink border border-mist"
                            )}
                          >
                            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-ulab/10 text-ulab">
                              <FileText size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold">
                                {m.attachmentName || "Document"}
                              </p>
                              {m.attachmentSize && (
                                <p className="text-[10px] opacity-80">
                                  {m.attachmentSize}
                                </p>
                              )}
                            </div>
                            <Download size={16} className="shrink-0 opacity-80" />
                          </a>
                        )}
                      </div>
                    )}

                    {m.body && (!m.attachmentUrl || m.body !== `Sent an attachment: ${m.attachmentName}`) && (
                      <p className="whitespace-pre-line">{m.body}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Attachment Preview Box */}
      {attachment && (
        <div className="flex items-center justify-between border-t border-mist/60 bg-sky/50 px-4 py-2 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            {attachment.type.startsWith("image/") ? (
              <ImageIcon size={16} className="text-ulab" />
            ) : (
              <FileText size={16} className="text-ulab" />
            )}
            <span className="truncate font-semibold text-ulab-deep">
              {attachment.name}
            </span>
            <span className="text-ink-soft">({attachment.size})</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="rounded p-1 text-ink-soft hover:text-rose"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={onSend}
        className="flex items-center gap-2 border-t border-mist/70 p-3 bg-surface"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-mist text-ink-soft transition hover:border-ulab hover:bg-sky hover:text-ulab"
          title="Attach file or photo"
          aria-label="Attach file"
        >
          <Paperclip size={18} />
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message the group..."
          aria-label="Message"
          className="flex-1 rounded-xl border border-mist bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-ulab focus:outline-none focus:ring-4 focus:ring-ulab/15"
        />

        <motion.button
          whileTap={{ scale: 0.92 }}
          type="submit"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-ulab text-white shadow-soft transition disabled:opacity-50"
          disabled={sending || (!text.trim() && !attachment)}
          aria-label="Send"
        >
          <SendHorizontal size={17} />
        </motion.button>
      </form>

      {/* Group Info Modal */}
      {groupDetails && (
        <GroupInfoModal
          isOpen={showInfo}
          onClose={() => setShowInfo(false)}
          group={groupDetails}
          currentUserId={currentUserId}
          basePath={backHref}
          availablePeople={availablePeople}
          onRefreshGroup={loadDetails}
        />
      )}
    </div>
  );
}
