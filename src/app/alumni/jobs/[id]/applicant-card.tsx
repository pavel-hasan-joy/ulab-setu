"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Download,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import type { User as PrismaUser } from "@prisma/client";
import { site } from "@/lib/site";
import { Avatar, Badge, Button, Card, timeAgo } from "@/components/ui";
import { ProfileModal } from "@/components/profile-modal";
import { ApplicantActions } from "./applicant-actions";
import {
  APPLICATION_STATUS_CONFIG,
  formatDhakaDateTime,
  type ApplicationPayload,
  type ApplicationStatus,
} from "@/lib/applications";

type SafeStudent = Omit<PrismaUser, "passwordHash">;

export function ApplicantCard({
  applicationId,
  status,
  createdAt,
  student,
  app,
  base,
  hiringNotes,
  interviewDate,
  interviewTime,
  interviewType,
  interviewLocation,
  interviewMeetingLink,
  interviewMessage,
}: {
  applicationId: string;
  status: string;
  createdAt: Date | string;
  student: SafeStudent;
  app: ApplicationPayload;
  base: string;
  hiringNotes?: string | null;
  interviewDate?: Date | string | null;
  interviewTime?: string | null;
  interviewType?: string | null;
  interviewLocation?: string | null;
  interviewMeetingLink?: string | null;
  interviewMessage?: string | null;
}) {
  const [showProfileModal, setShowProfileModal] = useState(false);

  const phone = app.phone || student.phone;
  const linkedin = app.linkedin || student.linkedin;
  const portfolio = app.portfolio;
  const cvUrl = app.cvData || app.cvUrl;
  const cvName = app.cvFileName || "Student_CV.pdf";
  const studentId = student.studentId || app.studentId;
  const department = student.department || app.department;
  const batch = student.batch || app.batch;

  const statusConfig = APPLICATION_STATUS_CONFIG[status as ApplicationStatus] || APPLICATION_STATUS_CONFIG.APPLIED;

  const skillList = student.skills
    ? student.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const isInterview = status === "INTERVIEW";
  const isRejected = status === "REJECTED";

  return (
    <>
      <Card className="p-5 shadow-soft transition-all hover:border-mist-deep">
        {/* Top Header: Avatar, Name, Status, Actions */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="group relative transition-transform hover:scale-105"
              title="Click to view full profile"
            >
              <Avatar name={student.name} size={54} src={student.image} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="font-display text-lg font-semibold text-ink hover:text-ulab hover:underline text-left transition"
                >
                  {student.name}
                </button>
                {studentId && (
                  <Badge tone="blue" className="text-[11px] font-mono">
                    ID: {studentId}
                  </Badge>
                )}
                <Badge tone={statusConfig.tone}>{statusConfig.label}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-ink-soft">
                {department} {batch ? `• Batch ${batch}` : ""} • Applied {timeAgo(createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowProfileModal(true)}
              className="px-3 py-1.5 text-xs text-ink-soft hover:text-ulab"
            >
              <User size={13} /> Full Profile
            </Button>
            <ApplicantActions
              applicationId={applicationId}
              status={status}
              initialNotes={hiringNotes}
              initialSchedule={{
                interviewDate: interviewDate ? new Date(interviewDate).toISOString() : null,
                interviewTime,
                interviewType,
                interviewLocation,
                interviewMeetingLink,
                interviewMessage,
              }}
            />
          </div>
        </div>

        {/* Interview Schedule Details Banner */}
        {isInterview && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 pb-2 mb-2 dark:border-blue-900/40">
              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
                <Calendar size={15} className="text-blue-600" /> Interview Scheduled (Asia/Dhaka)
              </span>
              <Badge tone="blue">{interviewType || "Scheduled"}</Badge>
            </div>

            <div className="grid gap-2 text-xs sm:grid-cols-2 md:grid-cols-3 text-blue-950 dark:text-blue-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700/80 dark:text-blue-400 block">Date & Time</span>
                <span className="font-semibold">{formatDhakaDateTime(interviewDate) || "Date set"}</span> {interviewTime ? `at ${interviewTime}` : ""}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700/80 dark:text-blue-400 block">Location / Platform</span>
                <span className="font-medium">{interviewLocation || "Venue specified"}</span>
              </div>

              {interviewMeetingLink && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-700/80 dark:text-blue-400 block">Meeting Link</span>
                  <a
                    href={interviewMeetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-ulab font-semibold hover:underline truncate max-w-full"
                  >
                    Open Meeting Link <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {interviewMessage && (
              <div className="mt-2.5 pt-2 border-t border-blue-200/50 text-xs text-blue-900 dark:text-blue-300 dark:border-blue-900/30">
                <span className="font-semibold">Candidate Instructions:</span> &ldquo;{interviewMessage}&rdquo;
              </div>
            )}
          </div>
        )}

        {/* Rejection Notice Banner */}
        {isRejected && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300 flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <XCircle size={15} className="text-rose-600" /> Marked as Not a Fit / Rejected
            </span>
            <span className="text-[11px] text-rose-700/80">Application archived</span>
          </div>
        )}

        {/* Detailed Contact & Academic Credentials Grid */}
        <div className="mt-4 grid gap-2.5 rounded-xl border border-mist bg-paper/40 p-3 sm:grid-cols-2 md:grid-cols-3 text-xs text-ink-soft">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-ulab shrink-0" />
            <a href={`mailto:${student.email}`} className="truncate hover:text-ink hover:underline">
              {student.email}
            </a>
          </div>

          {phone ? (
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-sage shrink-0" />
              <a href={`tel:${phone}`} className="hover:text-ink hover:underline">
                {phone}
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-ink-soft/70">
              <Phone size={14} className="shrink-0" />
              <span>Phone not provided</span>
            </div>
          )}

          {app.availability ? (
            <div className="flex items-center gap-2 text-sage font-medium">
              <Calendar size={14} className="shrink-0" />
              <span>Start: {app.availability}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <GraduationCap size={14} className="text-ulab shrink-0" />
              <span>Student, {site.universityShort}</span>
            </div>
          )}

          {student.location && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0 text-rose" />
              <span>{student.location}</span>
            </div>
          )}
        </div>

        {/* Candidate Pitch / Cover Note */}
        {app.coverNote && (
          <div className="mt-4 rounded-xl border border-mist bg-surface p-3.5 text-sm leading-relaxed text-ink shadow-xs">
            <p className="text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles size={12} className="text-ulab" /> Applicant Note / Why good fit
            </p>
            &ldquo;{app.coverNote}&rdquo;
          </div>
        )}

        {/* Private Recruiter Notes (if any) */}
        {hiringNotes && (
          <div className="mt-3 rounded-xl border border-gold/40 bg-gold-wash/50 p-3 text-xs">
            <span className="font-bold text-gold-ink flex items-center gap-1 mb-0.5">
              Private Recruiter Notes:
            </span>
            <p className="text-ink-soft whitespace-pre-line">{hiringNotes}</p>
          </div>
        )}

        {/* CV / Resume Attachment */}
        {cvUrl && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ulab/25 bg-sky/25 p-3">
            <div className="flex items-center gap-2.5 min-w-[200px]">
              <div className="flex size-9 items-center justify-center rounded-lg border border-mist bg-surface shadow-soft text-ulab">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-ink">{cvName}</p>
                <p className="text-[10px] text-ink-soft">Attached Curriculum Vitae</p>
              </div>
            </div>
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={cvName}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ulab px-3.5 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:bg-ulab-deep"
            >
              <Download size={13} /> View / Download CV
            </a>
          </div>
        )}

        {/* Skills Pills */}
        {skillList.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1.5">
              Skills & Expertise
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skillList.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-mist bg-surface px-2.5 py-1 text-xs font-medium text-ink shadow-2xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {student.bio && (
          <div className="mt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
              About Student
            </p>
            <p className="text-xs text-ink-soft leading-relaxed">{student.bio}</p>
          </div>
        )}

        {/* Footer Links & Messaging */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-mist/80 pt-3">
          <div className="flex flex-wrap items-center gap-3">
            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-ulab hover:underline"
              >
                LinkedIn <ExternalLink size={12} />
              </a>
            )}
            {portfolio && (
              <a
                href={portfolio}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-ulab hover:underline"
              >
                <Globe size={12} /> Portfolio / Projects <ExternalLink size={12} />
              </a>
            )}
          </div>

          <Link
            href={`${base}/messages?to=${student.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-ulab hover:text-ulab shadow-xs"
          >
            <MessageCircle size={13} className="text-ulab" /> Message Student &rarr;
          </Link>
        </div>
      </Card>

      {/* Full Interactive Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          person={student}
          onClose={() => setShowProfileModal(false)}
          messagesHref={`${base}/messages`}
        />
      )}
    </>
  );
}
