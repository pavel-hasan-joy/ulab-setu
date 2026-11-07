import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import {
  AdminApplicationsView,
  type AdminApplicationItem,
} from "@/components/admin-applications-view";
import type { ApplicationStatus } from "@/lib/applications";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  await requireAdminPermission("applications:view");

  const rawApplications = await db.application.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          studentId: true,
          image: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          type: true,
          postedBy: {
            select: {
              name: true,
              role: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const formatted: AdminApplicationItem[] = rawApplications.map((a) => ({
    id: a.id,
    status: (a.status as ApplicationStatus) || "APPLIED",
    createdAt: a.createdAt.toISOString(),
    viewedAt: a.viewedAt ? a.viewedAt.toISOString() : null,
    statusUpdatedAt: a.statusUpdatedAt ? a.statusUpdatedAt.toISOString() : null,
    hiringNotes: a.hiringNotes,
    rawNote: a.note,
    interviewDate: a.interviewDate ? a.interviewDate.toISOString() : null,
    interviewTime: a.interviewTime,
    interviewType: a.interviewType,
    interviewLocation: a.interviewLocation,
    interviewMeetingLink: a.interviewMeetingLink,
    interviewMessage: a.interviewMessage,
    student: a.student,
    job: a.job,
  }));

  return (
    <PageIn>
      <PageHeader
        title="Job Applications & Candidate Pipeline"
        description="Audit all student application records, track recruitment pipelines, review CVs, and monitor hiring decisions."
      />

      <AdminApplicationsView applications={formatted} />
    </PageIn>
  );
}
