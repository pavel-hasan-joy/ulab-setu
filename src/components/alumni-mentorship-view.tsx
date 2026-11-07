"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Compass,
  CheckCircle2,
  Clock,
  Calendar,
  Video,
  X,
  Settings2,
  Check,
  XCircle,
  Sparkles,
  UserCheck,
  User,
  MessageSquare,
} from "lucide-react";
import {
  updateMentorProfile,
  acceptMentorshipRequest,
  declineMentorshipRequest,
  scheduleMentorshipSession,
  completeMentorshipSession,
  type MentorshipTopic,
} from "@/app/actions/mentorship";
import { MENTORSHIP_TOPICS } from "@/lib/mentorship-constants";
import { Avatar, Badge, Button, cn, timeAgo } from "./ui";

export interface AlumniMentorProfile {
  id: string;
  isMentor: boolean;
  mentorAvailable: boolean;
  mentorTopics: string | null;
  mentorExpertise: string | null;
  mentorSessionFormat: string | null;
  mentorAvailabilityNote: string | null;
  mentorMaxMentees: number;
}

export interface AlumniMentorshipRequestItem {
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
    batch: string | null;
    studentId: string | null;
    image: string | null;
  };
}

interface AlumniMentorshipViewProps {
  initialProfile: AlumniMentorProfile;
  initialRequests: AlumniMentorshipRequestItem[];
}

export function AlumniMentorshipView({
  initialProfile,
  initialRequests,
}: AlumniMentorshipViewProps) {
  const [activeTab, setActiveTab] = useState<"REQUESTS" | "SETTINGS">("REQUESTS");
  const [profile, setProfile] = useState<AlumniMentorProfile>(initialProfile);
  const [requests, setRequests] = useState<AlumniMentorshipRequestItem[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Profile Settings Form
  const [isMentor, setIsMentor] = useState(profile.isMentor);
  const [mentorAvailable, setMentorAvailable] = useState(profile.mentorAvailable);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    profile.mentorTopics ? profile.mentorTopics.split(",").map((s) => s.trim()) : []
  );
  const [expertise, setExpertise] = useState(profile.mentorExpertise || "");
  const [sessionFormat, setSessionFormat] = useState(profile.mentorSessionFormat || "ONLINE");
  const [availabilityNote, setAvailabilityNote] = useState(profile.mentorAvailabilityNote || "");
  const [maxMentees, setMaxMentees] = useState(profile.mentorMaxMentees || 3);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Scheduling Modal
  const [schedulingReq, setSchedulingReq] = useState<AlumniMentorshipRequestItem | null>(null);
  const [scheduleDatetime, setScheduleDatetime] = useState("");
  const [scheduleLink, setScheduleLink] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Complete Modal
  const [completingReq, setCompletingReq] = useState<AlumniMentorshipRequestItem | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === "ALL") return true;
    return r.status === statusFilter;
  });

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    await updateMentorProfile({
      isMentor,
      mentorAvailable,
      mentorTopics: selectedTopics,
      mentorExpertise: expertise,
      mentorSessionFormat: sessionFormat,
      mentorAvailabilityNote: availabilityNote,
      mentorMaxMentees: Number(maxMentees),
    });

    setProfile({
      ...profile,
      isMentor,
      mentorAvailable,
      mentorTopics: selectedTopics.join(", "),
      mentorExpertise: expertise,
      mentorSessionFormat: sessionFormat,
      mentorAvailabilityNote: availabilityNote,
      mentorMaxMentees: Number(maxMentees),
    });

    setSavingProfile(false);
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 2000);
  };

  const handleAccept = async (requestId: string) => {
    await acceptMentorshipRequest(requestId);
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "ACCEPTED" } : r))
    );
  };

  const handleDecline = async (requestId: string) => {
    const reason = prompt("Optional reason for declining:");
    if (reason === null) return;
    await declineMentorshipRequest(requestId, reason || undefined);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: "DECLINED", mentorNotes: reason } : r
      )
    );
  };

  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingReq || !scheduleDatetime) return;

    setIsScheduling(true);
    await scheduleMentorshipSession(schedulingReq.id, {
      scheduledAt: scheduleDatetime,
      sessionLink: scheduleLink,
      note: scheduleNote,
    });

    setRequests((prev) =>
      prev.map((r) =>
        r.id === schedulingReq.id
          ? {
              ...r,
              status: "SCHEDULED",
              scheduledAt: new Date(scheduleDatetime).toISOString(),
              sessionLink: scheduleLink,
              mentorNotes: scheduleNote || r.mentorNotes,
            }
          : r
      )
    );

    setIsScheduling(false);
    setSchedulingReq(null);
    setScheduleDatetime("");
    setScheduleLink("");
    setScheduleNote("");
  };

  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingReq) return;

    setIsCompleting(true);
    await completeMentorshipSession(completingReq.id, completionNotes);

    setRequests((prev) =>
      prev.map((r) =>
        r.id === completingReq.id
          ? {
              ...r,
              status: "COMPLETED",
              completedAt: new Date().toISOString(),
              mentorNotes: completionNotes || r.mentorNotes,
            }
          : r
      )
    );

    setIsCompleting(false);
    setCompletingReq(null);
    setCompletionNotes("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge tone="gold">Pending Your Review</Badge>;
      case "ACCEPTED":
        return <Badge tone="sage">Accepted (Unscheduled)</Badge>;
      case "SCHEDULED":
        return <Badge tone="blue">Scheduled 📅</Badge>;
      case "COMPLETED":
        return <Badge tone="lilac">Completed</Badge>;
      case "DECLINED":
        return <Badge tone="rose">Declined</Badge>;
      case "CANCELLED":
        return <Badge tone="gray">Ended / Removed</Badge>;
      default:
        return <Badge tone="gray">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-2xl bg-paper p-1 text-xs font-semibold max-w-sm border border-mist/80">
          <button
            onClick={() => setActiveTab("REQUESTS")}
            className={cn(
              "flex-1 rounded-xl py-2 text-center transition flex items-center justify-center gap-1.5",
              activeTab === "REQUESTS"
                ? "bg-surface font-bold text-ink shadow-sm"
                : "text-ink-soft hover:text-ink"
            )}
          >
            <Clock size={14} />
            Mentorship Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab("SETTINGS")}
            className={cn(
              "flex-1 rounded-xl py-2 text-center transition flex items-center justify-center gap-1.5",
              activeTab === "SETTINGS"
                ? "bg-surface font-bold text-ink shadow-sm"
                : "text-ink-soft hover:text-ink"
            )}
          >
            <Settings2 size={14} />
            Mentor Profile & Preferences
          </button>
        </div>

        {/* Status Callout */}
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "size-2.5 rounded-full",
              profile.isMentor && profile.mentorAvailable
                ? "bg-emerald-500 animate-pulse"
                : "bg-gray-400"
            )}
          />
          <span className="font-semibold text-ink">
            {profile.isMentor
              ? profile.mentorAvailable
                ? "Active & Available for Mentees"
                : "Enrolled Mentor (Currently Paused)"
              : "Mentorship Inactive"}
          </span>
        </div>
      </div>

      {activeTab === "REQUESTS" ? (
        /* ================= REQUESTS TAB ================= */
        <div className="space-y-4">
          {/* Status Filter Bar */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-mist bg-surface p-3 shadow-soft text-xs">
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

          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-mist bg-surface p-12 text-center shadow-soft">
              <Clock size={28} className="mx-auto text-ink-soft" />
              <h3 className="mt-3 text-sm font-bold text-ink">No requests match this filter</h3>
              <p className="mt-1 text-xs text-ink-soft">
                Student mentorship inquiries will appear here as they arrive.
              </p>
            </div>
          ) : (
            filteredRequests.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-mist bg-surface p-5 shadow-soft transition hover:shadow-lift space-y-3"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar name={r.student.name} src={r.student.image} size={42} />
                    <div>
                      <h4 className="font-bold text-sm text-ink">{r.student.name}</h4>
                      <p className="text-xs text-ink-soft">
                        {r.student.department} {r.student.batch ? `• Batch ${r.student.batch}` : ""}
                      </p>
                      <p className="text-[11px] text-ink-soft font-mono">
                        {r.student.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(r.status)}
                  </div>
                </div>

                {/* Details Box */}
                <div className="rounded-xl bg-paper p-3 text-xs space-y-1.5 border border-mist/60">
                  <p>
                    <strong className="text-ink">Requested Topic:</strong>{" "}
                    <span className="font-semibold text-ulab-deep">{r.topic}</span>
                  </p>
                  {r.careerGoals && (
                    <p>
                      <strong className="text-ink">Career Goals:</strong> <span>{r.careerGoals}</span>
                    </p>
                  )}
                  <p className="text-ink-soft italic leading-relaxed">&ldquo;{r.message}&rdquo;</p>
                </div>

                {/* Scheduled Info if any */}
                {r.status === "SCHEDULED" && r.scheduledAt && (
                  <div className="rounded-xl bg-sky/50 border border-sky-light/60 p-3 text-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-ulab-deep shrink-0" />
                      <div>
                        <p className="font-bold text-ink">
                          Scheduled: {new Date(r.scheduledAt).toLocaleString()}
                        </p>
                        <p className="text-[11px] text-ink-soft">Format: {r.sessionFormat}</p>
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

                {/* Mentor Notes / Feedback */}
                {r.mentorNotes && (
                  <p className="text-xs text-ink-soft border-t border-mist/50 pt-2">
                    <strong className="text-ink">Your Notes / Response:</strong> {r.mentorNotes}
                  </p>
                )}

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-mist/60 pt-3">
                  <span className="text-[10px] text-ink-soft">
                    Requested {timeAgo(r.createdAt)} • Preferred: {r.sessionFormat || "Online"}
                  </span>

                  <div className="flex items-center gap-2">
                    {r.status === "PENDING" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleDecline(r.id)}
                          className="py-1 px-3 text-xs text-rose border-rose/30 hover:bg-rose-wash"
                        >
                          Decline
                        </Button>
                        <Button
                          onClick={() => handleAccept(r.id)}
                          className="py-1 px-3.5 text-xs font-semibold"
                        >
                          Accept Mentorship
                        </Button>
                      </>
                    )}

                    {(r.status === "ACCEPTED" || r.status === "SCHEDULED") && (
                      <>
                        <Link
                          href="/alumni/mentorship-messages"
                          className="inline-flex items-center gap-1 rounded-xl bg-ulab py-1 px-3 text-xs font-semibold text-white hover:bg-ulab-deep shadow-soft"
                        >
                          <MessageSquare size={13} />
                          Mentorship Chat
                        </Link>
                        <Button
                          variant="outline"
                          onClick={() => setSchedulingReq(r)}
                          className="py-1 px-3 text-xs gap-1"
                        >
                          <Calendar size={13} />
                          {r.status === "SCHEDULED" ? "Reschedule" : "Schedule Session"}
                        </Button>
                        <Button
                          onClick={() => setCompletingReq(r)}
                          className="py-1 px-3.5 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={13} />
                          Mark Completed
                        </Button>
                      </>
                    )}

                    {r.status === "COMPLETED" && (
                      <Link
                        href="/alumni/mentorship-messages"
                        className="inline-flex items-center gap-1 rounded-xl border border-mist/80 bg-paper py-1 px-3 text-xs font-semibold text-ink hover:bg-surface shadow-soft"
                      >
                        <MessageSquare size={13} />
                        Chat History
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ================= SETTINGS TAB ================= */
        <div className="rounded-2xl border border-mist bg-surface p-6 shadow-soft max-w-2xl">
          <h3 className="font-display text-base font-bold text-ink">
            Mentor Profile & Preferences
          </h3>
          <p className="mt-1 text-xs text-ink-soft">
            Configure your mentorship topics, availability hours, and preferred format for student advisories.
          </p>

          <form onSubmit={handleSaveProfile} className="mt-6 space-y-5 text-xs">
            {/* Toggles */}
            <div className="space-y-3 rounded-xl bg-paper p-4 border border-mist/70">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-bold text-ink">Offer Mentorship to Students</p>
                  <p className="text-[11px] text-ink-soft">
                    List your profile in the student Mentorship Directory
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isMentor}
                  onChange={(e) => setIsMentor(e.target.checked)}
                  className="size-4.5 accent-ulab"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-mist/60">
                <div>
                  <p className="font-bold text-ink">Currently Available for New Requests</p>
                  <p className="text-[11px] text-ink-soft">
                    Pause requests temporarily during busy periods
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={mentorAvailable}
                  onChange={(e) => setMentorAvailable(e.target.checked)}
                  className="size-4.5 accent-ulab"
                />
              </label>
            </div>

            {/* Topics Selection */}
            <div>
              <label className="font-bold text-ink mb-1.5 block">
                Mentorship Topics Offered
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MENTORSHIP_TOPICS.map((topic) => {
                  const isChecked = selectedTopics.includes(topic);
                  return (
                    <button
                      type="button"
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-xs font-semibold transition border",
                        isChecked
                          ? "bg-ulab text-white border-ulab"
                          : "bg-paper text-ink-soft border-mist hover:text-ink"
                      )}
                    >
                      {topic} {isChecked && "✓"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expertise */}
            <div>
              <label className="font-bold text-ink">
                Professional Expertise & Core Domains
              </label>
              <textarea
                rows={2}
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                placeholder="e.g. Distributed backend systems, React Native, Product Engineering, Data Science..."
                className="mt-1 w-full rounded-xl border border-mist bg-paper p-3 text-xs focus:border-ulab focus:outline-none"
              />
            </div>

            {/* Format & Capacity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-ink">Preferred Session Format</label>
                <select
                  value={sessionFormat}
                  onChange={(e) => setSessionFormat(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2 text-xs focus:border-ulab focus:outline-none"
                >
                  <option value="ONLINE">Online Virtual Session (Google Meet / Zoom)</option>
                  <option value="IN_PERSON">In-Person at Campus / Office</option>
                  <option value="FLEXIBLE">Flexible / Either</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-ink">Max Concurrent Mentees</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxMentees}
                  onChange={(e) => setMaxMentees(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2 text-xs focus:border-ulab focus:outline-none"
                />
              </div>
            </div>

            {/* Availability Note */}
            <div>
              <label className="font-bold text-ink">Availability Timing Note</label>
              <input
                value={availabilityNote}
                onChange={(e) => setAvailabilityNote(e.target.value)}
                placeholder="e.g. Fridays & Saturdays between 7 PM - 9 PM BST"
                className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2 text-xs focus:border-ulab focus:outline-none"
              />
            </div>

            {profileSavedMsg && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Mentor preferences saved successfully!
              </p>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={savingProfile}
                className="py-2 px-5 text-xs font-semibold"
              >
                {savingProfile ? "Saving Settings..." : "Save Mentor Settings"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Session Modal */}
      {schedulingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mist bg-surface p-6 shadow-lift">
            <div className="flex items-center justify-between border-b border-mist/70 pb-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-ulab" />
                <h3 className="font-display text-base font-bold text-ink">
                  Schedule Session with {schedulingReq.student.name}
                </h3>
              </div>
              <button
                onClick={() => setSchedulingReq(null)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-paper hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-ink">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleDatetime}
                  onChange={(e) => setScheduleDatetime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2 text-xs focus:border-ulab focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-ink">Meeting Link or Location</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-abc-def"
                  value={scheduleLink}
                  onChange={(e) => setScheduleLink(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2 text-xs focus:border-ulab focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-ink">Preparation Notes for Mentee (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please have your updated resume ready..."
                  value={scheduleNote}
                  onChange={(e) => setScheduleNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-mist bg-paper p-2.5 text-xs focus:border-ulab focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-mist/70 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSchedulingReq(null)}
                  className="py-1.5 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isScheduling}
                  className="py-1.5 px-4 text-xs font-semibold"
                >
                  {isScheduling ? "Scheduling..." : "Confirm Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Completed Modal */}
      {completingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mist bg-surface p-6 shadow-lift">
            <div className="flex items-center justify-between border-b border-mist/70 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <h3 className="font-display text-base font-bold text-ink">
                  Complete Mentorship Session
                </h3>
              </div>
              <button
                onClick={() => setCompletingReq(null)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-paper hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} className="mt-4 space-y-3.5 text-xs">
              <p className="text-ink-soft">
                Mark your session on &ldquo;{completingReq.topic}&rdquo; with {completingReq.student.name} as completed.
              </p>

              <div>
                <label className="font-bold text-ink">Session Feedback / Mentoring Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Great session discussing distributed database fundamentals and mock coding questions..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-mist bg-paper p-2.5 text-xs focus:border-ulab focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-mist/70 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCompletingReq(null)}
                  className="py-1.5 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCompleting}
                  className="py-1.5 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700"
                >
                  {isCompleting ? "Saving..." : "Mark as Completed"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
