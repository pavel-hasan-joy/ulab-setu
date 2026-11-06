"use client";

import { useState } from "react";
import {
  LifeBuoy,
  Search,
  Filter,
  UserCheck,
  Send,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import {
  replyToTicket,
  updateTicketStatus,
  assignTicket,
  addTicketInternalNote,
  type TicketStatus,
} from "@/app/actions/support";
import { Avatar, Badge, Button, cn, timeAgo } from "./ui";

export interface AdminTicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution?: string | null;
  internalNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string | null;
  };
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  messages: {
    id: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
    author: {
      id: string;
      name: string;
      role: string;
    };
  }[];
}

export interface AdminUserRef {
  id: string;
  name: string;
  email: string;
}

interface AdminTicketsManagerProps {
  initialTickets: AdminTicketItem[];
  availableAdmins: AdminUserRef[];
}

export function AdminTicketsManager({
  initialTickets,
  availableAdmins,
}: AdminTicketsManagerProps) {
  const [tickets, setTickets] = useState<AdminTicketItem[]>(initialTickets);
  const [activeTicket, setActiveTicket] = useState<AdminTicketItem | null>(
    initialTickets[0] || null
  );

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Interaction states
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  // Status & Resolution update modal/state
  const [newStatus, setNewStatus] = useState<TicketStatus>("RESOLVED");
  const [resolutionText, setResolutionText] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Assign ticket
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.user.name.toLowerCase().includes(q) ||
        t.user.email.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    const body = replyText.trim();
    const isInternal = isInternalNote;
    setReplyText("");
    setIsReplying(true);

    const optimisticMsg = {
      id: `tmp-${Date.now()}`,
      body,
      isInternal,
      createdAt: new Date().toISOString(),
      author: {
        id: "admin",
        name: isInternal ? "Internal Note" : "Staff Response",
        role: "ADMIN",
      },
    };

    const updated = {
      ...activeTicket,
      status: !isInternal ? "WAITING_FOR_USER" : activeTicket.status,
      messages: [...activeTicket.messages, optimisticMsg],
    };

    setActiveTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? updated : t)));

    await replyToTicket(activeTicket.id, body, isInternal);
    setIsReplying(false);
  };

  const handleStatusUpdate = async () => {
    if (!activeTicket) return;
    setIsUpdatingStatus(true);

    await updateTicketStatus(activeTicket.id, newStatus, resolutionText);

    const updated = {
      ...activeTicket,
      status: newStatus,
      resolution: resolutionText || activeTicket.resolution,
    };

    setActiveTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? updated : t)));
    setIsUpdatingStatus(false);
    setResolutionText("");
  };

  const handleAssign = async (adminId: string) => {
    if (!activeTicket) return;
    await assignTicket(activeTicket.id, adminId ? adminId : null);

    const assignedAdmin = availableAdmins.find((a) => a.id === adminId) || null;
    const updated = {
      ...activeTicket,
      assignedTo: assignedAdmin ? { id: assignedAdmin.id, name: assignedAdmin.name } : null,
      status: activeTicket.status === "OPEN" ? "IN_PROGRESS" : activeTicket.status,
    };

    setActiveTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? updated : t)));
  };

  const getStatusTone = (status: string): "gold" | "blue" | "lilac" | "sage" | "gray" => {
    switch (status) {
      case "OPEN":
        return "gold";
      case "IN_PROGRESS":
        return "blue";
      case "WAITING_FOR_USER":
        return "lilac";
      case "RESOLVED":
        return "sage";
      default:
        return "gray";
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
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-mist bg-surface p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket #, subject, student name, email..."
              className="w-full rounded-xl border border-mist bg-paper py-2 pl-9 pr-3 text-xs text-ink focus:border-ulab focus:outline-none"
            />
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
            <span className="rounded-lg bg-gold/15 px-2.5 py-1 text-gold-ink">
              Open: {tickets.filter((t) => t.status === "OPEN").length}
            </span>
            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              In Progress: {tickets.filter((t) => t.status === "IN_PROGRESS").length}
            </span>
            <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              Waiting: {tickets.filter((t) => t.status === "WAITING_FOR_USER").length}
            </span>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-mist/60">
          <div className="flex items-center gap-1.5 text-xs text-ink-soft">
            <Filter size={13} />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-mist bg-paper px-2.5 py-1.5 text-xs focus:border-ulab focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_USER">Waiting for User</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-mist bg-paper px-2.5 py-1.5 text-xs focus:border-ulab focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="LOGIN">Login</option>
            <option value="VERIFICATION">Verification</option>
            <option value="PROFILE">Profile</option>
            <option value="JOB_POSTING">Job Posting</option>
            <option value="JOB_APPLICATION">Job Application</option>
            <option value="MESSAGING">Messaging</option>
            <option value="TECHNICAL">Technical</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-mist bg-paper px-2.5 py-1.5 text-xs focus:border-ulab focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Main Support Workspace */}
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left: Filtered Ticket List */}
        <div className="space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="rounded-2xl border border-mist bg-surface p-8 text-center shadow-soft">
              <LifeBuoy size={24} className="mx-auto text-ink-soft" />
              <p className="mt-3 text-xs font-bold text-ink">No support tickets match filters</p>
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
                    <span className="font-mono text-xs font-bold text-ulab-deep">
                      {t.ticketNumber}
                    </span>
                    <div className="flex items-center gap-1">
                      <Badge tone={getPriorityTone(t.priority)} className="text-[10px]">
                        {t.priority}
                      </Badge>
                      <Badge tone={getStatusTone(t.status)} className="text-[10px]">
                        {t.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>

                  <h4 className="mt-2 text-xs font-bold text-ink truncate">{t.subject}</h4>
                  <p className="mt-1 text-[11px] text-ink-soft line-clamp-2">
                    {t.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-ink-soft">
                    <span>From: <strong>{t.user.name}</strong> ({t.user.role})</span>
                    <span>{timeAgo(t.createdAt)}</span>
                  </div>

                  {t.assignedTo && (
                    <p className="mt-1 text-[10px] text-purple-700 dark:text-purple-300">
                      Assigned: {t.assignedTo.name}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right: Active Ticket Details & Admin Response Desk */}
        <div className="rounded-2xl border border-mist bg-surface p-5 shadow-soft">
          {activeTicket ? (
            <div className="flex flex-col space-y-4">
              {/* Ticket Administrative Header */}
              <div className="border-b border-mist/70 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ulab-deep bg-sky px-2.5 py-1 rounded-lg">
                      {activeTicket.ticketNumber}
                    </span>
                    <Badge tone={getPriorityTone(activeTicket.priority)}>
                      {activeTicket.priority}
                    </Badge>
                    <Badge tone={getStatusTone(activeTicket.status)}>
                      {activeTicket.status.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  {/* Assignee Selector */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <UserCheck size={14} className="text-ink-soft" />
                    <select
                      value={activeTicket.assignedTo?.id || ""}
                      onChange={(e) => handleAssign(e.target.value)}
                      className="rounded-xl border border-mist bg-paper px-2 py-1 text-xs focus:border-ulab focus:outline-none"
                    >
                      <option value="">Unassigned</option>
                      {availableAdmins.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <h3 className="mt-3 font-display text-base font-bold text-ink">
                  {activeTicket.subject}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
                  <span>User: <strong>{activeTicket.user.name}</strong> ({activeTicket.user.email})</span>
                  <span>•</span>
                  <span>Role: <strong>{activeTicket.user.role}</strong></span>
                  <span>•</span>
                  <span>Category: <strong>{activeTicket.category}</strong></span>
                  <span>•</span>
                  <span>Filed {timeAgo(activeTicket.createdAt)}</span>
                </div>

                {/* Status Updater Section */}
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-paper p-3 border border-mist/70">
                  <span className="text-xs font-bold text-ink">Change Status:</span>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                    className="rounded-lg border border-mist bg-surface px-2 py-1 text-xs"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_FOR_USER">Waiting for User</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>

                  <input
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Resolution notes or remarks..."
                    className="flex-1 min-w-[200px] rounded-lg border border-mist bg-surface px-2.5 py-1 text-xs"
                  />

                  <Button
                    onClick={handleStatusUpdate}
                    disabled={isUpdatingStatus}
                    className="py-1 px-3 text-xs font-semibold"
                  >
                    {isUpdatingStatus ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>

              {/* Message Thread History */}
              <div className="space-y-3 overflow-y-auto max-h-[360px] p-2 bg-paper/40 rounded-xl">
                {activeTicket.messages.map((m) => {
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "rounded-2xl p-3.5 text-xs shadow-soft leading-relaxed border",
                        m.isInternal
                          ? "bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                          : m.author.role === "ADMIN"
                          ? "bg-sky/40 border-sky-light/50 dark:bg-sky/10"
                          : "bg-surface border-mist"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 pb-1 border-b border-mist/40 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          {m.isInternal && (
                            <span className="flex items-center gap-0.5 rounded bg-amber-200 px-1.5 py-0.5 font-bold text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                              <Lock size={10} /> STAFF INTERNAL NOTE
                            </span>
                          )}
                          <strong className="text-ink">{m.author.name}</strong>
                          <span className="text-ink-soft">({m.author.role})</span>
                        </div>
                        <span className="text-ink-soft">{timeAgo(m.createdAt)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-line text-ink">{m.body}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Desk */}
              <form onSubmit={handleSendReply} className="space-y-2 pt-2 border-t border-mist/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink">
                    {isInternalNote ? "Staff Internal Note (Hidden from user)" : "Public Reply to User"}
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-ink-soft">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="size-3.5 accent-amber-600"
                    />
                    Mark as Internal Staff Note
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? "Record confidential staff investigation or handover notes..."
                        : "Write official response to the user..."
                    }
                    className="flex-1 rounded-xl border border-mist bg-paper p-2.5 text-xs text-ink focus:border-ulab focus:outline-none"
                  />
                  <Button
                    type="submit"
                    disabled={!replyText.trim() || isReplying}
                    className={cn(
                      "py-3 px-4 text-xs font-semibold gap-1.5 shrink-0",
                      isInternalNote ? "bg-amber-600 hover:bg-amber-700" : ""
                    )}
                  >
                    <Send size={13} />
                    {isReplying ? "Saving..." : isInternalNote ? "Add Note" : "Send Reply"}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="grid h-72 place-items-center text-center">
              <div>
                <LifeBuoy size={28} className="mx-auto text-ink-soft" />
                <p className="mt-2 text-sm font-semibold text-ink">Select a ticket</p>
                <p className="text-xs text-ink-soft">
                  Choose a ticket from the left queue to respond or assign.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

