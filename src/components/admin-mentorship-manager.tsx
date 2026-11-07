"use client";

import { useState } from "react";
import Link from "next/link";
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
  Star,
  ShieldAlert,
  ShieldCheck,
  History,
  BarChart3,
  MessageSquare,
  Users,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  XCircle,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { Avatar, Badge, Button, Card, cn, timeAgo } from "./ui";
import {
  adminModerateFeedback,
  adminToggleMentorStatus,
} from "@/app/actions/mentorship";

export interface AdminMentorshipDashboardData {
  kpis: {
    totalMentors: number;
    activeAlumniMentors: number;
    activeFacultyMentors: number;
    availableMentors: number;
    fullyBookedMentors: number;
    totalRequests: number;
    pendingRequests: number;
    acceptedRequests: number;
    activeRelationships: number;
    completedMentorships: number;
    cancelledMentorships: number;
    acceptanceRate: number;
  };
  mentors: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
    company: string | null;
    designation: string | null;
    careerField: string | null;
    expertise: string | null;
    skills: string | null;
    topics: string | null;
    maxMentees: number;
    activeMenteesCount: number;
    totalRequestsCount: number;
    reportsCount: number;
    averageRating: number | null;
    totalReviews: number;
    isActive: boolean;
    status: string;
    image: string | null;
    alumniVerified?: boolean;
  }>;
  requests: Array<{
    id: string;
    topic: string;
    message: string;
    careerGoals: string | null;
    reason: string | null;
    status: string;
    sessionFormat: string | null;
    scheduledAt: string | null;
    sessionLink: string | null;
    mentorNotes: string | null;
    startedAt: string | null;
    completedAt: string | null;
    declinedAt: string | null;
    cancelledAt: string | null;
    endReason: string | null;
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
    relationship?: {
      id: string;
      status: string;
      hasFeedback: boolean;
    } | null;
  }>;
  feedbacks: Array<{
    id: string;
    relationshipId: string;
    rating: number;
    review: string | null;
    status: string;
    isReported: boolean;
    reportReason: string | null;
    adminNotes: string | null;
    createdAt: string;
    student: {
      id: string;
      name: string;
      email?: string;
      department: string | null;
    };
    mentor: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string | null;
    details: string | null;
    createdAt: string;
    actor: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }>;
  reports: Array<{
    id: string;
    targetType: string;
    targetId: string | null;
    reason: string;
    details: string | null;
    status: string;
    createdAt: string;
    reporter: {
      id: string;
      name: string;
      email: string;
    };
    reportedUser?: {
      id: string;
      name: string;
      email: string;
    } | null;
  }>;
  analytics: {
    popularTopics: Array<{ topic: string; count: number }>;
    monthlyTrends: Array<{
      month: string;
      requests: number;
      accepted: number;
      completed: number;
      declined: number;
    }>;
    mentorAvailability: {
      available: number;
      fullyBooked: number;
      unavailable: number;
    };
    roleBreakdown: {
      alumni: number;
      faculty: number;
    };
  };
}

export function AdminMentorshipManager({
  data,
}: {
  data: AdminMentorshipDashboardData;
}) {
  const [activeTab, setActiveTab] = useState<
    "MENTORS" | "REQUESTS" | "FEEDBACK" | "ANALYTICS" | "AUDIT" | "REPORTS"
  >("MENTORS");

  // Mentors filter & search state
  const [mentorSearch, setMentorSearch] = useState("");
  const [mentorRoleFilter, setMentorRoleFilter] = useState("ALL");
  const [mentorStatusFilter, setMentorStatusFilter] = useState("ALL");
  const [mentorDeptFilter, setMentorDeptFilter] = useState("ALL");
  const [mentorsList, setMentorsList] = useState(data.mentors);

  // Requests filter & search state
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState("ALL");

  // Feedback filter & state
  const [feedbackList, setFeedbackList] = useState(data.feedbacks);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Toggle mentor active status
  const handleToggleMentor = async (mentorId: string, currentActive: boolean) => {
    setActionInProgress(mentorId);
    try {
      const res = await adminToggleMentorStatus(
        mentorId,
        !currentActive,
        "Moderated from Admin Mentorship CRM"
      );
      if (res.success) {
        setMentorsList((prev) =>
          prev.map((m) =>
            m.id === mentorId
              ? {
                  ...m,
                  isActive: !currentActive,
                  status: !currentActive ? "AVAILABLE" : "TEMPORARILY_UNAVAILABLE",
                }
              : m
          )
        );
      }
    } finally {
      setActionInProgress(null);
    }
  };

  // Moderate feedback
  const handleModerateFeedback = async (
    feedbackId: string,
    action: "PUBLISH" | "HIDE" | "DELETE"
  ) => {
    setActionInProgress(feedbackId);
    try {
      const res = await adminModerateFeedback(feedbackId, action, `Action: ${action}`);
      if (res.success) {
        if (action === "DELETE") {
          setFeedbackList((prev) => prev.filter((f) => f.id !== feedbackId));
        } else {
          setFeedbackList((prev) =>
            prev.map((f) =>
              f.id === feedbackId
                ? {
                    ...f,
                    status: action === "PUBLISH" ? "PUBLISHED" : "HIDDEN",
                    isReported: false,
                  }
                : f
            )
          );
        }
      }
    } finally {
      setActionInProgress(null);
    }
  };

  // Filtered Mentors
  const filteredMentors = mentorsList.filter((m) => {
    if (mentorRoleFilter !== "ALL" && m.role !== mentorRoleFilter) return false;
    if (mentorStatusFilter !== "ALL" && m.status !== mentorStatusFilter) return false;
    if (mentorDeptFilter !== "ALL" && m.department !== mentorDeptFilter) return false;

    if (mentorSearch.trim()) {
      const q = mentorSearch.toLowerCase();
      const match =
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.company && m.company.toLowerCase().includes(q)) ||
        (m.designation && m.designation.toLowerCase().includes(q)) ||
        (m.expertise && m.expertise.toLowerCase().includes(q)) ||
        (m.topics && m.topics.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Filtered Requests
  const filteredRequests = data.requests.filter((r) => {
    if (requestStatusFilter !== "ALL" && r.status !== requestStatusFilter) return false;

    if (requestSearch.trim()) {
      const q = requestSearch.toLowerCase();
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

  // Extract unique departments for mentor filtering
  const mentorDepartments = Array.from(
    new Set(data.mentors.map((m) => m.department).filter(Boolean))
  ) as string[];

  const getStatusTone = (status: string): "sage" | "blue" | "gold" | "rose" | "gray" => {
    switch (status) {
      case "COMPLETED":
        return "sage";
      case "SCHEDULED":
      case "ACCEPTED":
        return "blue";
      case "PENDING":
        return "gold";
      case "DECLINED":
        return "rose";
      case "CANCELLED":
        return "gray";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "PENDING":
        return "Request Sent";
      case "ACCEPTED":
      case "SCHEDULED":
        return "Mentorship Active";
      case "COMPLETED":
        return "Completed";
      case "DECLINED":
        return "Declined";
      case "CANCELLED":
        return "Ended / Removed";
      default:
        return status.replace(/_/g, " ");
    }
  };

  return (
    <div className="space-y-6">
      {/* ================= 1. Real Database-Driven KPI Stats ================= */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-mist bg-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold text-ink-soft">Total Mentors</p>
          <p className="mt-1 text-2xl font-bold text-ink">{data.kpis.totalMentors}</p>
          <p className="mt-1 text-[10px] text-ink-soft">
            {data.kpis.activeAlumniMentors} Alumni · {data.kpis.activeFacultyMentors} Faculty
          </p>
        </div>

        <div className="rounded-2xl border border-mist bg-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold text-ink-soft">Available Now</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {data.kpis.availableMentors}
          </p>
          <p className="mt-1 text-[10px] text-ink-soft">
            {data.kpis.fullyBookedMentors} Fully Booked
          </p>
        </div>

        <div className="rounded-2xl border border-mist bg-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold text-ink-soft">Total Requests</p>
          <p className="mt-1 text-2xl font-bold text-ink">{data.kpis.totalRequests}</p>
          <p className="mt-1 text-[10px] text-gold-ink font-semibold">
            {data.kpis.pendingRequests} Pending
          </p>
        </div>

        <div className="rounded-2xl border border-mist bg-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold text-ink-soft">Active Sessions</p>
          <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {data.kpis.activeRelationships}
          </p>
          <p className="mt-1 text-[10px] text-ink-soft">
            {data.kpis.acceptedRequests} Scheduled/Active
          </p>
        </div>

        <div className="rounded-2xl border border-mist bg-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold text-ink-soft">Completed Sessions</p>
          <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
            {data.kpis.completedMentorships}
          </p>
          <p className="mt-1 text-[10px] text-ink-soft">
            {data.kpis.cancelledMentorships} Concluded
          </p>
        </div>

        <div className="rounded-2xl border border-mist bg-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold text-ink-soft">Acceptance Rate</p>
          <p className="mt-1 text-2xl font-bold text-teal-600 dark:text-teal-400">
            {data.kpis.acceptanceRate}%
          </p>
          <p className="mt-1 text-[10px] text-ink-soft">Real acceptance ratio</p>
        </div>
      </div>

      {/* ================= 2. Sub-Navigation Tabs ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist/80 pb-3">
        <div className="inline-flex rounded-2xl border border-mist/80 bg-paper/60 p-1.5">
          {[
            { id: "MENTORS", label: `Mentors (${data.mentors.length})`, icon: GraduationCap },
            { id: "REQUESTS", label: `Requests (${data.requests.length})`, icon: Compass },
            { id: "FEEDBACK", label: `Feedback (${data.feedbacks.length})`, icon: Star },
            { id: "ANALYTICS", label: "Analytics & Trends", icon: BarChart3 },
            { id: "AUDIT", label: `Audit Trail (${data.auditLogs.length})`, icon: History },
            { id: "REPORTS", label: `Reports (${data.reports.length})`, icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition",
                  active
                    ? "bg-ulab text-white shadow-soft"
                    : "text-ink-soft hover:bg-surface hover:text-ink"
                )}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-soft bg-paper px-2.5 py-1 rounded-xl border border-mist/60">
            <Lock size={12} className="text-emerald-600" /> Private direct chats are end-to-end protected
          </span>
        </div>
      </div>

      {/* ================= TAB 1: MENTORS DIRECTORY ================= */}
      {activeTab === "MENTORS" && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col gap-3 rounded-2xl border border-mist bg-surface p-4 shadow-soft">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                value={mentorSearch}
                onChange={(e) => setMentorSearch(e.target.value)}
                placeholder="Search mentors by name, company, position, expertise, topics, or skills..."
                className="w-full rounded-xl border border-mist bg-paper py-2.5 pl-9 pr-3 text-xs text-ink focus:border-ulab focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-mist/60 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink-soft">Role:</span>
                {["ALL", "ALUMNI", "TEACHER"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setMentorRoleFilter(role)}
                    className={cn(
                      "rounded-xl px-2.5 py-1 text-xs font-medium transition border",
                      mentorRoleFilter === role
                        ? "bg-ulab text-white border-ulab"
                        : "bg-paper text-ink-soft border-mist hover:text-ink"
                    )}
                  >
                    {role === "ALL" ? "All Roles" : role === "ALUMNI" ? "Alumni" : "Faculty"}
                  </button>
                ))}

                <span className="font-semibold text-ink-soft ml-2">Status:</span>
                {["ALL", "AVAILABLE", "FULLY_BOOKED", "TEMPORARILY_UNAVAILABLE"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setMentorStatusFilter(st)}
                    className={cn(
                      "rounded-xl px-2.5 py-1 text-xs font-medium transition border",
                      mentorStatusFilter === st
                        ? "bg-ulab text-white border-ulab"
                        : "bg-paper text-ink-soft border-mist hover:text-ink"
                    )}
                  >
                    {st === "ALL"
                      ? "All Statuses"
                      : st === "AVAILABLE"
                      ? "Available"
                      : st === "FULLY_BOOKED"
                      ? "Fully Booked"
                      : "Paused"}
                  </button>
                ))}
              </div>

              {mentorDepartments.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-ink-soft">Dept:</span>
                  <select
                    value={mentorDeptFilter}
                    onChange={(e) => setMentorDeptFilter(e.target.value)}
                    className="rounded-xl border border-mist bg-paper py-1 px-2 text-xs text-ink focus:outline-none"
                  >
                    <option value="ALL">All Departments</option>
                    {mentorDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Mentors Grid */}
          {filteredMentors.length === 0 ? (
            <div className="rounded-2xl border border-mist bg-surface p-12 text-center shadow-soft">
              <GraduationCap size={32} className="mx-auto text-ink-soft" />
              <h3 className="mt-3 text-sm font-bold text-ink">No mentors match the criteria</h3>
              <p className="mt-1 text-xs text-ink-soft">Try adjusting your filters or search keywords.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMentors.map((m) => (
                <Card key={m.id} className="flex flex-col justify-between p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} src={m.image} size={44} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-ink">{m.name}</h4>
                            {m.alumniVerified && (
                              <ShieldCheck size={14} className="text-emerald-600" />
                            )}
                          </div>
                          <p className="text-[11px] text-ink-soft">
                            {m.role === "TEACHER" ? "Faculty Mentor" : "Alumni Mentor"} ·{" "}
                            {m.department || "General"}
                          </p>
                        </div>
                      </div>

                      <Badge
                        tone={
                          m.status === "AVAILABLE"
                            ? "sage"
                            : m.status === "FULLY_BOOKED"
                            ? "gold"
                            : "gray"
                        }
                        className="text-[10px]"
                      >
                        {m.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="text-xs text-ink-soft space-y-1">
                      <p className="font-medium text-ink">
                        {m.designation || "Professional"}{" "}
                        {m.company && <span className="text-ink-soft">at {m.company}</span>}
                      </p>
                      {m.careerField && (
                        <p className="text-[11px] text-ulab-deep font-semibold">
                          Domain: {m.careerField}
                        </p>
                      )}
                    </div>

                    {/* Rating & Capacity Indicator */}
                    <div className="flex items-center justify-between rounded-xl bg-paper p-2.5 text-xs border border-mist/60">
                      <div className="flex items-center gap-1">
                        <Star size={13} className="fill-amber-400 text-amber-500" />
                        <span className="font-bold text-ink">
                          {m.averageRating ? m.averageRating.toFixed(1) : "New"}
                        </span>
                        <span className="text-[10px] text-ink-soft">
                          ({m.totalReviews} {m.totalReviews === 1 ? "review" : "reviews"})
                        </span>
                      </div>

                      <div className="text-[11px]">
                        <span className="font-semibold text-ink">Active: </span>
                        <span
                          className={cn(
                            "font-bold",
                            m.activeMenteesCount >= m.maxMentees
                              ? "text-gold-ink"
                              : "text-emerald-700 dark:text-emerald-400"
                          )}
                        >
                          {m.activeMenteesCount}/{m.maxMentees} mentees
                        </span>
                      </div>
                    </div>

                    {/* Topics Tags */}
                    {m.topics && (
                      <div className="flex flex-wrap gap-1">
                        {m.topics
                          .split(",")
                          .slice(0, 3)
                          .map((t, idx) => (
                            <span
                              key={idx}
                              className="rounded-lg bg-surface px-2 py-0.5 text-[10px] text-ink-soft border border-mist"
                            >
                              {t.trim()}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Footer & Admin Controls */}
                  <div className="flex items-center justify-between pt-3 border-t border-mist/60 text-xs">
                    <span className="text-[10px] text-ink-soft font-mono truncate max-w-[150px]">
                      {m.email}
                    </span>

                    <Button
                      variant={m.isActive ? "outline" : "primary"}
                      onClick={() => handleToggleMentor(m.id, m.isActive)}
                      disabled={actionInProgress === m.id}
                      className={cn(
                        "py-1 px-2.5 text-[11px] font-semibold",
                        m.isActive
                          ? "border-rose/30 text-rose hover:bg-rose-wash"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      )}
                    >
                      {m.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: REQUESTS MANAGEMENT ================= */}
      {activeTab === "REQUESTS" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-mist bg-surface p-4 shadow-soft">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Search mentorship requests by topic, student, alumni, or faculty mentor..."
                className="w-full rounded-xl border border-mist bg-paper py-2.5 pl-9 pr-3 text-xs text-ink focus:border-ulab focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-mist/60 text-xs">
              {[
                "ALL",
                "PENDING",
                "ACCEPTED",
                "SCHEDULED",
                "COMPLETED",
                "DECLINED",
                "CANCELLED",
              ].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setRequestStatusFilter(st)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 font-semibold transition",
                    requestStatusFilter === st
                      ? "bg-ulab text-white shadow-sm"
                      : "bg-paper text-ink-soft hover:text-ink"
                  )}
                >
                  {st === "ALL"
                    ? `All (${data.requests.length})`
                    : st === "CANCELLED"
                    ? "Ended / Removed"
                    : st === "PENDING"
                    ? "Request Sent"
                    : st === "ACCEPTED" || st === "SCHEDULED"
                    ? "Mentorship Active"
                    : st.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-mist bg-surface p-12 text-center shadow-soft">
              <Compass size={28} className="mx-auto text-ink-soft" />
              <h3 className="mt-3 text-sm font-bold text-ink">No requests found</h3>
              <p className="mt-1 text-xs text-ink-soft">Try selecting a different status filter.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredRequests.map((r) => (
                <Card key={r.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <Badge tone={getStatusTone(r.status)} className="text-[10px]">
                      {getStatusLabel(r.status)}
                    </Badge>
                    <span className="text-[11px] text-ink-soft">{timeAgo(r.createdAt)}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-ink">{r.topic}</h4>
                    <p className="mt-1 text-xs text-ink-soft italic line-clamp-2">
                      &ldquo;{r.message}&rdquo;
                    </p>
                  </div>

                  {r.careerGoals && (
                    <p className="text-[11px] text-ink-soft">
                      <strong className="text-ink">Career Goal:</strong> {r.careerGoals}
                    </p>
                  )}

                  {/* Student vs Mentor */}
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
                        Mentor
                      </span>
                      <p className="font-semibold text-ink">{r.mentor.name}</p>
                      <p className="text-[11px] text-ink-soft">
                        {r.mentor.designation}{" "}
                        {r.mentor.company ? `(${r.mentor.company})` : ""}
                      </p>
                      <p className="text-[10px] text-ink-soft font-mono">{r.mentor.email}</p>
                    </div>
                  </div>

                  {/* Scheduled info */}
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

                  {r.endReason && (
                    <p className="text-[11px] text-ink-soft italic border-t border-mist/50 pt-2">
                      <strong className="text-ink">Conclusion Reason:</strong> &ldquo;{r.endReason}&rdquo;
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: FEEDBACK & RATINGS ================= */}
      {activeTab === "FEEDBACK" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-mist bg-surface p-4 shadow-soft flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-ink">Student Mentorship Reviews & Ratings</h3>
              <p className="text-xs text-ink-soft">
                Audit student evaluations, rate scores, and moderate published written reviews.
              </p>
            </div>
            <Badge tone="lilac">{feedbackList.length} Total Reviews</Badge>
          </div>

          {feedbackList.length === 0 ? (
            <div className="rounded-2xl border border-mist bg-surface p-12 text-center shadow-soft">
              <Star size={32} className="mx-auto text-ink-soft" />
              <h3 className="mt-3 text-sm font-bold text-ink">No feedback reviews recorded yet</h3>
              <p className="mt-1 text-xs text-ink-soft">
                Feedback appears here as soon as students complete and evaluate their sessions.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {feedbackList.map((f) => (
                <Card key={f.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={cn(
                            star <= f.rating
                              ? "fill-amber-400 text-amber-500"
                              : "text-ink-soft/30"
                          )}
                        />
                      ))}
                      <span className="ml-1 text-xs font-bold text-ink">{f.rating}.0 / 5.0</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {f.isReported && (
                        <Badge tone="rose" className="text-[10px]">
                          Reported
                        </Badge>
                      )}
                      <Badge
                        tone={f.status === "PUBLISHED" ? "sage" : "gray"}
                        className="text-[10px]"
                      >
                        {f.status}
                      </Badge>
                    </div>
                  </div>

                  {f.review ? (
                    <p className="text-xs text-ink-soft bg-paper p-3 rounded-xl border border-mist/60 italic leading-relaxed">
                      &ldquo;{f.review}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-ink-soft italic">No written review provided.</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-mist/60 pt-2.5">
                    <div>
                      <p className="text-[10px] text-ink-soft uppercase font-bold">Reviewer</p>
                      <p className="font-semibold text-ink">{f.student.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-soft uppercase font-bold">Mentor Reviewed</p>
                      <p className="font-semibold text-ink">{f.mentor.name}</p>
                    </div>
                  </div>

                  {/* Admin Moderation Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-mist/60 text-xs">
                    <span className="text-[10px] text-ink-soft">{timeAgo(f.createdAt)}</span>

                    <div className="flex items-center gap-1.5">
                      {f.status === "PUBLISHED" ? (
                        <Button
                          variant="outline"
                          onClick={() => handleModerateFeedback(f.id, "HIDE")}
                          disabled={actionInProgress === f.id}
                          className="py-1 px-2.5 text-[11px] gap-1"
                        >
                          <EyeOff size={12} /> Hide
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => handleModerateFeedback(f.id, "PUBLISH")}
                          disabled={actionInProgress === f.id}
                          className="py-1 px-2.5 text-[11px] gap-1 text-emerald-700"
                        >
                          <Eye size={12} /> Publish
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        onClick={() => handleModerateFeedback(f.id, "DELETE")}
                        disabled={actionInProgress === f.id}
                        className="py-1 px-2 text-[11px] text-rose border-rose/30 hover:bg-rose-wash"
                        aria-label="Delete review"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: ANALYTICS & CHARTS ================= */}
      {activeTab === "ANALYTICS" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Topic Distribution */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-mist/60 pb-3">
                <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-ulab" />
                  Popular Mentorship Topics
                </h3>
                <span className="text-xs text-ink-soft">Demand by Student Request</span>
              </div>

              {data.analytics.popularTopics.length === 0 ? (
                <p className="text-xs text-ink-soft text-center py-6">No request data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.analytics.popularTopics.map((pt, idx) => {
                    const max = data.analytics.popularTopics[0]?.count || 1;
                    const pct = Math.round((pt.count / max) * 100);
                    return (
                      <div key={idx} className="space-y-1 text-xs">
                        <div className="flex justify-between font-semibold text-ink">
                          <span>{pt.topic}</span>
                          <span className="text-ink-soft">{pt.count} requests</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-paper overflow-hidden border border-mist/60">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-ulab to-purple-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Mentor Availability & Ratios */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-mist/60 pb-3">
                <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
                  <Users size={16} className="text-emerald-600" />
                  Mentor Pool & Availability Breakdown
                </h3>
                <span className="text-xs text-ink-soft">Capacity Distribution</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                  <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                    Available for Mentees
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-200 mt-1">
                    {data.analytics.mentorAvailability.available}
                  </p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">
                    Accepting new requests
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
                  <p className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                    Fully Booked Mentors
                  </p>
                  <p className="text-2xl font-extrabold text-amber-800 dark:text-amber-200 mt-1">
                    {data.analytics.mentorAvailability.fullyBooked}
                  </p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
                    Capacity limit reached
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-mist bg-paper p-4 text-xs space-y-2">
                <p className="font-bold text-ink">Role Ratio:</p>
                <div className="flex justify-between text-ink-soft">
                  <span>Alumni Mentors:</span>
                  <strong className="text-ink">{data.analytics.roleBreakdown.alumni}</strong>
                </div>
                <div className="flex justify-between text-ink-soft">
                  <span>Faculty Mentors:</span>
                  <strong className="text-ink">{data.analytics.roleBreakdown.faculty}</strong>
                </div>
              </div>
            </Card>
          </div>

          {/* Monthly Trends Table */}
          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
              <Calendar size={16} className="text-ulab" />
              Monthly Mentorship Trajectory (Actual Database Records)
            </h3>

            {data.analytics.monthlyTrends.length === 0 ? (
              <p className="text-xs text-ink-soft text-center py-6">No historical records yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-mist/80 bg-paper/50 text-[11px] uppercase tracking-wider text-ink-soft">
                    <tr>
                      <th className="py-2.5 px-3">Month</th>
                      <th className="py-2.5 px-3">New Requests</th>
                      <th className="py-2.5 px-3">Accepted</th>
                      <th className="py-2.5 px-3">Completed</th>
                      <th className="py-2.5 px-3">Declined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mist/60">
                    {data.analytics.monthlyTrends.map((m) => (
                      <tr key={m.month} className="hover:bg-paper/30">
                        <td className="py-2.5 px-3 font-semibold text-ink">{m.month}</td>
                        <td className="py-2.5 px-3 font-bold text-ulab-deep">{m.requests}</td>
                        <td className="py-2.5 px-3 text-emerald-700 font-semibold">{m.accepted}</td>
                        <td className="py-2.5 px-3 text-purple-700 font-semibold">{m.completed}</td>
                        <td className="py-2.5 px-3 text-rose-700 font-semibold">{m.declined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ================= TAB 5: AUDIT TRAIL ================= */}
      {activeTab === "AUDIT" && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-mist/60 pb-3">
            <div>
              <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
                <History size={16} className="text-ulab" />
                Mentorship Audit Trail
              </h3>
              <p className="text-xs text-ink-soft">
                Immutable chronological log of activations, request creations, approvals, and moderation actions.
              </p>
            </div>
            <Badge tone="gray">{data.auditLogs.length} Events</Badge>
          </div>

          {data.auditLogs.length === 0 ? (
            <p className="text-xs text-ink-soft text-center py-8">No audit logs recorded yet</p>
          ) : (
            <div className="space-y-3">
              {data.auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-mist bg-paper/60 p-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge tone="blue" className="text-[10px]">
                        {log.action}
                      </Badge>
                      <span className="font-semibold text-ink">{log.actor.name}</span>
                      <span className="text-[10px] text-ink-soft">({log.actor.role})</span>
                    </div>
                    <p className="text-ink-soft leading-relaxed">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-ink-soft shrink-0">{timeAgo(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ================= TAB 6: REPORTS & SAFETY ================= */}
      {activeTab === "REPORTS" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-mist bg-surface p-4 shadow-soft flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-rose" />
                Mentorship Safety & Moderation Reports
              </h3>
              <p className="text-xs text-ink-soft">
                Reports filed by students or mentors regarding harassment, fake info, or behavioral issues.
              </p>
            </div>
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-1 rounded-xl bg-ulab py-1.5 px-3 text-xs font-semibold text-white hover:bg-ulab-deep shadow-soft"
            >
              Open Reports CRM →
            </Link>
          </div>

          {data.reports.length === 0 ? (
            <div className="rounded-2xl border border-mist bg-surface p-12 text-center shadow-soft">
              <ShieldCheck size={32} className="mx-auto text-emerald-600" />
              <h3 className="mt-3 text-sm font-bold text-ink">Zero Active Mentorship Reports</h3>
              <p className="mt-1 text-xs text-ink-soft">
                The community is safe and healthy. No violations reported.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.reports.map((rp) => (
                <Card key={rp.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge tone="rose" className="text-[10px]">
                        {rp.reason}
                      </Badge>
                      <span className="text-xs font-bold text-ink">
                        Report by {rp.reporter.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-ink-soft">{timeAgo(rp.createdAt)}</span>
                  </div>

                  <p className="text-xs text-ink-soft bg-paper p-3 rounded-xl border border-mist/60 leading-relaxed">
                    {rp.details}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-mist/60 text-xs">
                    <span className="text-[11px] text-ink-soft">
                      Reported Target: {rp.targetType} (ID: {rp.targetId})
                    </span>
                    <Link
                      href={`/admin/reports`}
                      className="text-xs font-bold text-ulab hover:underline"
                    >
                      Investigate in Reports CRM →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
