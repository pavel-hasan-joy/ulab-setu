"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
  FileEdit,
  RotateCcw,
  CalendarClock,
  Ban,
  Link as LinkIcon,
  MapPin,
  Clock,
  Video,
  Building,
} from "lucide-react";
import {
  scheduleInterview,
  cancelInterview,
  rejectApplication,
  setApplicationStatus,
  updateApplicationHiringNotes,
} from "@/app/actions/jobs";
import { Badge, Button } from "@/components/ui";
import { canScheduleInterview } from "@/lib/applications";

export function ApplicantActions({
  applicationId,
  status,
  initialNotes = "",
  initialSchedule,
}: {
  applicationId: string;
  status: string;
  initialNotes?: string | null;
  initialSchedule?: {
    interviewDate?: string | null;
    interviewTime?: string | null;
    interviewType?: string | null;
    interviewLocation?: string | null;
    interviewMeetingLink?: string | null;
    interviewMessage?: string | null;
  };
}) {
  const [pending, startTransition] = useTransition();

  // Modals state
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Private Hiring Notes
  const [notes, setNotes] = useState(initialNotes || "");
  const [notesSaved, setNotesSaved] = useState(false);

  // Rejection Notes (optional private note for recruiter/admin)
  const [rejectionNote, setRejectionNote] = useState("");

  // Cancellation Reason
  const [cancelReason, setCancelReason] = useState("");

  // Interview Form State
  const defaultDate = initialSchedule?.interviewDate
    ? new Date(initialSchedule.interviewDate).toISOString().split("T")[0]
    : "";
  const [interviewDate, setInterviewDate] = useState(defaultDate);
  const [interviewTime, setInterviewTime] = useState(initialSchedule?.interviewTime || "10:30");
  const [interviewType, setInterviewType] = useState<"Physical" | "Online">(
    initialSchedule?.interviewType === "Physical" ? "Physical" : "Online"
  );
  const [interviewLocation, setInterviewLocation] = useState(
    initialSchedule?.interviewLocation ||
      (interviewType === "Online" ? "Google Meet" : "ULAB Permanent Campus, Mohammadpur")
  );
  const [interviewMeetingLink, setInterviewMeetingLink] = useState(
    initialSchedule?.interviewMeetingLink || ""
  );
  const [interviewMessage, setInterviewMessage] = useState(
    initialSchedule?.interviewMessage || ""
  );
  const [interviewError, setInterviewError] = useState<string | null>(null);

  // Minimum date for scheduling in Asia/Dhaka timezone: today
  const todayDhaka = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const isInterview = status === "INTERVIEW";
  const isRejected = status === "REJECTED";
  const allowInterview = canScheduleInterview(status);

  const setStatus = (s: "APPLIED" | "VIEWED" | "SHORTLISTED" | "INTERVIEW" | "SELECTED" | "REJECTED") => {
    startTransition(async () => {
      try {
        const res = await setApplicationStatus(applicationId, s);
        if (res?.error) alert(res.error);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to update status");
      }
    });
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateApplicationHiringNotes(applicationId, notes);
        setNotesSaved(true);
        setTimeout(() => {
          setNotesSaved(false);
          setShowNotesModal(false);
        }, 1200);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to save hiring notes");
      }
    });
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInterviewError(null);

    if (!interviewDate) {
      setInterviewError("Please choose an interview date.");
      return;
    }
    if (!interviewTime) {
      setInterviewError("Please choose an interview time.");
      return;
    }
    if (!interviewLocation.trim()) {
      setInterviewError("Please enter an interview location or venue.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await scheduleInterview({
          applicationId,
          date: interviewDate,
          time: interviewTime,
          location: interviewLocation,
          type: interviewType,
          meetingLink: interviewMeetingLink,
          message: interviewMessage,
        });

        if (res.error) {
          setInterviewError(res.error);
        } else {
          setShowInterviewModal(false);
        }
      } catch (err: unknown) {
        setInterviewError(err instanceof Error ? err.message : "Failed to schedule interview.");
      }
    });
  };

  const handleCancelInterviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await cancelInterview(applicationId, cancelReason);
        if (res.error) {
          alert(res.error);
        } else {
          setShowCancelModal(false);
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to cancel interview");
      }
    });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await rejectApplication(applicationId, rejectionNote);
        if (res.error) {
          alert(res.error);
        } else {
          setShowRejectModal(false);
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to reject application");
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Private Notes button */}
        <button
          type="button"
          onClick={() => setShowNotesModal(true)}
          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
            notes
              ? "border-gold bg-gold-wash/80 text-gold-ink font-semibold"
              : "border-mist bg-surface text-ink-soft hover:bg-mist hover:text-ink"
          }`}
          title="Private notes visible only to you and admins"
        >
          <FileEdit size={13} /> {notes ? "Hiring Notes (Saved)" : "Add Notes"}
        </button>

        {/* Shortlist action (when not yet shortlisted, interview, or selected) */}
        {!isRejected && status !== "SHORTLISTED" && status !== "INTERVIEW" && status !== "SELECTED" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setStatus("SHORTLISTED")}
            className="inline-flex items-center gap-1 rounded-lg bg-gold/90 px-3 py-1.5 text-xs font-semibold text-gold-ink hover:bg-gold transition shadow-xs"
          >
            <Sparkles size={13} /> Shortlist
          </button>
        )}

        {/* Invite for Interview (Available when allowed and not already scheduled) */}
        {allowInterview && !isInterview && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setInterviewError(null);
              setShowInterviewModal(true);
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-ulab px-3 py-1.5 text-xs font-semibold text-white hover:bg-ulab-deep transition shadow-xs"
          >
            <Calendar size={13} /> Invite for Interview
          </button>
        )}

        {/* Interview Reschedule & Cancel Controls */}
        {isInterview && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setInterviewError(null);
                setShowInterviewModal(true);
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs"
              title="Reschedule interview date, time, or location"
            >
              <CalendarClock size={13} /> Reschedule
            </button>

            <button
              type="button"
              disabled={pending}
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300 transition"
              title="Cancel this interview and revert candidate to shortlisted"
            >
              <Ban size={13} /> Cancel Interview
            </button>
          </>
        )}

        {/* Select Candidate (Offer) */}
        {(status === "SHORTLISTED" || status === "INTERVIEW") && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setStatus("SELECTED")}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs"
          >
            <CheckCircle2 size={13} /> Select Candidate
          </button>
        )}

        {/* Not a Fit / Reject Action */}
        {!isRejected && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setShowRejectModal(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:text-rose-600 hover:bg-rose-50 transition"
            title="Mark candidate as Not a Fit / Rejected"
          >
            <XCircle size={13} /> Not a Fit
          </button>
        )}

        {/* Reset / Reopen Application (if rejected or withdrawn) */}
        {(isRejected || status === "SELECTED") && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setStatus("APPLIED")}
            className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2 py-1.5 text-xs font-medium text-ink-soft hover:bg-mist transition"
            title="Reopen or reset status back to Under Review"
          >
            <RotateCcw size={12} /> Reopen
          </button>
        )}
      </div>

      {/* 1. Interview Scheduling / Rescheduling Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-mist bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                  <Calendar className="text-ulab" size={20} />
                  {isInterview ? "Reschedule Interview" : "Invite for Interview"}
                </h3>
                <p className="mt-1 text-xs text-ink-soft">
                  Schedule an interview session. The candidate will receive an immediate in-app notification with venue and timing details. (Asia/Dhaka timezone)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInterviewModal(false)}
                className="text-ink-soft hover:text-ink text-sm p-1"
              >
                ✕
              </button>
            </div>

            {interviewError && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                ⚠️ {interviewError}
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="mt-4 space-y-4">
              {/* Interview Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Interview Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInterviewType("Online");
                      if (!interviewLocation || interviewLocation.includes("Campus")) {
                        setInterviewLocation("Google Meet");
                      }
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                      interviewType === "Online"
                        ? "border-ulab bg-sky/30 text-ulab-deep shadow-xs"
                        : "border-mist bg-surface text-ink-soft hover:bg-mist"
                    }`}
                  >
                    <Video size={15} /> Online (Virtual)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInterviewType("Physical");
                      if (!interviewLocation || interviewLocation.includes("Meet")) {
                        setInterviewLocation("ULAB Permanent Campus, Mohammadpur");
                      }
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                      interviewType === "Physical"
                        ? "border-ulab bg-sky/30 text-ulab-deep shadow-xs"
                        : "border-mist bg-surface text-ink-soft hover:bg-mist"
                    }`}
                  >
                    <Building size={15} /> Physical (In-Person)
                  </button>
                </div>
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Interview Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={todayDhaka}
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full rounded-xl border border-mist bg-surface p-2.5 text-xs text-ink focus:border-ulab focus:outline-none"
                  />
                  <span className="mt-0.5 block text-[10px] text-ink-soft">Asia/Dhaka local date</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Interview Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full rounded-xl border border-mist bg-surface p-2.5 text-xs text-ink focus:border-ulab focus:outline-none"
                  />
                  <span className="mt-0.5 block text-[10px] text-ink-soft">e.g. 10:30 AM / 02:00 PM</span>
                </div>
              </div>

              {/* Location / Place */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Location / Venue <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="text"
                    required
                    value={interviewLocation}
                    onChange={(e) => setInterviewLocation(e.target.value)}
                    placeholder={
                      interviewType === "Online"
                        ? "e.g. Google Meet or Zoom"
                        : "e.g. ULAB Permanent Campus, Building A, Room 402"
                    }
                    className="w-full rounded-xl border border-mist bg-surface py-2.5 pl-9 pr-3 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none"
                  />
                </div>
              </div>

              {/* Online Meeting Link (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Meeting Link (Optional)
                </label>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="url"
                    value={interviewMeetingLink}
                    onChange={(e) => setInterviewMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                    className="w-full rounded-xl border border-mist bg-surface py-2.5 pl-9 pr-3 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none"
                  />
                </div>
                <span className="mt-0.5 block text-[10px] text-ink-soft">
                  Provide a Google Meet, Zoom, or Teams invite link if conducting virtually.
                </span>
              </div>

              {/* Message to Applicant */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Message to Applicant (Optional)
                </label>
                <textarea
                  value={interviewMessage}
                  onChange={(e) => setInterviewMessage(e.target.value)}
                  rows={3}
                  placeholder="e.g. Please bring a printed copy of your CV and portfolio. Be prepared for a 30-minute technical discussion..."
                  className="w-full rounded-xl border border-mist bg-surface p-2.5 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-mist/70">
                <button
                  type="button"
                  onClick={() => setShowInterviewModal(false)}
                  className="rounded-xl border border-mist px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-mist"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-ulab px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-ulab-deep disabled:opacity-60"
                >
                  {pending ? "Saving Schedule..." : isInterview ? "Confirm Reschedule" : "Send Interview Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Rejection Confirmation & Private Notes Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-mist bg-paper p-6 shadow-2xl">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <XCircle size={18} className="text-rose-600" />
              Reject Applicant / Not a Fit
            </h3>
            <p className="mt-1 text-xs text-ink-soft leading-relaxed">
              Updating this application to <strong>Rejected</strong> will notify the student and update their status in My Applications. The application record will remain saved.
            </p>

            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Internal Rejection Note (Optional)
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  rows={3}
                  placeholder="Private internal notes for recruitment tracking (never visible to candidate)..."
                  className="w-full rounded-xl border border-mist bg-surface p-2.5 text-xs text-ink placeholder:text-ink-soft focus:border-rose-500 focus:outline-none"
                />
                <span className="mt-0.5 block text-[10px] text-ink-soft">
                  🔒 Strictly confidential — only visible to you and verified administrators.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-mist/70">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="rounded-xl border border-mist px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-mist"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
                >
                  {pending ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Interview Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-mist bg-paper p-6 shadow-2xl">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Ban size={18} className="text-amber-600" />
              Cancel Scheduled Interview
            </h3>
            <p className="mt-1 text-xs text-ink-soft leading-relaxed">
              This will cancel the active interview and notify the candidate. The application will be moved back to <strong>Shortlisted</strong>.
            </p>

            <form onSubmit={handleCancelInterviewSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Slot conflict, hiring requirement changed, or will reschedule soon..."
                  className="w-full rounded-xl border border-mist bg-surface p-2.5 text-xs text-ink placeholder:text-ink-soft focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-mist/70">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="rounded-xl border border-mist px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-mist"
                >
                  Keep Interview
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60"
                >
                  {pending ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Private Hiring Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-mist bg-paper p-6 shadow-2xl">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <FileEdit size={18} className="text-ulab" />
              Private Hiring Notes
            </h3>
            <p className="mt-1 text-xs text-ink-soft">
              These notes are strictly private to you (and authorized university administrators). The student cannot see them.
            </p>

            <form onSubmit={handleSaveNotes} className="mt-4 space-y-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Write interview feedback, technical ratings, or questions for next rounds..."
                className="w-full rounded-xl border border-mist bg-surface p-3 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none"
              />

              <div className="flex items-center justify-between">
                {notesSaved && (
                  <span className="text-xs font-semibold text-emerald-600">✓ Notes saved securely!</span>
                )}
                {!notesSaved && <span />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNotesModal(false)}
                    className="rounded-xl border border-mist px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-mist"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-ulab px-4 py-1.5 text-xs font-semibold text-white hover:bg-ulab-deep disabled:opacity-60"
                  >
                    {pending ? "Saving..." : "Save Notes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
