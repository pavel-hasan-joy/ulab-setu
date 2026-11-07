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
  Star,
  Trash2,
  UserMinus,
} from "lucide-react";
import { Avatar, Badge, Button, Card, cn } from "./ui";
import {
  cancelMentorshipRequest,
  submitMentorshipFeedback,
  deleteMentorshipRelationship,
} from "@/app/actions/mentorship";

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
  relationshipId?: string | null;
  feedback?: {
    id: string;
    rating: number;
    review: string | null;
  } | null;
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
  const [activeTab, setActiveTab] = useState<
    "ALL" | "ACTIVE" | "PENDING" | "COMPLETED" | "ARCHIVED"
  >("ACTIVE");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  // Review modal state
  const [reviewingReq, setReviewingReq] = useState<StudentMentorshipRecord | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isAnonymousReview, setIsAnonymousReview] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Delete Mentor modal state
  const [deletingReq, setDeletingReq] = useState<StudentMentorshipRecord | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter lists
  const pendingList = requests.filter((r) => r.status === "PENDING");
  const activeList = requests.filter(
    (r) => r.status === "ACCEPTED" || r.status === "SCHEDULED"
  );
  const completedList = requests.filter((r) => r.status === "COMPLETED");
  const archivedList = requests.filter(
    (r) => r.status === "DECLINED" || r.status === "CANCELLED"
  );

  const displayedList =
    activeTab === "ACTIVE"
      ? activeList
      : activeTab === "PENDING"
      ? pendingList
      : activeTab === "COMPLETED"
      ? completedList
      : activeTab === "ARCHIVED"
      ? archivedList
      : requests;

  const handleCancelRequest = (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this mentorship request?")) return;

    startTransition(async () => {
      const res = await cancelMentorshipRequest(requestId, "Cancelled by student");
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({ type: "success", message: "Mentorship request cancelled." });
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: "CANCELLED" } : r))
        );
      }
    });
  };

  const handleDeleteMentor = async () => {
    if (!deletingReq) return;
    setIsDeleting(true);
    setFeedback(null);
    const res = await deleteMentorshipRelationship(deletingReq.id, deleteReason);
    setIsDeleting(false);
    if (res.success) {
      setFeedback({
        type: "success",
        message: "Mentor relationship ended and removed from active list successfully.",
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === deletingReq.id
            ? { ...r, status: "CANCELLED", endReason: deleteReason || "Removed by student" }
            : r
        )
      );
      setDeletingReq(null);
      setDeleteReason("");
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Failed to delete mentorship relationship.",
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewingReq || !reviewingReq.relationshipId) {
      setFeedback({
        type: "error",
        message: "Relationship reference missing. Please refresh and try again.",
      });
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await submitMentorshipFeedback({
        relationshipId: reviewingReq.relationshipId,
        rating: ratingStars,
        review: reviewComment.trim() || undefined,
        isAnonymous: isAnonymousReview,
      });

      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: "Thank you! Your mentorship feedback and rating have been recorded.",
        });
        setRequests((prev) =>
          prev.map((r) =>
            r.id === reviewingReq.id
              ? {
                  ...r,
                  feedback: {
                    id: res.feedbackId || "new",
                    rating: ratingStars,
                    review: reviewComment.trim() || null,
                  },
                }
              : r
          )
        );
        setReviewingReq(null);
        setReviewComment("");
        setRatingStars(5);
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-ink-soft">Active Guidance</p>
          <p className="mt-1 text-2xl font-bold text-ink">{activeList.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-ink-soft">Pending Requests</p>
          <p className="mt-1 text-2xl font-bold text-gold-ink">{pendingList.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-ink-soft">Completed Sessions</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {completedList.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-ink-soft">Total Applications</p>
          <p className="mt-1 text-2xl font-bold text-ink">{requests.length}</p>
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
                          : req.status === "SCHEDULED" || req.status === "ACCEPTED"
                          ? "sage"
                          : req.status === "COMPLETED"
                          ? "lilac"
                          : req.status === "DECLINED"
                          ? "rose"
                          : "gray"
                      }
                    >
                      {req.status === "PENDING"
                        ? "Request Sent"
                        : req.status === "ACCEPTED" || req.status === "SCHEDULED"
                        ? "Mentorship Active"
                        : req.status === "COMPLETED"
                        ? "Completed"
                        : req.status === "DECLINED"
                        ? "Declined"
                        : req.status === "CANCELLED"
                        ? "Ended / Removed"
                        : req.status}
                    </Badge>

                    {req.feedback && (
                      <Badge tone="gold" className="gap-1 text-[11px]">
                        <Star size={11} className="fill-amber-400 text-amber-500" />
                        {req.feedback.rating}.0 Rated
                      </Badge>
                    )}
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

                  {/* Completed Session Indicator Banner - Mentorship stays active and open */}
                  {req.completedAt && (req.status === "ACCEPTED" || req.status === "SCHEDULED") && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-3 text-xs text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                          ✓
                        </span>
                        <span>
                          <strong>1 Session Completed!</strong> Active Guidance · You can continue chatting and schedule more sessions together.
                        </span>
                      </div>
                      <Badge tone="sage" className="shrink-0 text-[10px]">
                        Session Done
                      </Badge>
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

                  {/* Student's submitted review */}
                  {req.feedback && req.feedback.review && (
                    <div className="mt-2 rounded-xl bg-amber-50/60 border border-amber-200/60 p-2.5 text-xs text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-200">
                      <p className="font-semibold text-[11px] flex items-center gap-1">
                        <Star size={12} className="fill-amber-400 text-amber-500" /> Your Review:
                      </p>
                      <p className="mt-0.5 italic text-[11px]">&ldquo;{req.feedback.review}&rdquo;</p>
                    </div>
                  )}

                  {req.careerGoals && (
                    <p className="text-[11px] text-ink-soft">
                      <strong className="text-ink">Career Goal:</strong> {req.careerGoals}
                    </p>
                  )}

                  {req.preferredAvailability && (
                    <p className="text-[11px] text-ink-soft">
                      <strong className="text-ink">Preferred Availability:</strong>{" "}
                      {req.preferredAvailability}
                    </p>
                  )}

                  {req.startedAt && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      Started on {new Date(req.startedAt).toLocaleDateString()}
                    </p>
                  )}

                  {req.status === "DECLINED" && req.mentorNotes && (
                    <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">
                      <strong className="text-ink">Mentor Note:</strong> &quot;{req.mentorNotes}&quot;
                    </p>
                  )}

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
                  <div className="flex flex-col gap-1.5 items-end">
                    <Link
                      href="/student/mentorship-messages"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ulab py-1.5 px-3 text-xs font-semibold text-white hover:bg-ulab-deep shadow-soft"
                    >
                      <MessageSquare size={13} />
                      Mentorship Chat
                    </Link>

                    {req.completedAt && !req.feedback && req.relationshipId && (
                      <Button
                        type="button"
                        onClick={() => {
                          setReviewingReq(req);
                          setRatingStars(5);
                          setReviewComment("");
                        }}
                        className="gap-1 bg-amber-500 hover:bg-amber-600 text-white py-1 px-3 text-xs font-semibold"
                      >
                        <Star size={13} className="fill-white" />
                        Rate & Review
                      </Button>
                    )}

                    <Button
                      type="button"
                      onClick={() => {
                        setDeletingReq(req);
                        setDeleteReason("");
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200/80 bg-rose-50/60 py-1 px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
                    >
                      <UserMinus size={12} />
                      Remove from My Mentors
                    </Button>
                  </div>
                )}

                {req.status === "COMPLETED" && (
                  <div className="flex flex-col gap-1.5 items-end">
                    {!req.feedback && req.relationshipId && (
                      <Button
                        type="button"
                        onClick={() => {
                          setReviewingReq(req);
                          setRatingStars(5);
                          setReviewComment("");
                        }}
                        className="gap-1 bg-amber-500 hover:bg-amber-600 text-white py-1 px-3 text-xs font-semibold"
                      >
                        <Star size={13} className="fill-white" />
                        Rate & Review Mentor
                      </Button>
                    )}

                    <Link
                      href="/student/mentorship-messages"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-mist/80 bg-paper/60 py-1.5 px-3 text-xs font-semibold text-ink hover:bg-surface shadow-soft"
                    >
                      <MessageSquare size={13} />
                      View Chat History
                    </Link>

                    <Button
                      type="button"
                      onClick={() => {
                        setDeletingReq(req);
                        setDeleteReason("");
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      <Trash2 size={11} />
                      Remove Record
                    </Button>
                  </div>
                )}

                {(req.status === "COMPLETED" || req.status === "DECLINED" || req.status === "CANCELLED") && (
                  <Link
                    href={`/student/mentors/${req.mentor.id}?request=1`}
                    className="inline-flex items-center gap-1 rounded-xl bg-ulab py-1.5 px-3 text-xs font-semibold text-white hover:bg-ulab-deep shadow-soft"
                  >
                    Request Again
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

      {/* Review Modal */}
      {reviewingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mist bg-surface p-6 shadow-lift space-y-4">
            <div className="flex items-center justify-between border-b border-mist/60 pb-3">
              <div>
                <h3 className="font-bold text-base text-ink">Rate & Review Mentor</h3>
                <p className="text-xs text-ink-soft">
                  Provide your feedback for {reviewingReq.mentor.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingReq(null)}
                className="rounded-lg p-1 text-ink-soft hover:bg-paper"
              >
                <X size={16} />
              </button>
            </div>

            {/* Star Rating Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Overall Rating (1 to 5 Stars):</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingStars(star)}
                    className="p-1 transition transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={cn(
                        star <= ratingStars
                          ? "fill-amber-400 text-amber-500"
                          : "text-ink-soft/30 hover:text-amber-400"
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 font-bold text-sm text-ink">{ratingStars} out of 5</span>
              </div>
            </div>

            {/* Written Review */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">
                Written Feedback & Experience (Optional):
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                placeholder="Share how this mentorship session helped your career, resume, or technical preparation..."
                className="w-full rounded-xl border border-mist bg-paper p-3 text-xs text-ink focus:border-ulab focus:outline-none"
              />
            </div>

            {/* Anonymous Toggle */}
            <label className="flex items-center gap-2 text-xs text-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymousReview}
                onChange={(e) => setIsAnonymousReview(e.target.checked)}
                className="size-4 accent-ulab"
              />
              <span>Submit review anonymously (hide my student name from public listing)</span>
            </label>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-mist/60">
              <Button
                variant="outline"
                type="button"
                onClick={() => setReviewingReq(null)}
                className="py-1.5 px-4 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="py-1.5 px-5 text-xs font-semibold bg-ulab text-white hover:bg-ulab-deep shadow-soft"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Mentor Confirmation Modal */}
      {deletingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-mist/80 bg-surface p-6 shadow-2xl dark:border-white/10">
            <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
              <div className="flex items-center gap-2 text-rose-600">
                <UserMinus size={18} />
                <h3 className="font-bold text-ink">Remove from My Mentors</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingReq(null)}
                className="rounded-lg p-1 text-ink-soft hover:bg-paper"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-ink leading-relaxed">
                Are you sure you want to remove <strong>{deletingReq.mentor.name}</strong> from your active mentors list?
              </p>
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 text-[11px] text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200 space-y-1">
                <p className="font-semibold">Effects of removal:</p>
                <ul className="list-disc list-inside space-y-0.5 text-ink-soft">
                  <li>The active mentorship will conclude and be removed from your active list.</li>
                  <li>The mentor&apos;s capacity slot will be freed up for other students.</li>
                  <li>Previous chat messages and history will be safely preserved in archives.</li>
                  <li>You can submit a new mentorship request to this mentor in the future.</li>
                </ul>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-ink-soft">
                  Reason / Note (Optional):
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g. Completed goals, Schedule mismatch, etc."
                  className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-1.5 text-xs text-ink placeholder:text-ink-soft/60 focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-mist/70 pt-3.5 dark:border-white/10">
              <Button
                type="button"
                onClick={() => setDeletingReq(null)}
                className="border border-mist/80 bg-paper/60 py-1.5 px-3 text-xs text-ink hover:bg-paper"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeleteMentor}
                disabled={isDeleting}
                className="bg-rose-600 py-1.5 px-3 text-xs font-semibold text-white hover:bg-rose-700 shadow-soft"
              >
                {isDeleting ? "Removing..." : "Confirm Removal"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
