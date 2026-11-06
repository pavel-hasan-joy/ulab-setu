"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Building,
  MapPin,
  Calendar,
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
} from "lucide-react";
import { Badge, Card, EmptyState, formatDate, timeAgo } from "@/components/ui";
import { withdrawApplication } from "@/app/actions/jobs";
import {
  APPLICATION_STATUS_CONFIG,
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
    const shortlisted = applications.filter(
      (a) => a.status === "SHORTLISTED" || a.status === "INTERVIEW"
    ).length;
    const selected = applications.filter((a) => a.status === "SELECTED").length;
    const withdrawnOrRejected = applications.filter(
      (a) => a.status === "REJECTED" || a.status === "WITHDRAWN"
    ).length;
    return { total, active, shortlisted, selected, withdrawnOrRejected };
  }, [applications]);

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (filter === "ACTIVE" && !(app.status === "APPLIED" || app.status === "VIEWED")) return false;
      if (
        filter === "SHORTLISTED" &&
        !(app.status === "SHORTLISTED" || app.status === "INTERVIEW" || app.status === "SELECTED")
      ) {
        return false;
      }
      if (filter === "WITHDRAWN" && !(app.status === "REJECTED" || app.status === "WITHDRAWN")) {
        return false;
      }

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-ulab">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Total Applications
          </span>
          <p className="mt-1 text-2xl font-bold text-ink">{counts.total}</p>
          <p className="mt-0.5 text-xs text-ink-soft">Positions applied for</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">In Review</span>
          <p className="mt-1 text-2xl font-bold text-ulab-deep">{counts.active}</p>
          <p className="mt-0.5 text-xs text-ink-soft">Queued or viewed by recruiter</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-gold">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Shortlist & Interview
          </span>
          <p className="mt-1 text-2xl font-bold text-gold-ink">{counts.shortlisted}</p>
          <p className="mt-0.5 text-xs text-ink-soft">Standout candidate stages</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-sage">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Selected / Hired
          </span>
          <p className="mt-1 text-2xl font-bold text-sage">{counts.selected}</p>
          <p className="mt-0.5 text-xs text-ink-soft">Job offers received 🎉</p>
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
              { id: "ACTIVE", label: `In Review (${counts.active})` },
              { id: "SHORTLISTED", label: `Shortlist & Interview (${counts.shortlisted})` },
              { id: "WITHDRAWN", label: "Archived" },
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
              : "You haven't submitted any job applications yet."
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
                className="overflow-hidden p-5 transition hover:border-ulab/40 hover:shadow-md"
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
