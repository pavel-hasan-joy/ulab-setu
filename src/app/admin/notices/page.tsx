import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import {
  AdminNoticesView,
  type AdminNoticeRecord,
} from "@/components/admin-notices-view";

export const dynamic = "force-dynamic";

export default async function AdminNoticesPage() {
  const { user: admin } = await requireAdminPermission("notifications:manage");

  const rawNotices = await db.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          designation: true,
        },
      },
    },
  });

  const notices: AdminNoticeRecord[] = rawNotices.map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    link: n.link,
    eventDate: n.eventDate ? n.eventDate.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
    author: n.author,
  }));

  return (
    <PageIn>
      <PageHeader
        title="Notices & Broadcast Management"
        description="Publish official university alerts, promote scholarships, announce campus events, and moderate community posts."
      />
      <AdminNoticesView
        notices={notices}
        currentAdminName={admin.name}
      />
    </PageIn>
  );
}
