"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  Search,
  Filter,
  PlusCircle,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit,
  Trash2,
  PauseCircle,
  PlayCircle,
  XCircle,
  Sparkles,
  Calendar,
  Building,
  MapPin,
  ChevronRight,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { Badge, Card, EmptyState, formatDate, timeAgo } from "@/components/ui";
import { setJobStatus, toggleJobReferral, deleteJob } from "@/app/actions/jobs";
import type { JobStatus } from "@/lib/jobs";

export type AlumniJobRecord = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  category: string;
  description: string;
  requirements: string | null;
  skills: string | null;
  salary: string | null;
  experienceLevel: string | null;
  deadline: string | null;
  referral: boolean;
  active: boolean;
  status: JobStatus;
  externalUrl: string | null;
  contactEmail: string | null;
  viewsCount: number;
  createdAt: string;
  applicationsCount: number;
  shortlistedCount: number;
};

export function AlumniJobsView({
  jobs,
  base,
  userName,
}: {
  jobs: AlumniJobRecord[];
  base: string;
  userName: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  // Statistics calculation
  const stats = useMemo(() => {
    const total = jobs.length;
    const published = jobs.filter((j) => j.status === "PUBLISHED" && j.active).length;
    const drafts = jobs.filter((j) => j.status === "DRAFT").length;
    const pausedOrClosed = jobs.filter((j) => j.status === "PAUSED" || j.status === "CLOSED").length;
    const expired = jobs.filter((j) => j.status === "EXPIRED" || (j.deadline && new Date(j.deadline).getTime() < Date.now())).length;
    const totalApps = jobs.reduce((sum, j) => sum + j.applicationsCount, 0);
    const totalShortlisted = jobs.reduce((sum, j) => sum + j.shortlistedCount, 0);

    return { total, published, drafts, pausedOrClosed, expired, totalApps, totalShortlisted };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "ACTIVE" && !(job.status === "PUBLISHED" && job.active)) return false;
        if (statusFilter === "DRAFT" && job.status !== "DRAFT") return false;
        if (statusFilter === "PAUSED" && job.status !== "PAUSED") return false;
        if (statusFilter === "CLOSED" && job.status !== "CLOSED") return false;
        if (statusFilter === "EXPIRED" && job.status !== "EXPIRED") return false;
      }

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.category.toLowerCase().includes(q) ||
        (job.skills && job.skills.toLowerCase().includes(q))
      );
    });
  }, [jobs, search, statusFilter]);

  const handleStatusChange = (jobId: string, status: JobStatus) => {
    startTransition(async () => {
      try {
        await setJobStatus(jobId, status);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to update job status");
      }
    });
  };

  const handleReferralToggle = (jobId: string) => {
    startTransition(async () => {
      try {
        await toggleJobReferral(jobId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to update referral");
      }
    });
  };

  const handleDelete = (jobId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove the job listing "${title}"?`)) return;
    startTransition(async () => {
      try {
        await deleteJob(jobId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete job");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <Card className="p-4 sm:p-5 border-l-4 border-l-ulab">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Postings</span>
            <Briefcase size={18} className="text-ulab" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{stats.total}</p>
          <p className="mt-1 text-xs text-ink-soft">{stats.published} currently live</p>
        </Card>

        <Card className="p-4 sm:p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-semibold uppercase tracking-wider">Live & Published</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 sm:text-3xl">{stats.published}</p>
          <p className="mt-1 text-xs text-ink-soft">{stats.drafts} drafts saved</p>
        </Card>

        <Card className="p-4 sm:p-5 border-l-4 border-l-gold">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-semibold uppercase tracking-wider">Applications</span>
            <Users size={18} className="text-gold" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{stats.totalApps}</p>
          <p className="mt-1 text-xs text-ink-soft">Total candidate submissions</p>
        </Card>

        <Card className="p-4 sm:p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-semibold uppercase tracking-wider">Shortlisted</span>
            <UserCheck size={18} className="text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-600 sm:text-3xl">{stats.totalShortlisted}</p>
          <p className="mt-1 text-xs text-ink-soft">High-potential candidates</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title, company, skills, or location..."
              className="w-full rounded-xl border border-mist bg-paper/60 py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink-soft/70 focus:border-ulab focus:outline-none focus:ring-1 focus:ring-ulab"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { id: "ALL", label: `All (${jobs.length})` },
              { id: "ACTIVE", label: `Published (${stats.published})` },
              { id: "DRAFT", label: `Drafts (${stats.drafts})` },
              { id: "PAUSED", label: `Paused` },
              { id: "EXPIRED", label: `Expired (${stats.expired})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === tab.id
                    ? "bg-ulab text-white shadow-sm"
                    : "bg-surface text-ink-soft hover:bg-mist hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Jobs Listing */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          title={search ? "No jobs match your search" : "No job postings in this view"}
          body={search ? "Try searching with different keywords." : "Create a job posting to hire talented ULAB students."}
          action={
            <Link
              href={`${base}/jobs/new`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ulab px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ulab-deep"
            >
              <PlusCircle size={16} /> Post a new job
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const isLive = job.status === "PUBLISHED" && job.active;
            const isExpired = job.status === "EXPIRED" || (job.deadline && new Date(job.deadline).getTime() < Date.now());

            return (
              <Card
                key={job.id}
                className="overflow-hidden transition-all hover:border-ulab/40 hover:shadow-md"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`${base}/jobs/${job.id}`}
                          className="text-lg font-bold text-ink hover:text-ulab transition sm:text-xl"
                        >
                          {job.title}
                        </Link>
                        {isLive && <Badge tone="sage">Live & Published</Badge>}
                        {job.status === "DRAFT" && <Badge tone="gray">Draft</Badge>}
                        {job.status === "PAUSED" && <Badge tone="gold">Paused</Badge>}
                        {job.status === "CLOSED" && <Badge tone="gray">Closed</Badge>}
                        {isExpired && <Badge tone="rose">Expired</Badge>}
                        {job.referral && <Badge tone="gold">Referral Available</Badge>}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-soft sm:text-sm">
                        <span className="inline-flex items-center gap-1 font-medium text-ink">
                          <Building size={14} className="text-ink-soft" />
                          {job.company}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} className="text-ink-soft" />
                          {job.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Briefcase size={14} className="text-ink-soft" />
                          {job.type} ({job.experienceLevel || "Any Experience"})
                        </span>
                        {job.deadline && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={14} className="text-ink-soft" />
                            Deadline: {formatDate(job.deadline)}
                          </span>
                        )}
                      </div>

                      {job.skills && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.skills
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .slice(0, 5)
                            .map((skill) => (
                              <span
                                key={skill}
                                className="rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-ink-soft border border-mist/70"
                              >
                                {skill}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Applicant & Statistics Counter */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Link
                        href={`${base}/jobs/${job.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky/90 px-3.5 py-2 text-sm font-semibold text-ulab-deep transition hover:bg-sky"
                      >
                        <Users size={16} />
                        <span>{job.applicationsCount}</span>
                        <span className="text-xs font-normal text-ink-soft">
                          applicant{job.applicationsCount === 1 ? "" : "s"}
                        </span>
                        <ChevronRight size={14} className="opacity-60" />
                      </Link>
                    </div>
                  </div>

                  {/* Actions and Status Management Bar */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-mist/70 pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Referral Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleReferralToggle(job.id)}
                        disabled={isPending}
                        title={job.referral ? "Disable referral badge" : "Offer employee referral"}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                          job.referral
                            ? "bg-gold-wash text-gold-ink border border-gold/40 hover:bg-gold-wash/80"
                            : "bg-surface text-ink-soft border border-mist hover:text-ink"
                        }`}
                      >
                        <Sparkles size={13} className={job.referral ? "text-gold" : "text-ink-soft"} />
                        {job.referral ? "Referral Active" : "Add Referral Offer"}
                      </button>

                      {/* Status Buttons */}
                      {job.status === "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(job.id, "PAUSED")}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                        >
                          <PauseCircle size={13} /> Pause Job
                        </button>
                      )}

                      {job.status === "PAUSED" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(job.id, "PUBLISHED")}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                        >
                          <PlayCircle size={13} /> Resume Job
                        </button>
                      )}

                      {job.status === "DRAFT" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(job.id, "PUBLISHED")}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={13} /> Publish Now
                        </button>
                      )}

                      {job.status !== "CLOSED" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(job.id, "CLOSED")}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-mist hover:text-ink"
                        >
                          <XCircle size={13} /> Close
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`${base}/jobs/${job.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-ulab hover:text-ulab"
                      >
                        <Edit size={13} /> Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(job.id, job.title)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
