import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  MapPin,
  Tag,
  Wallet,
  Sparkles,
  ExternalLink,
  Briefcase,
  AlertCircle,
  Building,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncExpiredJobs, isJobAcceptingApplications } from "@/lib/jobs";
import { PageIn } from "@/components/motion";
import { Avatar, Badge, Card, formatDate, posterLabel, timeAgo } from "@/components/ui";
import { ApplyPanel } from "./apply-panel";
import { ReportJobModal } from "@/components/report-job-modal";
import { JobPosterCard } from "@/components/job-poster-card";

export const metadata: Metadata = { title: "Job Opportunity | ULAB Setu" };

export default async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser("STUDENT");
  await syncExpiredJobs();

  const job = await db.job.findUnique({
    where: { id },
    include: { postedBy: true },
  });

  if (!job || job.deletedAt) notFound();

  // Increment view counter passively
  await db.job.update({
    where: { id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  const isAccepting = isJobAcceptingApplications(job);
  const isExpired = job.status === "EXPIRED" || (job.deadline && job.deadline.getTime() < Date.now());

  const application = await db.application.findUnique({
    where: { jobId_studentId: { jobId: id, studentId: user.id } },
  });

  return (
    <PageIn>
      <div className="flex items-center justify-between">
        <Link
          href="/student/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink transition"
        >
          <ArrowLeft size={16} /> All jobs
        </Link>

        {/* Report Job Button & Modal */}
        <ReportJobModal jobId={job.id} jobTitle={job.title} company={job.company} />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="blue">{job.type}</Badge>
            {job.experienceLevel && <Badge tone="gray">{job.experienceLevel}</Badge>}
            {job.referral && (
              <Badge tone="gold" className="font-semibold">
                ✨ Referral available
              </Badge>
            )}
            {job.status === "FILLED" && <Badge tone="lilac">Fully Filled / Capacity Reached</Badge>}
            {isExpired && <Badge tone="rose">Expired / Deadline Passed</Badge>}
            {!isAccepting && !isExpired && job.status !== "FILLED" && <Badge tone="gray">Applications Closed</Badge>}
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">{job.title}</h1>
          <p className="mt-1.5 text-lg font-medium text-ink-soft">{job.company}</p>

          {/* Job Overview Metadata */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} className="text-ulab" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Tag size={15} />
              {job.category}
            </span>
            {job.salary && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <Wallet size={15} />
                {job.salary}
              </span>
            )}
            {job.deadline && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock size={15} />
                Apply by {formatDate(job.deadline)}
              </span>
            )}
          </div>

          {/* Referral Notice */}
          {job.referral && (
            <div className="mt-5 rounded-2xl border border-gold/40 bg-gold-wash/60 p-4">
              <div className="flex items-start gap-3">
                <Sparkles size={20} className="shrink-0 text-gold mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-ink">Alumni Referral Available</p>
                  <p className="mt-0.5 text-xs text-ink-soft leading-relaxed">
                    The posting senior ({job.postedBy.name}) is offering internal employee referral for standout candidates. Make sure to tailor your note and portfolio!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* External Apply Banner if applicable */}
          {job.externalUrl && (
            <div className="mt-4 rounded-2xl border border-sky bg-sky/30 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ulab-deep">Company Career Portal</p>
                  <p className="text-xs text-ink-soft">This position also accepts applications on the employer&apos;s site.</p>
                </div>
                <a
                  href={job.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-ulab px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-ulab-deep transition"
                >
                  Apply on Company Site <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          {/* Job Details Card */}
          <Card className="mt-6 p-6">
            <h2 className="text-lg font-bold text-ink">About the role</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{job.description}</p>

            {job.skills && (
              <div className="mt-8 border-t border-mist/70 pt-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-ulab">Required Skills & Technologies</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-surface px-3 py-1 text-xs font-semibold text-ink border border-mist"
                      >
                        {skill}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {job.requirements && (
              <div className="mt-8 border-t border-mist/70 pt-5">
                <h2 className="text-lg font-bold text-ink">What they&apos;re looking for</h2>
                <ul className="mt-3 space-y-2.5">
                  {job.requirements
                    .split("\n")
                    .filter(Boolean)
                    .map((r) => (
                      <li key={r} className="flex gap-2.5 text-sm text-ink-soft">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ulab-light" />
                        <span>{r}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-mist/60 pt-4 text-xs text-ink-soft">
              <p>Posted {timeAgo(job.createdAt)}</p>
              {job.contactEmail && (
                <p>
                  Inquiries: <span className="font-semibold text-ink">{job.contactEmail}</span>
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Aside: Apply Panel & Poster info */}
        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <ApplyPanel
            jobId={job.id}
            open={isAccepting}
            applied={application?.status ?? null}
            student={user}
          />

          <JobPosterCard
            poster={job.postedBy}
            messagesHref="/student/messages"
          />
        </aside>
      </div>
    </PageIn>
  );
}
