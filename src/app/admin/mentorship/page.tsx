import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { AdminMentorshipManager } from "@/components/admin-mentorship-manager";

export default async function AdminMentorshipPage() {
  await requireAdminPermission("mentorship:view");

  const [rawRequests, totalMentorsCount] = await Promise.all([
    db.mentorshipRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: { id: true, name: true, email: true, department: true, image: true },
        },
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            company: true,
            designation: true,
            department: true,
          },
        },
      },
    }),
    db.user.count({
      where: { isMentor: true, status: "APPROVED" },
    }),
  ]);

  const serialized = rawRequests.map((r) => ({
    id: r.id,
    topic: r.topic,
    message: r.message,
    careerGoals: r.careerGoals,
    status: r.status,
    sessionFormat: r.sessionFormat,
    scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : null,
    sessionLink: r.sessionLink,
    mentorNotes: r.mentorNotes,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    student: r.student,
    mentor: r.mentor,
  }));

  return (
    <PageIn>
      <PageHeader
        title="Student-Alumni Career Mentorship"
        description="Monitor 1-on-1 guidance, mock interviews, career roadmap advisories, and completed sessions across the university network."
      />
      <div className="mt-6">
        <AdminMentorshipManager
          initialRequests={serialized}
          totalMentorsCount={totalMentorsCount}
        />
      </div>
    </PageIn>
  );
}
