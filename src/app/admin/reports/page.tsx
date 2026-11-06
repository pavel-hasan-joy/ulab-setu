import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { AdminReportsManager } from "@/components/admin-reports-manager";

export default async function AdminReportsPage() {
  await requireAdminPermission("reports:manage");

  const rawReports = await db.userReport.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: {
        select: { id: true, name: true, email: true, role: true },
      },
      reportedUser: {
        select: { id: true, name: true, email: true, role: true, status: true },
      },
      resolvedBy: { select: { id: true, name: true } },
    },
  });

  const serialized = rawReports.map((r) => ({
    id: r.id,
    targetType: r.targetType,
    targetId: r.targetId,
    reason: r.reason,
    details: r.details,
    status: r.status,
    actionTaken: r.actionTaken,
    resolutionNotes: r.resolutionNotes,
    investigationNotes: r.investigationNotes,
    createdAt: r.createdAt.toISOString(),
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
    reporter: r.reporter,
    reportedUser: r.reportedUser,
    resolvedBy: r.resolvedBy,
  }));

  return (
    <PageIn>
      <PageHeader
        title="Community Safety & Moderation Reports"
        description="Investigate misconduct reports, review evidence, execute enforcement actions, and maintain audit records."
      />
      <div className="mt-6">
        <AdminReportsManager initialReports={serialized} />
      </div>
    </PageIn>
  );
}
