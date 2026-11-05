import {
  AlertTriangle,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  UserX,
} from "lucide-react";
import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { Avatar, Badge, ButtonLink, Card, EmptyState, PageHeader, timeAgo } from "@/components/ui";
import { AdminReportActions } from "@/components/admin-report-actions";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  await requireAdminPermission("reports:manage");
  const params = await searchParams;
  const statusFilter = params?.status || "PENDING";

  const reports = await db.userReport.findMany({
    where: statusFilter === "ALL" ? {} : { status: statusFilter },
    include: {
      reporter: { select: { id: true, name: true, email: true, role: true } },
      reportedUser: { select: { id: true, name: true, email: true, role: true } },
      resolvedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageIn>
      <PageHeader
        title="Community Safety & Misconduct Reports"
        description="Review and resolve flags submitted by students, alumni, or faculty regarding inappropriate content or misconduct."
      />

      {/* Status Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { id: "PENDING", label: "Pending Review" },
          { id: "INVESTIGATING", label: "Investigating" },
          { id: "RESOLVED", label: "Resolved" },
          { id: "DISMISSED", label: "Dismissed" },
          { id: "ALL", label: "All Reports" },
        ].map((tab) => (
          <ButtonLink
            key={tab.id}
            href={`/admin/reports?status=${tab.id}`}
            variant={statusFilter === tab.id ? "primary" : "outline"}
            className="text-xs py-1.5 px-3"
          >
            {tab.label}
          </ButtonLink>
        ))}
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="All clear"
          body={`No ${statusFilter.toLowerCase()} trust and safety reports to display.`}
        />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="p-4 transition hover:shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-rose/10 p-2 text-rose">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-rose">
                        {r.reason}
                      </span>
                      <Badge tone="gray" className="text-[10px]">
                        Target: {r.targetType}
                      </Badge>
                      <Badge
                        tone={
                          r.status === "PENDING"
                            ? "rose"
                            : r.status === "RESOLVED"
                            ? "sage"
                            : "gray"
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>

                    <p className="mt-1 text-xs text-ink">{r.details || "No additional text provided."}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-ink-soft">
                      <span>Reported by: <strong>{r.reporter.name}</strong> ({r.reporter.email})</span>
                      {r.reportedUser && (
                        <span>
                          Target User: <strong>{r.reportedUser.name}</strong> ({r.reportedUser.email})
                        </span>
                      )}
                      <span>Filed {timeAgo(r.createdAt)}</span>
                    </div>

                    {r.resolutionNotes && (
                      <div className="mt-2 rounded-xl border border-mist/80 bg-paper/60 p-2 text-[11px] text-ink-soft dark:border-white/5">
                        <span className="font-semibold text-ink">Admin Resolution: </span>
                        {r.resolutionNotes} (by {r.resolvedBy?.name || "Admin"})
                      </div>
                    )}
                  </div>
                </div>

                {r.status === "PENDING" && <AdminReportActions reportId={r.id} />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageIn>
  );
}

