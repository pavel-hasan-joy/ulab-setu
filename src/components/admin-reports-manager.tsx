"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  UserX,
  FileText,
  Clock,
  ShieldCheck,
  Eye,
  Trash2,
} from "lucide-react";
import { moderateReport } from "@/app/actions/support";
import { Avatar, Badge, Button, cn, timeAgo } from "./ui";

export interface AdminReportItem {
  id: string;
  targetType: string;
  targetId?: string | null;
  reason: string;
  details?: string | null;
  status: string;
  actionTaken?: string | null;
  resolutionNotes?: string | null;
  investigationNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  reporter: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  reportedUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  } | null;
  resolvedBy?: {
    id: string;
    name: string;
  } | null;
}

interface AdminReportsManagerProps {
  initialReports: AdminReportItem[];
}

export function AdminReportsManager({ initialReports }: AdminReportsManagerProps) {
  const [reports, setReports] = useState<AdminReportItem[]>(initialReports);
  const [activeReport, setActiveReport] = useState<AdminReportItem | null>(
    initialReports[0] || null
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [targetFilter, setTargetFilter] = useState("ALL");

  // Moderation modal / action state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [moderationStatus, setModerationStatus] = useState<"INVESTIGATING" | "RESOLVED" | "DISMISSED">("RESOLVED");
  const [moderationAction, setModerationAction] = useState<"WARNED" | "SUSPENDED" | "CONTENT_REMOVED" | "NONE">("NONE");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [investigationNotes, setInvestigationNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredReports = reports.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (targetFilter !== "ALL" && r.targetType !== targetFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.reason.toLowerCase().includes(q) ||
        (r.details && r.details.toLowerCase().includes(q)) ||
        r.reporter.name.toLowerCase().includes(q) ||
        r.reporter.email.toLowerCase().includes(q) ||
        (r.reportedUser && r.reportedUser.name.toLowerCase().includes(q)) ||
        (r.reportedUser && r.reportedUser.email.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const handleExecuteModeration = async () => {
    if (!activeReport) return;
    setIsSubmitting(true);

    await moderateReport(activeReport.id, {
      status: moderationStatus,
      moderationAction,
      resolutionNotes,
      investigationNotes,
    });

    const updated: AdminReportItem = {
      ...activeReport,
      status: moderationStatus,
      actionTaken: moderationAction,
      resolutionNotes: resolutionNotes || activeReport.resolutionNotes,
      investigationNotes: investigationNotes || activeReport.investigationNotes,
      resolvedAt: new Date().toISOString(),
    };

    setActiveReport(updated);
    setReports((prev) => prev.map((r) => (r.id === activeReport.id ? updated : r)));
    setIsSubmitting(false);
    setActionModalOpen(false);
    setResolutionNotes("");
    setInvestigationNotes("");
  };

  const getStatusTone = (status: string): "rose" | "gold" | "sage" | "gray" => {
    switch (status) {
      case "PENDING":
        return "rose";
      case "INVESTIGATING":
        return "gold";
      case "RESOLVED":
        return "sage";
      default:
        return "gray";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-mist bg-surface p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reporter, reported member, reason, details..."
              className="w-full rounded-xl border border-mist bg-paper py-2 pl-9 pr-3 text-xs text-ink focus:border-ulab focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
            <span className="rounded-lg bg-rose/15 px-2.5 py-1 text-rose font-bold">
              Pending: {reports.filter((r) => r.status === "PENDING").length}
            </span>
            <span className="rounded-lg bg-gold/15 px-2.5 py-1 text-gold-ink">
              Investigating: {reports.filter((r) => r.status === "INVESTIGATING").length}
            </span>
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Resolved: {reports.filter((r) => r.status === "RESOLVED").length}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-mist/60">
          <div className="flex items-center gap-1.5 text-xs text-ink-soft">
            <Filter size={13} />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-mist bg-paper px-2.5 py-1.5 text-xs focus:border-ulab focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="INVESTIGATING">Under Investigation</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="rounded-xl border border-mist bg-paper px-2.5 py-1.5 text-xs focus:border-ulab focus:outline-none"
          >
            <option value="ALL">All Target Types</option>
            <option value="USER">User / Account</option>
            <option value="JOB">Job Opportunity</option>
            <option value="MESSAGE">Direct Message</option>
            <option value="POST">Campus Notice / Post</option>
            <option value="PROFILE">Profile Information</option>
            <option value="TUITION">Tuition Posting</option>
          </select>
        </div>
      </div>

      {/* Reports Workspace */}
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left: Queue List */}
        <div className="space-y-3">
          {filteredReports.length === 0 ? (
            <div className="rounded-2xl border border-mist bg-surface p-8 text-center shadow-soft">
              <ShieldCheck size={24} className="mx-auto text-emerald-600" />
              <p className="mt-3 text-xs font-bold text-ink">All clear</p>
              <p className="mt-1 text-[11px] text-ink-soft">No misconduct reports match filters.</p>
            </div>
          ) : (
            filteredReports.map((r) => {
              const isSelected = activeReport?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setActiveReport(r)}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-4 transition shadow-soft",
                    isSelected
                      ? "border-ulab bg-sky/30 dark:bg-sky/10"
                      : "border-mist/70 bg-surface hover:bg-paper/70"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-rose">
                      {r.reason.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge tone="gray" className="text-[10px]">
                        {r.targetType}
                      </Badge>
                      <Badge tone={getStatusTone(r.status)} className="text-[10px]">
                        {r.status}
                      </Badge>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-ink line-clamp-2 leading-relaxed">
                    {r.details || "No additional text details provided."}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-ink-soft">
                    <span>By: <strong>{r.reporter.name}</strong></span>
                    <span>{timeAgo(r.createdAt)}</span>
                  </div>

                  {r.reportedUser && (
                    <p className="mt-1 text-[10px] text-rose font-medium">
                      Accused: {r.reportedUser.name} ({r.reportedUser.role})
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right: Detailed Investigation Desk */}
        <div className="rounded-2xl border border-mist bg-surface p-5 shadow-soft">
          {activeReport ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="border-b border-mist/70 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider bg-rose/10 text-rose px-2.5 py-1 rounded-lg">
                      {activeReport.reason.replace(/_/g, " ")}
                    </span>
                    <Badge tone="gray">Type: {activeReport.targetType}</Badge>
                    <Badge tone={getStatusTone(activeReport.status)}>
                      {activeReport.status}
                    </Badge>
                    {activeReport.actionTaken && activeReport.actionTaken !== "NONE" && (
                      <span className="rounded bg-rose px-2 py-0.5 text-[10px] font-bold text-white">
                        Action: {activeReport.actionTaken}
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      setModerationStatus("RESOLVED");
                      setActionModalOpen(true);
                    }}
                    className="py-1 px-3 text-xs font-semibold"
                  >
                    Moderate & Resolve
                  </Button>
                </div>

                <div className="mt-4 rounded-xl bg-paper p-3.5 border border-mist/60 text-xs">
                  <p className="font-bold text-ink mb-1">Reported Details / Context:</p>
                  <p className="text-ink-soft whitespace-pre-line leading-relaxed">
                    {activeReport.details || "No text details provided."}
                  </p>
                </div>
              </div>

              {/* Investigation Context & Accused Member Info */}
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                {/* Reporter Box */}
                <div className="rounded-xl border border-mist bg-paper/60 p-3.5">
                  <p className="font-bold text-ink mb-2">Reporter Information:</p>
                  <p>Name: <strong>{activeReport.reporter.name}</strong></p>
                  <p className="text-ink-soft">Email: {activeReport.reporter.email}</p>
                  <p className="text-ink-soft">Role: {activeReport.reporter.role}</p>
                  <p className="text-ink-soft mt-1">Submitted: {timeAgo(activeReport.createdAt)}</p>
                </div>

                {/* Accused Member / Target Box */}
                <div className="rounded-xl border border-mist bg-paper/60 p-3.5">
                  <p className="font-bold text-ink mb-2">Accused Target:</p>
                  {activeReport.reportedUser ? (
                    <>
                      <p>Name: <strong>{activeReport.reportedUser.name}</strong></p>
                      <p className="text-ink-soft">Email: {activeReport.reportedUser.email}</p>
                      <p className="text-ink-soft">
                        Status: <strong className="uppercase">{activeReport.reportedUser.status}</strong>
                      </p>
                      <Link
                        href={`/admin/users?q=${encodeURIComponent(activeReport.reportedUser.email)}`}
                        className="mt-2 inline-flex items-center gap-1 text-ulab font-semibold hover:underline"
                      >
                        Inspect User in Admin CRM
                        <ExternalLink size={12} />
                      </Link>
                    </>
                  ) : activeReport.targetId ? (
                    <>
                      <p className="text-ink-soft">Target ID: <code className="font-mono">{activeReport.targetId}</code></p>
                      {activeReport.targetType === "JOB" && (
                        <Link
                          href={`/student/jobs/${activeReport.targetId}`}
                          target="_blank"
                          className="mt-2 inline-flex items-center gap-1 text-ulab font-semibold hover:underline"
                        >
                          View Reported Job Listing
                          <ExternalLink size={12} />
                        </Link>
                      )}
                    </>
                  ) : (
                    <p className="text-ink-soft">No specific target account linked.</p>
                  )}
                </div>
              </div>

              {/* Resolution History */}
              {activeReport.status !== "PENDING" && (
                <div className="rounded-xl border border-mist bg-paper p-3.5 text-xs space-y-2">
                  <p className="font-bold text-ink">Resolution Record:</p>
                  {activeReport.resolvedBy && (
                    <p className="text-ink-soft">
                      Resolved by: <strong>{activeReport.resolvedBy.name}</strong> {activeReport.resolvedAt && `(${timeAgo(activeReport.resolvedAt)})`}
                    </p>
                  )}
                  {activeReport.actionTaken && (
                    <p className="text-ink">
                      Action Taken: <strong className="text-rose uppercase">{activeReport.actionTaken}</strong>
                    </p>
                  )}
                  {activeReport.resolutionNotes && (
                    <p className="text-ink-soft">
                      Notes: {activeReport.resolutionNotes}
                    </p>
                  )}
                  {activeReport.investigationNotes && (
                    <p className="text-ink-soft font-mono text-[11px]">
                      Investigation: {activeReport.investigationNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid h-72 place-items-center text-center">
              <div>
                <ShieldAlert size={28} className="mx-auto text-ink-soft" />
                <p className="mt-2 text-sm font-semibold text-ink">Select a report</p>
                <p className="text-xs text-ink-soft">
                  Choose a misconduct report from the left queue to investigate.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Moderation Decision Modal */}
      {actionModalOpen && activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-mist bg-surface p-6 shadow-lift">
            <h3 className="font-display text-base font-bold text-ink">
              Moderate & Resolve Report
            </h3>
            <p className="mt-1 text-xs text-ink-soft">
              Select concrete moderation enforcement and record audit notes.
            </p>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-ink">Outcome Status</label>
                <select
                  value={moderationStatus}
                  onChange={(e) => setModerationStatus(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2 text-xs focus:border-ulab focus:outline-none"
                >
                  <option value="RESOLVED">Resolved (Action Applied or Handled)</option>
                  <option value="INVESTIGATING">Under Investigation (Keep Active)</option>
                  <option value="DISMISSED">Dismissed (Unfounded / No Action Required)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-ink">Enforcement Action</label>
                <select
                  value={moderationAction}
                  onChange={(e) => setModerationAction(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2 text-xs focus:border-ulab focus:outline-none"
                >
                  <option value="NONE">No Penalties (Informational / Dismissed)</option>
                  <option value="WARNED">Send Official Disciplinary Warning</option>
                  <option value="SUSPENDED">Suspend User Account Immediately</option>
                  <option value="CONTENT_REMOVED">Remove / Takedown Reported Content</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-ink">Resolution Notes (Public or feedback to reporter)</label>
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Content taken down and account placed under formal warning..."
                  className="mt-1 w-full rounded-xl border border-mist bg-paper p-2.5 text-xs focus:border-ulab focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-ink">Internal Investigation Notes (Staff audit only)</label>
                <textarea
                  rows={2}
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  placeholder="Record internal verification evidence or administrator notes..."
                  className="mt-1 w-full rounded-xl border border-mist bg-paper p-2.5 text-xs focus:border-ulab focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-mist/70 pt-4">
              <Button
                variant="ghost"
                onClick={() => setActionModalOpen(false)}
                className="py-1.5 px-3 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteModeration}
                disabled={isSubmitting}
                className="py-1.5 px-4 text-xs font-semibold"
              >
                {isSubmitting ? "Applying..." : "Confirm & Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

