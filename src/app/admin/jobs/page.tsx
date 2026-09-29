import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import {
  AdminJobsView,
  type AdminJobRecord,
} from "@/components/admin-jobs-view";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  await requireUser("ADMIN");

  const rawJobs = await db.job.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      postedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          company: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });

  const jobs: AdminJobRecord[] = rawJobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    type: j.type,
    category: j.category,
    description: j.description,
    requirements: j.requirements,
    salary: j.salary,
    deadline: j.deadline ? j.deadline.toISOString() : null,
    referral: j.referral,
    active: j.active,
    createdAt: j.createdAt.toISOString(),
    postedBy: j.postedBy,
    applicationsCount: j._count.applications,
  }));

  return (
    <PageIn>
      <PageHeader
        title="Job & Internship Moderation"
        description="Oversee employment circulars, track student applications, review company details, and moderate listings."
      />
      <AdminJobsView jobs={jobs} />
    </PageIn>
  );
}
