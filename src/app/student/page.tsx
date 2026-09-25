import Link from "next/link";
import { ArrowUpRight, Briefcase, MessageCircle, Sparkles, UserRoundPen } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AlumniJobCard } from "@/components/job-cards";
import { CountUp, PageIn, Stagger, StaggerItem } from "@/components/motion";
import { Avatar, ButtonLink, Card } from "@/components/ui";

export default async function StudentHome() {
  const user = await requireUser("STUDENT");
  const [applications, connections, jobs, alumni] = await Promise.all([
    db.application.count({ where: { studentId: user.id } }),
    db.connection.count({ where: { status: "ACCEPTED", OR: [{ fromId: user.id }, { toId: user.id }] } }),
    db.job.findMany({ where: { active: true }, include: { postedBy: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.user.findMany({ where: { role: "ALUMNI", status: "APPROVED", department: user.department }, take: 4, orderBy: { graduationYear: "desc" } }),
  ]);
  // Jobs posted by alumni from the student's own department come first.
  const picks = [...jobs].sort((a, b) => Number(b.postedBy.department === user.department) - Number(a.postedBy.department === user.department)).slice(0, 4);
  const profileDone = [user.bio, user.skills, user.linkedin].filter(Boolean).length;
  const firstName = user.name.split(" ")[0];

  return (
    <PageIn>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky via-[#f3f8fd] to-gold-wash/80 p-6 md:p-8">
        <div className="dots absolute inset-0 opacity-50" />
        <div className="relative">
          <p className="text-sm font-medium text-ulab-deep">Hello {firstName}</p>
          <h1 className="mt-1 max-w-lg text-3xl font-semibold md:text-4xl">What would you like to work on today?</h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/student/jobs"><Briefcase size={16} /> Browse jobs</ButtonLink>
            <ButtonLink href="/student/alumni" variant="outline"><MessageCircle size={16} /> Talk to alumni</ButtonLink>
          </div>
        </div>
      </div>

      <Stagger className="mt-6 grid grid-cols-3 gap-3 md:gap-4">
        {[
          { n: applications, label: "Applications", href: "/student/applications" },
          { n: connections, label: "Alumni connections", href: "/student/messages" },
          { n: jobs.length, label: "Open alumni jobs", href: "/student/jobs" },
        ].map((s) => (
          <StaggerItem key={s.label}>
            <Link href={s.href}>
              <Card className="p-4 transition hover:shadow-lift md:p-5">
                <CountUp to={s.n} className="font-display text-3xl font-semibold text-ulab-deep" />
                <p className="mt-1 text-xs text-ink-soft md:text-sm">{s.label}</p>
              </Card>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      {profileDone < 3 && (
        <Card className="mt-6 flex flex-wrap items-center gap-4 border-gold/40 bg-gold-wash/60 p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-surface text-[#9a7212]"><UserRoundPen size={18} /></span>
          <div className="flex-1">
            <p className="font-semibold">Finish your profile so alumni can say yes</p>
            <p className="text-sm text-ink-soft">A short bio and your skills are required to apply. {profileDone} of 3 done.</p>
          </div>
          <ButtonLink href="/student/profile" variant="outline">Edit profile</ButtonLink>
        </Card>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><Sparkles size={18} className="text-gold" /> Picked for you</h2>
          <Link href="/student/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-ulab hover:underline">All jobs <ArrowUpRight size={14} /></Link>
        </div>
        <Stagger className="grid gap-4 sm:grid-cols-2">
          {picks.map((job) => (
            <StaggerItem key={job.id}><AlumniJobCard job={job} href={`/student/jobs/${job.id}`} /></StaggerItem>
          ))}
        </Stagger>
      </section>

      {alumni.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold">Alumni from your department</h2>
            <Link href="/student/alumni" className="inline-flex items-center gap-1 text-sm font-semibold text-ulab hover:underline">See all <ArrowUpRight size={14} /></Link>
          </div>
          <Stagger className="grid gap-3 sm:grid-cols-2">
            {alumni.map((a) => (
              <StaggerItem key={a.id}>
                <Link href={`/student/alumni?q=${encodeURIComponent(a.name)}`}>
                  <Card className="flex items-center gap-3 p-4 transition hover:shadow-lift">
                    <Avatar name={a.name} size={44} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{a.name}</p>
                      <p className="truncate text-sm text-ink-soft">{a.designation} at {a.company}</p>
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}
    </PageIn>
  );
}
