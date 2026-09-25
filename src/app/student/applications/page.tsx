import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn, Stagger, StaggerItem } from "@/components/motion";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, timeAgo } from "@/components/ui";

export const metadata: Metadata = { title: "Applications" };

const tone = { APPLIED: "blue", SHORTLISTED: "sage", REJECTED: "gray" } as const;
const label = { APPLIED: "Sent", SHORTLISTED: "Shortlisted", REJECTED: "Not selected" } as const;

export default async function Applications() {
  const user = await requireUser("STUDENT");
  const apps = await db.application.findMany({
    where: { studentId: user.id },
    include: { job: { include: { postedBy: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageIn>
      <PageHeader title="My applications" description="Track every alumni job you've applied to. Jobs from Bdjobs and other sites are tracked on those sites." />
      {apps.length === 0 ? (
        <EmptyState title="You haven't applied yet" body="Alumni jobs often come with a referral. Start there." action={<ButtonLink href="/student/jobs">Browse alumni jobs</ButtonLink>} />
      ) : (
        <Stagger className="space-y-3">
          {apps.map((a) => (
            <StaggerItem key={a.id}>
              <Link href={`/student/jobs/${a.jobId}`}>
                <Card className="flex flex-wrap items-center gap-4 p-5 transition hover:shadow-lift">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.job.title}</p>
                    <p className="text-sm text-ink-soft">{a.job.company}, posted by {a.job.postedBy.name}</p>
                  </div>
                  <span className="text-xs text-ink-soft">{timeAgo(a.createdAt)}</span>
                  <Badge tone={tone[a.status as keyof typeof tone]}>{label[a.status as keyof typeof label]}</Badge>
                </Card>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </PageIn>
  );
}
