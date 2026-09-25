import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn, Stagger, StaggerItem } from "@/components/motion";
import { PendingBanner } from "@/components/pending-banner";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, formatDate } from "@/components/ui";
import { JobToggle } from "./job-toggle";

export const metadata: Metadata = { title: "My jobs" };

export default async function MyJobs({ searchParams }: { searchParams: Promise<{ posted?: string }> }) {
  const { posted } = await searchParams;
  const user = await requireUser("ALUMNI");
  const jobs = await db.job.findMany({
    where: { postedById: user.id },
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageIn>
      {user.status === "PENDING" && <PendingBanner />}
      <PageHeader
        title="My jobs"
        description="Jobs you've posted for ULAB students."
        action={user.status === "APPROVED" && <ButtonLink href="/alumni/jobs/new"><PlusCircle size={16} /> Post a job</ButtonLink>}
      />
      {posted && <p className="mb-5 rounded-xl bg-sage-wash px-4 py-3 text-sm font-medium text-sage">Job posted. Students can see it now.</p>}
      {jobs.length === 0 ? (
        <EmptyState title="You haven't posted a job yet" body="Even one internship makes a difference to a final-year student." action={user.status === "APPROVED" && <ButtonLink href="/alumni/jobs/new">Post your first job</ButtonLink>} />
      ) : (
        <Stagger className="space-y-3">
          {jobs.map((job) => (
            <StaggerItem key={job.id}>
              <Card className="flex flex-wrap items-center gap-4 p-5">
                <Link href={`/alumni/jobs/${job.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold hover:text-ulab-deep">{job.title}</p>
                    {!job.active && <Badge tone="gray">Closed</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-soft">{job.type}, {job.location}{job.deadline ? `, apply by ${formatDate(job.deadline)}` : ""}</p>
                </Link>
                <Link href={`/alumni/jobs/${job.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-sky px-3.5 py-2 text-sm font-semibold text-ulab-deep transition hover:bg-mist">
                  <Users size={15} /> {job._count.applications} applicant{job._count.applications === 1 ? "" : "s"}
                </Link>
                <JobToggle jobId={job.id} active={job.active} />
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </PageIn>
  );
}
