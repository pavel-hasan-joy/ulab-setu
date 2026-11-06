import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { AdminAnalyticsView, type FullAnalyticsData } from "@/components/admin-analytics-view";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireAdminPermission("analytics:view");

  const now = new Date();

  // 1. Core Counts & Metrics
  const [
    totalUsers,
    studentCount,
    alumniCount,
    teacherCount,
    adminCount,
    pendingUsersCount,
    emailVerifiedCount,
    verifiedAlumniCount,
    activeAccountsCount,
    totalJobs,
    publishedJobsCount,
    referralJobsCount,
    totalApplications,
    totalConnections,
    totalPosts,
    availableMentorsCount,
    totalMentorshipRequests,
    completedMentorshipSessions,
    openSupportTickets,
    resolvedSupportTickets,
    totalUserReports,
    rawUsers,
    rawJobs,
    rawApplications,
    rawMentorships,
    rawTickets,
    rawReports,
    rawLoginLogs,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "STUDENT" } }),
    db.user.count({ where: { role: "ALUMNI" } }),
    db.user.count({ where: { role: "TEACHER" } }),
    db.user.count({ where: { role: "ADMIN" } }),
    db.user.count({ where: { status: "PENDING" } }),
    db.user.count({ where: { emailVerified: true } }),
    db.user.count({ where: { role: "ALUMNI", alumniVerified: true } }),
    db.user.count({ where: { status: "APPROVED", deletedAt: null } }),
    db.job.count(),
    db.job.count({ where: { status: "PUBLISHED" } }),
    db.job.count({ where: { referral: true } }),
    db.application.count(),
    db.connection.count(),
    db.post.count(),
    db.user.count({ where: { isMentor: true, mentorAvailable: true } }),
    db.mentorshipRequest.count(),
    db.mentorshipRequest.count({ where: { status: "COMPLETED" } }),
    db.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_FOR_USER"] } } }),
    db.supportTicket.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
    db.userReport.count(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        alumniVerified: true,
        department: true,
        company: true,
        designation: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    db.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        type: true,
        status: true,
        referral: true,
        viewsCount: true,
        deadline: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
    }),
    db.application.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        job: { select: { id: true, title: true, company: true } },
        student: { select: { id: true, name: true, department: true } },
      },
    }),
    db.mentorshipRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        topic: true,
        status: true,
        sessionFormat: true,
        scheduledAt: true,
        completedAt: true,
        createdAt: true,
        mentor: { select: { id: true, name: true, company: true } },
        student: { select: { id: true, name: true, department: true } },
      },
    }),
    db.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true } },
      },
    }),
    db.userReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        targetType: true,
        reason: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
      },
    }),
    db.loginLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  // Compute expired jobs (explicit status or deadline < now)
  const expiredJobsCount = rawJobs.filter(
    (j) => j.status === "EXPIRED" || (j.deadline && new Date(j.deadline) < now)
  ).length;

  // 2. Compute 7-day daily trends (Logins, Applications, Jobs)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyMap: Record<
    string,
    { date: string; label: string; logins: number; applications: number; jobs: number }
  > = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const dayName = dayNames[d.getDay()];
    const dayMonth = `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}`;
    dailyMap[key] = {
      date: dayMonth,
      label: dayName,
      logins: 0,
      applications: 0,
      jobs: 0,
    };
  }

  for (const log of rawLoginLogs) {
    const key = new Date(log.createdAt).toISOString().split("T")[0];
    if (dailyMap[key]) dailyMap[key].logins += 1;
  }
  for (const app of rawApplications) {
    const key = new Date(app.createdAt).toISOString().split("T")[0];
    if (dailyMap[key]) dailyMap[key].applications += 1;
  }
  for (const job of rawJobs) {
    const key = new Date(job.createdAt).toISOString().split("T")[0];
    if (dailyMap[key]) dailyMap[key].jobs += 1;
  }

  const dailyTrends = Object.values(dailyMap);

  // 3. Compute 6-Month Monthly Trends (Registrations, Jobs, Applications)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyMap: Record<
    string,
    { month: string; label: string; registrations: number; jobs: number; applications: number }
  > = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    monthlyMap[key] = {
      month: key,
      label,
      registrations: 0,
      jobs: 0,
      applications: 0,
    };
  }

  for (const u of rawUsers) {
    const d = new Date(u.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap[key]) monthlyMap[key].registrations += 1;
  }
  for (const j of rawJobs) {
    const d = new Date(j.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap[key]) monthlyMap[key].jobs += 1;
  }
  for (const a of rawApplications) {
    const d = new Date(a.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap[key]) monthlyMap[key].applications += 1;
  }

  const monthlyTrends = Object.values(monthlyMap);

  // 4. Academic Department breakdown
  const deptCounts: Record<string, number> = {};
  for (const u of rawUsers) {
    const dept = u.department || "Other / General";
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  }
  const departmentStats = Object.entries(deptCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([department, count]) => ({
      department,
      count,
      percentage: Math.round((count / (totalUsers || 1)) * 100),
    }));

  // 5. Applications breakdown by status
  const applicationsByStatus: Record<string, number> = {
    APPLIED: 0,
    VIEWED: 0,
    SHORTLISTED: 0,
    INTERVIEW: 0,
    SELECTED: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
  };
  for (const app of rawApplications) {
    if (applicationsByStatus[app.status] !== undefined) {
      applicationsByStatus[app.status] += 1;
    } else {
      applicationsByStatus[app.status] = 1;
    }
  }

  // 6. Top jobs by application volume
  const topJobs = [...rawJobs]
    .sort((a, b) => b._count.applications - a._count.applications)
    .slice(0, 6)
    .map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      applicationCount: j._count.applications,
      percentage: Math.round((j._count.applications / (totalApplications || 1)) * 100),
    }));

  // 7. Mentorship breakdown by status
  const mentorshipByStatus: Record<string, number> = {
    PENDING: 0,
    ACCEPTED: 0,
    SCHEDULED: 0,
    COMPLETED: 0,
    DECLINED: 0,
    CANCELLED: 0,
  };
  for (const m of rawMentorships) {
    if (mentorshipByStatus[m.status] !== undefined) {
      mentorshipByStatus[m.status] += 1;
    }
  }

  // 8. Support metrics & Average resolution time
  const supportByCategory: Record<string, number> = {};
  let totalResolutionHours = 0;
  let resolvedCountForTime = 0;

  for (const t of rawTickets) {
    supportByCategory[t.category] = (supportByCategory[t.category] || 0) + 1;
    if ((t.status === "RESOLVED" || t.status === "CLOSED") && (t.resolvedAt || t.updatedAt)) {
      const end = new Date(t.resolvedAt || t.updatedAt).getTime();
      const start = new Date(t.createdAt).getTime();
      const diffHours = (end - start) / (1000 * 60 * 60);
      if (diffHours >= 0) {
        totalResolutionHours += diffHours;
        resolvedCountForTime += 1;
      }
    }
  }

  const avgResolutionHours =
    resolvedCountForTime > 0
      ? Math.round((totalResolutionHours / resolvedCountForTime) * 10) / 10
      : 0;

  // 9. Moderation reports breakdown
  const reportsByStatus: Record<string, number> = {
    PENDING: 0,
    INVESTIGATING: 0,
    RESOLVED: 0,
    DISMISSED: 0,
  };
  const reportsByTarget: Record<string, number> = {};
  for (const r of rawReports) {
    if (reportsByStatus[r.status] !== undefined) {
      reportsByStatus[r.status] += 1;
    }
    reportsByTarget[r.targetType] = (reportsByTarget[r.targetType] || 0) + 1;
  }

  // 10. Serialized datasets for client filtering and CSV export
  const analyticsData: FullAnalyticsData = {
    users: {
      total: totalUsers,
      students: studentCount,
      alumni: alumniCount,
      teachers: teacherCount,
      admins: adminCount,
      pending: pendingUsersCount,
      emailVerified: emailVerifiedCount,
      verifiedAlumni: verifiedAlumniCount,
      activeAccounts: activeAccountsCount,
      departmentStats,
      monthlyTrends,
      list: rawUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        alumniVerified: u.alumniVerified,
        department: u.department,
        company: u.company,
        designation: u.designation,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      })),
    },
    jobs: {
      total: totalJobs,
      published: publishedJobsCount,
      expired: expiredJobsCount,
      referralOpportunities: referralJobsCount,
      topJobs,
      list: rawJobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        type: j.type,
        status: j.status,
        referral: j.referral,
        viewsCount: j.viewsCount,
        applicationsCount: j._count.applications,
        deadline: j.deadline ? j.deadline.toISOString() : null,
        createdAt: j.createdAt.toISOString(),
      })),
    },
    applications: {
      total: totalApplications,
      byStatus: applicationsByStatus,
      list: rawApplications.map((a) => ({
        id: a.id,
        jobTitle: a.job.title,
        company: a.job.company,
        studentName: a.student.name,
        department: a.student.department,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    },
    mentorship: {
      availableMentors: availableMentorsCount,
      totalRequests: totalMentorshipRequests,
      completedSessions: completedMentorshipSessions,
      byStatus: mentorshipByStatus,
      list: rawMentorships.map((m) => ({
        id: m.id,
        topic: m.topic,
        status: m.status,
        sessionFormat: m.sessionFormat,
        mentorName: m.mentor.name,
        mentorCompany: m.mentor.company,
        studentName: m.student.name,
        studentDepartment: m.student.department,
        scheduledAt: m.scheduledAt ? m.scheduledAt.toISOString() : null,
        completedAt: m.completedAt ? m.completedAt.toISOString() : null,
        createdAt: m.createdAt.toISOString(),
      })),
    },
    support: {
      openTickets: openSupportTickets,
      resolvedTickets: resolvedSupportTickets,
      avgResolutionHours,
      byCategory: supportByCategory,
      totalReports: totalUserReports,
      reportsByStatus,
      reportsByTarget,
      ticketsList: rawTickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: t.status,
        userName: t.user.name,
        createdAt: t.createdAt.toISOString(),
        resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
      })),
      reportsList: rawReports.map((r) => ({
        id: r.id,
        targetType: r.targetType,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
      })),
    },
    activity: {
      daily: dailyTrends,
      monthly: monthlyTrends,
      recentLogins: rawLoginLogs.map((l) => ({
        id: l.id,
        name: l.name,
        email: l.email,
        role: l.role,
        createdAt: l.createdAt.toISOString(),
      })),
      totalConnections,
      totalPosts,
    },
  };

  return (
    <PageIn>
      <PageHeader
        title="Institutional Analytics & Enterprise Reports"
        description="Real-time multi-dimensional intelligence from the live production database. Monitor member engagement, hiring pipelines, mentorship outcomes, and export audited compliance reports."
      />

      <div className="mt-6">
        <AdminAnalyticsView data={analyticsData} />
      </div>
    </PageIn>
  );
}
