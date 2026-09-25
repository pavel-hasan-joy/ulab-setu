import Link from "next/link";
import { ArrowUpRight, PlusCircle } from "lucide-react";
import { requirePoster } from "@/lib/auth";
import { db } from "@/lib/db";
import { CountUp, PageIn, Stagger, StaggerItem } from "@/components/motion";
import { PendingBanner } from "@/components/pending-banner";
import { Avatar, Badge, ButtonLink, Card, EmptyState, timeAgo } from "@/components/ui";

export default async function AlumniHome() {
  const { user, base } = await requirePoster();
  const [activeJobs, applicants, connections, recent] = await Promise.all([
    db.job.count({ where: { postedById: user.id, active: true } }),
    db.application.count({ where: { job: { postedById: user.id } } }),
    db.connection.count({ where: { status: "ACCEPTED", OR: [{ fromId: user.id }, { toId: user.id }] } }),
    db.application.findMany({ where: { job: { postedById: user.id } }, include: { student: true, job: true }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const firstName = user.name.split(" ")[0];

  return (
    <PageIn>
      {user.status === "PENDING" && <PendingBanner />}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold-wash via-paper to-sky p-6 md:p-8">
        <div className="dots absolute inset-0 opacity-50" />
        <div className="relative">
          <p className="text-sm font-medium text-gold-ink">Welcome back, {firstName}</p>
          <h1 className="mt-1 max-w-lg text-3xl font-semibold md:text-4xl">Someone at ULAB is hoping to hear from you.</h1>
          <div className="mt-6 flex flex-wrap gap-3">
            {user.status === "APPROVED" && <ButtonLink href={`${base}/jobs/new`}><PlusCircle size={16} /> Post a job</ButtonLink>}
            <ButtonLink href={`${base}/messages`} variant="outline">Open messages</ButtonLink>
          </div>
        </div>
      </div>

      <Stagger className="mt-6 grid grid-cols-3 gap-3 md:gap-4">
        {[
          { n: activeJobs, label: "Open jobs", href: `${base}/jobs` },
          { n: applicants, label: "Applicants", href: `${base}/jobs` },
          { n: connections, label: "Conversations", href: `${base}/messages` },
        ].map((s) => (
          <StaggerItem key={s.label}>
            <Link href={s.href}>
              <Card className="p-4 transition hover:shadow-lift md:p-5">
                <CountUp to={s.n} className="font-display text-3xl font-semibold text-gold-ink" />
                <p className="mt-1 text-xs text-ink-soft md:text-sm">{s.label}</p>
              </Card>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Latest applicants</h2>
          <Link href={`${base}/jobs`} className="inline-flex items-center gap-1 text-sm font-semibold text-ulab hover:underline">All jobs <ArrowUpRight size={14} /></Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState title="No applicants yet" body="When students apply to your jobs, they'll show up here with their profile and note." />
        ) : (
          <Stagger className="space-y-3">
            {recent.map((a) => (
              <StaggerItem key={a.id}>
                <Link href={`${base}/jobs/${a.jobId}`}>
                  <Card className="flex items-center gap-4 p-4 transition hover:shadow-lift">
                    <Avatar name={a.student.name} size={42} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{a.student.name}</p>
                      <p className="truncate text-sm text-ink-soft">Applied to {a.job.title}</p>
                    </div>
                    <span className="hidden text-xs text-ink-soft sm:block">{timeAgo(a.createdAt)}</span>
                    {a.status === "SHORTLISTED" && <Badge tone="sage">Shortlisted</Badge>}
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </PageIn>
  );
}
