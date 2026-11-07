"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building,
  GraduationCap,
  Briefcase,
  Compass,
  Sparkles,
  ShieldCheck,
  Calendar,
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { Avatar, Badge, Button, Card } from "./ui";
import { sendMentorshipRequest } from "@/app/actions/mentorship";
import { MENTORSHIP_TOPICS } from "@/lib/mentorship-constants";

export interface MentorDetailsData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  alumniVerified: boolean;
  company: string;
  position: string;
  department: string;
  careerField: string;
  yearsOfExperience: number | null;
  bio: string;
  expertise: string;
  skills: string;
  topics: string[];
  preferredSessionType: string;
  availableDays: string[];
  communicationMethod: string;
  availabilityNote: string;
  academicExpertise?: string;
  researchInterests?: string;
  teachingAreas?: string;
  academicGuidanceTopics?: string;
  isAvailable: boolean;
  activeMenteesCount: number;
  maxCapacity: number;
  existingRequest: {
    id: string;
    status: string;
    topic: string;
    createdAt: string;
  } | null;
}

export function StudentMentorDetailsView({
  mentor,
  initialOpenRequest = false,
}: {
  mentor: MentorDetailsData;
  initialOpenRequest?: boolean;
}) {
  const [showRequestModal, setShowRequestModal] = useState(initialOpenRequest);
  const [selectedTopic, setSelectedTopic] = useState(mentor.topics[0] || "Career Guidance");
  const [customTopicText, setCustomTopicText] = useState("");
  const [careerGoals, setCareerGoals] = useState("");
  const [reason, setReason] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [sessionFormat, setSessionFormat] = useState(mentor.preferredSessionType || "ONLINE");
  const [preferredAvailability, setPreferredAvailability] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [requestStatus, setRequestStatus] = useState<string | null>(
    mentor.existingRequest ? mentor.existingRequest.status : null
  );
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const finalTopic = selectedTopic === "__CUSTOM__" ? customTopicText.trim() : selectedTopic.trim();
    if (!finalTopic) {
      setFeedback({
        type: "error",
        message: "Please choose or enter a valid mentorship topic.",
      });
      return;
    }

    startTransition(async () => {
      const res = await sendMentorshipRequest({
        mentorId: mentor.id,
        topic: finalTopic,
        careerGoals,
        reason,
        introduction,
        sessionFormat,
        preferredAvailability,
        message,
      });

      if (res.success) {
        setRequestStatus("PENDING");
        setShowRequestModal(false);
        setFeedback({
          type: "success",
          message: "Mentorship request sent successfully! You will be notified when the mentor responds.",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to submit mentorship request.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Back to Directory Button */}
      <div>
        <Link
          href="/student/mentors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink transition"
        >
          <ArrowLeft size={14} />
          Back to Find a Mentor
        </Link>
      </div>

      {/* Feedback Alert */}
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

      {/* Top Profile Hero Card */}
      <Card className="relative overflow-hidden p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar name={mentor.name} src={mentor.image} size={80} />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-ink">
                  {mentor.name}
                </h1>
                {mentor.role === "ALUMNI" && mentor.alumniVerified && (
                  <span title="Verified ULAB Alumni" className="inline-flex">
                    <ShieldCheck
                      size={20}
                      className="text-emerald-600"
                    />
                  </span>
                )}
                <Badge tone={mentor.role === "TEACHER" ? "lilac" : "gold"}>
                  {mentor.role === "TEACHER" ? "Faculty Mentor" : "Verified Alumni Mentor"}
                </Badge>
              </div>

              <p className="text-sm font-semibold text-ink-soft">
                {mentor.position} {mentor.company && `at ${mentor.company}`}
              </p>

              <p className="text-xs text-ink-soft">
                Department: <strong className="text-ink">{mentor.department}</strong>
                {mentor.careerField && ` · Field: ${mentor.careerField}`}
              </p>

              {/* Status and Capacity Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                {mentor.isAvailable ? (
                  <Badge tone="sage">● Available for Mentorship</Badge>
                ) : (
                  <Badge tone="gray">● Currently Unavailable</Badge>
                )}

                <span className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-semibold text-ink-soft border border-mist/80 dark:border-white/5 dark:bg-white/5">
                  Capacity: {mentor.activeMenteesCount} / {mentor.maxCapacity} active mentees
                </span>

                {mentor.yearsOfExperience !== null && mentor.yearsOfExperience > 0 && (
                  <span className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-semibold text-ink-soft border border-mist/80 dark:border-white/5 dark:bg-white/5">
                    {mentor.yearsOfExperience}+ Years Experience
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="shrink-0">
            {requestStatus === "PENDING" ? (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                <div className="flex items-center justify-center gap-1.5 font-bold">
                  <Clock size={14} className="text-amber-600 animate-pulse" />
                  <span>Request Sent (Pending Review)</span>
                </div>
                <Link
                  href="/student/mentorship"
                  className="mt-1 block text-[11px] underline hover:no-underline text-ink-soft"
                >
                  Track in My Requests →
                </Link>
              </div>
            ) : requestStatus === "ACCEPTED" || requestStatus === "SCHEDULED" ? (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-center text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
                <p className="font-bold">Active Mentor ({requestStatus})</p>
                <Link
                  href="/student/my-mentors"
                  className="mt-1 block text-[11px] underline hover:no-underline font-semibold"
                >
                  View in My Mentors →
                </Link>
              </div>
            ) : mentor.isAvailable ? (
              <Button
                type="button"
                onClick={() => setShowRequestModal(true)}
                className="w-full sm:w-auto bg-ulab py-2.5 px-6 text-sm text-white hover:bg-ulab-deep shadow-soft"
              >
                Request Mentorship
              </Button>
            ) : (
              <Button
                type="button"
                disabled
                className="w-full sm:w-auto bg-slate-300 py-2.5 px-6 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              >
                Fully Booked
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Content Grid: Left 2 Cols (Bio, Skills, Academic), Right Col (Availability, Format) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Professional Introduction */}
          <Card className="p-6">
            <h2 className="font-display text-sm font-bold text-ink border-b border-mist/70 pb-3 dark:border-white/10">
              Professional Introduction & Background
            </h2>
            <p className="mt-4 text-xs leading-relaxed text-ink-soft whitespace-pre-line">
              {mentor.bio ||
                `${mentor.name} is a dedicated ${
                  mentor.role === "TEACHER" ? "faculty member" : "alumni mentor"
                } at ULAB providing 1-on-1 guidance for student career growth.`}
            </p>
          </Card>

          {/* Mentorship Topics Offered */}
          <Card className="p-6">
            <h2 className="font-display text-sm font-bold text-ink border-b border-mist/70 pb-3 dark:border-white/10">
              Offered Mentorship Topics
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {mentor.topics.map((t) => (
                <span
                  key={t}
                  className="rounded-xl bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  ✓ {t}
                </span>
              ))}
            </div>
          </Card>

          {/* Expertise & Technical Skills */}
          <Card className="p-6">
            <h2 className="font-display text-sm font-bold text-ink border-b border-mist/70 pb-3 dark:border-white/10">
              Areas of Expertise & Skills
            </h2>
            <div className="mt-4 space-y-3 text-xs">
              {mentor.expertise && (
                <div>
                  <span className="font-bold text-ink">Specialized Expertise:</span>
                  <p className="mt-1 text-ink-soft leading-relaxed">{mentor.expertise}</p>
                </div>
              )}
              {mentor.skills && (
                <div>
                  <span className="font-bold text-ink">Technical & Professional Skills:</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {mentor.skills.split(",").map((s) => (
                      <Badge key={s} tone="gray">
                        {s.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Faculty Academic Guidance (If teacher) */}
          {mentor.role === "TEACHER" && (
            <Card className="p-6 border-purple-200 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/10">
              <div className="flex items-center gap-2 border-b border-purple-200/60 pb-3 dark:border-purple-900/30">
                <GraduationCap size={18} className="text-purple-700 dark:text-purple-300" />
                <h2 className="font-display text-sm font-bold text-ink">
                  Faculty Academic & Research Guidance
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-xs">
                {mentor.academicExpertise && (
                  <div>
                    <span className="font-bold text-ink">Academic Expertise:</span>
                    <p className="mt-0.5 text-ink-soft">{mentor.academicExpertise}</p>
                  </div>
                )}
                {mentor.researchInterests && (
                  <div>
                    <span className="font-bold text-ink">Research Interests:</span>
                    <p className="mt-0.5 text-ink-soft">{mentor.researchInterests}</p>
                  </div>
                )}
                {mentor.teachingAreas && (
                  <div>
                    <span className="font-bold text-ink">Teaching Areas:</span>
                    <p className="mt-0.5 text-ink-soft">{mentor.teachingAreas}</p>
                  </div>
                )}
                {mentor.academicGuidanceTopics && (
                  <div>
                    <span className="font-bold text-ink">Thesis & Advising Guidance Topics:</span>
                    <p className="mt-0.5 text-ink-soft">{mentor.academicGuidanceTopics}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Col: Session Logistics & Availability */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-sm font-bold text-ink border-b border-mist/70 pb-3 dark:border-white/10">
              Session Format & Scheduling
            </h2>
            <div className="mt-4 space-y-4 text-xs">
              <div>
                <span className="font-semibold text-ink-soft">Session Format:</span>
                <p className="mt-1 font-bold text-ink flex items-center gap-1.5">
                  <Video size={14} className="text-ulab" />
                  {mentor.preferredSessionType}
                </p>
              </div>

              <div>
                <span className="font-semibold text-ink-soft">Preferred Communication Method:</span>
                <p className="mt-1 font-bold text-ink">
                  {mentor.communicationMethod.replace(/_/g, " ")}
                </p>
              </div>

              <div>
                <span className="font-semibold text-ink-soft">Available Days:</span>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {mentor.availableDays.map((d) => (
                    <Badge key={d} tone="blue">
                      {d}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Parsed Timing, Hours & Notes */}
              {(() => {
                const note = mentor.availabilityNote || "";
                const timeMatch = note.match(/Preferred Time:\s*([^|]+)/i);
                const hoursMatch = note.match(/Hours:\s*([^|]+)/i);
                const cleanNote = note
                  .replace(/Preferred Time:\s*[^|]+(\||\b)/i, "")
                  .replace(/Hours:\s*[^|]+(\||\b)/i, "")
                  .trim();

                return (
                  <>
                    {timeMatch && (
                      <div>
                        <span className="font-semibold text-ink-soft">Preferred Time Slots:</span>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {timeMatch[1].split(",").map((s) => s.trim()).filter(Boolean).map((slot) => (
                            <Badge key={slot} tone="sage">
                              {slot}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {hoursMatch && (
                      <div>
                        <span className="font-semibold text-ink-soft">Available Hours (সময়):</span>
                        <p className="mt-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          ⏰ {hoursMatch[1].trim()}
                        </p>
                      </div>
                    )}
                    {cleanNote && (
                      <div>
                        <span className="font-semibold text-ink-soft">Scheduling Notes:</span>
                        <p className="mt-1 rounded-xl bg-paper/60 p-2.5 text-ink-soft leading-relaxed dark:bg-white/5">
                          {cleanNote}
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="mt-6 border-t border-mist/70 pt-4 dark:border-white/10">
              {requestStatus === "PENDING" ? (
                <Button
                  type="button"
                  disabled
                  className="w-full bg-amber-100/90 text-amber-900 border border-amber-300/80 py-2 text-xs font-semibold cursor-not-allowed dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60"
                >
                  <Clock size={13} className="mr-1.5 inline" />
                  Request Sent (Pending Review)
                </Button>
              ) : requestStatus === "ACCEPTED" || requestStatus === "SCHEDULED" ? (
                <Link
                  href="/student/my-mentors"
                  className="block w-full text-center rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2 text-xs font-semibold text-white shadow-soft"
                >
                  Active Mentor — View in My Mentors →
                </Link>
              ) : mentor.isAvailable ? (
                <Button
                  type="button"
                  onClick={() => setShowRequestModal(true)}
                  className="w-full bg-ulab py-2 text-xs text-white hover:bg-ulab-deep shadow-soft"
                >
                  Send Mentorship Request
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled
                  className="w-full bg-slate-200 text-slate-500 py-2 text-xs cursor-not-allowed dark:bg-slate-800 dark:text-slate-400"
                >
                  Mentor Fully Booked
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* REQUEST MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-mist/80 bg-surface p-6 shadow-2xl dark:border-white/10">
            <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Compass size={18} className="text-ulab" />
                <h3 className="font-bold text-ink">Request Mentorship from {mentor.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="rounded-lg p-1 text-ink-soft hover:bg-paper"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="mt-4 max-h-[75vh] overflow-y-auto pr-1 space-y-3.5">
              {/* 1. Mentorship Topic */}
              <div>
                <label className="text-xs font-semibold text-ink">
                  1. Mentorship Topic <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs font-semibold text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                >
                  <optgroup label="Mentor's Offered Topics">
                    {mentor.topics.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="All Common Mentorship Topics">
                    {MENTORSHIP_TOPICS.filter((t) => !mentor.topics.includes(t)).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </optgroup>
                  <option value="__CUSTOM__">✍️ Custom Topic (অন্য যেকোনো বিষয় লিখুন)...</option>
                </select>

                {selectedTopic === "__CUSTOM__" && (
                  <div className="mt-2">
                    <label className="text-[11px] font-semibold text-ink-soft">
                      Type Your Custom Mentorship Topic <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customTopicText}
                      onChange={(e) => setCustomTopicText(e.target.value)}
                      placeholder="e.g. Flutter Development, Research Methodology, GRE/IELTS, etc."
                      className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-1.5 text-xs text-ink placeholder:text-ink-soft/60 focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                )}
              </div>

              {/* 2. Career Goal */}
              <div>
                <label className="text-xs font-semibold text-ink">
                  2. Career Goal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={careerGoals}
                  onChange={(e) => setCareerGoals(e.target.value)}
                  placeholder="e.g. Become a Software Engineer at a leading global tech company or pursue higher studies."
                  className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                />
              </div>

              {/* 3. Reason for Request */}
              <div>
                <label className="text-xs font-semibold text-ink">
                  3. Reason for Request <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. I admire your experience at Brain Station 23 and would value your feedback on my tech stack and interview prep."
                  className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 p-2.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                />
              </div>

              {/* 4. Short Introduction */}
              <div>
                <label className="text-xs font-semibold text-ink">
                  4. Short Introduction <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={introduction}
                  onChange={(e) => setIntroduction(e.target.value)}
                  placeholder="e.g. I am a 7th semester CSE student passionate about distributed systems and cloud engineering."
                  className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 p-2.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                />
              </div>

              {/* 5. Preferred Session Type */}
              <div>
                <label className="text-xs font-semibold text-ink">
                  5. Preferred Session Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={sessionFormat}
                  onChange={(e) => setSessionFormat(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs font-semibold text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                >
                  <option value="ONLINE">Online Virtual Meeting (Google Meet / Zoom)</option>
                  <option value="IN_PERSON">In-Person (ULAB Campus)</option>
                  <option value="HYBRID">Flexible / Hybrid</option>
                </select>
              </div>

              {/* 6. Preferred Availability */}
              <div>
                <label className="text-xs font-semibold text-ink">
                  6. Preferred Availability (Days & Time Slots)
                </label>
                <input
                  type="text"
                  value={preferredAvailability}
                  onChange={(e) => setPreferredAvailability(e.target.value)}
                  placeholder="e.g. Friday afternoons, or Weekday evenings after 7 PM"
                  className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                />
              </div>

              {/* 7. Optional Additional Message */}
              <div>
                <label className="text-xs font-semibold text-ink">
                  7. Optional Additional Message / Specific Questions
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any portfolio / GitHub links, resume notes, or specific topics you want to prioritize."
                  className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 p-2.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-mist/70 pt-3.5 dark:border-white/10">
                <Button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="bg-paper text-xs text-ink hover:bg-paper/80"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!reason.trim() || !introduction.trim() || isPending}
                  className="bg-ulab text-xs text-white hover:bg-ulab-deep shadow-soft"
                >
                  {isPending ? "Submitting Request..." : "Submit Mentorship Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
