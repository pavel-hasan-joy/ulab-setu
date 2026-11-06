import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { syncExpiredJobs } from "@/lib/jobs";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import {
  AdminJobsView,
  type AdminJobRecord,
  type JobReportItem,
} from "@/components/admin-jobs-view";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  await requireAdminPermission("jobs:manage");
  await syncExpiredJobs();

  // Fetch all jobs
  const rawJobs = await db.job.findMany({
    where: { deletedAt: null },
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

  // Fetch pending reports on jobs
  const pendingReports = await db.userReport.findMany({
    where: {
      targetType: "JOB",
      status: "PENDING",
    },
    include: {
      reporter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group reports by targetId (jobId)
  const reportsByJobId = new Map<string, JobReportItem[]>();
  for (const r of pendingReports) {
    if (!r.targetId) continue;
    const existing = reportsByJobId.get(r.targetId) || [];
    existing.push({
      id: r.id,
      reason: r.reason,
      details: r.details,
      createdAt: r.createdAt.toISOString(),
      reporterName: r.reporter.name,
      reporterEmail: r.reporter.email,
    });
    reportsByJobId.set(r.targetId, existing);
  }

  const jobs: AdminJobRecord[] = rawJobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    type: j.type,
    category: j.category,
    description: j.description,
    requirements: j.requirements,
    skills: j.skills,
    salary: j.salary,
    experienceLevel: j.experienceLevel,
    deadline: j.deadline ? j.deadline.toISOString() : null,
    referral: j.referral,
    active: j.active,
    status: j.status || (j.active ? "PUBLISHED" : "CLOSED"),
    externalUrl: j.externalUrl,
    contactEmail: j.contactEmail,
    viewsCount: j.viewsCount,
    createdAt: j.createdAt.toISOString(),
    postedBy: j.postedBy,
    applicationsCount: j._count.applications,
    pendingReports: reportsByJobId.get(j.id) || [],
  }));

  return (
    <PageIn>
      <PageHeader
        title="Job & Internship Moderation"
        description="Oversee employment circulars, track student applications, review company details, and investigate reported listings."
      />

      <AdminJobsView jobs={jobs} />
    </PageIn>
  );
}
