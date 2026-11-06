"use client";

import { useState } from "react";
import {
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  X,
  ShieldCheck,
  Check,
  User as UserIcon,
} from "lucide-react";
import {
  createSupportTicket,
  replyToTicket,
  updateTicketStatus,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/app/actions/support";
import { Avatar, Badge, Button, cn, timeAgo } from "./ui";

export interface SerializedTicketMessage {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
    image?: string | null;
  };
}

export interface SerializedSupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  messages: SerializedTicketMessage[];
}

interface UserSupportViewProps {
  initialTickets: SerializedSupportTicket[];
  currentUserId: string;
  baseRole: "student" | "alumni" | "teacher";
}

export function UserSupportView({
  initialTickets,
  currentUserId,
  baseRole,
}: UserSupportViewProps) {
  const [tickets, setTickets] = useState<SerializedSupportTicket[]>(initialTickets);
  const [activeTicket, setActiveTicket] = useState<SerializedSupportTicket | null>(
    initialTickets[0] || null
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("TECHNICAL");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Reply states
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === "ALL") return true;
    return t.status === statusFilter;
  });

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    const res = await createSupportTicket({
      subject,
      category,
      priority,
      description,
    });

    setIsSubmitting(false);

    if (res.error) {
      setFormError(res.error);
      return;
    }

    const newTicket: SerializedSupportTicket = {
      id: res.ticketId!,
      ticketNumber: res.ticketNumber!,
      subject,
      category,
      priority,
      status: "OPEN",
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `tmp-${Date.now()}`,
          body: description,
          isInternal: false,
          createdAt: new Date().toISOString(),
          author: {
            id: currentUserId,
            name: "You",
            role: baseRole.toUpperCase(),
          },
        },
      ],
    };

    setTickets([newTicket, ...tickets]);
    setActiveTicket(newTicket);
    setIsCreateOpen(false);
    setSubject("");
    setDescription("");
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    const body = replyText.trim();
    setReplyText("");
    setIsReplying(true);

    // Optimistic message update
    const optimisticMsg: SerializedTicketMessage = {
      id: `msg-${Date.now()}`,
      body,
      isInternal: false,
      createdAt: new Date().toISOString(),
      author: {
        id: currentUserId,
        name: "You",
        role: baseRole.toUpperCase(),
      },
    };

    const updatedActive = {
      ...activeTicket,
      status: activeTicket.status === "WAITING_FOR_USER" ? "IN_PROGRESS" : activeTicket.status,
      messages: [...activeTicket.messages, optimisticMsg],
    };

    setActiveTicket(updatedActive);
    setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? updatedActive : t)));

    await replyToTicket(activeTicket.id, body, false);
    setIsReplying(false);
  };

  const handleToggleClose = async () => {
    if (!activeTicket) return;
    const newStatus: TicketStatus = activeTicket.status === "CLOSED" ? "OPEN" : "CLOSED";

    const updated = { ...activeTicket, status: newStatus };
    setActiveTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? updated : t)));

    await updateTicketStatus(activeTicket.id, newStatus);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge tone="gold">Open</Badge>;
      case "IN_PROGRESS":
        return <Badge tone="blue">In Progress</Badge>;
      case "WAITING_FOR_USER":
        return <Badge tone="lilac">Waiting for You</Badge>;
      case "RESOLVED":
        return <Badge tone="sage">Resolved</Badge>;
      case "CLOSED":
        return <Badge tone="gray">Closed</Badge>;
      default:
        return <Badge tone="gray">{status}</Badge>;
    }
  };

  const getPriorityTone = (priority: string): "rose" | "gold" | "sage" | "gray" => {
    switch (priority) {
      case "URGENT":
      case "HIGH":
        return "rose";
      case "MEDIUM":
        return "gold";
      case "LOW":
        return "sage";
      default:
        return "gray";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-mist bg-surface p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "OPEN", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                statusFilter === st
                  ? "bg-ulab text-white shadow-sm"
                  : "bg-paper text-ink-soft hover:text-ink"
              )}
            >
              {st === "ALL" ? `All (${tickets.length})` : st.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* New Ticket Action */}
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-1.5 py-2 px-3.5 text-xs font-semibold shadow-soft"
        >
          <Plus size={15} />
          Create Support Ticket
        </Button>
      </div>

      {/* Main Grid: Ticket List + Selected Ticket Thread */}
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left: Ticket Cards List */}
        <div className="space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="rounded-2xl border border-mist bg-surface p-8 text-center shadow-soft">
              <div className="mx-auto grid size-10 place-items-center rounded-xl bg-sky text-ulab-deep">
                <LifeBuoy size={20} />
              </div>
              <p className="mt-3 text-xs font-bold text-ink">No tickets found</p>
              <p className="mt-1 text-[11px] text-ink-soft">
                {statusFilter === "ALL"
                  ? "You have not submitted any support tickets yet."
                  : `No tickets matching "${statusFilter}".`}
              </p>
            </div>
          ) : (
            filteredTickets.map((t) => {
              const isSelected = activeTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setActiveTicket(t)}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-4 transition shadow-soft",
                    isSelected
                      ? "border-ulab bg-sky/30 dark:bg-sky/10"
                      : "border-mist/70 bg-surface hover:bg-paper/70"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-ulab-deep">
                      {t.ticketNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge tone={getPriorityTone(t.priority)} className="text-[10px]">
                        {t.priority}
                      </Badge>
                      {getStatusBadge(t.status)}
                    </div>
                  </div>

                  <h4 className="mt-2 text-xs font-bold text-ink truncate">{t.subject}</h4>
                  <p className="mt-1 text-[11px] text-ink-soft line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-ink-soft">
                    <span>Category: {t.category.replace(/_/g, " ")}</span>
                    <span>{timeAgo(t.updatedAt || t.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Active Ticket Details & Conversation Thread */}
        <div className="rounded-2xl border border-mist bg-surface p-5 shadow-soft">
          {activeTicket ? (
            <div className="flex flex-col h-full space-y-4">
              {/* Ticket Header */}
              <div className="border-b border-mist/70 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ulab-deep bg-sky px-2.5 py-1 rounded-lg">
                      {activeTicket.ticketNumber}
                    </span>
                    <Badge tone={getPriorityTone(activeTicket.priority)}>
                      {activeTicket.priority} Priority
                    </Badge>
                    {getStatusBadge(activeTicket.status)}
                  </div>

                  <Button
                    variant="ghost"
                    onClick={handleToggleClose}
                    className="py-1 px-2.5 text-xs text-ink-soft hover:text-ink"
                  >
                    {activeTicket.status === "CLOSED" ? "Reopen Ticket" : "Close Ticket"}
                  </Button>
                </div>

                <h3 className="mt-3 font-display text-base font-bold text-ink">
                  {activeTicket.subject}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
                  <span>Category: <strong>{activeTicket.category.replace(/_/g, " ")}</strong></span>
                  <span>•</span>
                  <span>Filed {timeAgo(activeTicket.createdAt)}</span>
                  {activeTicket.assignedTo && (
                    <>
                      <span>•</span>
                      <span>Assigned Agent: <strong>{activeTicket.assignedTo.name}</strong></span>
                    </>
                  )}
                </div>

                {activeTicket.resolution && (
                  <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Official Resolution:
                    </p>
                    <p className="mt-1">{activeTicket.resolution}</p>
                  </div>
                )}
              </div>

              {/* Thread Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] p-2 bg-paper/40 rounded-xl">
                {activeTicket.messages
                  .filter((m) => !m.isInternal) // Strict privacy: internal notes never visible to users
                  .map((m) => {
                    const isMine = m.author.id === currentUserId;
                    return (
                      <div
                        key={m.id}
                        className={cn("flex flex-col", isMine ? "items-end" : "items-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-3 shadow-soft leading-relaxed text-xs",
                            isMine
                              ? "bg-ulab text-white rounded-br-sm"
                              : "bg-surface border border-mist text-ink rounded-bl-sm"
                          )}
                        >
                          <div
                            className={cn(
                              "mb-1 flex items-center justify-between gap-3 text-[10px]",
                              isMine ? "text-white/80" : "text-ink-soft"
                            )}
                          >
                            <span className="font-bold">{m.author.name}</span>
                            <span>{timeAgo(m.createdAt)}</span>
                          </div>
                          <p className="whitespace-pre-line">{m.body}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Reply Form */}
              {activeTicket.status !== "CLOSED" ? (
                <form onSubmit={handleSendReply} className="flex items-center gap-2 pt-2">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response to the support team..."
                    className="flex-1 rounded-xl border border-mist bg-paper px-3.5 py-2.5 text-xs text-ink focus:border-ulab focus:outline-none"
                  />
                  <Button
                    type="submit"
                    disabled={!replyText.trim() || isReplying}
                    className="py-2.5 px-4 text-xs font-semibold gap-1.5"
                  >
                    <Send size={13} />
                    {isReplying ? "Sending..." : "Reply"}
                  </Button>
                </form>
              ) : (
                <div className="rounded-xl bg-mist/30 p-3 text-center text-xs text-ink-soft">
                  This ticket is marked closed. Click &ldquo;Reopen Ticket&rdquo; above to continue the conversation.
                </div>
              )}
            </div>
          ) : (
            <div className="grid h-72 place-items-center text-center">
              <div>
                <LifeBuoy size={28} className="mx-auto text-ink-soft" />
                <p className="mt-2 text-sm font-semibold text-ink">Select a ticket</p>
                <p className="text-xs text-ink-soft">
                  Choose a ticket from the left panel to review responses.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-mist bg-surface p-6 shadow-lift">
            <div className="flex items-center justify-between border-b border-mist/70 pb-3">
              <div className="flex items-center gap-2">
                <LifeBuoy size={18} className="text-ulab" />
                <h3 className="font-display text-base font-bold text-ink">
                  Submit Customer Support Ticket
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-paper hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-ink">Subject / Issue Summary *</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Cannot update graduation year on profile"
                  required
                  className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2 text-xs focus:border-ulab focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2 text-xs focus:border-ulab focus:outline-none"
                  >
                    <option value="LOGIN">Login & Authentication</option>
                    <option value="VERIFICATION">Email / Student ID Verification</option>
                    <option value="PROFILE">Profile & Contact Info</option>
                    <option value="JOB_POSTING">Job Posting & Management</option>
                    <option value="JOB_APPLICATION">Job Applications & ATS</option>
                    <option value="MESSAGING">Direct Messaging & Chat</option>
                    <option value="TECHNICAL">General Technical Problem</option>
                    <option value="OTHER">Other Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2 text-xs focus:border-ulab focus:outline-none"
                  >
                    <option value="LOW">Low (General question)</option>
                    <option value="MEDIUM">Medium (Standard issue)</option>
                    <option value="HIGH">High (Impacts work)</option>
                    <option value="URGENT">Urgent (Blocked completely)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink">Description & Steps to Reproduce *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide details about what happened, any error messages, and what you were trying to do..."
                  rows={4}
                  required
                  className="mt-1 w-full rounded-xl border border-mist bg-paper p-3 text-xs focus:border-ulab focus:outline-none"
                />
              </div>

              {formError && (
                <p className="text-xs font-semibold text-rose">{formError}</p>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-mist/70 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateOpen(false)}
                  className="py-1.5 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-1.5 px-4 text-xs font-semibold"
                >
                  {isSubmitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

