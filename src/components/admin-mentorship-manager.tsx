"use client";

import { useState } from "react";
import {
  Compass,
  Search,
  Filter,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  Award,
} from "lucide-react";
import { Avatar, Badge, Button, cn, timeAgo } from "./ui";

export interface AdminMentorshipRequestItem {
  id: string;
  topic: string;
  message: string;
  careerGoals: string | null;
  status: string;
  sessionFormat: string | null;
  scheduledAt: string | null;
  sessionLink: string | null;
  mentorNotes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    department: string | null;
    image: string | null;
  };
  mentor: {
    id: string;
    name: string;
    email: string;
    role: string;
    company: string | null;
    designation: string | null;
    department: string | null;
  };
}

interface AdminMentorshipManagerProps {
  initialRequests: AdminMentorshipRequestItem[];
  totalMentorsCount: number;
}

export function AdminMentorshipManager({
  initialRequests,
  totalMentorsCount,
}: AdminMentorshipManagerProps) {
  const [requests] = useState<AdminMentorshipRequestItem[]>(initialRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const totalCompleted = requests.filter((r) => r.status === "COMPLETED").length;
  const totalScheduled = requests.filter((r) => r.status === "SCHEDULED").length;
  const totalAccepted = requests.filter((r) => r.status === "ACCEPTED").length;
  const totalPending = requests.filter((r) => r.status === "PENDING").length;

  const acceptanceRate =
    requests.length > 0
      ? Math.round(
          ((totalCompleted + totalScheduled + totalAccepted) / requests.length) * 100
        )
      : 0;

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.topic.toLowerCase().includes(q) ||
        r.student.name.toLowerCase().includes(q) ||
        r.student.email.toLowerCase().includes(q) ||
        r.mentor.name.toLowerCase().includes(q) ||
        r.mentor.email.toLowerCase().includes(q) ||
        (r.mentor.company && r.mentor.company.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const getStatusTone = (status: string): "sage" | "blue" | "gold" | "rose" | "gray" => {
    switch (status) {
      case "COMPLETED":
        return "sage";
      case "SCHEDULED":
        return "blue";
      case "ACCEPTED":
        return "sage";
      case "PENDING":
        return "gold";
      case "DECLINED":
        return "rose";
      default:
        return "gray";
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-mist bg-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold text-ink-soft">Registered Mentors</p>
          <p className="mt-1 text-2xl font-bold text-ink">{totalMentorsCount}</p>
        </div>
        <div className="rounded-2xl border border-mist bg-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold text-ink-soft">Pending Requests</p>
          <p className="mt-1 text-2xl font-bold text-gold-ink">{totalPending}</p>
        </div>
        <div className="rounded-2xl border border-mist bg-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold text-ink-soft">Scheduled Sessions</p>
          <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{totalScheduled}</p>
        </div>
        <div className="rounded-2xl border border-mist bg-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold text-ink-soft">Completed Sessions</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalCompleted}</p>
        </div>
        <div className="rounded-2xl border border-mist bg-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold text-ink-soft">Acceptance Rate</p>
          <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">{acceptanceRate}%</p>
        </div>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-mist bg-surface p-4 shadow-soft">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mentorship requests by topic, student, or alumni mentor..."
            className="w-full rounded-xl border border-mist bg-paper py-2.5 pl-9 pr-3 text-xs text-ink focus:border-ulab focus:outline-none"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-mist/60 text-xs">
          {["ALL", "PENDING", "ACCEPTED", "SCHEDULED", "COMPLETED", "DECLINED", "CANCELLED"].map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "rounded-xl px-3 py-1.5 font-semibold transition",
                  statusFilter === st
                    ? "bg-ulab text-white shadow-sm"
                    : "bg-paper text-ink-soft hover:text-ink"
                )}
              >
                {st === "ALL" ? `All (${requests.length})` : st.replace(/_/g, " ")}
              </button>
            )
          )}
        </div>
      </div>

      {/* Requests Feed */}
      {filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-mist bg-surface p-12 text-center shadow-soft">
          <Compass size={28} className="mx-auto text-ink-soft" />
          <h3 className="mt-3 text-sm font-bold text-ink">No mentorship sessions found</h3>
          <p className="mt-1 text-xs text-ink-soft">No records match the current filter criteria.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredRequests.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-mist bg-surface p-5 shadow-soft transition hover:shadow-lift space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <Badge tone={getStatusTone(r.status)} className="text-[10px]">
                  {r.status.replace(/_/g, " ")}
                </Badge>
                <span className="text-[11px] text-ink-soft">{timeAgo(r.createdAt)}</span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-ink">{r.topic}</h4>
                <p className="mt-1 text-xs text-ink-soft italic line-clamp-2">
                  &ldquo;{r.message}&rdquo;
                </p>
              </div>

              {/* Mentee & Mentor Comparison */}
              <div className="grid grid-cols-2 gap-3 border-t border-mist/60 pt-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                    Student (Mentee)
                  </span>
                  <p className="font-semibold text-ink">{r.student.name}</p>
                  <p className="text-[11px] text-ink-soft">{r.student.department}</p>
                  <p className="text-[10px] text-ink-soft font-mono">{r.student.email}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                    Alumni Mentor
                  </span>
                  <p className="font-semibold text-ink">{r.mentor.name}</p>
                  <p className="text-[11px] text-ink-soft">
                    {r.mentor.designation} {r.mentor.company ? `(${r.mentor.company})` : ""}
                  </p>
                  <p className="text-[10px] text-ink-soft font-mono">{r.mentor.email}</p>
                </div>
              </div>

              {/* Scheduled Session / Notes */}
              {r.scheduledAt && (
                <div className="rounded-xl bg-paper p-2.5 text-[11px] text-ink-soft border border-mist/60 flex items-center justify-between">
                  <span>📅 Scheduled: {new Date(r.scheduledAt).toLocaleString()}</span>
                  {r.sessionLink && (
                    <a
                      href={r.sessionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ulab font-semibold hover:underline"
                    >
                      Meeting Link
                    </a>
                  )}
                </div>
              )}

              {r.mentorNotes && (
                <p className="text-[11px] text-ink-soft border-t border-mist/50 pt-2">
                  <strong className="text-ink">Mentor Feedback:</strong> {r.mentorNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
