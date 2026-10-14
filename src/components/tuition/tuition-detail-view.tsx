"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  MessageCircle,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  toggleTuitionStatus,
  updateTuitionApplicationStatus,
  deleteTuition,
} from "@/app/actions/tuitions";
import { ApplyTuitionModal } from "./apply-tuition-modal";
import { Avatar, Badge, Button, Card, formatDate, timeAgo } from "@/components/ui";

export type TuitionDetail = {
  id: string;
  title: string;
  classGrade: string;
  curriculum: string;
  subjects: string;
  tutoringType: string;
  location: string;
  daysPerWeek: string;
  salary: string;
  studentGender: string | null;
  preferredTutorGender: string | null;
  requirements: string | null;
  status: string;
  createdAt: Date | string;
  postedById: string;
  postedBy: {
    id: string;
    name: string;
    role: string;
    image: string | null;
    department: string | null;
    batch: string | null;
    designation: string | null;
    company: string | null;
  };
  applications: Array<{
    id: string;
    expectedSalary: string | null;
    experience: string | null;
    availability: string | null;
    note: string | null;
    status: string;
    createdAt: Date | string;
    applicant: {
      id: string;
      name: string;
      role: string;
      image: string | null;
      department: string | null;
      batch: string | null;
      studentId: string | null;
      skills: string | null;
      linkedin: string | null;
      github: string | null;
    };
  }>;
};

export function TuitionDetailView({
  tuition,
  currentUserId,
  basePath,
}: {
  tuition: TuitionDetail;
  currentUserId: string;
  basePath: string;
}) {
  const router = useRouter();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const isOwner = tuition.postedById === currentUserId;
  const myApplication = tuition.applications.find(
    (a) => a.applicant.id === currentUserId
  );

  async function handleToggleStatus() {
    setUpdating(true);
    const newStatus = tuition.status === "OPEN" ? "CLOSED" : "OPEN";
    await toggleTuitionStatus(tuition.id, newStatus);
    setUpdating(false);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this tuition posting?")) return;
    setUpdating(true);
    await deleteTuition(tuition.id);
    router.push(`${basePath}/tuitions`);
  }

  async function handleStatusChange(
    applicationId: string,
    status: "APPLIED" | "SHORTLISTED" | "SELECTED" | "REJECTED"
  ) {
    setUpdating(true);
    await updateTuitionApplicationStatus(applicationId, status);
    setUpdating(false);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 md:p-8">
      {/* Back link */}
      <div>
        <Link
          href={`${basePath}/tuitions`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink transition"
        >
          <ArrowLeft size={16} />
          <span>Back to All Tuitions</span>
        </Link>
      </div>

      {/* Main Tuition Header Card */}
      <Card className="overflow-hidden border border-mist/80 bg-surface p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between border-b border-mist/60 pb-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                tone={tuition.status === "OPEN" ? "sage" : "gray"}
                className="font-semibold text-xs px-3 py-1"
              >
                {tuition.status === "OPEN" ? "● Active / Open" : "Closed"}
              </Badge>
              <Badge tone="blue">{tuition.tutoringType}</Badge>
              <Badge tone="lilac">{tuition.curriculum}</Badge>
              <Badge tone="gold">{tuition.classGrade}</Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-display">
              {tuition.title}
            </h1>

            <p className="text-xs text-ink-soft">
              Posted on {formatDate(tuition.createdAt)} ({timeAgo(tuition.createdAt)})
            </p>
          </div>

          {/* Owner actions or Apply button */}
          <div className="flex items-center gap-2 shrink-0">
            {isOwner ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleToggleStatus}
                  disabled={updating}
                  className="text-xs px-3 py-1.5"
                >
                  {tuition.status === "OPEN" ? "Close Tuition" : "Reopen Tuition"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={updating}
                  className="text-rose hover:bg-rose-wash text-xs px-2.5 py-1.5"
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            ) : myApplication ? (
              <div className="rounded-2xl bg-sage-wash px-4 py-2 text-center text-xs font-semibold text-sage">
                <p className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} />
                  <span>Application Submitted</span>
                </p>
                <p className="text-[11px] font-normal text-ink-soft mt-0.5">
                  Status: <strong className="text-sage">{myApplication.status}</strong>
                </p>
              </div>
            ) : tuition.status === "OPEN" ? (
              <Button
                onClick={() => setShowApplyModal(true)}
                className="gap-2 shadow-lift py-2.5 px-5 text-sm"
              >
                <Sparkles size={16} />
                <span>Apply for this Tuition</span>
              </Button>
            ) : (
              <span className="rounded-xl bg-mist/60 px-3 py-1.5 text-xs font-semibold text-ink-soft">
                Posting Closed
              </span>
            )}
          </div>
        </div>

        {/* Overview Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-mist/60 bg-surface/50 p-3.5">
            <span className="text-[11px] font-medium text-ink-soft">Salary / Budget</span>
            <p className="mt-1 text-base font-bold text-gold-ink font-display">{tuition.salary}</p>
          </div>

          <div className="rounded-2xl border border-mist/60 bg-surface/50 p-3.5">
            <span className="text-[11px] font-medium text-ink-soft">Location / Area</span>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink truncate">
              <MapPin size={15} className="shrink-0 text-rose" />
              <span className="truncate">{tuition.location}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-mist/60 bg-surface/50 p-3.5">
            <span className="text-[11px] font-medium text-ink-soft">Weekly Schedule</span>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Calendar size={15} className="shrink-0 text-gold" />
              <span>{tuition.daysPerWeek}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-mist/60 bg-surface/50 p-3.5">
            <span className="text-[11px] font-medium text-ink-soft">Tutor Preference</span>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <UserCheck size={15} className="shrink-0 text-sage" />
              <span>{tuition.preferredTutorGender || "Any Tutor"}</span>
            </p>
          </div>
        </div>

        {/* Subjects & Details */}
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-sky/30 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ulab-deep">
              Target Subjects
            </h3>
            <p className="mt-1 text-sm font-semibold text-ink">{tuition.subjects}</p>
          </div>

          {tuition.studentGender && (
            <div className="text-xs text-ink-soft">
              Student Gender: <strong className="text-ink">{tuition.studentGender}</strong>
            </div>
          )}

          {tuition.requirements && (
            <div className="rounded-2xl border border-mist/60 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                Requirements & Details
              </h3>
              <p className="mt-2 text-sm text-ink leading-relaxed whitespace-pre-line">
                {tuition.requirements}
              </p>
            </div>
          )}
        </div>

        {/* Poster Profile Footer */}
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-mist/70 bg-mist/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              name={tuition.postedBy.name}
              src={tuition.postedBy.image}
              size={44}
            />
            <div>
              <p className="text-sm font-semibold text-ink">{tuition.postedBy.name}</p>
              <p className="text-xs text-ink-soft">
                {tuition.postedBy.role === "TEACHER"
                  ? `${tuition.postedBy.designation || "Teacher"}, ULAB`
                  : tuition.postedBy.role === "ALUMNI"
                  ? `Alumni (${tuition.postedBy.department || ""})`
                  : `Student (${tuition.postedBy.department || ""})`}
              </p>
            </div>
          </div>

          {tuition.postedBy.id !== currentUserId && (
            <Link
              href={`${basePath}/messages?with=${tuition.postedBy.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-surface px-4 py-2 text-xs font-semibold text-ink border border-mist hover:border-ulab-light transition shadow-2xs"
            >
              <MessageCircle size={15} className="text-ulab" />
              <span>Message Poster</span>
            </Link>
          )}
        </div>
      </Card>

      {/* Owner View: List of Applicants */}
      {isOwner && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink font-display flex items-center gap-2">
              <Users size={20} className="text-ulab" />
              <span>Received Applications ({tuition.applications.length})</span>
            </h2>
          </div>

          {tuition.applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-mist p-8 text-center bg-surface">
              <p className="text-sm font-semibold text-ink">No applicants yet</p>
              <p className="mt-1 text-xs text-ink-soft">
                When student tutors apply, their profile, experience, and notes will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tuition.applications.map((app) => (
                <Card
                  key={app.id}
                  className="p-5 sm:p-6 border border-mist/80 bg-surface rounded-2xl shadow-xs"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={app.applicant.name}
                        src={app.applicant.image}
                        size={46}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-ink font-display">
                            {app.applicant.name}
                          </h3>
                          <Badge
                            tone={
                              app.status === "SELECTED"
                                ? "sage"
                                : app.status === "SHORTLISTED"
                                ? "gold"
                                : app.status === "REJECTED"
                                ? "rose"
                                : "blue"
                            }
                            className="text-[11px]"
                          >
                            {app.status}
                          </Badge>
                        </div>

                        <p className="text-xs text-ink-soft">
                          {app.applicant.department || "Student"}{" "}
                          {app.applicant.batch ? `• Batch ${app.applicant.batch}` : ""}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-xs text-ink-soft">
                          <span>Applied {timeAgo(app.createdAt)}</span>
                          {app.expectedSalary && (
                            <span>
                              Expected: <strong className="text-ink">{app.expectedSalary}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`${basePath}/messages?with=${app.applicant.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-ulab-light transition"
                      >
                        <MessageCircle size={14} className="text-ulab" />
                        <span>Chat</span>
                      </Link>

                      {app.status !== "SELECTED" && (
                        <button
                          onClick={() => handleStatusChange(app.id, "SELECTED")}
                          disabled={updating}
                          className="rounded-xl bg-sage-wash px-3 py-1.5 text-xs font-semibold text-sage hover:bg-sage/20 transition"
                        >
                          Select Tutor
                        </button>
                      )}

                      {app.status !== "SHORTLISTED" && app.status !== "SELECTED" && (
                        <button
                          onClick={() => handleStatusChange(app.id, "SHORTLISTED")}
                          disabled={updating}
                          className="rounded-xl bg-gold-wash px-3 py-1.5 text-xs font-semibold text-gold-ink hover:bg-gold/20 transition"
                        >
                          Shortlist
                        </button>
                      )}

                      {app.status !== "REJECTED" && (
                        <button
                          onClick={() => handleStatusChange(app.id, "REJECTED")}
                          disabled={updating}
                          className="rounded-xl bg-mist/50 px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-rose-wash hover:text-rose transition"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Application details */}
                  <div className="mt-4 grid gap-2 rounded-xl bg-mist/20 p-3.5 text-xs sm:grid-cols-2">
                    <div>
                      <span className="font-semibold text-ink-soft">Experience:</span>{" "}
                      <span className="text-ink">{app.experience || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-ink-soft">Availability:</span>{" "}
                      <span className="text-ink">{app.availability || "Not specified"}</span>
                    </div>
                  </div>

                  {app.note && (
                    <div className="mt-3 text-xs text-ink bg-surface rounded-xl border border-mist/50 p-3 leading-relaxed">
                      <span className="font-semibold text-ink-soft block mb-1">Applicant Note:</span>
                      {app.note}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Apply Modal */}
      <ApplyTuitionModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        tuitionId={tuition.id}
        tuitionTitle={tuition.title}
        tuitionSalary={tuition.salary}
      />
    </div>
  );
}
