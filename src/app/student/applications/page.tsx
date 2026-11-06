import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import {
  StudentApplicationsView,
  type StudentApplicationRecord,
} from "@/components/student-applications-view";
import type { ApplicationStatus } from "@/lib/applications";

export const metadata: Metadata = { title: "My Applications | ULAB Setu" };

export default async function ApplicationsPage() {
  const user = await requireUser("STUDENT");

  const rawApps = await db.application.findMany({
    where: { studentId: user.id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          type: true,
          salary: true,
          referral: true,
          active: true,
          postedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedApps: StudentApplicationRecord[] = rawApps.map((a) => ({
    id: a.id,
    status: (a.status as ApplicationStatus) || "APPLIED",
    createdAt: a.createdAt.toISOString(),
    viewedAt: a.viewedAt ? a.viewedAt.toISOString() : null,
    statusUpdatedAt: a.statusUpdatedAt ? a.statusUpdatedAt.toISOString() : null,
    withdrawnAt: a.withdrawnAt ? a.withdrawnAt.toISOString() : null,
    rawNote: a.note,
    job: a.job,
  }));

  return (
    <PageIn>
      <PageHeader
        title="My Applications"
        description="Track all job applications submitted to ULAB alumni and faculty. Monitor recruiter reviews and interview invitations in real time."
      />

      <StudentApplicationsView applications={formattedApps} />
    </PageIn>
  );
}
