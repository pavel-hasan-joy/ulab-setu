import Link from "next/link";
import {
  FileText,
  Briefcase,
  User,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
} from "lucide-react";
import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { Avatar, Badge, ButtonLink, Card, EmptyState, PageHeader, timeAgo } from "@/components/ui";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdminPermission("applications:view");
  const params = await searchParams;
  const q = (params?.q || "").trim().toLowerCase();
  const statusFilter = params?.status;

  const applications = await db.application.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q
        ? {
            OR: [
              { student: { name: { contains: q, mode: "insensitive" } } },
              { student: { email: { contains: q, mode: "insensitive" } } },
              { job: { title: { contains: q, mode: "insensitive" } } },
              { job: { company: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          studentId: true,
          image: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          type: true,
          postedBy: { select: { name: true, role: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageIn>
      <PageHeader
        title="Student Job & Internship Applications"
        description="Comprehensive audit of all employment applications submitted by ULAB students."
        action={
          <ButtonLink href="/admin/jobs" variant="outline" className="text-xs">
            Manage Job Postings
          </ButtonLink>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="mb-6 p-4">
        <form method="GET" className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-60 flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by student, job title, or company..."
              className="h-10 w-full rounded-xl border border-mist/80 bg-paper pl-9 pr-3 text-xs text-ink placeholder:text-ink-soft/60 focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
            />
          </div>

          <select
            name="status"
            defaultValue={statusFilter || ""}
            className="h-10 rounded-xl border border-mist/80 bg-paper px-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
          >
            <option value="">All Application Statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="REJECTED">Declined</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-ulab px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-ulab-deep"
          >
            Filter
          </button>
        </form>
      </Card>

      {/* Applications Table */}
      {applications.length === 0 ? (
        <EmptyState
          title="No applications found"
          body="Student applications to jobs and internships will appear here."
        />
      ) : (
        <Card className="overflow-hidden p-0 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-mist/80 bg-paper/60 text-ink-soft uppercase tracking-wider text-[10px] dark:border-white/10 dark:bg-white/5">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Applied Position</th>
                  <th className="py-3 px-4">Hiring Poster</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Applied</th>
                  <th className="py-3 px-4 text-right">Resume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist/60 dark:divide-white/5">
                {applications.map((app) => {
                  let coverNoteText = "";
                  let cvUrl = app.resumeUrl;
                  try {
                    if (app.note && app.note.startsWith("{")) {
                      const parsed = JSON.parse(app.note);
                      coverNoteText = parsed.coverNote || "";
                      if (!cvUrl && parsed.cvUrl) cvUrl = parsed.cvUrl;
                    } else {
                      coverNoteText = app.note || "";
                    }
                  } catch {
                    coverNoteText = app.note || "";
                  }

                  return (
                    <tr key={app.id} className="transition hover:bg-paper/40 dark:hover:bg-white/5">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={app.student.name} size={32} src={app.student.image} />
                          <div>
                            <p className="font-bold text-ink">{app.student.name}</p>
                            <p className="text-[11px] text-ink-soft">{app.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-ink">{app.job.title}</p>
                        <p className="text-[11px] text-ink-soft">{app.job.company} • {app.job.location}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-ink">{app.job.postedBy.name}</p>
                        <Badge tone={app.job.postedBy.role === "ALUMNI" ? "gold" : "lilac"} className="text-[10px]">
                          {app.job.postedBy.role === "ALUMNI" ? "Alumnus" : "Faculty"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          tone={
                            app.status === "SHORTLISTED"
                              ? "sage"
                              : app.status === "REJECTED"
                              ? "rose"
                              : "blue"
                          }
                        >
                          {app.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-ink-soft">{timeAgo(app.createdAt)}</td>
                      <td className="py-3.5 px-4 text-right">
                        {cvUrl ? (
                          <a
                            href={cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-ulab hover:underline"
                          >
                            CV <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-ink-soft/60">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageIn>
  );
}

