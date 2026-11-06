"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Building,
  User,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  Eye,
  Calendar,
  Sparkles,
  XCircle,
  FileEdit,
} from "lucide-react";
import { Badge, Card, EmptyState, formatDate, timeAgo } from "@/components/ui";
import {
  APPLICATION_STATUS_CONFIG,
  type ApplicationStatus,
  parseApplicationNote,
} from "@/lib/applications";

export type AdminApplicationItem = {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  viewedAt: string | null;
  statusUpdatedAt: string | null;
  hiringNotes: string | null;
  rawNote: string | null;
  student: {
    id: string;
    name: string;
    email: string;
    department: string | null;
    studentId: string | null;
    image: string | null;
  };
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    postedBy: {
      name: string;
      role: string;
      email: string;
    };
  };
};

export function AdminApplicationsView({
  applications,
}: {
  applications: AdminApplicationItem[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [jobFilter, setJobFilter] = useState("ALL");
  const [inspectApp, setInspectApp] = useState<AdminApplicationItem | null>(null);

  // Extract unique jobs for dropdown
  const uniqueJobs = useMemo(() => {
    const map = new Map<string, string>();
    applications.forEach((a) => {
      map.set(a.job.id, `${a.job.title} (${a.job.company})`);
    });
    return Array.from(map.entries());
  }, [applications]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = applications.length;
    const applied = applications.filter((a) => a.status === "APPLIED" || a.status === "VIEWED").length;
    const shortlisted = applications.filter((a) => a.status === "SHORTLISTED" || a.status === "INTERVIEW").length;
    const selected = applications.filter((a) => a.status === "SELECTED").length;
    const rejected = applications.filter((a) => a.status === "REJECTED").length;
    const withdrawn = applications.filter((a) => a.status === "WITHDRAWN").length;
    return { total, applied, shortlisted, selected, rejected, withdrawn };
  }, [applications]);

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== "ALL" && app.status !== statusFilter) return false;
      if (jobFilter !== "ALL" && app.job.id !== jobFilter) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        app.student.name.toLowerCase().includes(q) ||
        app.student.email.toLowerCase().includes(q) ||
        (app.student.studentId && app.student.studentId.toLowerCase().includes(q)) ||
        (app.student.department && app.student.department.toLowerCase().includes(q)) ||
        app.job.title.toLowerCase().includes(q) ||
        app.job.company.toLowerCase().includes(q)
      );
    });
  }, [applications, statusFilter, jobFilter, search]);

  const handleExportCSV = () => {
    const headers = [
      "Application ID",
      "Candidate Name",
      "Student ID",
      "Email",
      "Department",
      "Job Title",
      "Company",
      "Recruiter Name",
      "Status",
      "Applied Date",
      "Viewed Date",
      "CV Attached",
      "Hiring Notes",
    ];

    const rows = filtered.map((a) => {
      const parsed = parseApplicationNote(a.rawNote);
      return [
        `"${a.id}"`,
        `"${a.student.name.replace(/"/g, '""')}"`,
        `"${a.student.studentId || ""}"`,
        `"${a.student.email}"`,
        `"${a.student.department || ""}"`,
        `"${a.job.title.replace(/"/g, '""')}"`,
        `"${a.job.company.replace(/"/g, '""')}"`,
        `"${a.job.postedBy.name.replace(/"/g, '""')}"`,
        `"${a.status}"`,
        `"${formatDate(a.createdAt)}"`,
        `"${a.viewedAt ? formatDate(a.viewedAt) : "Not yet"}"`,
        `"${parsed.cvFileName || parsed.cvUrl ? "Yes" : "No"}"`,
        `"${(a.hiringNotes || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ulab_applications_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <Card className="p-3.5 border-l-4 border-l-ulab">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Total</span>
          <p className="mt-1 text-2xl font-bold text-ink">{stats.total}</p>
        </Card>
        <Card className="p-3.5 border-l-4 border-l-blue">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">In Review</span>
          <p className="mt-1 text-2xl font-bold text-blue-600">{stats.applied}</p>
        </Card>
        <Card className="p-3.5 border-l-4 border-l-gold">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Shortlisted</span>
          <p className="mt-1 text-2xl font-bold text-gold-ink">{stats.shortlisted}</p>
        </Card>
        <Card className="p-3.5 border-l-4 border-l-sage">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Selected</span>
          <p className="mt-1 text-2xl font-bold text-sage">{stats.selected}</p>
        </Card>
        <Card className="p-3.5 border-l-4 border-l-gray-400">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Rejected</span>
          <p className="mt-1 text-2xl font-bold text-ink-soft">{stats.rejected}</p>
        </Card>
        <Card className="p-3.5 border-l-4 border-l-rose">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Withdrawn</span>
          <p className="mt-1 text-2xl font-bold text-rose">{stats.withdrawn}</p>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate name, student ID, email, or job title..."
                className="w-full rounded-xl border border-mist bg-paper/60 py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-mist bg-surface px-4 py-2.5 text-xs font-semibold text-ink shadow-sm hover:bg-mist transition"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist/70 pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: `All (${applications.length})` },
                { id: "APPLIED", label: "Applied" },
                { id: "VIEWED", label: "Viewed" },
                { id: "SHORTLISTED", label: "Shortlisted" },
                { id: "INTERVIEW", label: "Interview" },
                { id: "SELECTED", label: "Selected" },
                { id: "REJECTED", label: "Rejected" },
                { id: "WITHDRAWN", label: "Withdrawn" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    statusFilter === tab.id
                      ? "bg-ulab text-white shadow-sm"
                      : "bg-surface text-ink-soft hover:bg-mist hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div>
              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="rounded-lg border border-mist bg-surface px-3 py-1 text-xs font-medium text-ink focus:border-ulab focus:outline-none"
              >
                <option value="ALL">All Jobs ({uniqueJobs.length})</option>
                {uniqueJobs.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Applications Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No applications found"
          body="No candidate applications match your current search or filter criteria."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const config = APPLICATION_STATUS_CONFIG[app.status] || APPLICATION_STATUS_CONFIG.APPLIED;
            const parsed = parseApplicationNote(app.rawNote);

            return (
              <Card
                key={app.id}
                className="p-5 transition hover:border-ulab/30 hover:shadow-xs"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-ink sm:text-lg">{app.student.name}</span>
                      {app.student.studentId && (
                        <Badge tone="blue" className="text-[11px] font-mono">
                          ID: {app.student.studentId}
                        </Badge>
                      )}
                      <Badge tone={config.tone}>{config.label}</Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                      <span>{app.student.email}</span>
                      <span>•</span>
                      <span>{app.student.department || "General"}</span>
                      <span>•</span>
                      <span>
                        Applied for:{" "}
                        <strong className="text-ink">
                          {app.job.title} at {app.job.company}
                        </strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-ink-soft">
                      <span>Submitted {timeAgo(app.createdAt)}</span>
                      {app.viewedAt && <span>Viewed {timeAgo(app.viewedAt)}</span>}
                      {app.hiringNotes && (
                        <span className="text-gold-ink font-semibold">
                          📝 Has Recruiter Notes
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setInspectApp(app)}
                      className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-ulab hover:text-ulab transition"
                    >
                      <Eye size={13} /> Inspect Candidate
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Inspect Application Modal */}
      {inspectApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-mist bg-paper p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setInspectApp(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-ink-soft hover:bg-mist hover:text-ink transition"
            >
              <XCircle size={20} />
            </button>

            <div className="flex items-center gap-2">
              <Badge
                tone={
                  APPLICATION_STATUS_CONFIG[inspectApp.status]?.tone || "blue"
                }
              >
                {APPLICATION_STATUS_CONFIG[inspectApp.status]?.label}
              </Badge>
              <span className="text-xs text-ink-soft">
                Applied {timeAgo(inspectApp.createdAt)}
              </span>
            </div>

            <h2 className="mt-2 text-xl font-bold text-ink">{inspectApp.student.name}</h2>
            <p className="text-xs text-ink-soft">
              {inspectApp.student.email} • ID: {inspectApp.student.studentId || "N/A"} •{" "}
              {inspectApp.student.department}
            </p>

            {/* Target Job Box */}
            <div className="mt-4 rounded-xl border border-mist bg-surface/50 p-3 text-xs">
              <p className="font-bold text-ink">Position: {inspectApp.job.title}</p>
              <p className="text-ink-soft">{inspectApp.job.company} • {inspectApp.job.location}</p>
              <p className="text-[11px] text-ink-soft mt-1">
                Posted by: {inspectApp.job.postedBy.name} ({inspectApp.job.postedBy.role})
              </p>
            </div>

            {/* Candidate Cover Note */}
            {(() => {
              const parsed = parseApplicationNote(inspectApp.rawNote);
              return (
                <div className="mt-4 space-y-3">
                  {parsed.coverNote && (
                    <div className="rounded-xl border border-mist bg-paper p-3 text-xs">
                      <p className="font-bold text-ink uppercase tracking-wider text-[11px] mb-1">
                        Cover Pitch / Why Good Fit:
                      </p>
                      <p className="whitespace-pre-line text-ink-soft leading-relaxed">
                        {parsed.coverNote}
                      </p>
                    </div>
                  )}

                  {/* Attached CV Link */}
                  {(parsed.cvUrl || parsed.cvData) && (
                    <div className="flex items-center justify-between rounded-xl border border-sage/50 bg-sage-wash/40 p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-sage" />
                        <span className="font-semibold text-ink">
                          {parsed.cvFileName || "Candidate_CV.pdf"}
                        </span>
                      </div>
                      <a
                        href={parsed.cvData || parsed.cvUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        download={parsed.cvFileName || "Candidate_CV.pdf"}
                        className="inline-flex items-center gap-1 rounded-lg bg-sage px-3 py-1 font-semibold text-white shadow-xs hover:bg-sage/90"
                      >
                        <Download size={12} /> Open CV
                      </a>
                    </div>
                  )}

                  {/* Recruiter Hiring Notes if any */}
                  {inspectApp.hiringNotes && (
                    <div className="rounded-xl border border-gold/40 bg-gold-wash/50 p-3 text-xs">
                      <p className="font-bold text-gold-ink flex items-center gap-1 mb-1">
                        <FileEdit size={13} /> Internal Recruiter Notes:
                      </p>
                      <p className="whitespace-pre-line text-ink-soft">{inspectApp.hiringNotes}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-6 flex justify-end border-t border-mist pt-4">
              <button
                type="button"
                onClick={() => setInspectApp(null)}
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
