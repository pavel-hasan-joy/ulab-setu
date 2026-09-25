import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requirePoster } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn, Stagger, StaggerItem } from "@/components/motion";
import { Avatar, Badge, Card, EmptyState, timeAgo } from "@/components/ui";
import { ApplicantActions } from "./applicant-actions";

export default async function JobApplicants({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, base } = await requirePoster();
  const job = await db.job.findFirst({
    where: { id, postedById: user.id },
    include: { applications: { include: { student: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!job) notFound();

  return (
    <PageIn>
      <Link href={`${base}/jobs`} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"><ArrowLeft size={16} /> My jobs</Link>
      <h1 className="mt-4 text-3xl font-semibold">{job.title}</h1>
      <p className="mt-1 text-ink-soft">{job.applications.length} applicant{job.applications.length === 1 ? "" : "s"}</p>

      <div className="mt-8">
        {job.applications.length === 0 ? (
          <EmptyState title="No applicants yet" body="Share the job with your department's student groups to get it noticed." />
        ) : (
          <Stagger className="space-y-4">
            {job.applications.map((a) => (
              <StaggerItem key={a.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start gap-4">
                    <Avatar name={a.student.name} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-lg font-semibold">{a.student.name}</p>
                        {a.status === "SHORTLISTED" && <Badge tone="sage">Shortlisted</Badge>}
                        {a.status === "REJECTED" && <Badge tone="gray">Not selected</Badge>}
                      </div>
                      <p className="text-sm text-ink-soft">{a.student.department}, admitted {a.student.batch}. Applied {timeAgo(a.createdAt)}.</p>
                      {a.student.linkedin && (
                        <a href={a.student.linkedin} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-ulab hover:underline">LinkedIn <ExternalLink size={13} /></a>
                      )}
                    </div>
                    <ApplicantActions applicationId={a.id} status={a.status} />
                  </div>
                  {a.note && <p className="mt-4 rounded-xl bg-paper px-4 py-3 text-sm leading-relaxed">&ldquo;{a.note}&rdquo;</p>}
                  {a.student.bio && <p className="mt-3 text-sm text-ink-soft">{a.student.bio}</p>}
                  {a.student.skills && (
                    <div className="mt-3 flex flex-wrap gap-1.5">{a.student.skills.split(",").map((s) => <Badge key={s} tone="gray">{s.trim()}</Badge>)}</div>
                  )}
                  <p className="mt-3 text-xs text-ink-soft">Contact: {a.student.email}</p>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </PageIn>
  );
}
