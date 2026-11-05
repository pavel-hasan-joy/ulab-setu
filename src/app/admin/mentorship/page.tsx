import {
  Compass,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Clock,
  MessageSquare,
} from "lucide-react";
import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { Avatar, Badge, ButtonLink, Card, EmptyState, PageHeader, timeAgo } from "@/components/ui";

export default async function AdminMentorshipPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  await requireAdminPermission("mentorship:view");
  const params = await searchParams;
  const statusFilter = params?.status || "ALL";

  const requests = await db.mentorshipRequest.findMany({
    where: statusFilter === "ALL" ? {} : { status: statusFilter },
    include: {
      student: { select: { id: true, name: true, email: true, department: true, image: true } },
      mentor: { select: { id: true, name: true, email: true, role: true, company: true, designation: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageIn>
      <PageHeader
        title="Student-Alumni Career Mentorship"
        description="Monitor 1-on-1 guidance, portfolio reviews, and mock interview advisories across the university network."
      />

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["ALL", "PENDING", "ACCEPTED", "COMPLETED", "DECLINED"].map((st) => (
          <ButtonLink
            key={st}
            href={`/admin/mentorship?status=${st}`}
            variant={statusFilter === st ? "primary" : "outline"}
            className="text-xs py-1.5 px-3"
          >
            {st}
          </ButtonLink>
        ))}
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="No mentorship sessions found"
          body="Mentorship requests between students and alumni will appear here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((m) => (
            <Card key={m.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <Badge
                  tone={
                    m.status === "ACCEPTED"
                      ? "sage"
                      : m.status === "COMPLETED"
                      ? "blue"
                      : m.status === "PENDING"
                      ? "gold"
                      : "gray"
                  }
                >
                  {m.status}
                </Badge>
                <span className="text-[11px] text-ink-soft">{timeAgo(m.createdAt)}</span>
              </div>

              <h3 className="mt-3 font-display font-bold text-ink">{m.topic}</h3>
              <p className="mt-1 text-xs text-ink-soft italic">"{m.message}"</p>

              {/* Student and Mentor Cards */}
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-mist/60 pt-3 text-xs dark:border-white/5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                    Student (Mentee)
                  </span>
                  <p className="font-semibold text-ink">{m.student.name}</p>
                  <p className="text-[11px] text-ink-soft">{m.student.department}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                    Mentor
                  </span>
                  <p className="font-semibold text-ink">{m.mentor.name}</p>
                  <p className="text-[11px] text-ink-soft">
                    {m.mentor.designation} {m.mentor.company ? `(${m.mentor.company})` : ""}
                  </p>
                </div>
              </div>

              {m.mentorNotes && (
                <div className="mt-3 rounded-xl border border-mist/80 bg-paper/60 p-2.5 text-xs text-ink-soft dark:border-white/5">
                  <span className="font-semibold text-ink">Mentor Schedule/Notes: </span>
                  {m.mentorNotes}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </PageIn>
  );
}
