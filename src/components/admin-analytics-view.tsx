"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  GraduationCap,
  Briefcase,
  FileText,
  Compass,
  LifeBuoy,
  Download,
  Calendar,
  Search,
  Filter,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";

export type FullAnalyticsData = {
  users: {
    total: number;
    students: number;
    alumni: number;
    teachers: number;
    admins: number;
    pending: number;
    emailVerified: number;
    verifiedAlumni: number;
    activeAccounts: number;
    departmentStats: Array<{ department: string; count: number; percentage: number }>;
    monthlyTrends: Array<{
      month: string;
      label: string;
      registrations: number;
      jobs: number;
      applications: number;
    }>;
    list: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      emailVerified: boolean;
      alumniVerified: boolean;
      department: string | null;
      company: string | null;
      designation: string | null;
      createdAt: string;
      lastLoginAt: string | null;
    }>;
  };
  jobs: {
    total: number;
    published: number;
    expired: number;
    referralOpportunities: number;
    topJobs: Array<{
      id: string;
      title: string;
      company: string;
      applicationCount: number;
      percentage: number;
    }>;
    list: Array<{
      id: string;
      title: string;
      company: string;
      location: string;
      type: string;
      status: string;
      referral: boolean;
      viewsCount: number;
      applicationsCount: number;
      deadline: string | null;
      createdAt: string;
    }>;
  };
  applications: {
    total: number;
    byStatus: Record<string, number>;
    list: Array<{
      id: string;
      jobTitle: string;
      company: string;
      studentName: string;
      department: string | null;
      status: string;
      createdAt: string;
      updatedAt: string;
    }>;
  };
  mentorship: {
    availableMentors: number;
    totalRequests: number;
    completedSessions: number;
    byStatus: Record<string, number>;
    list: Array<{
      id: string;
      topic: string;
      status: string;
      sessionFormat: string | null;
      mentorName: string;
      mentorCompany: string | null;
      studentName: string;
      studentDepartment: string | null;
      scheduledAt: string | null;
      completedAt: string | null;
      createdAt: string;
    }>;
  };
  support: {
    openTickets: number;
    resolvedTickets: number;
    avgResolutionHours: number;
    byCategory: Record<string, number>;
    totalReports: number;
    reportsByStatus: Record<string, number>;
    reportsByTarget: Record<string, number>;
    ticketsList: Array<{
      id: string;
      ticketNumber: string;
      subject: string;
      category: string;
      priority: string;
      status: string;
      userName: string;
      createdAt: string;
      resolvedAt: string | null;
    }>;
    reportsList: Array<{
      id: string;
      targetType: string;
      reason: string;
      status: string;
      createdAt: string;
      resolvedAt: string | null;
    }>;
  };
  activity: {
    daily: Array<{
      date: string;
      label: string;
      logins: number;
      applications: number;
      jobs: number;
    }>;
    monthly: Array<{
      month: string;
      label: string;
      registrations: number;
      jobs: number;
      applications: number;
    }>;
    recentLogins: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
    totalConnections: number;
    totalPosts: number;
  };
};

// Backwards compatibility types for other callers if any
export type AnalyticsUser = FullAnalyticsData["users"]["list"][0];
export type LoginLogItem = FullAnalyticsData["activity"]["recentLogins"][0];
export type DailyData = { date: string; label: string; count: number };
export type DepartmentStat = FullAnalyticsData["users"]["departmentStats"][0];

type TabKey =
  | "overview"
  | "users"
  | "jobs"
  | "applications"
  | "mentorship"
  | "support"
  | "reports";

export function AdminAnalyticsView({ data }: { data: FullAnalyticsData }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [chartMetric, setChartMetric] = useState<"logins" | "applications" | "jobs">("logins");
  const [searchQuery, setSearchQuery] = useState("");
  const [reportDateRange, setReportDateRange] = useState<"7d" | "30d" | "90d" | "all">("all");
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Helper to filter list by date range
  const filterByDate = <T extends { createdAt: string }>(items: T[], range: typeof reportDateRange) => {
    if (range === "all") return items;
    const now = new Date();
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);
    return items.filter((item) => new Date(item.createdAt) >= cutoff);
  };

  // CSV Generator Utility
  const triggerCSVDownload = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((val) => {
              const str = String(val ?? "").replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(",")
        ),
      ].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${filename}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // 1. Export Users CSV
  const handleExportUsers = () => {
    const filtered = filterByDate(data.users.list, reportDateRange);
    const headers = [
      "User ID",
      "Full Name",
      "Official Email",
      "Campus Role",
      "Account Status",
      "Email Verified",
      "Alumni Verified",
      "Department",
      "Company / Employer",
      "Designation / Title",
      "Registered Date",
      "Last Authentication",
    ];
    const rows = filtered.map((u) => [
      u.id,
      u.name,
      u.email,
      u.role,
      u.status,
      u.emailVerified ? "Yes" : "No",
      u.alumniVerified ? "Yes" : "No",
      u.department || "N/A",
      u.company || "N/A",
      u.designation || "N/A",
      new Date(u.createdAt).toISOString(),
      u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : "Never",
    ]);
    triggerCSVDownload("ulab_setu_users_registry", headers, rows);
  };

  // 2. Export Jobs CSV
  const handleExportJobs = () => {
    const filtered = filterByDate(data.jobs.list, reportDateRange);
    const headers = [
      "Job ID",
      "Job Title",
      "Company Name",
      "Work Location",
      "Employment Type",
      "Publication Status",
      "Referral Opportunity",
      "Application Volume",
      "Total Page Views",
      "Application Deadline",
      "Posted Date",
    ];
    const rows = filtered.map((j) => [
      j.id,
      j.title,
      j.company,
      j.location,
      j.type,
      j.status,
      j.referral ? "Available" : "Standard",
      j.applicationsCount,
      j.viewsCount,
      j.deadline ? new Date(j.deadline).toISOString() : "Open",
      new Date(j.createdAt).toISOString(),
    ]);
    triggerCSVDownload("ulab_setu_jobs_report", headers, rows);
  };

  // 3. Export Applications (ATS) CSV
  const handleExportApplications = () => {
    const filtered = filterByDate(data.applications.list, reportDateRange);
    const headers = [
      "Application ID",
      "Job Title",
      "Hiring Company",
      "Applicant Name",
      "Applicant Department",
      "ATS Status",
      "Applied Date",
      "Last Status Update",
    ];
    const rows = filtered.map((a) => [
      a.id,
      a.jobTitle,
      a.company,
      a.studentName,
      a.department || "N/A",
      a.status,
      new Date(a.createdAt).toISOString(),
      new Date(a.updatedAt).toISOString(),
    ]);
    triggerCSVDownload("ulab_setu_ats_applications", headers, rows);
  };

  // 4. Export Mentorship Engagements CSV
  const handleExportMentorship = () => {
    const filtered = filterByDate(data.mentorship.list, reportDateRange);
    const headers = [
      "Session ID",
      "Mentorship Topic",
      "Mentor Name",
      "Mentor Organization",
      "Mentee Student Name",
      "Mentee Department",
      "Session Format",
      "Engagement Status",
      "Scheduled Date",
      "Completed Date",
      "Requested Date",
    ];
    const rows = filtered.map((m) => [
      m.id,
      m.topic,
      m.mentorName,
      m.mentorCompany || "N/A",
      m.studentName,
      m.studentDepartment || "N/A",
      m.sessionFormat || "ONLINE",
      m.status,
      m.scheduledAt ? new Date(m.scheduledAt).toISOString() : "Unscheduled",
      m.completedAt ? new Date(m.completedAt).toISOString() : "Pending",
      new Date(m.createdAt).toISOString(),
    ]);
    triggerCSVDownload("ulab_setu_mentorship_sessions", headers, rows);
  };

  // 5. Export Support & Moderation CSV
  const handleExportSupport = () => {
    const filteredTickets = filterByDate(data.support.ticketsList, reportDateRange);
    const headers = [
      "Record ID",
      "Reference Number",
      "Record Type",
      "Subject / Description",
      "Category",
      "Priority / Severity",
      "Current Status",
      "Initiated By",
      "Created Date",
      "Resolution Date",
    ];
    const rows = filteredTickets.map((t) => [
      t.id,
      t.ticketNumber,
      "Support Ticket",
      t.subject,
      t.category,
      t.priority,
      t.status,
      t.userName,
      new Date(t.createdAt).toISOString(),
      t.resolvedAt ? new Date(t.resolvedAt).toISOString() : "Open",
    ]);
    triggerCSVDownload("ulab_setu_support_and_tickets", headers, rows);
  };

  // Max value for 7-day daily chart scaling
  const maxDailyVal = Math.max(
    ...data.activity.daily.map((d) => d[chartMetric]),
    1
  );

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist/80 pb-3 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-mist/80 bg-paper/60 p-1.5 dark:border-white/5 dark:bg-white/5">
          {[
            { id: "overview", label: "Executive Overview", icon: BarChart3 },
            { id: "users", label: "Users & Demographics", icon: Users },
            { id: "jobs", label: "Jobs & Opportunities", icon: Briefcase },
            { id: "applications", label: "ATS Applications", icon: FileText },
            { id: "mentorship", label: "Mentorship Outcomes", icon: Compass },
            { id: "support", label: "Support & Safety", icon: LifeBuoy },
            { id: "reports", label: "Enterprise CSV Reports", icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabKey)}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-ulab text-white shadow-soft"
                    : "text-ink-soft hover:bg-surface hover:text-ink"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global CSV Download Pill */}
        <Button
          type="button"
          onClick={() => setActiveTab("reports")}
          className="flex items-center gap-1.5 bg-paper/80 text-xs font-semibold text-ink border border-mist/80 hover:bg-paper"
        >
          <Download size={13} />
          Export Datasets
        </Button>
      </div>

      {/* Download Alert Toast */}
      <AnimatePresence>
        {downloadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <CheckCircle2 size={16} />
            <span>Audited CSV export generated successfully: {downloadSuccess}.csv</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top 6 KPI Metric Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                Total Members
              </span>
              <p className="mt-2 font-display text-2xl font-bold text-ink">
                {data.users.total}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <TrendingUp size={12} />
                <span>{data.users.activeAccounts} Active</span>
              </div>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                Students
              </span>
              <p className="mt-2 font-display text-2xl font-bold text-ink">
                {data.users.students}
              </p>
              <p className="mt-1 text-[11px] text-ink-soft">
                {Math.round((data.users.students / (data.users.total || 1)) * 100)}% of community
              </p>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                Verified Alumni
              </span>
              <p className="mt-2 font-display text-2xl font-bold text-amber-600 dark:text-amber-400">
                {data.users.verifiedAlumni}
              </p>
              <p className="mt-1 text-[11px] text-ink-soft">
                {data.users.alumni} total alumni
              </p>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                Live Jobs
              </span>
              <p className="mt-2 font-display text-2xl font-bold text-ulab">
                {data.jobs.published}
              </p>
              <p className="mt-1 text-[11px] text-ink-soft">
                {data.jobs.referralOpportunities} with referral
              </p>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                Applications
              </span>
              <p className="mt-2 font-display text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {data.applications.total}
              </p>
              <p className="mt-1 text-[11px] text-ink-soft">
                Across {data.jobs.total} jobs
              </p>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                Mentors Active
              </span>
              <p className="mt-2 font-display text-2xl font-bold text-purple-700 dark:text-purple-400">
                {data.mentorship.availableMentors}
              </p>
              <p className="mt-1 text-[11px] text-ink-soft">
                {data.mentorship.completedSessions} completed sessions
              </p>
            </Card>
          </div>

          {/* Interactive 7-Day Trend Chart with Metric Switcher */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-ink">
                      7-Day Activity Velocity
                    </h3>
                    <Badge tone="blue">Real-Time DB Sync</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">
                    Daily engagement trajectory across authentications, job submissions, and career applications
                  </p>
                </div>

                {/* Metric switcher */}
                <div className="inline-flex rounded-xl border border-mist/80 bg-paper/60 p-1">
                  {[
                    { key: "logins", label: "User Logins" },
                    { key: "applications", label: "Applications" },
                    { key: "jobs", label: "Jobs Posted" },
                  ].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setChartMetric(m.key as any)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        chartMetric === m.key
                          ? "bg-surface text-ink shadow-soft"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bar visualization */}
              <div className="mt-8">
                <div className="grid grid-cols-7 items-end gap-3 h-44 border-b border-mist/80 pb-3">
                  {data.activity.daily.map((d, index) => {
                    const val = d[chartMetric];
                    const heightPercent = Math.max((val / maxDailyVal) * 100, 8);
                    return (
                      <div
                        key={d.date}
                        className="group relative flex flex-col items-center justify-end h-full"
                      >
                        {/* Hover Tooltip */}
                        <div className="pointer-events-none absolute -top-10 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-top-12 z-20">
                          <div className="rounded-lg bg-slate-900 px-2.5 py-1 text-center shadow-lg">
                            <p className="text-[11px] font-bold text-white">
                              {val} {chartMetric}
                            </p>
                            <p className="text-[9px] text-slate-300 whitespace-nowrap">
                              {d.date}
                            </p>
                          </div>
                        </div>

                        {/* Bar */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ duration: 0.6, delay: index * 0.05 }}
                          className={`relative w-full max-w-[42px] rounded-t-xl transition-colors cursor-pointer shadow-sm ${
                            chartMetric === "logins"
                              ? "bg-gradient-to-t from-ulab to-sky"
                              : chartMetric === "applications"
                              ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                              : "bg-gradient-to-t from-amber-600 to-amber-400"
                          }`}
                        >
                          <span className="absolute inset-x-0 top-1 text-center text-[10px] font-bold text-white">
                            {val > 0 ? val : ""}
                          </span>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>

                {/* Day Labels */}
                <div className="mt-3 grid grid-cols-7 text-center">
                  {data.activity.daily.map((d) => (
                    <div key={d.date} className="text-xs font-semibold text-ink-soft">
                      {d.label}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Department Breakdown */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-ink">
                  Top Departments
                </h3>
                <Badge tone="gray">Distribution</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                Member composition by academic discipline
              </p>

              <div className="mt-5 space-y-3.5">
                {data.users.departmentStats.map((dept, i) => (
                  <div key={dept.department} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-ink truncate max-w-[170px]">
                        {dept.department}
                      </span>
                      <span className="font-semibold text-ink-soft">
                        {dept.count} ({dept.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dept.percentage}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="h-full rounded-full bg-gradient-to-r from-ulab to-ulab-deep"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & DEMOGRAPHICS */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Total Users</span>
              <p className="mt-1 text-2xl font-bold text-ink">{data.users.total}</p>
              <p className="mt-1 text-xs text-ink-soft">{data.users.activeAccounts} active accounts</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Email-Verified Accounts</span>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{data.users.emailVerified}</p>
              <p className="mt-1 text-xs text-ink-soft">
                {Math.round((data.users.emailVerified / (data.users.total || 1)) * 100)}% verified rate
              </p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Verified Alumni</span>
              <p className="mt-1 text-2xl font-bold text-amber-600">{data.users.verifiedAlumni}</p>
              <p className="mt-1 text-xs text-ink-soft">Out of {data.users.alumni} alumni</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Faculty & Staff</span>
              <p className="mt-1 text-2xl font-bold text-purple-600">{data.users.teachers + data.users.admins}</p>
              <p className="mt-1 text-xs text-ink-soft">{data.users.teachers} Teachers · {data.users.admins} Admins</p>
            </Card>
          </div>

          {/* Member Registry Table with Search */}
          <Card className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-ink">Member Registry Directory</h3>
                <p className="text-xs text-ink-soft">Audited production user records</p>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type="text"
                  placeholder="Search name, email, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 rounded-xl border border-mist/80 bg-paper/60 pl-8 pr-3 py-1.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                />
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-mist/80 text-[11px] font-semibold text-ink-soft dark:border-white/10">
                  <tr>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Joined</th>
                    <th className="py-2.5 px-3">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist/50 dark:divide-white/5">
                  {data.users.list
                    .filter((u) => {
                      const q = searchQuery.toLowerCase();
                      return (
                        u.name.toLowerCase().includes(q) ||
                        u.email.toLowerCase().includes(q) ||
                        (u.department?.toLowerCase() || "").includes(q)
                      );
                    })
                    .slice(0, 15)
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-paper/40 dark:hover:bg-white/5 transition">
                        <td className="py-2.5 px-3 font-semibold text-ink">{u.name}</td>
                        <td className="py-2.5 px-3 font-mono text-ink-soft">{u.email}</td>
                        <td className="py-2.5 px-3">
                          <Badge tone={u.role === "STUDENT" ? "blue" : u.role === "ALUMNI" ? "gold" : "lilac"}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge tone={u.status === "APPROVED" ? "sage" : "gray"}>
                            {u.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-ink-soft">{u.department || "—"}</td>
                        <td className="py-2.5 px-3 text-ink-soft">
                          {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-2.5 px-3 text-ink-soft">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Never"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: JOBS & RECRUITMENT */}
      {activeTab === "jobs" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Total Jobs</span>
              <p className="mt-1 text-2xl font-bold text-ink">{data.jobs.total}</p>
              <p className="mt-1 text-xs text-ink-soft">Opportunities in system</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Published Jobs</span>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{data.jobs.published}</p>
              <p className="mt-1 text-xs text-ink-soft">Active and accepting applications</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Expired Jobs</span>
              <p className="mt-1 text-2xl font-bold text-rose-600">{data.jobs.expired}</p>
              <p className="mt-1 text-xs text-ink-soft">Passed deadline or closed</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Referral Opportunities</span>
              <p className="mt-1 text-2xl font-bold text-amber-600">{data.jobs.referralOpportunities}</p>
              <p className="mt-1 text-xs text-ink-soft">Alumni employee referrals</p>
            </Card>
          </div>

          {/* Top Jobs by Applications */}
          <Card className="p-6">
            <h3 className="font-display text-base font-bold text-ink">Most Applied Opportunities</h3>
            <p className="text-xs text-ink-soft">Jobs attracting highest student interest</p>

            <div className="mt-5 space-y-4">
              {data.jobs.topJobs.map((job) => (
                <div key={job.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-ink">{job.title}</span>
                      <span className="ml-2 text-ink-soft">at {job.company}</span>
                    </div>
                    <span className="font-semibold text-ink">
                      {job.applicationCount} applications ({job.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                    <div
                      style={{ width: `${Math.max(job.percentage, 5)}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-sky to-ulab"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: ATS APPLICATIONS */}
      {activeTab === "applications" && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-ink">Application Lifecycle Funnel</h3>
                <p className="text-xs text-ink-soft">Distribution across 7 ATS recruitment stages</p>
              </div>
              <Badge tone="blue">{data.applications.total} Total Submissions</Badge>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {[
                { status: "APPLIED", label: "Applied", tone: "blue" },
                { status: "VIEWED", label: "Viewed", tone: "lilac" },
                { status: "SHORTLISTED", label: "Shortlisted", tone: "gold" },
                { status: "INTERVIEW", label: "Interview", tone: "gold" },
                { status: "SELECTED", label: "Selected", tone: "sage" },
                { status: "REJECTED", label: "Rejected", tone: "gray" },
                { status: "WITHDRAWN", label: "Withdrawn", tone: "gray" },
              ].map((stage) => {
                const count = data.applications.byStatus[stage.status] || 0;
                return (
                  <div
                    key={stage.status}
                    className="rounded-2xl border border-mist/80 bg-paper/60 p-4 text-center dark:border-white/5 dark:bg-white/5"
                  >
                    <Badge tone={stage.tone as any}>{stage.label}</Badge>
                    <p className="mt-3 text-2xl font-bold text-ink">{count}</p>
                    <p className="mt-1 text-[11px] text-ink-soft">
                      {Math.round((count / (data.applications.total || 1)) * 100)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: MENTORSHIP OUTCOMES */}
      {activeTab === "mentorship" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Registered Mentors</span>
              <p className="mt-1 text-2xl font-bold text-ink">{data.mentorship.availableMentors}</p>
              <p className="mt-1 text-xs text-ink-soft">Verified alumni mentors</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Total Requests</span>
              <p className="mt-1 text-2xl font-bold text-ulab">{data.mentorship.totalRequests}</p>
              <p className="mt-1 text-xs text-ink-soft">From student mentees</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Completed Sessions</span>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{data.mentorship.completedSessions}</p>
              <p className="mt-1 text-xs text-ink-soft">Finished with mentor notes</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Completion Ratio</span>
              <p className="mt-1 text-2xl font-bold text-purple-600">
                {Math.round((data.mentorship.completedSessions / (data.mentorship.totalRequests || 1)) * 100)}%
              </p>
              <p className="mt-1 text-xs text-ink-soft">Engagement success rate</p>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 6: SUPPORT & SAFETY */}
      {activeTab === "support" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Open Support Tickets</span>
              <p className="mt-1 text-2xl font-bold text-amber-600">{data.support.openTickets}</p>
              <p className="mt-1 text-xs text-ink-soft">Awaiting resolution</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Resolved Tickets</span>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{data.support.resolvedTickets}</p>
              <p className="mt-1 text-xs text-ink-soft">Closed helpdesk inquiries</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Avg Resolution Time</span>
              <p className="mt-1 text-2xl font-bold text-ink">{data.support.avgResolutionHours} hrs</p>
              <p className="mt-1 text-xs text-ink-soft">From ticket submission</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-ink-soft">Safety Reports</span>
              <p className="mt-1 text-2xl font-bold text-rose-600">{data.support.totalReports}</p>
              <p className="mt-1 text-xs text-ink-soft">{data.support.reportsByStatus.RESOLVED || 0} investigated</p>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 7: ENTERPRISE CSV REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-mist/70 pb-4 dark:border-white/10">
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  Enterprise Audit & Compliance Reports
                </h3>
                <p className="text-xs text-ink-soft">
                  Export structured, privacy-sanitized CSV datasets directly from the production database.
                </p>
              </div>

              {/* Date range filter for exports */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink-soft">Date Scope:</span>
                <select
                  value={reportDateRange}
                  onChange={(e) => setReportDateRange(e.target.value as any)}
                  className="rounded-xl border border-mist/80 bg-paper/60 px-3 py-1.5 text-xs font-semibold text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                >
                  <option value="all">All-Time Historical</option>
                  <option value="90d">Past 90 Days</option>
                  <option value="30d">Past 30 Days</option>
                  <option value="7d">Past 7 Days</option>
                </select>
              </div>
            </div>

            {/* 5 Dataset Export Cards */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Report 1: Users */}
              <div className="flex flex-col justify-between rounded-2xl border border-mist/80 bg-paper/60 p-5 dark:border-white/5 dark:bg-white/5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-xl bg-sky/20 text-ulab-deep">
                      <Users size={18} />
                    </span>
                    <Badge tone="blue">Audited</Badge>
                  </div>
                  <h4 className="mt-3 font-bold text-ink">Users & Member Registry</h4>
                  <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                    Student, alumni, faculty, and administrative profiles with verification and activity timestamps.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleExportUsers}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 bg-ulab text-xs text-white hover:bg-ulab-deep"
                >
                  <Download size={14} />
                  Export Users CSV
                </Button>
              </div>

              {/* Report 2: Jobs */}
              <div className="flex flex-col justify-between rounded-2xl border border-mist/80 bg-paper/60 p-5 dark:border-white/5 dark:bg-white/5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      <Briefcase size={18} />
                    </span>
                    <Badge tone="gold">Recruitment</Badge>
                  </div>
                  <h4 className="mt-3 font-bold text-ink">Jobs & Opportunities</h4>
                  <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                    All company listings, employment types, referral availability, application counts, and deadlines.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleExportJobs}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 bg-amber-600 text-xs text-white hover:bg-amber-700"
                >
                  <Download size={14} />
                  Export Jobs CSV
                </Button>
              </div>

              {/* Report 3: Applications */}
              <div className="flex flex-col justify-between rounded-2xl border border-mist/80 bg-paper/60 p-5 dark:border-white/5 dark:bg-white/5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <FileText size={18} />
                    </span>
                    <Badge tone="sage">ATS Pipeline</Badge>
                  </div>
                  <h4 className="mt-3 font-bold text-ink">Job Applications (ATS)</h4>
                  <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                    Submission records, hiring stages (Applied to Selected/Rejected), and review timelines.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleExportApplications}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 bg-emerald-700 text-xs text-white hover:bg-emerald-800"
                >
                  <Download size={14} />
                  Export Applications CSV
                </Button>
              </div>

              {/* Report 4: Mentorship */}
              <div className="flex flex-col justify-between rounded-2xl border border-mist/80 bg-paper/60 p-5 dark:border-white/5 dark:bg-white/5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                      <Compass size={18} />
                    </span>
                    <Badge tone="lilac">Mentorship</Badge>
                  </div>
                  <h4 className="mt-3 font-bold text-ink">Mentorship Sessions</h4>
                  <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                    Student-alumni mentorship pairings, topics, scheduling details, and completion records.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleExportMentorship}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 bg-purple-700 text-xs text-white hover:bg-purple-800"
                >
                  <Download size={14} />
                  Export Mentorship CSV
                </Button>
              </div>

              {/* Report 5: Support & Moderation */}
              <div className="flex flex-col justify-between rounded-2xl border border-mist/80 bg-paper/60 p-5 dark:border-white/5 dark:bg-white/5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                      <LifeBuoy size={18} />
                    </span>
                    <Badge tone="gray">Support & Safety</Badge>
                  </div>
                  <h4 className="mt-3 font-bold text-ink">Support & Moderation</h4>
                  <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                    User helpdesk tickets, categories, resolution durations, and community safety enforcement reports.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleExportSupport}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 bg-slate-800 text-xs text-white hover:bg-slate-900"
                >
                  <Download size={14} />
                  Export Support CSV
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
