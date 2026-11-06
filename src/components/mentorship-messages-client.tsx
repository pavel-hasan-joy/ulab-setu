"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Compass,
  GraduationCap,
  MessageSquare,
  Search,
  Check,
  CheckCheck,
  Paperclip,
  SendHorizontal,
  FileText,
  Download,
  X,
  Lock,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Avatar, Badge, Button, cn, timeAgo } from "./ui";
import {
  fetchMessages,
  sendMessage,
  type SerializedMessage,
} from "@/app/actions/network";

export interface SerializedMentorshipConnection {
  id: string;
  fromId: string;
  toId: string;
  topic: string | null;
  isCompleted: boolean;
  createdAt: string;
  unreadCount: number;
  otherUser: {
    id: string;
    name: string;
    role: string;
    department: string | null;
    designation: string | null;
    company: string | null;
    image: string | null;
    alumniVerified?: boolean;
  };
  lastMessage?: {
    body: string;
    createdAt: string;
  };
}

interface MentorshipMessagesClientProps {
  currentUserId: string;
  basePath: string;
  connections: SerializedMentorshipConnection[];
  selectedConnectionId?: string;
}

export function MentorshipMessagesClient({
  currentUserId,
  basePath,
  connections = [],
  selectedConnectionId,
}: MentorshipMessagesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  const activeConnection = connections.find((c) => c.id === selectedConnectionId);
  const hasSelection = Boolean(activeConnection);

  const filteredConnections = connections.filter((c) => {
    if (filterTab === "ACTIVE" && c.isCompleted) return false;
    if (filterTab === "COMPLETED" && !c.isCompleted) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.otherUser.name.toLowerCase().includes(q);
      const matchTopic = (c.topic || "").toLowerCase().includes(q);
      const matchDept = (c.otherUser.department || "").toLowerCase().includes(q);
      const matchCompany = (c.otherUser.company || "").toLowerCase().includes(q);
      return matchName || matchTopic || matchDept || matchCompany;
    }
    return true;
  });

  return (
    <div className="grid overflow-hidden rounded-3xl border border-mist/80 bg-surface shadow-soft md:h-[660px] md:grid-cols-[340px_1fr] dark:border-white/10">
      {/* SIDEBAR: MENTORSHIP INBOX */}
      <div
        className={cn(
          "flex flex-col border-mist/70 bg-surface md:border-r dark:border-white/10",
          hasSelection && "hidden md:flex"
        )}
      >
        {/* Top Header & Search */}
        <div className="border-b border-mist/70 p-4 space-y-3 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass size={18} className="text-ulab" />
              <h3 className="font-display text-sm font-bold text-ink">Mentorship Inbox</h3>
            </div>
            <span className="rounded-full bg-ulab/10 px-2 py-0.5 text-[11px] font-bold text-ulab">
              {connections.length}
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              placeholder="Search by mentor, student, topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-mist/80 bg-paper/60 pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1">
            {(["ALL", "ACTIVE", "COMPLETED"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={cn(
                  "flex-1 rounded-lg py-1 text-[11px] font-semibold transition",
                  filterTab === tab
                    ? "bg-ulab text-white shadow-soft"
                    : "border border-mist/70 bg-paper/60 text-ink-soft hover:bg-paper dark:border-white/10 dark:bg-white/5"
                )}
              >
                {tab === "ALL" ? "All" : tab === "ACTIVE" ? "Active" : "Concluded"}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-mist/40 dark:divide-white/5">
          {filteredConnections.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-soft">
              <MessageSquare size={32} className="mx-auto text-ink-soft/30 mb-2" />
              <p className="font-bold text-ink">No mentorship chats found</p>
              <p className="mt-1 text-[11px]">
                {filterTab === "ALL"
                  ? "When a mentorship request is accepted, a dedicated private conversation will appear here."
                  : `No conversations matching "${filterTab.toLowerCase()}".`}
              </p>
            </div>
          ) : (
            filteredConnections.map((conn) => {
              const isSelected = conn.id === selectedConnectionId;
              const roleLabel =
                conn.otherUser.role === "TEACHER"
                  ? "Faculty Mentor"
                  : conn.otherUser.role === "ALUMNI"
                  ? "Alumni Mentor"
                  : "Student";

              return (
                <Link
                  key={conn.id}
                  href={`${basePath}?c=${conn.id}`}
                  className={cn(
                    "flex items-start gap-3 p-3.5 transition",
                    isSelected
                      ? "bg-ulab/10 dark:bg-ulab/20"
                      : "hover:bg-paper/70 dark:hover:bg-white/5"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      name={conn.otherUser.name}
                      src={conn.otherUser.image}
                      size={44}
                    />
                    {conn.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-emerald-600 text-[9px] font-bold text-white shadow-sm">
                        {conn.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate text-xs font-bold text-ink">
                          {conn.otherUser.name}
                        </span>
                        {conn.otherUser.alumniVerified && (
                          <ShieldCheck size={12} className="shrink-0 text-emerald-600" />
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-ink-soft">
                        {timeAgo(conn.lastMessage?.createdAt || conn.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] font-medium text-ink-soft">
                        {roleLabel}
                      </span>
                      {conn.topic && (
                        <span className="truncate rounded-md bg-emerald-50 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {conn.topic}
                        </span>
                      )}
                      {conn.isCompleted && (
                        <span className="rounded-md bg-paper px-1.5 py-0.2 text-[9px] font-semibold text-ink-soft">
                          Concluded
                        </span>
                      )}
                    </div>

                    <p className="truncate text-[11px] text-ink-soft">
                      {conn.lastMessage?.body || "Mentorship conversation opened"}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT PANE */}
      <div className={cn("flex flex-col bg-surface", !hasSelection && "hidden md:flex")}>
        {activeConnection ? (
          <MentorshipChatPane
            connection={activeConnection}
            currentUserId={currentUserId}
            backHref={basePath}
          />
        ) : (
          <div className="grid h-full place-items-center p-8 text-center">
            <div className="max-w-xs space-y-3">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-ulab/10 text-ulab">
                <Compass size={24} />
              </div>
              <h4 className="font-display text-sm font-bold text-ink">
                Select a Mentorship Conversation
              </h4>
              <p className="text-xs text-ink-soft leading-relaxed">
                Connect 1-on-1 with your accepted career mentor or mentee student. Discuss interview prep, resume critiques, and session scheduling.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component: Mentorship Chat Pane
function MentorshipChatPane({
  connection,
  currentUserId,
  backHref,
}: {
  connection: SerializedMentorshipConnection;
  currentUserId: string;
  backHref: string;
}) {
  const [messages, setMessages] = useState<SerializedMessage[] | null>(null);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File attachment
  const [attachment, setAttachment] = useState<{
    url: string;
    name: string;
    size?: string;
    type?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Poll for messages every 3.5 seconds
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const m = await fetchMessages(connection.id);
      if (alive) setMessages(m);
    };
    load();
    const interval = setInterval(load, 3500);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [connection.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages?.length]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("Attachment size must be 8 MB or less.");
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
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !attachment) || isSending || connection.isCompleted) return;

    setIsSending(true);
    setErrorMsg(null);

    const payload = {
      body: text.trim(),
      attachment: attachment || undefined,
    };

    setText("");
    setAttachment(null);

    const res = await sendMessage(connection.id, payload.body, payload.attachment);
    setIsSending(false);

    if (res.success) {
      const updated = await fetchMessages(connection.id);
      setMessages(updated);
    } else {
      setErrorMsg(res.error || "Failed to send message.");
    }
  };

  const roleLabel =
    connection.otherUser.role === "TEACHER"
      ? "Faculty Mentor"
      : connection.otherUser.role === "ALUMNI"
      ? "Alumni Mentor"
      : "Mentee Student";

  return (
    <div className="flex h-full flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-mist/70 p-3.5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="grid size-8 place-items-center rounded-xl border border-mist/80 bg-paper/60 text-ink-soft hover:bg-paper md:hidden"
          >
            <ArrowLeft size={14} />
          </Link>

          <Avatar
            name={connection.otherUser.name}
            src={connection.otherUser.image}
            size={40}
          />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink">
                {connection.otherUser.name}
              </span>
              {connection.otherUser.alumniVerified && (
                <ShieldCheck size={14} className="text-emerald-600" />
              )}
              <Badge
                tone={
                  connection.otherUser.role === "TEACHER"
                    ? "lilac"
                    : connection.otherUser.role === "ALUMNI"
                    ? "gold"
                    : "blue"
                }
              >
                {roleLabel}
              </Badge>
            </div>

            <p className="text-[11px] text-ink-soft">
              {connection.otherUser.designation || connection.otherUser.department || "ULAB Member"} {connection.otherUser.company && `at ${connection.otherUser.company}`}
            </p>
          </div>
        </div>

        {/* Mentorship Topic & Status Badge */}
        <div className="flex items-center gap-2">
          {connection.topic && (
            <span className="hidden sm:inline-flex rounded-xl bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              {connection.topic}
            </span>
          )}
          <Badge tone={connection.isCompleted ? "gray" : "sage"}>
            {connection.isCompleted ? "Concluded" : "Active Mentorship"}
          </Badge>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-paper/20 dark:bg-white/[0.02]">
        {/* Topic Banner */}
        {connection.topic && (
          <div className="mx-auto max-w-md rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-center text-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <span className="font-bold text-emerald-900 dark:text-emerald-200">
              Career Mentorship Track: {connection.topic}
            </span>
            <p className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">
              Private 1-on-1 session between {connection.otherUser.name} and you.
            </p>
          </div>
        )}

        {messages === null ? (
          <div className="py-12 text-center text-xs text-ink-soft">
            Loading mentorship messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-soft">
            <p className="font-bold text-ink">No messages yet</p>
            <p className="mt-1">
              Start your career guidance conversation by saying hello or sharing your questions!
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex flex-col", m.mine ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm",
                  m.mine
                    ? "bg-ulab text-white rounded-br-none"
                    : "bg-surface border border-mist/80 text-ink rounded-bl-none dark:border-white/10"
                )}
              >
                {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}

                {/* Attachment view */}
                {m.attachment && (
                  <div
                    className={cn(
                      "mt-2 flex items-center gap-2 rounded-xl p-2 text-xs",
                      m.mine ? "bg-white/15" : "bg-paper/70 dark:bg-white/5"
                    )}
                  >
                    <FileText size={16} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{m.attachment.name}</p>
                      {m.attachment.size && (
                        <p className="text-[10px] opacity-80">{m.attachment.size}</p>
                      )}
                    </div>
                    <a
                      href={m.attachment.url}
                      download={m.attachment.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:opacity-80"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                )}

                <div
                  className={cn(
                    "mt-1 flex items-center justify-end gap-1 text-[9px]",
                    m.mine ? "text-white/80" : "text-ink-soft"
                  )}
                >
                  <span>{timeAgo(m.at)}</span>
                  {m.mine && (
                    <span>
                      {m.isRead ? (
                        <CheckCheck size={12} className="text-white" />
                      ) : (
                        <Check size={12} className="text-white/60" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        <div ref={endRef} />
      </div>

      {/* Error Toast */}
      {errorMsg && (
        <div className="flex items-center gap-2 border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bottom Input or Completed Archive Banner */}
      {connection.isCompleted ? (
        <div className="border-t border-mist/70 bg-paper/60 p-4 text-center text-xs dark:border-white/10 dark:bg-white/5">
          <div className="inline-flex items-center gap-1.5 font-bold text-ink">
            <Lock size={14} className="text-ink-soft" />
            <span>This career mentorship relationship has been concluded.</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-soft">
            All messages, shared feedback, and recommendations are securely preserved in read-only mode.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="border-t border-mist/70 p-3 space-y-2 dark:border-white/10">
          {attachment && (
            <div className="flex items-center justify-between rounded-xl border border-mist/80 bg-paper/60 p-2 text-xs dark:border-white/10">
              <div className="flex items-center gap-2 truncate">
                <FileText size={14} className="text-ulab" />
                <span className="truncate font-medium text-ink">{attachment.name}</span>
                <span className="text-[10px] text-ink-soft">({attachment.size})</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="p-1 text-ink-soft hover:text-ink"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="grid size-9 place-items-center rounded-xl border border-mist/80 bg-paper/60 text-ink-soft hover:bg-paper transition dark:border-white/10"
              title="Attach resume or document"
            >
              <Paperclip size={16} />
            </button>

            <input
              type="text"
              placeholder={`Message ${connection.otherUser.name}...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 rounded-xl border border-mist/80 bg-paper/60 px-3.5 py-2 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
            />

            <Button
              type="submit"
              disabled={(!text.trim() && !attachment) || isSending}
              className="size-9 p-0 bg-ulab text-white hover:bg-ulab-deep shadow-soft"
            >
              <SendHorizontal size={15} />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
