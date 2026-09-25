import Link from "next/link";
import { ArrowUpRight, BadgeCheck, MessageCircle, Search, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { CinematicHero } from "@/components/landing/cinematic-hero";
import { JobPortals } from "@/components/job-portals";
import { MorphStory } from "@/components/landing/morph-story";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { ScrollText } from "@/components/landing/scroll-text";
import { WalkStory } from "@/components/landing/walk-story";
import { CountUp, HoverLift, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { SiteHeader, Logo } from "@/components/site-header";
import { Avatar, Badge, ButtonLink, Card, posterLabel } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [alumniCount, studentCount, jobCount, jobs, companies] = await Promise.all([
    db.user.count({ where: { role: "ALUMNI", status: "APPROVED" } }),
    db.user.count({ where: { role: "STUDENT" } }),
    db.job.count({ where: { active: true } }),
    db.job.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, take: 3, include: { postedBy: true } }),
    db.user.findMany({ where: { role: "ALUMNI", status: "APPROVED", company: { not: null } }, select: { company: true }, distinct: ["company"] }),
  ]);

  const stats = [
    { n: alumniCount, label: "verified alumni" },
    { n: studentCount, label: "students" },
    { n: jobCount, label: "open alumni jobs" },
  ];

  return (
    <>
      <ScrollProgress />
      <SiteHeader />
      <main>
        <CinematicHero />

        <MorphStory />

        {/* Stats */}
        <section aria-label="Setu in numbers" className="border-y border-mist/70 bg-surface/60">
          <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-mist/70 px-4 md:px-6">
            {stats.map((s) => (
              <div key={s.label} className="px-2 py-8 text-center md:py-10">
                <CountUp to={s.n} className="font-display text-3xl font-semibold text-ulab-deep md:text-5xl" />
                <p className="mt-1 text-xs text-ink-soft md:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <WalkStory />

        <section className="mx-auto max-w-4xl px-4 py-24 md:px-6 md:py-36">
          <ScrollText text={`Every ${site.universityShort} graduate once sat where you sit now, wondering how to get that first job. They remember. Most of them are happy to tell you how they did it.`} />
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:px-6 md:py-28">
          <Reveal className="max-w-xl">
            <h2 className="text-3xl font-semibold md:text-4xl">From first message to first offer</h2>
            <p className="mt-3 text-ink-soft">Alumni are verified by the {site.universityShort} alumni office, so every name you see here really walked the same campus.</p>
          </Reveal>
          <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: UserPlus, title: "Join with your role", body: `Students sign up with their @${site.studentEmailDomain} email. Alumni are checked against their student ID.` },
              { icon: MessageCircle, title: "Reach out to a senior", body: "Find alumni by department, company or batch, and message anyone directly." },
              { icon: BadgeCheck, title: "Apply with a referral", body: "Apply to jobs alumni post here. Many come with an offer to refer you internally." },
            ].map((s, i) => (
              <StaggerItem key={s.title}>
                <HoverLift className="h-full">
                  <Card className="relative h-full overflow-hidden p-6">
                    <span className="absolute right-5 top-4 font-display text-6xl font-semibold text-sky">{i + 1}</span>
                    <span className="relative grid size-11 place-items-center rounded-xl bg-sky text-ulab"><s.icon size={20} /></span>
                    <h3 className="relative mt-5 text-lg font-semibold">{s.title}</h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
                  </Card>
                </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Latest jobs */}
        <section id="jobs" className="scroll-mt-20 bg-gradient-to-b from-sky/60 to-paper">
          <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-24">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold md:text-4xl">Posted by alumni this week</h2>
                <p className="mt-3 text-ink-soft">Plus live openings from Bdjobs and other Bangladeshi job sites once you sign in.</p>
              </div>
              <ButtonLink href="/signup" variant="soft">See all jobs <ArrowUpRight size={16} /></ButtonLink>
            </Reveal>
            <Stagger className="mt-10 grid gap-5 md:grid-cols-3">
              {jobs.map((job) => (
                <StaggerItem key={job.id}>
                  <HoverLift className="h-full">
                    <Link href="/signup" className="block h-full">
                      <Card className="flex h-full flex-col p-6 transition-shadow hover:shadow-lift">
                        <div className="flex flex-wrap gap-2">
                          <Badge>{job.type}</Badge>
                          {job.referral && <Badge tone="gold">Referral available</Badge>}
                        </div>
                        <h3 className="mt-4 text-lg font-semibold leading-snug">{job.title}</h3>
                        <p className="mt-1 text-sm text-ink-soft">{job.company}, {job.location}</p>
                        <div className="mt-auto flex items-center gap-2.5 border-t border-mist/70 pt-4 mt-6">
                          <Avatar name={job.postedBy.name} size={30} />
                          <p className="text-xs text-ink-soft">
                            Posted by <span className="font-medium text-ink">{job.postedBy.name}</span>, {posterLabel(job.postedBy)}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  </HoverLift>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 md:px-6">
          <JobPortals title="More places to find jobs" />
        </div>

        {/* Companies marquee */}
        {companies.length > 0 && (
          <section className="overflow-hidden py-16">
            <p className="mb-8 text-center text-sm text-ink-soft">{site.universityShort} alumni on Setu work at</p>
            <div className="group relative [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
              <div className="flex w-max animate-marquee gap-4 group-hover:[animation-play-state:paused]">
                {[...companies, ...companies, ...companies, ...companies].map((c, i) => (
                  <span key={i} className="whitespace-nowrap rounded-full border border-mist bg-surface px-5 py-2.5 font-display text-base font-medium text-ink-soft">
                    {c.company}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-24 md:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky via-paper to-gold-wash px-6 py-14 text-center md:py-20">
              <div className="dots absolute inset-0 opacity-60" />
              <div className="relative">
                <h2 className="mx-auto max-w-lg text-3xl font-semibold md:text-4xl">Graduated from {site.universityShort}? Someone here is where you were.</h2>
                <p className="mx-auto mt-3 max-w-md text-ink-soft">Post an opening at your company or answer one question a month. It adds up.</p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <ButtonLink href="/signup?role=alumni" className="px-5 py-3">Join as alumni</ButtonLink>
                  <ButtonLink href="/signup?role=student" variant="outline" className="px-5 py-3"><Search size={16} /> Find a mentor</ButtonLink>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-mist/70 bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink-soft md:px-6">
          <Logo />
          <p className="text-xs">
            Illustration from <a href="https://commons.wikimedia.org/wiki/File:Girl_in_sailor_fuku_publicdomainq.png" className="underline decoration-mist underline-offset-4 hover:text-ulab" target="_blank" rel="noreferrer">Public Domain Q</a> (CC0)
          </p>
          <p>
            A community project for <a href={site.universityUrl} className="underline decoration-mist underline-offset-4 hover:text-ulab" target="_blank" rel="noreferrer">{site.university}</a>.
          </p>
        </div>
      </footer>
    </>
  );
}
