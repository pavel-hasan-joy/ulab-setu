import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { requirePoster } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncExpiredJobs } from "@/lib/jobs";
import { PageIn } from "@/components/motion";
import { PendingBanner } from "@/components/pending-banner";
import { ButtonLink, PageHeader } from "@/components/ui";
import { AlumniJobsView, type AlumniJobRecord } from "@/components/alumni-jobs-view";

export const metadata: Metadata = { title: "Job Management CRM | ULAB Setu" };

export default async function MyJobs({
  searchParams,
}: {
  searchParams: Promise<{ posted?: string; updated?: string }>;
}) {
  const { posted, updated } = await searchParams;
  const { user, base } = await requirePoster();
  await syncExpiredJobs();

  const jobs = await db.job.findMany({
    where: { postedById: user.id, deletedAt: null },
    include: {
      applications: {
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedJobs: AlumniJobRecord[] = jobs.map((j) => ({
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
    status: (j.status as any) || (j.active ? "PUBLISHED" : "CLOSED"),
    externalUrl: j.externalUrl,
    contactEmail: j.contactEmail,
    viewsCount: j.viewsCount,
    createdAt: j.createdAt.toISOString(),
    applicationsCount: j.applications.length,
    shortlistedCount: j.applications.filter((a) => a.status === "SHORTLISTED").length,
  }));

  return (
    <PageIn>
      {user.status === "PENDING" && <PendingBanner />}
      <PageHeader
        title="Job Management"
        description="Create, publish, and moderate professional job opportunities and track student applicants."
        action={
          user.status === "APPROVED" && (
            <ButtonLink href={`${base}/jobs/new`}>
              <PlusCircle size={16} /> Post a job
            </ButtonLink>
          )
        }
      />

      {posted && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          🎉 Job posting published successfully! Students can now view and apply for this position.
        </div>
      )}

      {updated && (
        <div className="mb-5 rounded-xl border border-sky/80 bg-sky/40 px-4 py-3 text-sm font-medium text-ulab-deep">
          ✓ Job posting updated successfully.
        </div>
      )}

      <AlumniJobsView jobs={formattedJobs} base={base} userName={user.name} />
    </PageIn>
  );
}
