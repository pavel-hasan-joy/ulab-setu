"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  GraduationCap, Search, ShieldCheck, TrendingUp, UserCheck, Users,
} from "lucide-react";
import { Avatar, Badge, Card, timeAgo } from "@/components/ui";

export type AnalyticsUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department: string | null;
  company: string | null;
  designation: string | null;
  createdAt: string;
  lastLoginAt: string | null;
};

export type LoginLogItem = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export type DailyData = {
  date: string;
  label: string;
  count: number;
};

export type DepartmentStat = {
  department: string;
  count: number;
  percentage: number;
};

export function AdminAnalyticsView({
  totalUsers,
  studentCount,
  alumniCount,
  teacherCount,
  adminCount,
  pendingCount,
  dailyLogins,
  departmentStats,
  recentLogins,
  allUsers,
}: {
  totalUsers: number;
  studentCount: number;
  alumniCount: number;
  teacherCount: number;
  adminCount: number;
  pendingCount: number;
  dailyLogins: DailyData[];
  departmentStats: DepartmentStat[];
  recentLogins: LoginLogItem[];
  allUsers: AnalyticsUser[];
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"logins" | "users">("logins");

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredLogs = recentLogins.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || l.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate highest login day for scale
  const maxDayLogins = Math.max(...dailyLogins.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="relative overflow-hidden p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Total Network</span>
              <span className="grid size-8 place-items-center rounded-lg bg-sky text-ulab-deep">
                <Users size={18} />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold text-ink">{totalUsers}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
              <span className="flex items-center text-emerald-600 font-medium">
                <TrendingUp size={14} className="mr-0.5" /> Active
              </span>
              <span>across all 4 campus roles</span>
            </div>
            <div className="absolute -bottom-6 -right-6 size-24 rounded-full bg-sky/30 blur-2xl" />
          </Card>
        </motion.div>

        {/* Students */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <Card className="relative overflow-hidden p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Students</span>
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                <GraduationCap size={18} />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold text-ink">{studentCount}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
              <span>{Math.round((studentCount / (totalUsers || 1)) * 100)}% of members</span>
              <Badge tone="sage">Verified domain</Badge>
            </div>
          </Card>
        </motion.div>

        {/* Alumni */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
        >
          <Card className="relative overflow-hidden p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Alumni</span>
              <span className="grid size-8 place-items-center rounded-lg bg-gold-wash text-gold-ink">
                <UserCheck size={18} />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold text-ink">{alumniCount}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
              <span>{pendingCount > 0 ? `${pendingCount} awaiting approval` : "All verified"}</span>
              <Badge tone="gold">Mentors</Badge>
            </div>
          </Card>
        </motion.div>

        {/* Faculty / Teachers */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24 }}
        >
          <Card className="relative overflow-hidden p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Faculty & Admins</span>
              <span className="grid size-8 place-items-center rounded-lg bg-lilac-wash text-lilac-ink">
                <ShieldCheck size={18} />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold text-ink">{teacherCount + adminCount}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
              <span>{teacherCount} Teachers · {adminCount} Admins</span>
              <Badge tone="lilac">Official</Badge>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Main Graphs Grid: 7-Day Login Activity & Department Distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 7-Day Login Activity Graph */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-ink">Login Activity Trend</h2>
                <Badge tone="blue">Last 7 Days</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-soft">Daily logins and authentication volume across the network</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </div>
          </div>

          {/* Interactive Bar & Sparkline Chart */}
          <div className="mt-8">
            <div className="grid grid-cols-7 items-end gap-3 h-48 border-b border-mist/80 pb-3">
              {dailyLogins.map((d, index) => {
                const heightPercent = Math.max((d.count / maxDayLogins) * 100, 8);
                return (
                  <div key={d.date} className="group relative flex flex-col items-center justify-end h-full">
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute -top-10 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-top-12 z-20">
                      <div className="rounded-lg bg-slate-900 px-2.5 py-1 text-center shadow-lg">
                        <p className="text-[11px] font-bold text-white">{d.count} logins</p>
                        <p className="text-[9px] text-slate-300 whitespace-nowrap">{d.date}</p>
                      </div>
                      <div className="mx-auto size-1.5 -rotate-45 bg-slate-900 -mt-1" />
                    </div>

                    {/* Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="relative w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-ulab to-sky hover:from-ulab-deep hover:to-ulab transition-colors cursor-pointer shadow-sm"
                    >
                      <span className="absolute inset-x-0 top-1.5 text-center text-[10px] font-bold text-white drop-shadow-sm opacity-90">
                        {d.count > 0 ? d.count : ""}
                      </span>
                    </motion.div>
                  </div>
                );
              })}
            </div>

            {/* Day Labels */}
            <div className="mt-3 grid grid-cols-7 text-center">
              {dailyLogins.map((d) => (
                <div key={d.date} className="text-xs font-semibold text-ink-soft">
                  {d.label}
                </div>
              ))}
            </div>
          </div>

          {/* Role Proportion Bar */}
          <div className="mt-8 border-t border-mist/70 pt-5">
            <div className="flex items-center justify-between text-xs text-ink-soft">
              <span className="font-semibold text-ink">Member Breakdown by Role</span>
              <span>{totalUsers} Total Accounts</span>
            </div>
            <div className="mt-2.5 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(studentCount / (totalUsers || 1)) * 100}%` }}
                transition={{ duration: 0.8 }}
                className="bg-sky"
                title={`Students: ${studentCount}`}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(alumniCount / (totalUsers || 1)) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="bg-amber-400"
                title={`Alumni: ${alumniCount}`}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(teacherCount / (totalUsers || 1)) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-purple-400"
                title={`Teachers: ${teacherCount}`}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(adminCount / (totalUsers || 1)) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="bg-emerald-500"
                title={`Admins: ${adminCount}`}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-sky" /> Students ({studentCount})</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-amber-400" /> Alumni ({alumniCount})</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-purple-400" /> Teachers ({teacherCount})</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-500" /> Admins ({adminCount})</span>
            </div>
          </div>
        </Card>

        {/* Academic Department Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Departments</h2>
            <Badge tone="gray">Distribution</Badge>
          </div>
          <p className="mt-1 text-xs text-ink-soft">Registered members by university academic discipline</p>

          <div className="mt-6 space-y-4">
            {departmentStats.map((dept, i) => (
              <div key={dept.department} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-ink truncate max-w-[180px]">{dept.department}</span>
                  <span className="font-semibold text-ink-soft">{dept.count} ({dept.percentage}%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
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

      {/* User Login Audit & Member Registry */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-ink">Activity & Member Logs</h2>
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("logins")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    activeTab === "logins" ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Recent Logins ({recentLogins.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    activeTab === "users" ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  All Users ({allUsers.length})
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-ink-soft">Real-time user authentication audit trail and login history</p>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                placeholder="Search name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 sm:w-56 rounded-xl border border-mist/80 bg-surface pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-mist/80 bg-surface px-2.5 py-1.5 text-xs font-medium text-ink focus:border-ulab focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="ALUMNI">Alumni</option>
              <option value="TEACHER">Teachers</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>

        {/* Table / List */}
        <div className="mt-6 overflow-x-auto">
          {activeTab === "logins" ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-mist/80 text-ink-soft font-semibold">
                  <th className="pb-3 pl-1">User</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Login Time</th>
                  <th className="pb-3 text-right pr-2">Relative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist/50">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-ink-soft">
                      No matching login activities found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 pl-1">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={log.name} size={30} />
                          <span className="font-semibold text-ink">{log.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge
                          tone={
                            log.role === "STUDENT"
                              ? "blue"
                              : log.role === "ALUMNI"
                              ? "gold"
                              : log.role === "TEACHER"
                              ? "lilac"
                              : "sage"
                          }
                        >
                          {log.role}
                        </Badge>
                      </td>
                      <td className="py-3 text-ink-soft font-mono text-[11px]">{log.email}</td>
                      <td className="py-3 text-ink-soft">
                        {new Date(log.createdAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 text-right pr-2 font-medium text-emerald-600">
                        {timeAgo(log.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-mist/80 text-ink-soft font-semibold">
                  <th className="pb-3 pl-1">Member</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Last Active</th>
                  <th className="pb-3 text-right pr-2">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist/50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-ink-soft">
                      No matching registered users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 pl-1">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.name} size={30} />
                          <div>
                            <p className="font-semibold text-ink">{u.name}</p>
                            <p className="text-[11px] text-ink-soft font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge
                          tone={
                            u.role === "STUDENT"
                              ? "blue"
                              : u.role === "ALUMNI"
                              ? "gold"
                              : u.role === "TEACHER"
                              ? "lilac"
                              : "sage"
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 text-ink-soft">{u.department ?? "—"}</td>
                      <td className="py-3">
                        {u.lastLoginAt ? (
                          <span className="font-medium text-emerald-600">{timeAgo(u.lastLoginAt)}</span>
                        ) : (
                          <span className="text-ink-soft/70">Joined {timeAgo(u.createdAt)}</span>
                        )}
                      </td>
                      <td className="py-3 text-right pr-2 text-ink-soft">
                        {new Date(u.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
