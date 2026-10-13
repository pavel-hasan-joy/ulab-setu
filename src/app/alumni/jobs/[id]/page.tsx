import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePoster } from "@/lib/auth";
import { db } from "@/lib/db";
import { cleanExpiredJobs } from "@/lib/jobs";
import { parseApplicationNote } from "@/lib/applications";
import { PageIn, Stagger, StaggerItem } from "@/components/motion";
import { EmptyState } from "@/components/ui";
import { ApplicantCard } from "./applicant-card";

export default async function JobApplicants({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, base } = await requirePoster();
  await cleanExpiredJobs();
  const job = await db.job.findFirst({
    where: { id, postedById: user.id },
    include: { applications: { include: { student: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!job) notFound();

  return (
    <PageIn>
      <Link href={`${base}/jobs`} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> My jobs
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">{job.title}</h1>
      <p className="mt-1 text-ink-soft">
        {job.applications.length} applicant{job.applications.length === 1 ? "" : "s"}
      </p>

      <div className="mt-8">
        {job.applications.length === 0 ? (
          <EmptyState
            title="No applicants yet"
            body="Share the job with your department's student groups to get it noticed."
          />
        ) : (
          <Stagger className="space-y-4">
            {job.applications.map((a) => {
              const app = parseApplicationNote(a.note);
              return (
                <StaggerItem key={a.id}>
                  <ApplicantCard
                    applicationId={a.id}
                    status={a.status}
                    createdAt={a.createdAt}
                    student={a.student}
                    app={app}
                    base={base}
                  />
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </div>
    </PageIn>
  );
}
