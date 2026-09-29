"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Trash2,
  Users,
  Calendar,
  Building,
  MapPin,
  ExternalLink,
  Download,
  Clock,
  Sparkles,
} from "lucide-react";
import { Badge, Card, EmptyState, timeAgo } from "@/components/ui";
import {
  toggleJobStatusByAdmin,
  deleteJobByAdmin,
} from "@/app/actions/admin";

export type AdminJobRecord = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  category: string;
  description: string;
  requirements: string | null;
  salary: string | null;
  deadline: string | null;
  referral: boolean;
  active: boolean;
  createdAt: string;
  postedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
    company: string | null;
  };
  applicationsCount: number;
};

export function AdminJobsView({ jobs }: { jobs: AdminJobRecord[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (statusFilter === "ACTIVE" && !j.active) return false;
      if (statusFilter === "CLOSED" && j.active) return false;
      if (typeFilter !== "ALL" && j.type !== typeFilter) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.category.toLowerCase().includes(q) ||
        j.postedBy.name.toLowerCase().includes(q) ||
        j.postedBy.email.toLowerCase().includes(q)
      );
    });
  }, [jobs, search, statusFilter, typeFilter]);

  const handleToggle = (jobId: string) => {
    startTransition(async () => {
      try {
        await toggleJobStatusByAdmin(jobId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to toggle job status");
      }
    });
  };

  const handleDelete = (jobId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete the job "${title}" and all its student applications?`)) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteJobByAdmin(jobId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete job");
      }
    });
  };

  const handleExportCSV = () => {
    const headers = [
      "Job ID",
      "Title",
      "Company",
      "Location",
      "Type",
      "Category",
      "Salary",
      "Deadline",
      "Referral",
      "Status",
      "Posted By",
      "Poster Email",
      "Applications Count",
      "Posted Date",
    ];

    const rows = filteredJobs.map((j) => [
      `"${j.id}"`,
      `"${j.title.replace(/"/g, '""')}"`,
      `"${j.company.replace(/"/g, '""')}"`,
      `"${j.location.replace(/"/g, '""')}"`,
      `"${j.type}"`,
      `"${j.category}"`,
      `"${(j.salary || "").replace(/"/g, '""')}"`,
      `"${j.deadline ? new Date(j.deadline).toLocaleDateString() : "Open"}"`,
      `"${j.referral ? "Yes" : "No"}"`,
      `"${j.active ? "Active" : "Closed"}"`,
      `"${j.postedBy.name.replace(/"/g, '""')}"`,
      `"${j.postedBy.email}"`,
      j.applicationsCount,
      `"${new Date(j.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ulab_jobs_moderation_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metrics = useMemo(() => {
    return {
      total: jobs.length,
      active: jobs.filter((j) => j.active).length,
      closed: jobs.filter((j) => !j.active).length,
      totalApplications: jobs.reduce((sum, j) => sum + j.applicationsCount, 0),
    };
  }, [jobs]);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <p className="text-xs font-medium text-ink-soft">Total Opportunities</p>
          <p className="mt-1 text-2xl font-bold text-ink">{metrics.total}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-medium text-ink-soft">Active Openings</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.active}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-medium text-ink-soft">Closed Listings</p>
          <p className="mt-1 text-2xl font-bold text-ink-soft">{metrics.closed}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-medium text-ink-soft">Student Applications</p>
          <p className="mt-1 text-2xl font-bold text-ulab-deep">
            {metrics.totalApplications}
          </p>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/70"
            />
            <input
              type="text"
              placeholder="Search jobs by title, company, poster name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-mist bg-surface py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-soft/60 focus:border-ulab-light focus:outline-none focus:ring-4 focus:ring-ulab-light/15"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-mist bg-surface px-3.5 py-2.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-mist/50 hover:text-ulab-deep"
            >
              <Download size={14} /> Export CSV ({filteredJobs.length})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-mist/50 text-xs">
          <span className="flex items-center gap-1 font-semibold text-ink-soft mr-1">
            <Filter size={13} /> Filters:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="CLOSED">Closed Only</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Internship">Internship</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
          </select>

          {(search || statusFilter !== "ALL" || typeFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setTypeFilter("ALL");
              }}
              className="text-xs text-rose font-medium hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          title="No jobs found"
          body="No posted jobs match your current search and filters."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-ink-soft px-1">
            <span>Showing {filteredJobs.length} job postings</span>
            {isPending && <span className="text-ulab font-medium animate-pulse">Updating...</span>}
          </div>

          <div className="grid gap-3">
            {filteredJobs.map((j) => {
              const isExpanded = expandedJobId === j.id;

              return (
                <Card
                  key={j.id}
                  className={`p-5 transition-all ${
                    !j.active ? "opacity-75 bg-slate-50/50 dark:bg-slate-900/20" : ""
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-ink">
                          {j.title}
                        </span>
                        <Badge tone={j.active ? "sage" : "gray"}>
                          {j.active ? "Active" : "Closed"}
                        </Badge>
                        <Badge tone="blue">{j.type}</Badge>
                        {j.referral && (
                          <Badge tone="gold" className="gap-1">
                            <Sparkles size={11} /> Referral Available
                          </Badge>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-ulab/10 text-ulab-deep px-2.5 py-0.5 text-xs font-semibold">
                          <Users size={12} /> {j.applicationsCount} applicant{j.applicationsCount === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                        <span className="inline-flex items-center gap-1 font-semibold text-ink">
                          <Building size={13} /> {j.company}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={13} /> {j.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Briefcase size={13} /> {j.category}
                        </span>
                        {j.salary && <span>💰 {j.salary}</span>}
                        {j.deadline && (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                            <Calendar size={13} /> Deadline: {new Date(j.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-ink-soft/90 pt-1">
                        Posted by <span className="font-semibold text-ink">{j.postedBy.name}</span> ({j.postedBy.role}) · {j.postedBy.email} · {timeAgo(j.createdAt)}
                      </div>
                    </div>

                    {/* Moderation Controls */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                      <button
                        onClick={() => setExpandedJobId(isExpanded ? null : j.id)}
                        className="rounded-xl border border-mist bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-mist/40 transition"
                      >
                        {isExpanded ? "Hide Details" : "View Details"}
                      </button>

                      <button
                        disabled={isPending}
                        onClick={() => handleToggle(j.id)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          j.active
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}
                      >
                        {j.active ? (
                          <>
                            <XCircle size={13} /> Close Job
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} /> Re-open Job
                          </>
                        )}
                      </button>

                      <button
                        disabled={isPending}
                        onClick={() => handleDelete(j.id, j.title)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400"
                        title="Permanently Delete Job"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Expanded description and requirements */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-mist/60 space-y-3 text-xs text-ink bg-sky/10 -mx-5 -mb-5 p-5 rounded-b-2xl">
                      <div>
                        <h4 className="font-bold text-ink-soft uppercase tracking-wider text-[11px] mb-1">
                          Role Description
                        </h4>
                        <p className="whitespace-pre-line leading-relaxed text-ink/90">
                          {j.description}
                        </p>
                      </div>

                      {j.requirements && (
                        <div>
                          <h4 className="font-bold text-ink-soft uppercase tracking-wider text-[11px] mb-1">
                            Requirements & Qualifications
                          </h4>
                          <p className="whitespace-pre-line leading-relaxed text-ink/90">
                            {j.requirements}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
