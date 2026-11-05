import Link from "next/link";
import {
  Users,
  GraduationCap,
  Briefcase,
  FileText,
  ShieldCheck,
  Compass,
  AlertTriangle,
  LifeBuoy,
  UserPlus,
  ArrowUpRight,
  TrendingUp,
  Activity,
  History,
  CheckCircle2,
} from "lucide-react";
import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn, CountUp } from "@/components/motion";
import { Avatar, Badge, ButtonLink, Card, EmptyState, timeAgo } from "@/components/ui";

export default async function AdminDashboardPage() {
  await requireAdminPermission("dashboard:view");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Parallel database-driven statistics (zero fake statistics)
  const [
    totalUsers,
    totalStudents,
    totalAlumni,
    totalFaculty,
    verifiedAlumni,
    activeJobs,
    totalApplications,
    mentorshipRequests,
    newRegistrations,
    pendingReports,
    openTickets,
    recentUsers,
    recentAudits,
    shortlistedApps,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "STUDENT" } }),
    db.user.count({ where: { role: "ALUMNI" } }),
    db.user.count({ where: { role: "TEACHER" } }),
    db.user.count({ where: { role: "ALUMNI", alumniVerified: true } }),
    db.job.count({ where: { active: true } }),
    db.application.count(),
    db.mentorshipRequest.count().catch(() => 0),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.userReport.count({ where: { status: "PENDING" } }).catch(() => 0),
    db.supportTicket.count({ where: { status: "OPEN" } }).catch(() => 0),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        image: true,
        status: true,
        alumniVerified: true,
        createdAt: true,
      },
    }),
    db.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { admin: { select: { name: true, email: true } } },
    }).catch(() => []),
    db.application.count({ where: { status: "SHORTLISTED" } }),
  ]);

  const stats = [
    { title: "Total Users", count: totalUsers, icon: Users, tone: "text-ulab", href: "/admin/users" },
    { title: "Students", count: totalStudents, icon: GraduationCap, tone: "text-blue-600", href: "/admin/users?role=STUDENT" },
    { title: "Alumni Network", count: totalAlumni, icon: Briefcase, tone: "text-gold-ink", href: "/admin/alumni" },
    { title: "Verified Alumni", count: verifiedAlumni, icon: ShieldCheck, tone: "text-emerald-600", href: "/admin/alumni?verified=1" },
    { title: "Faculty Members", count: totalFaculty, icon: Activity, tone: "text-purple-600", href: "/admin/users?role=TEACHER" },
    { title: "Active Jobs", count: activeJobs, icon: Briefcase, tone: "text-indigo-600", href: "/admin/jobs" },
    { title: "Total Applications", count: totalApplications, icon: FileText, tone: "text-cyan-600", href: "/admin/applications" },
    { title: "Mentorship Requests", count: mentorshipRequests, icon: Compass, tone: "text-teal-600", href: "/admin/mentorship" },
  ];

  return (
    <PageIn>
      {/* Dashboard Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-mist/70 pb-5 dark:border-white/10">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            SaaS Administration Console
          </h1>
          <p className="mt-1 text-xs text-ink-soft md:text-sm">
            Live database-driven oversight across students, alumni, faculty, employment & platform trust.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink href="/admin/users" variant="outline" className="gap-1.5 text-xs py-2">
            <Users size={14} /> Manage Users
          </ButtonLink>
          <ButtonLink href="/admin/reports" variant="outline" className="gap-1.5 text-xs py-2">
            <AlertTriangle size={14} /> Reports ({pendingReports})
          </ButtonLink>
          <ButtonLink href="/admin/analytics" variant="primary" className="gap-1.5 text-xs py-2">
            <TrendingUp size={14} /> Analytics View
          </ButtonLink>
        </div>
      </div>

      {/* Critical System Alerts Bar */}
      {(pendingReports > 0 || openTickets > 0) && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {pendingReports > 0 && (
            <Link
              href="/admin/reports"
              className="flex items-center gap-3 rounded-2xl border border-rose/30 bg-rose-wash/60 p-4 transition hover:shadow-soft"
            >
              <div className="rounded-xl bg-rose/10 p-2 text-rose">
                <AlertTriangle size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-rose">Pending Moderation Reports ({pendingReports})</p>
                <p className="text-[11px] text-ink-soft">Unresolved user reports require moderation review.</p>
              </div>
              <ArrowUpRight size={16} className="text-rose" />
            </Link>
          )}
          {openTickets > 0 && (
            <Link
              href="/admin/tickets"
              className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold-wash/60 p-4 transition hover:shadow-soft"
            >
              <div className="rounded-xl bg-gold/10 p-2 text-gold-ink">
                <LifeBuoy size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gold-ink">Open Helpdesk Tickets ({openTickets})</p>
                <p className="text-[11px] text-ink-soft">Support requests awaiting admin response.</p>
              </div>
              <ArrowUpRight size={16} className="text-gold-ink" />
            </Link>
          )}
        </div>
      )}

      {/* Database Statistics Grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.title} href={s.href} className="group">
            <Card className="p-4 transition hover:-translate-y-0.5 hover:shadow-lift md:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-soft">{s.title}</span>
                <s.icon size={16} className={s.tone} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <CountUp to={s.count} className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Visual Activity & Charts Section */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* User Growth & Platform Composition Chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
            <div>
              <h3 className="font-display text-base font-bold text-ink">University Network Breakdown</h3>
              <p className="text-xs text-ink-soft">Role distribution and alumni verification coverage</p>
            </div>
            <Badge tone="blue">Active Database</Badge>
          </div>

          <div className="mt-6 space-y-4">
            {/* Student Bar */}
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span>Students</span>
                <span className="text-ink-soft">
                  {totalStudents} ({totalUsers ? Math.round((totalStudents / totalUsers) * 100) : 0}%)
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-mist/50 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${totalUsers ? (totalStudents / totalUsers) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Alumni Bar */}
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  Alumni <CheckCircle2 size={12} className="text-emerald-600" />
                </span>
                <span className="text-ink-soft">
                  {totalAlumni} ({totalUsers ? Math.round((totalAlumni / totalUsers) * 100) : 0}%)
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-mist/50 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${totalUsers ? (totalAlumni / totalUsers) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Verified Alumni Sub-coverage */}
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <span>Verified via ULAB Email</span>
                <span>
                  {verifiedAlumni} ({totalAlumni ? Math.round((verifiedAlumni / totalAlumni) * 100) : 0}% of alumni)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950/60">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${totalAlumni ? (verifiedAlumni / totalAlumni) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Faculty Bar */}
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span>Faculty</span>
                <span className="text-ink-soft">
                  {totalFaculty} ({totalUsers ? Math.round((totalFaculty / totalUsers) * 100) : 0}%)
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-mist/50 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${totalUsers ? (totalFaculty / totalUsers) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-mist/70 bg-paper/60 p-3 text-xs text-ink-soft dark:border-white/10 dark:bg-white/5">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <UserPlus size={14} className="text-ulab" />
              <strong>{newRegistrations}</strong> new university members in the last 30 days.
            </span>
            <Link href="/admin/users" className="font-semibold text-ulab hover:underline">
              View Directory →
            </Link>
          </div>
        </Card>

        {/* Application & Employment Activity */}
        <Card className="flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
              <h3 className="font-display text-base font-bold text-ink">Career Placement</h3>
              <Badge tone="sage">Jobs & Hiring</Badge>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-mist/80 bg-paper/70 p-4 dark:border-white/5 dark:bg-white/5">
                <p className="text-xs text-ink-soft">Active Job Opportunities</p>
                <p className="font-display text-2xl font-bold text-ink">{activeJobs}</p>
                <p className="mt-0.5 text-[11px] text-ink-soft">Posted by alumni and academic faculty</p>
              </div>

              <div className="rounded-2xl border border-mist/80 bg-paper/70 p-4 dark:border-white/5 dark:bg-white/5">
                <p className="text-xs text-ink-soft">Submitted Applications</p>
                <p className="font-display text-2xl font-bold text-ink">{totalApplications}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 size={13} />
                  <span>{shortlistedApps} students shortlisted for interviews</span>
                </div>
              </div>
            </div>
          </div>

          <ButtonLink href="/admin/applications" variant="outline" className="mt-6 w-full text-xs">
            Review Applications Queue
          </ButtonLink>
        </Card>
      </div>

      {/* Bottom Grid: Recent Registrations & Administrative Activity */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent Registrations Table */}
        <Card className="p-5">
          <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
            <div>
              <h3 className="font-display text-base font-bold text-ink">Recent Registrations</h3>
              <p className="text-xs text-ink-soft">Latest accounts joined with @ulab.edu.bd</p>
            </div>
            <Link href="/admin/users" className="text-xs font-semibold text-ulab hover:underline">
              All Users
            </Link>
          </div>

          <div className="mt-4 divide-y divide-mist/60 dark:divide-white/5">
            {recentUsers.length === 0 ? (
              <EmptyState title="No users found" body="New registrations will appear here." />
            ) : (
              recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={u.name} size={36} src={u.image} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-ink">{u.name}</p>
                      <p className="truncate text-[11px] text-ink-soft">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={u.role === "ALUMNI" ? "gold" : u.role === "TEACHER" ? "lilac" : "blue"}>
                      {u.role === "TEACHER" ? "Faculty" : u.role === "ALUMNI" ? "Alumni" : "Student"}
                    </Badge>
                    <span className="hidden text-[11px] text-ink-soft sm:inline-block">
                      {timeAgo(u.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Administrative Audit Activity */}
        <Card className="p-5">
          <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
            <div>
              <h3 className="font-display text-base font-bold text-ink">Administrative Audit Trail</h3>
              <p className="text-xs text-ink-soft">Recent system governance & audit log actions</p>
            </div>
            <Link href="/admin/audit-logs" className="text-xs font-semibold text-ulab hover:underline">
              Full Logs
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentAudits.length === 0 ? (
              <EmptyState title="No audit entries" body="System events and admin actions will be logged here." />
            ) : (
              recentAudits.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-2xl border border-mist/60 bg-paper/50 p-3 text-xs dark:border-white/5 dark:bg-white/5"
                >
                  <div className="rounded-lg bg-surface p-1.5 text-ink-soft shadow-xs dark:bg-white/10">
                    <History size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">
                      {a.admin.name}: <span className="font-mono text-ulab">{a.action}</span>
                    </p>
                    <p className="text-[11px] text-ink-soft">
                      {a.details || `Modified ${a.targetType} (${a.targetId || "System"})`}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-ink-soft">{timeAgo(a.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PageIn>
  );
}
