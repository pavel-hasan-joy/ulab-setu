"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Eye,
  Save,
  Briefcase,
  GraduationCap,
  Building,
  Mail,
  AlertCircle,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import {
  toggleMentorActivation,
  updateCareerMentorProfile,
  acceptMentorshipRequest,
  declineMentorshipRequest,
  scheduleMentorshipSession,
  completeMentorshipSession,
  type MentorshipTopic,
  type MentorAvailabilityStatus,
} from "@/app/actions/mentorship";
import { MENTORSHIP_TOPICS } from "@/lib/mentorship-constants";
import { Avatar, Badge, Button, cn, timeAgo } from "./ui";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export interface MentorProfileItem {
  id?: string;
  userId: string;
  isActive: boolean;
  status: MentorAvailabilityStatus;
  bio?: string | null;
  careerField?: string | null;
  company?: string | null;
  position?: string | null;
  department?: string | null;
  expertise?: string | null;
  skills?: string | null;
  topics?: string | null;
  yearsOfExperience?: number | null;
  preferredSessionType?: string | null;
  availableDays?: string | null;
  communicationMethod?: string | null;
  maxMentees: number;
  availabilityNote?: string | null;
  // Faculty fields
  academicExpertise?: string | null;
  researchInterests?: string | null;
  teachingAreas?: string | null;
  academicGuidanceTopics?: string | null;
}

export interface MentorshipRequestRecord {
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

interface CareerMentorSettingsViewProps {
  initialProfile: MentorProfileItem;
  initialRequests: MentorshipRequestRecord[];
  userRole: "ALUMNI" | "TEACHER" | "ADMIN";
  userName: string;
  userEmail: string;
  userImage?: string | null;
  activeMenteesCount: number;
  completedSessionsCount: number;
}

export function CareerMentorSettingsView({
  initialProfile,
  initialRequests,
  userRole,
  userName,
  userEmail,
  userImage,
  activeMenteesCount: initialActiveMentees,
  completedSessionsCount: initialCompleted,
}: CareerMentorSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"SETTINGS" | "REQUESTS">("SETTINGS");
  const [profile, setProfile] = useState<MentorProfileItem>(initialProfile);
  const [requests, setRequests] = useState<MentorshipRequestRecord[]>(initialRequests);
  const [activeMenteesCount, setActiveMenteesCount] = useState(initialActiveMentees);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(initialCompleted);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Form State
  const [isActive, setIsActive] = useState(profile.isActive);
  const [availabilityStatus, setAvailabilityStatus] = useState<MentorAvailabilityStatus>(profile.status);
  const [bio, setBio] = useState(profile.bio || "");
  const [careerField, setCareerField] = useState(profile.careerField || "");
  const [company, setCompany] = useState(profile.company || "");
  const [position, setPosition] = useState(profile.position || "");
  const [department, setDepartment] = useState(profile.department || "");
  const [expertise, setExpertise] = useState(profile.expertise || "");
  const [skills, setSkills] = useState(profile.skills || "");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    profile.topics ? profile.topics.split(",").map((s) => s.trim()).filter(Boolean) : []
  );
  const [yearsOfExperience, setYearsOfExperience] = useState<string>(
    profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined
      ? String(profile.yearsOfExperience)
      : ""
  );
  const [preferredSessionType, setPreferredSessionType] = useState(profile.preferredSessionType || "ONLINE");
  const [selectedDays, setSelectedDays] = useState<string[]>(
    profile.availableDays ? profile.availableDays.split(",").map((s) => s.trim()).filter(Boolean) : ["Sunday", "Tuesday", "Thursday"]
  );
  const [communicationMethod, setCommunicationMethod] = useState(profile.communicationMethod || "GOOGLE_MEET");
  const [maxMentees, setMaxMentees] = useState(profile.maxMentees || 3);
  const [availabilityNote, setAvailabilityNote] = useState(profile.availabilityNote || "");

  // Faculty specific fields
  const [academicExpertise, setAcademicExpertise] = useState(profile.academicExpertise || "");
  const [researchInterests, setResearchInterests] = useState(profile.researchInterests || "");
  const [teachingAreas, setTeachingAreas] = useState(profile.teachingAreas || "");
  const [academicGuidanceTopics, setAcademicGuidanceTopics] = useState(profile.academicGuidanceTopics || "");

  // UI feedback states
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Modals for Request Queue
  const [schedulingReq, setSchedulingReq] = useState<MentorshipRequestRecord | null>(null);
  const [scheduleDatetime, setScheduleDatetime] = useState("");
  const [scheduleLink, setScheduleLink] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  const [completingReq, setCompletingReq] = useState<MentorshipRequestRecord | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  const [decliningReq, setDecliningReq] = useState<MentorshipRequestRecord | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [isDeclining, setIsDeclining] = useState(false);

  // 1. One-click Toggle Activation
  const handleToggleActivation = () => {
    const nextState = !isActive;
    setIsActive(nextState);
    setFeedback(null);

    startTransition(async () => {
      const res = await toggleMentorActivation(nextState);
      if (res.success) {
        setAvailabilityStatus(res.status);
        setFeedback({
          type: "success",
          message: res.message || "Mentorship activation updated successfully.",
        });
      } else {
        setIsActive(!nextState); // Rollback
        setFeedback({
          type: "error",
          message: res.error || "Failed to update mentor activation status.",
        });
      }
    });
  };

  // 2. Save Comprehensive Mentor Profile
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await updateCareerMentorProfile({
        isActive,
        status: availabilityStatus,
        bio,
        careerField,
        company,
        position,
        department,
        expertise,
        skills,
        topics: selectedTopics,
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience, 10) : undefined,
        preferredSessionType,
        availableDays: selectedDays,
        communicationMethod,
        maxMentees: Number(maxMentees),
        availabilityNote,
        academicExpertise,
        researchInterests,
        teachingAreas,
        academicGuidanceTopics,
      });

      if (res.success) {
        setAvailabilityStatus(res.computedStatus);
        setProfile(res.profile as any);
        setFeedback({
          type: "success",
          message: "Career Mentor Profile successfully saved and updated.",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to save mentor profile.",
        });
      }
    });
  };

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Request Management Handlers
  const handleAccept = async (id: string) => {
    const res = await acceptMentorshipRequest(id);
    if (res.success) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "ACCEPTED", updatedAt: new Date().toISOString() } : r))
      );
    }
  };

  const handleDeclineSubmit = async () => {
    if (!decliningReq) return;
    setIsDeclining(true);
    const res = await declineMentorshipRequest(decliningReq.id, declineReason);
    setIsDeclining(false);
    if (res.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === decliningReq.id
            ? { ...r, status: "DECLINED", mentorNotes: declineReason || null, updatedAt: new Date().toISOString() }
            : r
        )
      );
      setDecliningReq(null);
      setDeclineReason("");
    }
  };

  const handleScheduleSubmit = async () => {
    if (!schedulingReq || !scheduleDatetime) return;
    setIsScheduling(true);
    const res = await scheduleMentorshipSession(schedulingReq.id, {
      scheduledAt: scheduleDatetime,
      sessionLink: scheduleLink,
      note: scheduleNote,
    });
    setIsScheduling(false);
    if (res.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === schedulingReq.id
            ? {
                ...r,
                status: "SCHEDULED",
                scheduledAt: new Date(scheduleDatetime).toISOString(),
                sessionLink: scheduleLink || null,
                mentorNotes: scheduleNote || r.mentorNotes,
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
      setSchedulingReq(null);
      setScheduleDatetime("");
      setScheduleLink("");
      setScheduleNote("");
    }
  };

  const handleCompleteSubmit = async () => {
    if (!completingReq) return;
    setIsCompleting(true);
    const res = await completeMentorshipSession(completingReq.id, completeNotes);
    setIsCompleting(false);
    if (res.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === completingReq.id
            ? {
                ...r,
                status: "COMPLETED",
                completedAt: new Date().toISOString(),
                mentorNotes: completeNotes || r.mentorNotes,
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
      setCompletedSessionsCount((c) => c + 1);
      setActiveMenteesCount((c) => Math.max(c - 1, 0));
      setCompletingReq(null);
      setCompleteNotes("");
    }
  };

  const filteredRequests = requests.filter((r) =>
    statusFilter === "ALL" ? true : r.status === statusFilter
  );

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* 1. MASTER BANNER: BECOME A CAREER MENTOR ACTIVATION */}
      <div className="relative overflow-hidden rounded-3xl border border-mist/80 bg-gradient-to-br from-emerald-50/90 via-surface to-gold-wash/40 p-6 shadow-sm dark:border-white/10 dark:from-emerald-950/30 dark:via-surface dark:to-amber-950/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-soft">
                <Compass size={18} />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-ink">
                Become a Career Mentor
              </h2>
              <Badge tone={userRole === "TEACHER" ? "lilac" : "gold"}>
                {userRole === "TEACHER" ? "Faculty Mentor" : "Verified Alumni Mentor"}
              </Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              Guide students and young professionals across ULAB. Share industry wisdom, conduct resume reviews,
              and offer technical career roadmaps. When Mentor mode is enabled, your profile becomes discoverable in the
              mentorship directory.
            </p>

            {/* Status Pills and Metrics */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2 rounded-xl border border-mist/80 bg-paper/70 px-3 py-1.5 dark:border-white/5 dark:bg-white/5">
                <span className="text-ink-soft">Status:</span>
                {!isActive ? (
                  <Badge tone="gray">Inactive (OFF)</Badge>
                ) : availabilityStatus === "AVAILABLE" ? (
                  <Badge tone="sage">● Available & Discoverable</Badge>
                ) : availabilityStatus === "FULLY_BOOKED" ? (
                  <Badge tone="lilac">● Fully Booked</Badge>
                ) : (
                  <Badge tone="gold">● Temporarily Paused</Badge>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-mist/80 bg-paper/70 px-3 py-1.5 dark:border-white/5 dark:bg-white/5">
                <span className="text-ink-soft">Active Mentees:</span>
                <span className="font-bold text-ink">
                  {activeMenteesCount} / {maxMentees}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-mist/80 bg-paper/70 px-3 py-1.5 dark:border-white/5 dark:bg-white/5">
                <span className="text-ink-soft">Completed Sessions:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {completedSessionsCount}
                </span>
              </div>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex flex-col items-start gap-2.5 rounded-2xl border border-mist/80 bg-surface/90 p-4 shadow-soft lg:items-end dark:border-white/10">
            <span className="text-xs font-semibold text-ink">Mentor Discovery Mode</span>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold ${isActive ? "text-emerald-700 dark:text-emerald-400" : "text-ink-soft"}`}>
                {isActive ? "ACTIVE (ON)" : "PAUSED (OFF)"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={handleToggleActivation}
                disabled={isPending}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActive ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-ink-soft text-left lg:text-right">
              {isActive
                ? "Students can send mentorship requests."
                : "New requests blocked; active sessions remain."}
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Alert Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. NAVIGATION TABS: MENTOR PROFILE SETTINGS VS INQUIRIES QUEUE */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist/80 pb-3 dark:border-white/10">
        <div className="inline-flex rounded-2xl border border-mist/80 bg-paper/60 p-1.5 dark:border-white/5 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setActiveTab("SETTINGS")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "SETTINGS"
                ? "bg-ulab text-white shadow-soft"
                : "text-ink-soft hover:bg-surface hover:text-ink"
            }`}
          >
            <Settings2 size={15} />
            <span>Mentor Profile & Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("REQUESTS")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "REQUESTS"
                ? "bg-ulab text-white shadow-soft"
                : "text-ink-soft hover:bg-surface hover:text-ink"
            }`}
          >
            <MessageSquare size={15} />
            <span>Mentorship Requests</span>
            {pendingCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === "SETTINGS" && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-1.5 border border-mist/80 bg-paper/60 text-xs text-ink hover:bg-paper"
            >
              <Eye size={14} />
              Preview Profile
            </Button>
            <Button
              type="button"
              onClick={() => handleSaveProfile()}
              disabled={isPending}
              className="flex items-center gap-1.5 bg-ulab text-xs text-white hover:bg-ulab-deep shadow-soft"
            >
              <Save size={14} />
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* TAB 1: MENTOR PROFILE SETTINGS */}
      {activeTab === "SETTINGS" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: Main Fields */}
            <div className="space-y-6 lg:col-span-2">
              {/* Professional Introduction Card */}
              <div className="rounded-3xl border border-mist/80 bg-surface p-6 shadow-soft dark:border-white/10">
                <div className="flex items-center gap-2 border-b border-mist/70 pb-3 dark:border-white/10">
                  <span className="grid size-7 place-items-center rounded-lg bg-sky/30 text-ulab-deep">
                    <User size={16} />
                  </span>
                  <h3 className="font-display text-sm font-bold text-ink">
                    Professional Introduction & Background
                  </h3>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-ink">
                      Mentor Bio / Statement
                    </label>
                    <p className="text-[11px] text-ink-soft">
                      Introduce your background, career philosophy, and what mentees can expect.
                    </p>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="e.g. Lead Software Architect with 8+ years building enterprise systems. Passionate about helping ULAB students prepare for technical interviews and cloud architecture careers."
                      className="mt-1.5 w-full rounded-2xl border border-mist/80 bg-paper/60 p-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-ink">Career Field / Domain</label>
                      <input
                        type="text"
                        value={careerField}
                        onChange={(e) => setCareerField(e.target.value)}
                        placeholder="e.g. Software & Cloud Engineering"
                        className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-ink">Years of Experience</label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={yearsOfExperience}
                        onChange={(e) => setYearsOfExperience(e.target.value)}
                        placeholder="e.g. 6"
                        className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-ink">Current Company / Organization</label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Brain Station 23 / ULAB"
                        className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-ink">Current Position / Title</label>
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="e.g. Senior Software Architect"
                        className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-ink">Academic Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Department of Computer Science and Engineering (CSE)"
                      className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                </div>
              </div>

              {/* Mentorship Topics & Areas of Expertise */}
              <div className="rounded-3xl border border-mist/80 bg-surface p-6 shadow-soft dark:border-white/10">
                <div className="flex items-center gap-2 border-b border-mist/70 pb-3 dark:border-white/10">
                  <span className="grid size-7 place-items-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <Sparkles size={16} />
                  </span>
                  <h3 className="font-display text-sm font-bold text-ink">
                    Mentorship Topics & Technical Skills
                  </h3>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-ink">
                      Offered Mentorship Topics (Select all applicable)
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {MENTORSHIP_TOPICS.map((topic) => {
                        const isSelected = selectedTopics.includes(topic);
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => toggleTopic(topic)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                              isSelected
                                ? "bg-emerald-700 text-white shadow-soft"
                                : "border border-mist/80 bg-paper/60 text-ink-soft hover:bg-paper hover:text-ink dark:border-white/10 dark:bg-white/5"
                            }`}
                          >
                            {isSelected ? "✓ " : "+ "}
                            {topic}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-ink">Areas of Expertise</label>
                    <input
                      type="text"
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      placeholder="e.g. Distributed Systems, Frontend Architecture, System Design, DevOps"
                      className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-ink">Relevant Technical & Professional Skills</label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="e.g. React, Next.js, TypeScript, PostgreSQL, Docker, AWS"
                      className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                </div>
              </div>

              {/* Conditional Faculty Academic Section */}
              {userRole === "TEACHER" && (
                <div className="rounded-3xl border border-purple-200 bg-purple-50/40 p-6 shadow-soft dark:border-purple-900/40 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2 border-b border-purple-200/60 pb-3 dark:border-purple-900/30">
                    <span className="grid size-7 place-items-center rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                      <GraduationCap size={16} />
                    </span>
                    <h3 className="font-display text-sm font-bold text-ink">
                      Faculty Academic & Research Guidance Fields
                    </h3>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-ink">Academic Expertise</label>
                        <input
                          type="text"
                          value={academicExpertise}
                          onChange={(e) => setAcademicExpertise(e.target.value)}
                          placeholder="e.g. Artificial Intelligence, NLP, Data Mining"
                          className="mt-1 w-full rounded-xl border border-purple-200 bg-surface px-3 py-2 text-xs text-ink focus:border-purple-600 focus:outline-none dark:border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink">Research Interests</label>
                        <input
                          type="text"
                          value={researchInterests}
                          onChange={(e) => setResearchInterests(e.target.value)}
                          placeholder="e.g. Deep Learning, Bengali NLP, Computer Vision"
                          className="mt-1 w-full rounded-xl border border-purple-200 bg-surface px-3 py-2 text-xs text-ink focus:border-purple-600 focus:outline-none dark:border-white/10"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-ink">Teaching Areas</label>
                        <input
                          type="text"
                          value={teachingAreas}
                          onChange={(e) => setTeachingAreas(e.target.value)}
                          placeholder="e.g. Algorithms, Data Structures, Operating Systems"
                          className="mt-1 w-full rounded-xl border border-purple-200 bg-surface px-3 py-2 text-xs text-ink focus:border-purple-600 focus:outline-none dark:border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink">Academic Guidance Topics</label>
                        <input
                          type="text"
                          value={academicGuidanceTopics}
                          onChange={(e) => setAcademicGuidanceTopics(e.target.value)}
                          placeholder="e.g. Undergraduate Thesis, Conference Papers, Master's Abroad"
                          className="mt-1 w-full rounded-xl border border-purple-200 bg-surface px-3 py-2 text-xs text-ink focus:border-purple-600 focus:outline-none dark:border-white/10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Mentorship Preferences & Capacity */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-mist/80 bg-surface p-6 shadow-soft dark:border-white/10">
                <h3 className="font-display text-sm font-bold text-ink border-b border-mist/70 pb-3 dark:border-white/10">
                  Availability & Session Preferences
                </h3>

                <div className="mt-4 space-y-4">
                  {/* Availability Status */}
                  <div>
                    <label className="text-xs font-semibold text-ink">Availability Mode</label>
                    <select
                      value={availabilityStatus}
                      onChange={(e) => setAvailabilityStatus(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs font-semibold text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                    >
                      <option value="AVAILABLE">Available for Requests</option>
                      <option value="TEMPORARILY_UNAVAILABLE">Temporarily Unavailable (Paused)</option>
                      <option value="FULLY_BOOKED">Fully Booked</option>
                    </select>
                  </div>

                  {/* Maximum Active Mentees */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-ink">Maximum Active Mentees</label>
                      <span className="font-mono text-xs font-bold text-ulab">{maxMentees}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={maxMentees}
                      onChange={(e) => setMaxMentees(Number(e.target.value))}
                      className="mt-2 w-full accent-ulab"
                    />
                    <p className="mt-1 text-[11px] text-ink-soft">
                      Once active requests reach {maxMentees}, your profile will automatically switch to Fully Booked.
                    </p>
                  </div>

                  {/* Preferred Session Type */}
                  <div>
                    <label className="text-xs font-semibold text-ink">Preferred Session Format</label>
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-center">
                      {[
                        { key: "ONLINE", label: "Online" },
                        { key: "IN_PERSON", label: "In-Person" },
                        { key: "HYBRID", label: "Hybrid" },
                      ].map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setPreferredSessionType(t.key)}
                          className={`rounded-xl py-2 text-xs font-semibold transition ${
                            preferredSessionType === t.key
                              ? "bg-ulab text-white shadow-soft"
                              : "border border-mist/80 bg-paper/60 text-ink-soft hover:bg-paper dark:border-white/10 dark:bg-white/5"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Available Days */}
                  <div>
                    <label className="text-xs font-semibold text-ink">Available Days</label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {WEEKDAYS.map((day) => {
                        const isDaySelected = selectedDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                              isDaySelected
                                ? "bg-emerald-700 text-white"
                                : "border border-mist/80 bg-paper/60 text-ink-soft hover:bg-paper dark:border-white/10 dark:bg-white/5"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preferred Communication Method */}
                  <div>
                    <label className="text-xs font-semibold text-ink">Communication Method</label>
                    <select
                      value={communicationMethod}
                      onChange={(e) => setCommunicationMethod(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs font-semibold text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                    >
                      <option value="GOOGLE_MEET">Google Meet</option>
                      <option value="ZOOM">Zoom Video</option>
                      <option value="IN_PERSON">In-Person (ULAB Campus)</option>
                      <option value="EMAIL">Email & Chat</option>
                    </select>
                  </div>

                  {/* Availability Note */}
                  <div>
                    <label className="text-xs font-semibold text-ink">Availability & Timing Note</label>
                    <textarea
                      rows={2}
                      value={availabilityNote}
                      onChange={(e) => setAvailabilityNote(e.target.value)}
                      placeholder="e.g. Free after 7:00 PM on weekdays or Saturday afternoons."
                      className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 p-2.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                </div>

                <div className="mt-6 border-t border-mist/70 pt-4 dark:border-white/10">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex w-full items-center justify-center gap-1.5 bg-ulab text-xs text-white hover:bg-ulab-deep shadow-soft"
                  >
                    <Save size={14} />
                    {isPending ? "Saving..." : "Save Mentor Settings"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: REQUESTS & SESSIONS QUEUE */}
      {activeTab === "REQUESTS" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-base font-bold text-ink">
              Mentorship Inquiries & Sessions ({filteredRequests.length})
            </h3>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-1">
              {["ALL", "PENDING", "ACCEPTED", "SCHEDULED", "COMPLETED", "DECLINED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                    statusFilter === st
                      ? "bg-ulab text-white shadow-soft"
                      : "border border-mist/80 bg-paper/60 text-ink-soft hover:bg-paper hover:text-ink dark:border-white/10 dark:bg-white/5"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="rounded-3xl border border-mist/80 bg-surface p-12 text-center dark:border-white/10">
              <Compass size={36} className="mx-auto text-ink-soft/40" />
              <h4 className="mt-3 font-display text-sm font-bold text-ink">No requests found</h4>
              <p className="mt-1 text-xs text-ink-soft">
                {statusFilter === "ALL"
                  ? "You have not received any mentorship inquiries yet. Keep your mentor mode active to be discovered!"
                  : `No requests with status: ${statusFilter}.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col gap-4 rounded-3xl border border-mist/80 bg-surface p-5 shadow-soft sm:flex-row sm:items-start sm:justify-between dark:border-white/10"
                >
                  <div className="flex items-start gap-3.5">
                    <Avatar name={req.student.name} src={req.student.image} size={40} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink">{req.student.name}</span>
                        <Badge tone="blue">{req.student.department || "Student"}</Badge>
                        <Badge
                          tone={
                            req.status === "PENDING"
                              ? "gold"
                              : req.status === "SCHEDULED"
                              ? "sage"
                              : req.status === "COMPLETED"
                              ? "lilac"
                              : "gray"
                          }
                        >
                          {req.status}
                        </Badge>
                      </div>

                      <p className="mt-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        Topic: {req.topic}
                      </p>
                      <p className="mt-1 text-xs text-ink-soft leading-relaxed max-w-xl">
                        &quot;{req.message}&quot;
                      </p>

                      {req.careerGoals && (
                        <p className="mt-2 text-[11px] text-ink-soft">
                          <span className="font-semibold text-ink">Career Goals:</span> {req.careerGoals}
                        </p>
                      )}

                      {req.scheduledAt && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold dark:text-emerald-400">
                            <Calendar size={13} />
                            {new Date(req.scheduledAt).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                          {req.sessionLink && (
                            <a
                              href={req.sessionLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 font-semibold text-ulab hover:underline"
                            >
                              <Video size={13} />
                              Join Meeting
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {req.status === "PENDING" && (
                      <>
                        <Button
                          type="button"
                          onClick={() => handleAccept(req.id)}
                          className="bg-emerald-700 py-1.5 px-3 text-xs text-white hover:bg-emerald-800"
                        >
                          <Check size={14} className="mr-1" />
                          Accept
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setDecliningReq(req)}
                          className="border border-mist bg-paper/60 py-1.5 px-3 text-xs text-rose-600 hover:bg-paper"
                        >
                          <X size={14} className="mr-1" />
                          Decline
                        </Button>
                      </>
                    )}

                    {req.status === "ACCEPTED" && (
                      <Button
                        type="button"
                        onClick={() => {
                          setSchedulingReq(req);
                          setScheduleDatetime("");
                          setScheduleLink("");
                        }}
                        className="bg-ulab py-1.5 px-3 text-xs text-white hover:bg-ulab-deep"
                      >
                        <Calendar size={14} className="mr-1" />
                        Schedule Session
                      </Button>
                    )}

                    {req.status === "SCHEDULED" && (
                      <Button
                        type="button"
                        onClick={() => {
                          setCompletingReq(req);
                          setCompleteNotes("");
                        }}
                        className="bg-purple-700 py-1.5 px-3 text-xs text-white hover:bg-purple-800"
                      >
                        <CheckCircle2 size={14} className="mr-1" />
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. PREVIEW MODAL */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-mist/80 bg-surface p-6 shadow-2xl dark:border-white/10"
            >
              <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Eye size={18} className="text-ulab" />
                  <h3 className="font-bold text-ink">Mentor Profile Preview (Student View)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="rounded-lg p-1 text-ink-soft hover:bg-paper"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar name={userName} src={userImage} size={56} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-ink">{userName}</h4>
                      <Badge tone={userRole === "TEACHER" ? "lilac" : "gold"}>
                        {userRole === "TEACHER" ? "Faculty" : "Verified Alumni"}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-soft">
                      {position ? `${position} at ${company || "ULAB"}` : department || "ULAB Mentor"}
                    </p>
                    {yearsOfExperience && (
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        {yearsOfExperience}+ Years Experience
                      </p>
                    )}
                  </div>
                </div>

                {bio && (
                  <p className="text-xs text-ink leading-relaxed rounded-2xl bg-paper/60 p-3.5 dark:bg-white/5">
                    &quot;{bio}&quot;
                  </p>
                )}

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-ink">Offered Topics:</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selectedTopics.map((t) => (
                        <Badge key={t} tone="sage">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {expertise && (
                    <p className="text-ink-soft">
                      <span className="font-semibold text-ink">Expertise:</span> {expertise}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 pt-2 text-[11px] text-ink-soft">
                    <span>
                      <strong className="text-ink">Format:</strong> {preferredSessionType}
                    </span>
                    <span>
                      <strong className="text-ink">Channel:</strong> {communicationMethod}
                    </span>
                    <span>
                      <strong className="text-ink">Days:</strong> {selectedDays.join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-mist/70 pt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="bg-ulab text-xs text-white hover:bg-ulab-deep"
                >
                  Close Preview
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MODALS FOR REQUESTS: SCHEDULE, COMPLETE, DECLINE */}
      {/* Schedule Modal */}
      {schedulingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-mist/80 bg-surface p-6 shadow-2xl dark:border-white/10">
            <h3 className="font-bold text-ink">Schedule Mentorship Session</h3>
            <p className="text-xs text-ink-soft mt-1">
              With {schedulingReq.student.name} on &quot;{schedulingReq.topic}&quot;
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink">Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduleDatetime}
                  onChange={(e) => setScheduleDatetime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 p-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink">Meeting Link or Location</label>
                <input
                  type="text"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={scheduleLink}
                  onChange={(e) => setScheduleLink(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 p-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink">Preparation Note for Student</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please bring your updated resume or portfolio link."
                  value={scheduleNote}
                  onChange={(e) => setScheduleNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 p-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setSchedulingReq(null)}
                className="bg-paper text-xs text-ink hover:bg-paper/80"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!scheduleDatetime || isScheduling}
                onClick={handleScheduleSubmit}
                className="bg-ulab text-xs text-white hover:bg-ulab-deep"
              >
                {isScheduling ? "Scheduling..." : "Confirm Schedule"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {completingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-mist/80 bg-surface p-6 shadow-2xl dark:border-white/10">
            <h3 className="font-bold text-ink">Complete Mentorship Session</h3>
            <p className="text-xs text-ink-soft mt-1">
              Finalize session with {completingReq.student.name}
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-ink">Feedback & Recommendations</label>
              <textarea
                rows={3}
                placeholder="Key takeaways, career recommendations, and next steps for the mentee..."
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 p-2.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setCompletingReq(null)}
                className="bg-paper text-xs text-ink hover:bg-paper/80"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isCompleting}
                onClick={handleCompleteSubmit}
                className="bg-emerald-700 text-xs text-white hover:bg-emerald-800"
              >
                {isCompleting ? "Completing..." : "Complete & Send Feedback"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {decliningReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-mist/80 bg-surface p-6 shadow-2xl dark:border-white/10">
            <h3 className="font-bold text-ink">Decline Mentorship Request</h3>
            <p className="text-xs text-ink-soft mt-1">
              Provide a polite reason for {decliningReq.student.name}
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-ink">Reason / Explanation (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. Currently preparing for product release, unable to dedicate time this month."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 p-2.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setDecliningReq(null)}
                className="bg-paper text-xs text-ink hover:bg-paper/80"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isDeclining}
                onClick={handleDeclineSubmit}
                className="bg-rose-600 text-xs text-white hover:bg-rose-700"
              >
                {isDeclining ? "Declining..." : "Decline Request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
