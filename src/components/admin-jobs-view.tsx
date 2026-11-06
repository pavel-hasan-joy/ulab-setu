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
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
  ChevronRight,
  Eye,
  Flag,
} from "lucide-react";
import { Badge, Card, EmptyState, formatDate, timeAgo } from "@/components/ui";
import {
  toggleJobStatusByAdmin,
  setJobStatusByAdmin,
  deleteJobByAdmin,
  resolveJobReportByAdmin,
} from "@/app/actions/admin";

export type JobReportItem = {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporterName: string;
  reporterEmail: string;
};

export type AdminJobRecord = {
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
  status: string;
  externalUrl: string | null;
  contactEmail: string | null;
  viewsCount: number;
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
  pendingReports: JobReportItem[];
};

export function AdminJobsView({ jobs }: { jobs: AdminJobRecord[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [inspectJob, setInspectJob] = useState<AdminJobRecord | null>(null);
  const [isPending, startTransition] = useTransition();

  // Extract unique companies for filtering
  const companies = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.company) set.add(j.company);
    });
    return Array.from(set).sort();
  }, [jobs]);

  // Total reported jobs count
  const totalReportedCount = useMemo(() => {
    return jobs.filter((j) => j.pendingReports.length > 0).length;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (statusFilter === "ACTIVE" && !(j.active && j.status === "PUBLISHED")) return false;
      if (statusFilter === "PAUSED" && j.status !== "PAUSED") return false;
      if (statusFilter === "CLOSED" && j.status !== "CLOSED") return false;
      if (statusFilter === "DRAFT" && j.status !== "DRAFT") return false;
      if (statusFilter === "EXPIRED" && j.status !== "EXPIRED") return false;
      if (statusFilter === "REPORTED" && j.pendingReports.length === 0) return false;
      if (statusFilter === "REFERRAL" && !j.referral) return false;

      if (companyFilter !== "ALL" && j.company !== companyFilter) return false;
      if (typeFilter !== "ALL" && j.type !== typeFilter) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.category.toLowerCase().includes(q) ||
        j.postedBy.name.toLowerCase().includes(q) ||
        j.postedBy.email.toLowerCase().includes(q) ||
        (j.skills && j.skills.toLowerCase().includes(q))
      );
    });
  }, [jobs, search, statusFilter, companyFilter, typeFilter]);

  const handleToggle = (jobId: string) => {
    startTransition(async () => {
      try {
        await toggleJobStatusByAdmin(jobId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to toggle job status");
      }
    });
  };

  const handleSetStatus = (jobId: string, status: "PUBLISHED" | "PAUSED" | "CLOSED" | "REMOVED") => {
    startTransition(async () => {
      try {
        await setJobStatusByAdmin(jobId, status);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to update job status");
      }
    });
  };

  const handleDelete = (jobId: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete the job "${title}" and all its student applications?`
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteJobByAdmin(jobId);
        if (inspectJob?.id === jobId) setInspectJob(null);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete job");
      }
    });
  };

  const handleResolveReport = (reportId: string, resolution: "RESOLVED" | "DISMISSED", removeJob: boolean = false) => {
    startTransition(async () => {
      try {
        await resolveJobReportByAdmin(reportId, resolution, "Moderated from Admin Job CRM", removeJob);
        if (inspectJob) {
          // Update inspect modal locally
          setInspectJob({
            ...inspectJob,
            pendingReports: inspectJob.pendingReports.filter((r) => r.id !== reportId),
          });
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to resolve report");
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
      "Pending Reports",
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
      `"${j.deadline ? formatDate(j.deadline) : "N/A"}"`,
      `"${j.referral ? "Yes" : "No"}"`,
      `"${j.status}"`,
      `"${j.postedBy.name.replace(/"/g, '""')}"`,
      `"${j.postedBy.email}"`,
      `"${j.applicationsCount}"`,
      `"${j.pendingReports.length}"`,
      `"${formatDate(j.createdAt)}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ulab_jobs_moderation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Moderation KPI Metric Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-ulab">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Total Postings</span>
          <p className="mt-1 text-2xl font-bold text-ink">{jobs.length}</p>
          <p className="mt-0.5 text-xs text-ink-soft">Alumni & Faculty circulars</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Live & Active</span>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {jobs.filter((j) => j.active && j.status === "PUBLISHED").length}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">Visible to students</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Paused / Closed</span>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {jobs.filter((j) => j.status === "PAUSED" || j.status === "CLOSED").length}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">In review or filled</p>
        </Card>

        <Card
          className={`p-4 border-l-4 ${
            totalReportedCount > 0 ? "border-l-rose-500 bg-rose-50/20" : "border-l-gray-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Reported Postings</span>
            {totalReportedCount > 0 && <ShieldAlert size={16} className="text-rose-600" />}
          </div>
          <p className={`mt-1 text-2xl font-bold ${totalReportedCount > 0 ? "text-rose-600" : "text-ink"}`}>
            {totalReportedCount}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">Requires moderation audit</p>
        </Card>
      </div>

      {/* Control & Filter Toolbar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" size={16} />
              <input
                type="text"
                placeholder="Search job title, company, poster name, email, or skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-mist bg-paper/60 py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none focus:ring-1 focus:ring-ulab"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-mist bg-surface px-4 py-2.5 text-xs font-semibold text-ink shadow-sm hover:bg-mist transition"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist/70 pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: `All (${jobs.length})` },
                { id: "ACTIVE", label: "Live Active" },
                { id: "REPORTED", label: `Reported (${totalReportedCount})`, tone: "rose" },
                { id: "PAUSED", label: "Paused" },
                { id: "CLOSED", label: "Closed" },
                { id: "EXPIRED", label: "Expired" },
                { id: "REFERRAL", label: "Referral Available" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    statusFilter === tab.id
                      ? tab.tone === "rose"
                        ? "bg-rose-600 text-white"
                        : "bg-ulab text-white shadow-sm"
                      : tab.tone === "rose" && totalReportedCount > 0
                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40"
                      : "bg-surface text-ink-soft hover:bg-mist hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="rounded-lg border border-mist bg-surface px-2.5 py-1 text-xs font-medium text-ink focus:border-ulab focus:outline-none"
              >
                <option value="ALL">All Companies ({companies.length})</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-mist bg-surface px-2.5 py-1 text-xs font-medium text-ink focus:border-ulab focus:outline-none"
              >
                <option value="ALL">All Employment Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Jobs Table List */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          title="No jobs matching criteria"
          body="Try adjusting your search terms or filters to find job listings."
        />
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const hasReports = job.pendingReports.length > 0;
            const isLive = job.active && job.status === "PUBLISHED";

            return (
              <Card
                key={job.id}
                className={`overflow-hidden transition-all ${
                  hasReports
                    ? "border-rose-300 bg-rose-50/10 dark:border-rose-800/40"
                    : "hover:border-ulab/30"
                }`}
              >
                <div className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-ink sm:text-lg">{job.title}</span>
                        {isLive && <Badge tone="sage">Live</Badge>}
                        {job.status === "PAUSED" && <Badge tone="gold">Paused</Badge>}
                        {job.status === "CLOSED" && <Badge tone="gray">Closed</Badge>}
                        {job.status === "EXPIRED" && <Badge tone="rose">Expired</Badge>}
                        {job.referral && <Badge tone="gold">Referral Available</Badge>}
                        {hasReports && (
                          <Badge tone="rose" className="font-bold flex items-center gap-1">
                            <AlertTriangle size={12} /> {job.pendingReports.length} Report(s)
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                        <span className="font-semibold text-ink flex items-center gap-1">
                          <Building size={13} className="text-ink-soft" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-ink-soft" />
                          {job.location}
                        </span>
                        <span>
                          {job.type} • {job.category}
                        </span>
                        {job.deadline && (
                          <span className="flex items-center gap-1">
                            <Clock size={13} className="text-ink-soft" />
                            Deadline: {formatDate(job.deadline)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-ink-soft">
                        <span>
                          Posted by:{" "}
                          <span className="font-medium text-ink">
                            {job.postedBy.name} ({job.postedBy.role})
                          </span>
                        </span>
                        <span>•</span>
                        <span>{job.postedBy.email}</span>
                        <span>•</span>
                        <span>{timeAgo(job.createdAt)}</span>
                      </div>
                    </div>

                    {/* Applications & Moderation Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                      <div className="rounded-lg bg-sky/60 px-3 py-1.5 text-xs font-semibold text-ulab-deep">
                        <Users size={14} className="inline mr-1" />
                        {job.applicationsCount} application{job.applicationsCount === 1 ? "" : "s"}
                      </div>

                      <button
                        type="button"
                        onClick={() => setInspectJob(job)}
                        className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-ulab hover:text-ulab transition"
                      >
                        <Eye size={13} /> Inspect
                      </button>

                      {/* Quick Pause / Resume */}
                      {job.status === "PUBLISHED" ? (
                        <button
                          type="button"
                          onClick={() => handleSetStatus(job.id, "PAUSED")}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                        >
                          <PauseCircle size={13} /> Pause
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetStatus(job.id, "PUBLISHED")}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          <PlayCircle size={13} /> Resume
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(job.id, job.title)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>

                  {/* Reports Preview Banner if any */}
                  {hasReports && (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/80 p-3 dark:border-rose-900/50 dark:bg-rose-950/20">
                      <div className="flex items-center justify-between text-xs text-rose-900 dark:text-rose-300">
                        <span className="font-bold flex items-center gap-1.5">
                          <AlertTriangle size={14} /> Attention: Flagged by {job.pendingReports.length} student(s)
                        </span>
                        <button
                          type="button"
                          onClick={() => setInspectJob(job)}
                          className="font-semibold underline hover:text-rose-700"
                        >
                          Review Reports & Details →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Inspect / Moderation Slide-over Modal */}
      {inspectJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-mist bg-paper p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setInspectJob(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-soft hover:bg-mist hover:text-ink transition"
            >
              <XCircle size={20} />
            </button>

            <div className="flex items-center gap-2">
              <Badge tone="blue">{inspectJob.type}</Badge>
              <Badge tone="gray">{inspectJob.status}</Badge>
              {inspectJob.referral && <Badge tone="gold">Referral Available</Badge>}
            </div>

            <h2 className="mt-2 text-2xl font-bold text-ink">{inspectJob.title}</h2>
            <p className="text-sm font-semibold text-ink-soft">{inspectJob.company}</p>

            {/* Poster Details */}
            <div className="mt-4 rounded-xl border border-mist/80 bg-surface/50 p-3.5 text-xs">
              <p className="font-bold text-ink mb-1">Posted By Member Information:</p>
              <div className="grid grid-cols-2 gap-2 text-ink-soft">
                <p>
                  Name: <span className="font-medium text-ink">{inspectJob.postedBy.name}</span>
                </p>
                <p>
                  Role: <span className="font-medium text-ink">{inspectJob.postedBy.role}</span>
                </p>
                <p>
                  Email: <span className="font-medium text-ink">{inspectJob.postedBy.email}</span>
                </p>
                <p>
                  Department: <span className="font-medium text-ink">{inspectJob.postedBy.department || "N/A"}</span>
                </p>
              </div>
            </div>

            {/* Reported Complaints section if any */}
            {inspectJob.pendingReports.length > 0 && (
              <div className="mt-5 space-y-3 rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <Flag size={15} /> Student Reports ({inspectJob.pendingReports.length})
                  </h3>
                </div>

                <div className="space-y-2">
                  {inspectJob.pendingReports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-lg border border-rose-200 bg-paper p-3 text-xs text-ink dark:border-rose-900/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-600 uppercase tracking-wide">
                          Reason: {report.reason}
                        </span>
                        <span className="text-ink-soft">{timeAgo(report.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-ink-soft">{report.details || "No written explanation provided."}</p>
                      <p className="mt-1 text-[11px] text-ink-soft">
                        Reported by: {report.reporterName} ({report.reporterEmail})
                      </p>

                      <div className="mt-2.5 flex items-center gap-2 border-t border-mist/60 pt-2">
                        <button
                          type="button"
                          onClick={() => handleResolveReport(report.id, "DISMISSED")}
                          disabled={isPending}
                          className="rounded-lg border border-mist px-2.5 py-1 font-semibold text-ink-soft hover:bg-mist"
                        >
                          Dismiss Report (False Alarm)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveReport(report.id, "RESOLVED", true)}
                          disabled={isPending}
                          className="rounded-lg bg-rose-600 px-2.5 py-1 font-semibold text-white hover:bg-rose-700"
                        >
                          Resolve & Remove Job
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Job Content */}
            <div className="mt-5 space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-ink uppercase tracking-wider text-[11px] text-ulab">About the Role</h4>
                <p className="mt-1 whitespace-pre-line leading-relaxed text-ink-soft text-sm">
                  {inspectJob.description}
                </p>
              </div>

              {inspectJob.skills && (
                <div>
                  <h4 className="font-bold text-ink uppercase tracking-wider text-[11px] text-ulab">Required Skills</h4>
                  <p className="mt-1 font-medium text-ink">{inspectJob.skills}</p>
                </div>
              )}

              {inspectJob.requirements && (
                <div>
                  <h4 className="font-bold text-ink uppercase tracking-wider text-[11px] text-ulab">Qualifications</h4>
                  <p className="mt-1 whitespace-pre-line text-ink-soft">{inspectJob.requirements}</p>
                </div>
              )}

              {inspectJob.externalUrl && (
                <div>
                  <h4 className="font-bold text-ink uppercase tracking-wider text-[11px] text-ulab">
                    External Career Link
                  </h4>
                  <a
                    href={inspectJob.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 font-semibold text-ulab hover:underline"
                  >
                    {inspectJob.externalUrl} <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Moderation Actions Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-mist pt-4">
              <div className="flex items-center gap-2">
                {inspectJob.status === "PUBLISHED" ? (
                  <button
                    type="button"
                    onClick={() => handleSetStatus(inspectJob.id, "PAUSED")}
                    disabled={isPending}
                    className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300"
                  >
                    Pause Posting
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetStatus(inspectJob.id, "PUBLISHED")}
                    disabled={isPending}
                    className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Set as Published
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(inspectJob.id, inspectJob.title)}
                  disabled={isPending}
                  className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300"
                >
                  Delete Listing
                </button>
              </div>

              <button
                type="button"
                onClick={() => setInspectJob(null)}
                className="rounded-xl border border-mist px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-mist"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
