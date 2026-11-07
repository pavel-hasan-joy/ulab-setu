"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Building,
  MapPin,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  XCircle,
  AlertCircle,
  Sparkles,
  Eye,
  Briefcase,
  ChevronRight,
  Download,
  Video,
  FolderGit2,
} from "lucide-react";
import { Badge, Card, EmptyState, formatDate, timeAgo } from "@/components/ui";
import { withdrawApplication } from "@/app/actions/jobs";
import {
  APPLICATION_STATUS_CONFIG,
  formatDhakaDateTime,
  type ApplicationStatus,
  canWithdrawApplication,
  parseApplicationNote,
} from "@/lib/applications";

export type StudentApplicationRecord = {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  viewedAt: string | null;
  statusUpdatedAt: string | null;
  withdrawnAt: string | null;
  rawNote: string | null;
  interviewDate?: string | null;
  interviewTime?: string | null;
  interviewType?: string | null;
  interviewLocation?: string | null;
  interviewMeetingLink?: string | null;
  interviewMessage?: string | null;
  interviewScheduledAt?: string | null;
  interviewCancelledAt?: string | null;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string | null;
    referral: boolean;
    active: boolean;
    postedBy: {
      id: string;
      name: string;
      email: string;
      department: string | null;
    };
  };
};

export function StudentApplicationsView({
  applications,
}: {
  applications: StudentApplicationRecord[];
}) {
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const total = applications.length;
    const active = applications.filter((a) => a.status === "APPLIED" || a.status === "VIEWED").length;
    const interview = applications.filter((a) => a.status === "INTERVIEW").length;
    const shortlisted = applications.filter((a) => a.status === "SHORTLISTED").length;
    const selected = applications.filter((a) => a.status === "SELECTED").length;
    const rejected = applications.filter((a) => a.status === "REJECTED").length;
    const withdrawn = applications.filter((a) => a.status === "WITHDRAWN").length;
    return { total, active, interview, shortlisted, selected, rejected, withdrawn };
  }, [applications]);

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (filter === "INTERVIEW" && app.status !== "INTERVIEW") return false;
      if (filter === "ACTIVE" && !(app.status === "APPLIED" || app.status === "VIEWED")) return false;
      if (filter === "SHORTLISTED" && app.status !== "SHORTLISTED") return false;
      if (filter === "SELECTED" && app.status !== "SELECTED") return false;
      if (filter === "REJECTED" && app.status !== "REJECTED") return false;
      if (filter === "WITHDRAWN" && app.status !== "WITHDRAWN") return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        app.job.title.toLowerCase().includes(q) ||
        app.job.company.toLowerCase().includes(q) ||
        app.job.postedBy.name.toLowerCase().includes(q)
      );
    });
  }, [applications, filter, search]);

  const handleWithdraw = (appId: string, jobTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to withdraw your application for "${jobTitle}"? You can re-apply later if the position is still open.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await withdrawApplication(appId);
        if (res.error) alert(res.error);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to withdraw application");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card className="p-4 border-l-4 border-l-ulab">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Total
          </span>
          <p className="mt-1 text-2xl font-bold text-ink">{counts.total}</p>
          <p className="mt-0.5 text-xs text-ink-soft">All applied</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Interviews
          </span>
          <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{counts.interview}</p>
          <p className="mt-0.5 text-xs text-ink-soft">Scheduled invites</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-gold">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Shortlisted
          </span>
          <p className="mt-1 text-2xl font-bold text-gold-ink">{counts.shortlisted}</p>
          <p className="mt-0.5 text-xs text-ink-soft">Candidate pool</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-sage">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Selected
          </span>
          <p className="mt-1 text-2xl font-bold text-sage">{counts.selected}</p>
          <p className="mt-0.5 text-xs text-ink-soft">Job offers 🎉</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-500">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            Rejected
          </span>
          <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{counts.rejected}</p>
          <p className="mt-0.5 text-xs text-ink-soft">Not selected</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" size={16} />
            <input
              type="text"
              placeholder="Search by job title, company, or senior's name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-mist bg-paper/60 py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: `All (${counts.total})` },
              { id: "INTERVIEW", label: `Interviews (${counts.interview})` },
              { id: "ACTIVE", label: `In Review (${counts.active})` },
              { id: "SHORTLISTED", label: `Shortlisted (${counts.shortlisted})` },
              { id: "SELECTED", label: `Selected (${counts.selected})` },
              { id: "REJECTED", label: `Rejected (${counts.rejected})` },
              { id: "WITHDRAWN", label: `Withdrawn (${counts.withdrawn})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filter === tab.id
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

      {/* Applications List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No applications found"
          body={
            search
              ? "No job applications match your search query."
              : "No applications found under this status filter."
          }
          action={
            <Link
              href="/student/jobs"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ulab px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-ulab-deep transition"
            >
              Browse Active Openings
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const config = APPLICATION_STATUS_CONFIG[app.status] || APPLICATION_STATUS_CONFIG.APPLIED;
            const parsed = parseApplicationNote(app.rawNote);
            const withdrawable = canWithdrawApplication(app.status);

            return (
              <Card
                key={app.id}
                className="overflow-hidden p-5 transition hover:border-ulab/40 hover:shadow-md space-y-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/student/jobs/${app.job.id}`}
                        className="text-lg font-bold text-ink hover:text-ulab transition sm:text-xl"
                      >
                        {app.job.title}
                      </Link>
                      <Badge tone={config.tone}>{config.label}</Badge>
                      {app.job.referral && <Badge tone="gold">Referral Eligible</Badge>}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft sm:text-sm">
                      <span className="font-semibold text-ink flex items-center gap-1">
                        <Building size={14} className="text-ink-soft" />
                        {app.job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} className="text-ink-soft" />
                        {app.job.location}
                      </span>
                      <span>{app.job.type}</span>
                      {app.job.salary && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {app.job.salary}
                        </span>
                      )}
                    </div>

                    {/* Status Feedback Notice */}
                    <p className="text-xs text-ink-soft bg-surface/80 p-2.5 rounded-xl border border-mist/70">
                      💡 <span className="font-semibold text-ink">Status update:</span> {config.description}
                    </p>

                    {/* Attached CV and Submission Details */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-ink-soft">
                      {parsed.cvFileName && (
                        <span className="inline-flex items-center gap-1 text-sage font-medium bg-sage-wash/50 px-2 py-0.5 rounded-md">
                          <FileText size={13} />
                          {parsed.cvFileName}
                        </span>
                      )}
                      {parsed.cvUrl && (
                        <a
                          href={parsed.cvUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-ulab font-semibold hover:underline"
                        >
                          View Online Resume <ExternalLink size={12} />
                        </a>
                      )}
                      <span>Submitted {timeAgo(app.createdAt)}</span>
                      {app.viewedAt && (
                        <span className="inline-flex items-center gap-1 text-ink-soft">
                          <Eye size={12} /> Viewed {timeAgo(app.viewedAt)}
                        </span>
                      )}
                    </div>

                    {/* Submitted Projects & Portfolio Links */}
                    {parsed.projects && parsed.projects.length > 0 && (
                      <div className="pt-2 border-t border-mist/60 space-y-1.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                          <FolderGit2 size={13} className="text-ulab" />
                          Submitted Projects & Portfolio ({parsed.projects.length})
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {parsed.projects.map((proj, idx) => (
                            <div
                              key={proj.url + idx}
                              className="flex items-center justify-between rounded-xl border border-mist bg-surface/60 p-2.5 text-xs transition hover:border-mist-deep"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-semibold text-ink block truncate">
                                  {proj.title || `Project ${idx + 1}`}
                                </span>
                                <span className="text-[10px] text-ink-soft font-mono truncate block">
                                  {proj.url}
                                </span>
                              </div>
                              <a
                                href={proj.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 inline-flex items-center gap-1 rounded-md bg-ulab/10 px-2 py-0.5 text-[11px] font-semibold text-ulab hover:bg-ulab hover:text-white transition"
                              >
                                View <ExternalLink size={11} />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <Link
                      href={`/student/jobs/${app.job.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-surface px-3.5 py-2 text-xs font-semibold text-ink hover:border-ulab hover:text-ulab transition"
                    >
                      View Circular <ArrowRight size={13} />
                    </Link>

                    {withdrawable && (
                      <button
                        type="button"
                        onClick={() => handleWithdraw(app.id, app.job.title)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded-xl border border-mist bg-surface px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                      >
                        <XCircle size={13} /> Withdraw
                      </button>
                    )}
                  </div>
                </div>

                {/* Prominent Interview Scheduled Card for Candidate */}
                {app.status === "INTERVIEW" && (
                  <div className="rounded-2xl border-2 border-blue-400 bg-sky/30 p-4 shadow-sm dark:border-blue-700/60 dark:bg-blue-950/30">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/80 pb-2.5 dark:border-blue-900/50">
                      <span className="flex items-center gap-2 text-sm font-bold text-ulab-deep dark:text-blue-300">
                        <CalendarClock size={18} className="text-ulab" />
                        Interview Scheduled (Asia/Dhaka Time)
                      </span>
                      <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                        {app.interviewType || "Scheduled"}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-ink-soft block">
                          Date & Time
                        </span>
                        <p className="font-bold text-ink text-sm">
                          {formatDhakaDateTime(app.interviewDate) || "Date scheduled"}
                        </p>
                        {app.interviewTime && (
                          <p className="text-xs font-semibold text-ulab-deep dark:text-blue-300">
                            at {app.interviewTime}
                          </p>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-ink-soft block">
                          Venue / Location
                        </span>
                        <p className="font-semibold text-ink flex items-center gap-1">
                          <MapPin size={13} className="text-rose-500 shrink-0" />
                          {app.interviewLocation || "Campus specified"}
                        </p>
                      </div>

                      {app.interviewMeetingLink && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-ink-soft block">
                            Online Meeting Link
                          </span>
                          <a
                            href={app.interviewMeetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-ulab px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-ulab-deep transition"
                          >
                            <Video size={13} /> Join Interview <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>

                    {app.interviewMessage && (
                      <div className="mt-3 rounded-xl border border-blue-200/80 bg-surface/90 p-3 text-xs leading-relaxed dark:border-blue-900/40">
                        <span className="font-bold text-ulab-deep dark:text-blue-300 block mb-0.5">
                          Note from Recruiter:
                        </span>
                        <p className="text-ink-soft">{app.interviewMessage}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection Feedback Box */}
                {app.status === "REJECTED" && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                    <p className="font-semibold flex items-center gap-1.5 text-sm">
                      <XCircle size={16} className="text-rose-600 shrink-0" /> Application Status: Rejected / Not Selected
                    </p>
                    <p className="mt-1 text-ink-soft leading-relaxed">
                      Thank you for your interest and time. The employer decided not to move forward with your application for this position. Keep exploring and applying for other active circulars on Setu!
                    </p>
                    {app.statusUpdatedAt && (
                      <p className="mt-2 text-[10px] text-ink-soft/70">
                        Status updated: {formatDate(app.statusUpdatedAt)}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
