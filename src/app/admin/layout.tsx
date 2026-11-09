import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAdminSubRole } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("ADMIN");
  const subRole = getAdminSubRole(user);

  // Real database-driven notification badge counts
  const [pendingReports, pendingMentorship, pendingApprovals, pendingCmsReview] = await Promise.all([
    db.userReport.count({ where: { status: "PENDING" } }).catch(() => 0),
    db.mentorshipRequest.count({ where: { status: "PENDING" } }).catch(() => 0),
    db.user.count({ where: { status: "PENDING" } }).catch(() => 0),
    db.cmsContent.count({ where: { status: "IN_REVIEW", deletedAt: null } }).catch(() => 0),
  ]);

  return (
    <AdminShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        subRole,
      }}
      badgeCounts={{
        pendingReports,
        pendingMentorship,
        pendingApprovals,
        pendingCmsReview,
      }}
    >
      {children}
    </AdminShell>
  );
}
