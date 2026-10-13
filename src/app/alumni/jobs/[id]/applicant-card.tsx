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
} from "lucide-react";
import type { User as PrismaUser } from "@prisma/client";
import { site } from "@/lib/site";
import { Avatar, Badge, Button, Card, timeAgo } from "@/components/ui";
import { ProfileModal } from "@/components/profile-modal";
import { ApplicantActions } from "./applicant-actions";
import type { ApplicationPayload } from "@/lib/applications";

type SafeStudent = Omit<PrismaUser, "passwordHash">;

export function ApplicantCard({
  applicationId,
  status,
  createdAt,
  student,
  app,
  base,
}: {
  applicationId: string;
  status: string;
  createdAt: Date | string;
  student: SafeStudent;
  app: ApplicationPayload;
  base: string;
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

  const skillList = student.skills
    ? student.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

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
                {status === "SHORTLISTED" && <Badge tone="sage">Shortlisted</Badge>}
                {status === "REJECTED" && <Badge tone="gray">Not selected</Badge>}
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
            <ApplicantActions applicationId={applicationId} status={status} />
          </div>
        </div>

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
