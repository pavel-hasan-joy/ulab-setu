import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  Phone,
} from "lucide-react";
import { requirePoster } from "@/lib/auth";
import { db } from "@/lib/db";
import { cleanExpiredJobs } from "@/lib/jobs";
import { parseApplicationNote } from "@/lib/applications";
import { PageIn, Stagger, StaggerItem } from "@/components/motion";
import { Avatar, Badge, Card, EmptyState, timeAgo } from "@/components/ui";
import { ApplicantActions } from "./applicant-actions";

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
              const phone = app.phone || a.student.phone;
              const linkedin = app.linkedin || a.student.linkedin;
              const portfolio = app.portfolio;
              const cvUrl = app.cvData || app.cvUrl;
              const cvName = app.cvFileName || "Student_CV.pdf";

              return (
                <StaggerItem key={a.id}>
                  <Card className="p-5 shadow-soft">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <Avatar name={a.student.name} size={48} />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-display text-lg font-semibold">{a.student.name}</p>
                            {a.status === "SHORTLISTED" && <Badge tone="sage">Shortlisted</Badge>}
                            {a.status === "REJECTED" && <Badge tone="gray">Not selected</Badge>}
                          </div>
                          <p className="text-sm text-ink-soft">
                            {a.student.department}, admitted {a.student.batch}. Applied {timeAgo(a.createdAt)}.
                          </p>
                        </div>
                      </div>
                      <ApplicantActions applicationId={a.id} status={a.status} />
                    </div>

                    {/* Metadata & Quick Tags */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-soft">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail size={13} className="text-ink-soft/70" />
                        <a href={`mailto:${a.student.email}`} className="hover:underline">{a.student.email}</a>
                      </span>
                      {phone && (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone size={13} className="text-ink-soft/70" />
                          <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
                        </span>
                      )}
                      {app.availability && (
                        <span className="inline-flex items-center gap-1.5 text-sage">
                          <Calendar size={13} /> Available: {app.availability}
                        </span>
                      )}
                    </div>

                    {/* CV / Resume Attachment */}
                    {cvUrl && (
                      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-ulab-light/30 bg-sky/30 p-3">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-white shadow-soft text-ulab">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-ink">{cvName}</p>
                            <p className="text-[10px] text-ink-soft">Attached Curriculum Vitae</p>
                          </div>
                        </div>
                        <a
                          href={cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={cvName}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-ulab px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:bg-ulab-deep"
                        >
                          <Download size={13} /> View / Download CV
                        </a>
                      </div>
                    )}

                    {/* Candidate Pitch / Note */}
                    {app.coverNote && (
                      <div className="mt-4 rounded-xl border border-mist bg-paper/60 px-4 py-3 text-sm leading-relaxed text-ink">
                        <p className="text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1">
                          Applicant Note
                        </p>
                        &ldquo;{app.coverNote}&rdquo;
                      </div>
                    )}

                    {/* Student Skills & Bio */}
                    {a.student.bio && <p className="mt-3 text-sm text-ink-soft leading-relaxed">{a.student.bio}</p>}

                    {/* Professional Links */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 pt-1">
                      {linkedin && (
                        <a
                          href={linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-ulab hover:underline"
                        >
                          LinkedIn <ExternalLink size={12} />
                        </a>
                      )}
                      {portfolio && (
                        <a
                          href={portfolio}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-ulab hover:underline"
                        >
                          <Globe size={12} /> Portfolio / Projects <ExternalLink size={12} />
                        </a>
                      )}
                      <Link
                        href={`${base}/messages?to=${a.student.id}`}
                        className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-ink"
                      >
                        Message Student &rarr;
                      </Link>
                    </div>
                  </Card>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </div>
    </PageIn>
  );
}
