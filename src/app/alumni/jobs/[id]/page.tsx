import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building,
  MapPin,
  Briefcase,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Edit,
  Sparkles,
  ExternalLink,
  Mail,
  UserCheck,
} from "lucide-react";
import { requirePoster } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncExpiredJobs } from "@/lib/jobs";
import { parseApplicationNote } from "@/lib/applications";
import { PageIn, Stagger, StaggerItem } from "@/components/motion";
import { Badge, Card, EmptyState, formatDate } from "@/components/ui";
import { ApplicantCard } from "./applicant-card";
import { JobDetailControls } from "./job-detail-controls";

export const metadata: Metadata = { title: "Job Applicants & Overview | ULAB Setu" };

export default async function JobApplicants({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { id } = await params;
  const { updated } = await searchParams;
  const { user, base } = await requirePoster();
  await syncExpiredJobs();

  const job = await db.job.findFirst({
    where: { id, postedById: user.id, deletedAt: null },
    include: {
      applications: {
        include: { student: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!job) notFound();

  // Auto-mark any unviewed application as VIEWED
  const unviewedIds = job.applications.filter((a) => a.status === "APPLIED").map((a) => a.id);
  if (unviewedIds.length > 0) {
    await db.application.updateMany({
      where: { id: { in: unviewedIds } },
      data: { status: "VIEWED", viewedAt: new Date(), statusUpdatedAt: new Date() },
    }).catch(() => {});
  }

  const isLive = job.status === "PUBLISHED" && job.active;
  const isExpired = job.status === "EXPIRED" || (job.deadline && new Date(job.deadline).getTime() < Date.now());
  const shortlistedCount = job.applications.filter((a) => a.status === "SHORTLISTED").length;
  const selectedCount = job.applications.filter((a) => a.status === "SELECTED").length;
  const pendingCount = job.applications.filter((a) => a.status === "APPLIED").length;

  return (
    <PageIn>
      <div className="mb-4">
        <Link
          href={`${base}/jobs`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink transition"
        >
          <ArrowLeft size={16} /> Back to My Jobs
        </Link>
      </div>

      {updated && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          ✓ Job posting updated successfully!
        </div>
      )}

      {/* Main Job Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-ink sm:text-3xl">{job.title}</h1>
              {isLive && <Badge tone="sage">Live & Published</Badge>}
              {job.status === "FILLED" && <Badge tone="lilac">Fully Filled</Badge>}
              {job.status === "DRAFT" && <Badge tone="gray">Draft</Badge>}
              {job.status === "PAUSED" && <Badge tone="gold">Paused</Badge>}
              {job.status === "CLOSED" && <Badge tone="gray">Closed</Badge>}
              {isExpired && <Badge tone="rose">Expired</Badge>}
              {job.referral && <Badge tone="gold">Referral Available</Badge>}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
              <span className="flex items-center gap-1 font-semibold text-ink">
                <Building size={15} className="text-ink-soft" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={15} className="text-ink-soft" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase size={15} className="text-ink-soft" />
                {job.type} • {job.experienceLevel || "Entry"}
              </span>
              {job.hiringCapacity && (
                <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                  <Users size={15} className="text-indigo-500" />
                  Capacity: {job.hiringCapacity} ({selectedCount} Selected)
                </span>
              )}
              {job.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar size={15} className="text-ink-soft" />
                  Apply by {formatDate(job.deadline)}
                </span>
              )}
            </div>

            {job.salary && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Compensation: {job.salary}
              </p>
            )}

            {job.skills && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {job.skills
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-surface px-2 py-0.5 text-xs font-medium text-ink-soft border border-mist"
                    >
                      {skill}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`${base}/jobs/${job.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-ulab hover:text-ulab"
            >
              <Edit size={15} /> Edit Posting
            </Link>
          </div>
        </div>

        {/* Quick Status and Referral Controls */}
        <div className="mt-6 border-t border-mist/70 pt-4">
          <JobDetailControls
            jobId={job.id}
            currentStatus={job.status as any}
            currentReferral={job.referral}
          />
        </div>
      </Card>

      {/* Candidate Pipeline Metrics */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <Card className="p-4 border-l-4 border-l-ulab">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Total Applicants</span>
          <p className="mt-1 text-2xl font-bold text-ink">{job.applications.length}</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-gold">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Pending Review</span>
          <p className="mt-1 text-2xl font-bold text-ink">{pendingCount}</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Shortlisted</span>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{shortlistedCount}</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Selected Candidates</span>
          <p className="mt-1 text-2xl font-bold text-indigo-600">
            {selectedCount}
            {job.hiringCapacity ? (
              <span className="text-xs font-normal text-ink-soft ml-1">/ {job.hiringCapacity} capacity</span>
            ) : null}
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-sky-500">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">External Apply Link</span>
          <div className="mt-1">
            {job.externalUrl ? (
              <a
                href={job.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-ulab hover:underline truncate max-w-full"
              >
                Visit Site <ExternalLink size={12} />
              </a>
            ) : (
              <span className="text-xs text-ink-soft">Direct Setu Apply</span>
            )}
          </div>
        </Card>
      </div>

      {/* Applicants Section */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">
            Received Applications ({job.applications.length})
          </h2>
          <p className="text-xs text-ink-soft">Review CVs, cover notes, and shortlist candidates</p>
        </div>

        {job.applications.length === 0 ? (
          <EmptyState
            title="No applicants yet"
            body="Applications submitted by ULAB students will appear here with full CVs and portfolios."
          />
        ) : (
          <Stagger className="space-y-4">
            {job.applications.map((a) => {
              const app = parseApplicationNote(a.note);
              return (
                <StaggerItem key={a.id}>
                  <ApplicantCard
                    applicationId={a.id}
                    status={a.status === "APPLIED" ? "VIEWED" : a.status}
                    createdAt={a.createdAt}
                    student={a.student}
                    app={app}
                    base={base}
                    hiringNotes={a.hiringNotes}
                    interviewDate={a.interviewDate}
                    interviewTime={a.interviewTime}
                    interviewType={a.interviewType}
                    interviewLocation={a.interviewLocation}
                    interviewMeetingLink={a.interviewMeetingLink}
                    interviewMessage={a.interviewMessage}
                  />
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </div>
    </PageIn>
  );
}
