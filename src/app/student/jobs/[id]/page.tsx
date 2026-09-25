import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin, Tag, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { Avatar, Badge, Card, formatDate, timeAgo } from "@/components/ui";
import { ApplyPanel } from "./apply-panel";

export default async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser("STUDENT");
  const job = await db.job.findUnique({ where: { id }, include: { postedBy: true } });
  if (!job) notFound();
  const application = await db.application.findUnique({ where: { jobId_studentId: { jobId: id, studentId: user.id } } });

  return (
    <PageIn>
      <Link href="/student/jobs" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"><ArrowLeft size={16} /> All jobs</Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap gap-1.5">
            <Badge>{job.type}</Badge>
            {job.referral && <Badge tone="gold">Referral available</Badge>}
            {!job.active && <Badge tone="gray">Closed</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{job.title}</h1>
          <p className="mt-1.5 text-lg text-ink-soft">{job.company}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{job.location}</span>
            <span className="inline-flex items-center gap-1.5"><Tag size={15} />{job.category}</span>
            {job.salary && <span className="inline-flex items-center gap-1.5"><Wallet size={15} />{job.salary}</span>}
            {job.deadline && <span className="inline-flex items-center gap-1.5"><CalendarClock size={15} />Apply by {formatDate(job.deadline)}</span>}
          </div>

          <Card className="mt-8 p-6">
            <h2 className="text-lg font-semibold">About the role</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{job.description}</p>
            {job.requirements && (
              <>
                <h2 className="mt-8 text-lg font-semibold">What they&apos;re looking for</h2>
                <ul className="mt-3 space-y-2">
                  {job.requirements.split("\n").filter(Boolean).map((r) => (
                    <li key={r} className="flex gap-2.5 text-ink-soft"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-ulab-light" />{r}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-8 text-xs text-ink-soft">Posted {timeAgo(job.createdAt)}</p>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <ApplyPanel jobId={job.id} open={job.active} applied={application?.status ?? null} />
          <Card className="p-5">
            <p className="text-xs font-medium text-ink-soft">Posted by</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={job.postedBy.name} size={44} />
              <div>
                <p className="font-semibold">{job.postedBy.name}</p>
                <p className="text-sm text-ink-soft">{job.postedBy.department}, class of {job.postedBy.graduationYear}</p>
              </div>
            </div>
            <Link href={`/student/alumni?q=${encodeURIComponent(job.postedBy.name)}`} className="mt-4 block rounded-xl bg-sky px-4 py-2.5 text-center text-sm font-semibold text-ulab-deep transition hover:bg-mist">
              Ask {job.postedBy.name.split(" ")[0]} a question
            </Link>
          </Card>
        </aside>
      </div>
    </PageIn>
  );
}
