import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import {
  AdminAnalyticsView,
  type DailyData,
  type DepartmentStat,
  type AnalyticsUser,
  type LoginLogItem,
} from "@/components/admin-analytics-view";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireUser("ADMIN");

  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    studentCount,
    alumniCount,
    teacherCount,
    adminCount,
    pendingCount,
    loginLogs,
    allUsersRaw,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "STUDENT" } }),
    db.user.count({ where: { role: "ALUMNI" } }),
    db.user.count({ where: { role: "TEACHER" } }),
    db.user.count({ where: { role: "ADMIN" } }),
    db.user.count({ where: { status: "PENDING" } }),
    db.loginLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        department: true,
        company: true,
        designation: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
  ]);

  // Compute 7-day daily activity
  const dailyMap: Record<string, number> = {};
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyMap[key] = 0;
  }

  for (const log of loginLogs) {
    const key = new Date(log.createdAt).toISOString().split("T")[0];
    if (dailyMap[key] !== undefined) {
      dailyMap[key] += 1;
    }
  }

  const dailyLogins: DailyData[] = Object.entries(dailyMap).map(([dateStr, count]) => {
    const dateObj = new Date(dateStr + "T00:00:00");
    const dayName = dayNames[dateObj.getDay()];
    const dayMonth = `${dateObj.getDate()} ${dateObj.toLocaleDateString("en-US", { month: "short" })}`;
    return {
      date: dayMonth,
      label: dayName,
      count,
    };
  });

  // Department counts
  const deptCounts: Record<string, number> = {};
  for (const u of allUsersRaw) {
    const dept = u.department || "Other / General";
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  }

  const departmentStats: DepartmentStat[] = Object.entries(deptCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([department, count]) => ({
      department,
      count,
      percentage: Math.round((count / (totalUsers || 1)) * 100),
    }));

  const serializedUsers: AnalyticsUser[] = allUsersRaw.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
  }));

  const serializedLogs: LoginLogItem[] = loginLogs.map((l) => ({
    id: l.id,
    email: l.email,
    name: l.name,
    role: l.role,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <PageIn>
      <PageHeader
        title="Platform Analytics & Logins"
        description="Monitor registered university members, live authentication activity, and track who logs in and when."
      />
      <AdminAnalyticsView
        totalUsers={totalUsers}
        studentCount={studentCount}
        alumniCount={alumniCount}
        teacherCount={teacherCount}
        adminCount={adminCount}
        pendingCount={pendingCount}
        dailyLogins={dailyLogins}
        departmentStats={departmentStats}
        recentLogins={serializedLogs}
        allUsers={serializedUsers}
      />
    </PageIn>
  );
}
