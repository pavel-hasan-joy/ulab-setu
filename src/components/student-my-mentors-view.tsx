"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Compass,
  Calendar,
  Video,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { Avatar, Badge, Button, Card } from "./ui";
import { cancelMentorshipRequest } from "@/app/actions/mentorship";

export interface StudentMentorshipRecord {
  id: string;
  topic: string;
  message: string;
  careerGoals: string | null;
  reason?: string | null;
  introduction?: string | null;
  preferredAvailability?: string | null;
  status: string;
  sessionFormat: string | null;
  scheduledAt: string | null;
  sessionLink: string | null;
  mentorNotes: string | null;
  startedAt?: string | null;
  completedAt: string | null;
  declinedAt?: string | null;
  cancelledAt?: string | null;
  endReason?: string | null;
  connectionId?: string | null;
  createdAt: string;
  updatedAt: string;
  mentor: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    department: string | null;
    company?: string | null;
    position?: string | null;
    careerField?: string | null;
    communicationMethod?: string;
    alumniVerified?: boolean;
  };
}

export function StudentMyMentorsView({
  initialRequests,
}: {
  initialRequests: StudentMentorshipRecord[];
}) {
  const [requests, setRequests] = useState<StudentMentorshipRecord[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "PENDING" | "COMPLETED" | "ARCHIVED">("ALL");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleCancelRequest = (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this mentorship request?")) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await cancelMentorshipRequest(requestId);
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: "CANCELLED" } : r))
        );
        setFeedback({
          type: "success",
          message: "Mentorship request cancelled successfully.",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to cancel request.",
        });
      }
    });
  };

  const pendingList = requests.filter((r) => r.status === "PENDING");
  const activeList = requests.filter((r) => r.status === "ACCEPTED" || r.status === "SCHEDULED");
  const completedList = requests.filter((r) => r.status === "COMPLETED");
  const archivedList = requests.filter((r) => r.status === "DECLINED" || r.status === "CANCELLED");

  const displayedList =
    activeTab === "PENDING"
      ? pendingList
      : activeTab === "ACTIVE"
      ? activeList
      : activeTab === "COMPLETED"
      ? completedList
      : activeTab === "ARCHIVED"
      ? archivedList
      : requests;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            Active Mentors
          </span>
          <p className="mt-1 text-2xl font-bold text-ink">{activeList.length}</p>
          <p className="mt-0.5 text-xs text-ink-soft">Ongoing & scheduled sessions</p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            Pending Inquiries
          </span>
          <p className="mt-1 text-2xl font-bold text-amber-600">{pendingList.length}</p>
          <p className="mt-0.5 text-xs text-ink-soft">Awaiting mentor acceptance</p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            Completed Sessions
          </span>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{completedList.length}</p>
          <p className="mt-0.5 text-xs text-ink-soft">With mentor recommendations</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Expand Network
            </span>
            <p className="mt-1 text-xs text-ink-soft">Explore more mentors</p>
          </div>
          <Link
            href="/student/mentors"
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-ulab hover:underline"
          >
            Find a Mentor →
          </Link>
        </Card>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-2xl border p-4 text-xs font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Segment Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist/80 pb-3 dark:border-white/10">
        <div className="inline-flex rounded-2xl border border-mist/80 bg-paper/60 p-1.5 dark:border-white/5 dark:bg-white/5">
          {[
            { id: "ALL", label: `All Mentorships (${requests.length})` },
            { id: "ACTIVE", label: `Active (${activeList.length})` },
            { id: "PENDING", label: `Pending (${pendingList.length})` },
            { id: "COMPLETED", label: `Completed (${completedList.length})` },
            { id: "ARCHIVED", label: `Archived (${archivedList.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "bg-ulab text-white shadow-soft"
                  : "text-ink-soft hover:bg-surface hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Link
          href="/student/mentors"
          className="inline-flex items-center gap-1.5 rounded-xl bg-ulab py-1.5 px-3.5 text-xs font-semibold text-white hover:bg-ulab-deep shadow-soft transition"
        >
          <Compass size={14} />
          Find New Mentor
        </Link>
      </div>

      {/* Requests List */}
      {displayedList.length === 0 ? (
        <Card className="p-12 text-center">
          <GraduationCap size={40} className="mx-auto text-ink-soft/40" />
          <h3 className="mt-3 font-display text-base font-bold text-ink">
            No mentorship requests in this view
          </h3>
          <p className="mt-1 text-xs text-ink-soft max-w-sm mx-auto">
            {activeTab === "ALL"
              ? "You haven't requested mentorship from any alumni or faculty yet. Discover verified mentors to accelerate your career."
              : `No mentorship records found with status: ${activeTab}.`}
          </p>
          <div className="mt-5">
            <Link
              href="/student/mentors"
              className="inline-flex items-center gap-2 rounded-2xl bg-ulab px-5 py-2 text-xs font-bold text-white hover:bg-ulab-deep shadow-soft"
            >
              <Compass size={14} />
              Browse Career Mentors
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayedList.map((req) => (
            <Card
              key={req.id}
              className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex items-start gap-4 flex-1">
                <Avatar name={req.mentor.name} src={req.mentor.image} size={52} />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/student/mentors/${req.mentor.id}`}
                      className="font-bold text-sm text-ink hover:text-ulab transition"
                    >
                      {req.mentor.name}
                    </Link>
                    <Badge tone={req.mentor.role === "TEACHER" ? "lilac" : "gold"}>
                      {req.mentor.role === "TEACHER" ? "Faculty" : "Verified Alumni"}
                    </Badge>
                    <Badge
                      tone={
                        req.status === "PENDING"
                          ? "gold"
                          : req.status === "SCHEDULED"
                          ? "sage"
                          : req.status === "COMPLETED"
                          ? "lilac"
                          : req.status === "ACCEPTED"
                          ? "blue"
                          : "gray"
                      }
                    >
                      {req.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-ink-soft">
                    {req.mentor.position} {req.mentor.company && `at ${req.mentor.company}`}
                  </p>

                  <div className="pt-1">
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      Topic: {req.topic}
                    </span>
                    <p className="mt-1 text-xs text-ink-soft leading-relaxed bg-paper/60 p-3 rounded-2xl dark:bg-white/5">
                      &quot;{req.message}&quot;
                    </p>
                  </div>

                  {/* Scheduled Session Card */}
                  {req.status === "SCHEDULED" && req.scheduledAt && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-3.5 dark:border-emerald-800 dark:bg-emerald-950/40">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar size={16} className="text-emerald-700 dark:text-emerald-400" />
                        <div>
                          <p className="font-bold text-emerald-900 dark:text-emerald-200">
                            Session Scheduled
                          </p>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                            {new Date(req.scheduledAt).toLocaleString("en-US", {
                              dateStyle: "full",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>

                      {req.sessionLink && (
                        <a
                          href={req.sessionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 py-1.5 px-3 text-xs font-bold text-white hover:bg-emerald-800 shadow-soft"
                        >
                          <Video size={13} />
                          Join Meeting
                        </a>
                      )}
                    </div>
                  )}

                  {/* Mentor Feedback / Completion Notes */}
                  {req.status === "COMPLETED" && req.mentorNotes && (
                    <div className="mt-3 rounded-2xl border border-purple-200 bg-purple-50/70 p-3.5 dark:border-purple-900/40 dark:bg-purple-950/30">
                      <p className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                        <Sparkles size={14} /> Mentor Feedback & Recommendations:
                      </p>
                      <p className="mt-1 text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
                        {req.mentorNotes}
                      </p>
                    </div>
                  )}

                  {req.careerGoals && (
                    <p className="text-[11px] text-ink-soft">
                      <strong className="text-ink">Career Goal:</strong> {req.careerGoals}
                    </p>
                  )}

                  {req.preferredAvailability && (
                    <p className="text-[11px] text-ink-soft">
                      <strong className="text-ink">Preferred Availability:</strong> {req.preferredAvailability}
                    </p>
                  )}

                  {req.startedAt && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      Started on {new Date(req.startedAt).toLocaleDateString()}
                    </p>
                  )}

                  {/* Decline Reason */}
                  {req.status === "DECLINED" && req.mentorNotes && (
                    <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">
                      <strong className="text-ink">Mentor Note:</strong> &quot;{req.mentorNotes}&quot;
                    </p>
                  )}

                  {/* End Reason */}
                  {req.endReason && (
                    <p className="mt-2 text-xs text-ink-soft italic">
                      <strong className="text-ink">Conclusion Note:</strong> &quot;{req.endReason}&quot;
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 flex flex-col gap-2 items-end">
                {req.status === "PENDING" && (
                  <Button
                    type="button"
                    onClick={() => handleCancelRequest(req.id)}
                    disabled={isPending}
                    className="border border-mist/80 bg-paper/60 py-1.5 px-3 text-xs text-rose-600 hover:bg-paper"
                  >
                    Cancel Request
                  </Button>
                )}

                {(req.status === "ACCEPTED" || req.status === "SCHEDULED") && (
                  <Link
                    href="/student/mentorship-messages"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-ulab py-1.5 px-3 text-xs font-semibold text-white hover:bg-ulab-deep shadow-soft"
                  >
                    <MessageSquare size={13} />
                    Mentorship Chat
                  </Link>
                )}
                {req.status === "COMPLETED" && (
                  <Link
                    href="/student/mentorship-messages"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-mist/80 bg-paper/60 py-1.5 px-3 text-xs font-semibold text-ink hover:bg-surface shadow-soft"
                  >
                    <MessageSquare size={13} />
                    View Chat History
                  </Link>
                )}

                <Link
                  href={`/student/mentors/${req.mentor.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-ink"
                >
                  View Mentor Profile →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

