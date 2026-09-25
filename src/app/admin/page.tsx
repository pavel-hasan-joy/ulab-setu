import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn, Stagger, StaggerItem } from "@/components/motion";
import { Avatar, Badge, Card, EmptyState, PageHeader, timeAgo } from "@/components/ui";
import { ApprovalButtons } from "./approval-buttons";

export default async function AdminPage() {
  await requireUser("ADMIN");
  const [pending, approvedCount] = await Promise.all([
    db.user.findMany({ where: { role: { in: ["ALUMNI", "TEACHER"] }, status: "PENDING" }, orderBy: { createdAt: "asc" } }),
    db.user.count({ where: { role: "ALUMNI", status: "APPROVED" } }),
  ]);

  return (
    <PageIn>
      <PageHeader title="Approvals" description={`Check alumni student IDs and faculty emails against university records before approving. ${approvedCount} alumni verified so far.`} />
      {pending.length === 0 ? (
        <EmptyState title="All caught up" body="New alumni and teacher sign-ups will appear here for verification." />
      ) : (
        <Stagger className="space-y-3">
          {pending.map((u) => (
            <StaggerItem key={u.id}>
              <Card className="flex flex-wrap items-center gap-4 p-5">
                <Avatar name={u.name} size={46} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{u.name}</p>
                    <Badge tone={u.role === "TEACHER" ? "lilac" : "gold"}>{u.role === "TEACHER" ? "Teacher" : "Alumni"}</Badge>
                  </div>
                  {u.role === "TEACHER" ? (
                    <p className="text-sm text-ink-soft">{u.designation}, {u.department}</p>
                  ) : (
                    <p className="text-sm text-ink-soft">{u.department}, graduated {u.graduationYear}. Student ID <span className="font-semibold text-ink">{u.studentId}</span>. {u.designation} at {u.company}.</p>
                  )}
                  <p className="text-xs text-ink-soft">{u.email}. Signed up {timeAgo(u.createdAt)}.</p>
                </div>
                <ApprovalButtons userId={u.id} />
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </PageIn>
  );
}
