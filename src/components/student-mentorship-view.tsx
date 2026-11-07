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
  Clock,
  Calendar,
  Video,
  X,
  ExternalLink,
  Ban,
  Sparkles,
  UserCheck,
} from "lucide-react";
import {
  sendMentorshipRequest,
  cancelMentorshipRequest,
  type MentorshipTopic,
} from "@/app/actions/mentorship";
import { MENTORSHIP_TOPICS } from "@/lib/mentorship-constants";
import { Avatar, Badge, Button, cn, timeAgo } from "./ui";

export interface SerializedMentor {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  designation: string | null;
  company: string | null;
  image: string | null;
  skills: string | null;
  alumniVerified: boolean;
  isMentor: boolean;
  mentorAvailable: boolean;
  mentorTopics: string | null;
  mentorExpertise: string | null;
  mentorSessionFormat: string | null;
  mentorAvailabilityNote: string | null;
  mentorMaxMentees: number;
}

export interface SerializedMentorshipRequest {
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
  mentor: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
    designation: string | null;
    company: string | null;
    image: string | null;
    alumniVerified: boolean;
  };
}

interface StudentMentorshipViewProps {
  mentors: SerializedMentor[];
  requests: SerializedMentorshipRequest[];
  currentUserId: string;
}

export function StudentMentorshipView({
  mentors,
  requests: initialRequests,
  currentUserId,
}: StudentMentorshipViewProps) {
  const [activeTab, setActiveTab] = useState<"BROWSE" | "MY_REQUESTS">("BROWSE");
  const [requests, setRequests] = useState<SerializedMentorshipRequest[]>(initialRequests);
  const [requestsFilter, setRequestsFilter] = useState<"ACTIVE" | "ARCHIVED" | "ALL">("ACTIVE");

  const activeRequests = requests.filter((r) =>
    ["PENDING", "ACCEPTED", "SCHEDULED"].includes(r.status)
  );
  const archivedRequests = requests.filter((r) =>
    ["COMPLETED", "DECLINED", "CANCELLED"].includes(r.status)
  );
  const displayedRequests =
    requestsFilter === "ACTIVE"
      ? activeRequests
      : requestsFilter === "ARCHIVED"
      ? archivedRequests
      : requests;

  // Search & Filter for Mentors
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [topicFilter, setTopicFilter] = useState("ALL");

  // Request Modal State
  const [selectedMentor, setSelectedMentor] = useState<SerializedMentor | null>(null);
  const [modalTopic, setModalTopic] = useState<MentorshipTopic>(MENTORSHIP_TOPICS[0]);
  const [modalGoals, setModalGoals] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalFormat, setModalFormat] = useState("ONLINE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const departments = Array.from(
    new Set(mentors.map((m) => m.department).filter(Boolean))
  ) as string[];

  const filteredMentors = mentors.filter((m) => {
    if (departmentFilter !== "ALL" && m.department !== departmentFilter) return false;
    if (topicFilter !== "ALL" && (!m.mentorTopics || !m.mentorTopics.includes(topicFilter))) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        m.name.toLowerCase().includes(q) ||
        (m.company && m.company.toLowerCase().includes(q)) ||
        (m.designation && m.designation.toLowerCase().includes(q)) ||
        (m.skills && m.skills.toLowerCase().includes(q)) ||
        (m.mentorExpertise && m.mentorExpertise.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const handleOpenRequestModal = (mentor: SerializedMentor) => {
    setSelectedMentor(mentor);
    setSubmitError("");
    setModalGoals("");
    setModalMessage("");
    setModalFormat(mentor.mentorSessionFormat || "ONLINE");
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;

    setIsSubmitting(true);
    setSubmitError("");

    const res = await sendMentorshipRequest({
      mentorId: selectedMentor.id,
      topic: modalTopic,
      message: modalMessage,
      careerGoals: modalGoals,
      sessionFormat: modalFormat,
    });

    setIsSubmitting(false);

    if (res.error) {
      setSubmitError(res.error);
      return;
    }

    // Optimistically add to requests list
    const newReq: SerializedMentorshipRequest = {
      id: res.requestId!,
      topic: modalTopic,
      message: modalMessage,
      careerGoals: modalGoals,
      status: "PENDING",
      sessionFormat: modalFormat,
      scheduledAt: null,
      sessionLink: null,
      mentorNotes: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mentor: {
        id: selectedMentor.id,
        name: selectedMentor.name,
        email: selectedMentor.email,
        role: selectedMentor.role,
        department: selectedMentor.department,
        designation: selectedMentor.designation,
        company: selectedMentor.company,
        image: selectedMentor.image,
        alumniVerified: selectedMentor.alumniVerified,
      },
    };

    setRequests([newReq, ...requests]);
    setSelectedMentor(null);
    setActiveTab("MY_REQUESTS");
  };

  const handleCancelRequest = async (requestId: string) => {
    if (confirm("Are you sure you want to cancel this mentorship request?")) {
      await cancelMentorshipRequest(requestId);
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "CANCELLED" } : r))
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge tone="gold">Pending Mentor Review</Badge>;
      case "ACCEPTED":
        return <Badge tone="sage">Accepted</Badge>;
      case "SCHEDULED":
        return <Badge tone="blue">Session Scheduled 📅</Badge>;
      case "COMPLETED":
        return <Badge tone="sage">Completed 🌟</Badge>;
      case "DECLINED":
        return <Badge tone="rose">Declined</Badge>;
      case "CANCELLED":
        return <Badge tone="gray">Cancelled</Badge>;
      default:
        return <Badge tone="gray">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex rounded-2xl bg-paper p-1 text-xs font-semibold max-w-sm border border-mist/80">
        <button
          onClick={() => setActiveTab("BROWSE")}
          className={cn(
            "flex-1 rounded-xl py-2 text-center transition flex items-center justify-center gap-1.5",
            activeTab === "BROWSE"
              ? "bg-surface font-bold text-ink shadow-sm"
              : "text-ink-soft hover:text-ink"
          )}
        >
          <Compass size={14} />
          Browse Mentors ({mentors.length})
        </button>
        <button
          onClick={() => setActiveTab("MY_REQUESTS")}
          className={cn(
            "flex-1 rounded-xl py-2 text-center transition flex items-center justify-center gap-1.5",
            activeTab === "MY_REQUESTS"
              ? "bg-surface font-bold text-ink shadow-sm"
              : "text-ink-soft hover:text-ink"
          )}
        >
          <Clock size={14} />
          My Requests ({requests.length})
        </button>
      </div>

      {activeTab === "BROWSE" ? (
        /* ================= BROWSE MENTORS TAB ================= */
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-mist bg-surface p-4 shadow-soft">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mentors by name, company, role, skills, or expertise..."
                className="w-full rounded-xl border border-mist bg-paper py-2.5 pl-9 pr-3 text-xs text-ink focus:border-ulab focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-mist/60 text-xs">
              <div className="flex items-center gap-1 text-ink-soft">
                <Filter size={13} />
                <span>Filters:</span>
              </div>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="rounded-xl border border-mist bg-paper px-2.5 py-1.5 text-xs focus:border-ulab focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="rounded-xl border border-mist bg-paper px-2.5 py-1.5 text-xs focus:border-ulab focus:outline-none"
              >
                <option value="ALL">All Topics</option>
                {MENTORSHIP_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mentors Grid */}
          {filteredMentors.length === 0 ? (
            <div className="rounded-2xl border border-mist bg-surface p-12 text-center shadow-soft">
              <Compass size={28} className="mx-auto text-ink-soft" />
              <h3 className="mt-3 text-sm font-bold text-ink">No mentors match your search</h3>
              <p className="mt-1 text-xs text-ink-soft">
                Try clearing or adjusting filters to discover available alumni mentors.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMentors.map((m) => {
                const topicsList = m.mentorTopics
                  ? m.mentorTopics.split(",").map((s) => s.trim())
                  : [];
                const skillsList = m.skills
                  ? m.skills.split(",").map((s) => s.trim()).slice(0, 3)
                  : [];

                return (
                  <div
                    key={m.id}
                    className="flex flex-col justify-between rounded-2xl border border-mist/70 bg-surface p-5 shadow-soft transition hover:shadow-lift"
                  >
                    <div>
                      {/* Mentor Card Header */}
                      <div className="flex items-start gap-3">
                        <Avatar name={m.name} src={m.image} size={46} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-ink truncate">{m.name}</h4>
                            {m.alumniVerified && (
                              <span
                                className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
                                title="Verified Alumni"
                              >
                                ✓
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-soft truncate">
                            {m.designation} {m.company ? `at ${m.company}` : ""}
                          </p>
                          <p className="text-[11px] text-ink-soft">{m.department}</p>
                        </div>
                      </div>

                      {/* Mentor Expertise & Availability */}
                      {m.mentorExpertise && (
                        <div className="mt-3 text-xs text-ink-soft">
                          <strong className="text-ink font-semibold">Expertise:</strong>{" "}
                          <span>{m.mentorExpertise}</span>
                        </div>
                      )}

                      {/* Mentorship Topics Badges */}
                      {topicsList.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {topicsList.slice(0, 3).map((top) => (
                            <span
                              key={top}
                              className="rounded-lg bg-sky px-2 py-0.5 text-[10px] font-medium text-ulab-deep"
                            >
                              {top}
                            </span>
                          ))}
                          {topicsList.length > 3 && (
                            <span className="text-[10px] text-ink-soft self-center">
                              +{topicsList.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Session Details */}
                      <div className="mt-3.5 space-y-1 text-[11px] text-ink-soft border-t border-mist/50 pt-2.5">
                        <p>Format: <strong className="text-ink">{m.mentorSessionFormat || "Online"}</strong></p>
                        {m.mentorAvailabilityNote && (
                          <p className="line-clamp-1 italic">
                            &ldquo;{m.mentorAvailabilityNote}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-5 pt-3 border-t border-mist/60 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Available for Mentoring
                      </span>
                      {(() => {
                        const activeReq = requests.find(
                          (r) =>
                            r.mentor.id === m.id &&
                            ["PENDING", "ACCEPTED", "SCHEDULED"].includes(r.status)
                        );
                        if (activeReq?.status === "PENDING") {
                          return (
                            <button
                              type="button"
                              disabled
                              className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 cursor-not-allowed dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                            >
                              Request Sent (Pending)
                            </button>
                          );
                        }
                        if (
                          activeReq?.status === "ACCEPTED" ||
                          activeReq?.status === "SCHEDULED"
                        ) {
                          return (
                            <Link
                              href="/student/my-mentors"
                              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-soft"
                            >
                              Active Mentor →
                            </Link>
                          );
                        }
                        return (
                          <Button
                            onClick={() => handleOpenRequestModal(m)}
                            className="py-1.5 px-3 text-xs font-semibold gap-1"
                          >
                            Request Mentorship
                          </Button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= MY REQUESTS TAB ================= */
        <div className="space-y-4">
          {/* Sub-filter segment tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist/80 pb-3 dark:border-white/10">
            <div className="inline-flex rounded-2xl border border-mist/80 bg-paper/60 p-1 dark:border-white/5 dark:bg-white/5">
              {[
                { id: "ACTIVE", label: `Active & Pending (${activeRequests.length})` },
                { id: "ARCHIVED", label: `Concluded & Archived (${archivedRequests.length})` },
                { id: "ALL", label: `All Requests (${requests.length})` },
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  type="button"
                  onClick={() => setRequestsFilter(subTab.id as any)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    requestsFilter === subTab.id
                      ? "bg-ulab text-white shadow-soft"
                      : "text-ink-soft hover:bg-surface hover:text-ink"
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            <Link
              href="/student/my-mentors"
              className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper transition"
            >
              Open My Mentors Workspace →
            </Link>
          </div>

          {displayedRequests.length === 0 ? (
            <div className="rounded-2xl border border-mist bg-surface p-12 text-center shadow-soft">
              <Clock size={28} className="mx-auto text-ink-soft" />
              <h3 className="mt-3 text-sm font-bold text-ink">
                {requestsFilter === "ACTIVE"
                  ? "No active or pending mentorship requests"
                  : requestsFilter === "ARCHIVED"
                  ? "No concluded or archived mentorships"
                  : "No mentorship requests sent yet"}
              </h3>
              <p className="mt-1 text-xs text-ink-soft">
                {requestsFilter === "ACTIVE"
                  ? "You do not have any ongoing mentorships right now. Explore mentors to start a session."
                  : "Browse our verified alumni mentors to request 1-on-1 career guidance."}
              </p>
              <Button
                onClick={() => setActiveTab("BROWSE")}
                className="mt-4 py-2 px-4 text-xs font-semibold"
              >
                Browse Mentors
              </Button>
            </div>
          ) : (
            displayedRequests.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-mist bg-surface p-5 shadow-soft transition hover:shadow-lift space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar name={r.mentor.name} src={r.mentor.image} size={42} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-ink">{r.mentor.name}</h4>
                        {r.mentor.alumniVerified && (
                          <span className="inline-flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-soft">
                        {r.mentor.designation} {r.mentor.company ? `at ${r.mentor.company}` : ""}
                      </p>
                      <p className="text-[11px] text-ink-soft">{r.mentor.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(r.status)}
                    {r.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        onClick={() => handleCancelRequest(r.id)}
                        className="py-1 px-2.5 text-xs text-rose hover:bg-rose-wash"
                      >
                        Cancel Request
                      </Button>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-paper p-3 text-xs space-y-1.5 border border-mist/60">
                  <p>
                    <strong className="text-ink">Topic:</strong> <span>{r.topic}</span>
                  </p>
                  {r.careerGoals && (
                    <p>
                      <strong className="text-ink">Career Goals:</strong> <span>{r.careerGoals}</span>
                    </p>
                  )}
                  <p className="text-ink-soft italic">&ldquo;{r.message}&rdquo;</p>
                </div>

                {/* Scheduled Session Info */}
                {r.status === "SCHEDULED" && r.scheduledAt && (
                  <div className="rounded-xl bg-sky/50 border border-sky-light/60 p-3 text-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-ulab-deep shrink-0" />
                      <div>
                        <p className="font-bold text-ink">
                          Session Date: {new Date(r.scheduledAt).toLocaleString()}
                        </p>
                        <p className="text-[11px] text-ink-soft">Format: {r.sessionFormat || "Online"}</p>
                      </div>
                    </div>
                    {r.sessionLink && (
                      <a
                        href={r.sessionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl bg-ulab px-3 py-1.5 text-xs font-semibold text-white shadow-soft hover:bg-ulab-deep transition"
                      >
                        <Video size={13} />
                        Join Session Meeting
                      </a>
                    )}
                  </div>
                )}

                {/* Completed / Feedback notes */}
                {r.mentorNotes && (
                  <div className="text-xs text-ink-soft border-t border-mist/50 pt-2">
                    <strong className="text-ink">Mentor Feedback / Notes:</strong> {r.mentorNotes}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-ink-soft pt-1">
                  <span>Requested {timeAgo(r.createdAt)}</span>
                  <span>Preferred Format: {r.sessionFormat}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Request Mentorship Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-mist bg-surface p-6 shadow-lift">
            <div className="flex items-center justify-between border-b border-mist/70 pb-3">
              <div className="flex items-center gap-2">
                <Compass size={18} className="text-ulab" />
                <h3 className="font-display text-base font-bold text-ink">
                  Request Mentorship with {selectedMentor.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMentor(null)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-paper hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-ink">Mentorship Topic *</label>
                <select
                  value={modalTopic}
                  onChange={(e) => setModalTopic(e.target.value as MentorshipTopic)}
                  className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2 text-xs focus:border-ulab focus:outline-none"
                >
                  {MENTORSHIP_TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-ink">Preferred Session Format</label>
                <select
                  value={modalFormat}
                  onChange={(e) => setModalFormat(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2 text-xs focus:border-ulab focus:outline-none"
                >
                  <option value="ONLINE">Online Virtual Session (Google Meet / Zoom)</option>
                  <option value="IN_PERSON">In-Person at Campus / Office</option>
                  <option value="FLEXIBLE">Flexible / Any</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-ink">Your Specific Career Goals *</label>
                <textarea
                  rows={2}
                  value={modalGoals}
                  onChange={(e) => setModalGoals(e.target.value)}
                  placeholder="e.g. Preparing for junior software engineering interviews in Dhaka fintech startups..."
                  required
                  className="mt-1 w-full rounded-xl border border-mist bg-paper p-2.5 text-xs focus:border-ulab focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-ink">Personal Note / Introduction *</label>
                <textarea
                  rows={3}
                  value={modalMessage}
                  onChange={(e) => setModalMessage(e.target.value)}
                  placeholder="Introduce yourself, your semester/background, and specific questions you would like advice on..."
                  required
                  className="mt-1 w-full rounded-xl border border-mist bg-paper p-2.5 text-xs focus:border-ulab focus:outline-none"
                />
              </div>

              {submitError && (
                <p className="text-xs font-semibold text-rose">{submitError}</p>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-mist/70 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedMentor(null)}
                  className="py-1.5 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-1.5 px-4 text-xs font-semibold"
                >
                  {isSubmitting ? "Sending Request..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
