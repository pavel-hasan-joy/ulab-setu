"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  GraduationCap,
  Briefcase,
  BookOpen,
  Calendar,
  Building,
  MoreVertical,
} from "lucide-react";
import { Avatar, Badge, Card, EmptyState, timeAgo } from "@/components/ui";
import {
  setAdminUserStatus,
  changeUserRole,
  deleteUserByAdmin,
} from "@/app/actions/admin";
import { departments } from "@/lib/site";

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department: string | null;
  studentId: string | null;
  batch: string | null;
  graduationYear: string | null;
  company: string | null;
  designation: string | null;
  location: string | null;
  createdAt: string;
  lastLoginAt: string | null;
};

export function AdminUsersView({
  users,
  currentAdminId,
}: {
  users: AdminUserRecord[];
  currentAdminId: string;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
      if (deptFilter !== "ALL" && u.department !== deptFilter) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.studentId && u.studentId.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.company && u.company.toLowerCase().includes(q)) ||
        (u.designation && u.designation.toLowerCase().includes(q))
      );
    });
  }, [users, search, roleFilter, statusFilter, deptFilter]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "User ID",
      "Name",
      "Email",
      "Role",
      "Status",
      "Department",
      "Student ID",
      "Batch",
      "Graduation Year",
      "Company",
      "Designation",
      "Location",
      "Joined Date",
      "Last Login",
    ];

    const rows = filteredUsers.map((u) => [
      `"${u.id}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.status}"`,
      `"${(u.department || "").replace(/"/g, '""')}"`,
      `"${u.studentId || ""}"`,
      `"${u.batch || ""}"`,
      `"${u.graduationYear || ""}"`,
      `"${(u.company || "").replace(/"/g, '""')}"`,
      `"${(u.designation || "").replace(/"/g, '""')}"`,
      `"${(u.location || "").replace(/"/g, '""')}"`,
      `"${new Date(u.createdAt).toISOString()}"`,
      `"${u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : "Never"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ulab_setu_users_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusChange = (
    userId: string,
    status: "APPROVED" | "PENDING" | "REJECTED"
  ) => {
    startTransition(async () => {
      try {
        await setAdminUserStatus(userId, status);
        setActionUserId(null);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to update status");
      }
    });
  };

  const handleRoleChange = (
    userId: string,
    role: "STUDENT" | "ALUMNI" | "TEACHER" | "ADMIN"
  ) => {
    startTransition(async () => {
      try {
        await changeUserRole(userId, role);
        setActionUserId(null);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to change role");
      }
    });
  };

  const handleDelete = (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${name}"? This action cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteUserByAdmin(userId);
        setActionUserId(null);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete user");
      }
    });
  };

  const roleCounts = useMemo(() => {
    return {
      total: users.length,
      students: users.filter((u) => u.role === "STUDENT").length,
      alumni: users.filter((u) => u.role === "ALUMNI").length,
      teachers: users.filter((u) => u.role === "TEACHER").length,
      admins: users.filter((u) => u.role === "ADMIN").length,
      pending: users.filter((u) => u.status === "PENDING").length,
    };
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        <Card className="p-4 text-center">
          <p className="text-xs font-medium text-ink-soft">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-ink">{roleCounts.total}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-medium text-ink-soft">Students</p>
          <p className="mt-1 text-2xl font-bold text-ulab-deep">{roleCounts.students}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-medium text-ink-soft">Alumni</p>
          <p className="mt-1 text-2xl font-bold text-gold-ink">{roleCounts.alumni}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-medium text-ink-soft">Teachers</p>
          <p className="mt-1 text-2xl font-bold text-lilac-ink">{roleCounts.teachers}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs font-medium text-ink-soft">Admins</p>
          <p className="mt-1 text-2xl font-bold text-ink">{roleCounts.admins}</p>
        </Card>
        <Card className="p-4 text-center border-amber-200 bg-amber-50/40 dark:bg-amber-950/20">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {roleCounts.pending}
          </p>
        </Card>
      </div>

      {/* Control Bar: Search & Filters */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/70"
            />
            <input
              type="text"
              placeholder="Search by name, email, student ID, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-mist bg-surface py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-soft/60 focus:border-ulab-light focus:outline-none focus:ring-4 focus:ring-ulab-light/15"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* CSV Export Button */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-mist bg-surface px-3.5 py-2.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-mist/50 hover:text-ulab-deep"
              title="Download Filtered Users as CSV"
            >
              <Download size={15} />
              Export CSV ({filteredUsers.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-mist/50 text-xs">
          <span className="flex items-center gap-1 font-semibold text-ink-soft mr-1">
            <Filter size={13} /> Filters:
          </span>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="ALUMNI">Alumni</option>
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected / Suspended</option>
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {(search || roleFilter !== "ALL" || statusFilter !== "ALL" || deptFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setRoleFilter("ALL");
                setStatusFilter("ALL");
                setDeptFilter("ALL");
              }}
              className="text-xs text-rose font-medium hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          title="No users found"
          body="No users match your active search or filters."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-ink-soft px-1">
            <span>Showing {filteredUsers.length} users</span>
            {isPending && <span className="text-ulab font-medium animate-pulse">Updating...</span>}
          </div>

          <div className="grid gap-3">
            {filteredUsers.map((u) => {
              const isSelf = u.id === currentAdminId;
              const isActionOpen = actionUserId === u.id;

              return (
                <Card
                  key={u.id}
                  className="p-4 transition-all hover:border-mist"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <Avatar name={u.name} size={44} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink text-sm sm:text-base">
                            {u.name}
                          </span>
                          {isSelf && (
                            <Badge tone="lilac" className="text-[10px]">
                              You
                            </Badge>
                          )}
                          <Badge
                            tone={
                              u.role === "ADMIN"
                                ? "lilac"
                                : u.role === "TEACHER"
                                ? "blue"
                                : u.role === "ALUMNI"
                                ? "gold"
                                : "sage"
                            }
                          >
                            {u.role}
                          </Badge>
                          <Badge
                            tone={
                              u.status === "APPROVED"
                                ? "sage"
                                : u.status === "PENDING"
                                ? "gold"
                                : "rose"
                            }
                          >
                            {u.status}
                          </Badge>
                        </div>

                        <p className="text-xs text-ink-soft truncate">
                          {u.email}
                          {u.studentId && (
                            <span className="ml-2 font-mono text-ink">
                              ID: {u.studentId}
                            </span>
                          )}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                          {u.department && (
                            <span className="inline-flex items-center gap-1">
                              <BookOpen size={12} /> {u.department}
                            </span>
                          )}
                          {u.company && (
                            <span className="inline-flex items-center gap-1 text-ink">
                              <Briefcase size={12} /> {u.designation ? `${u.designation} at ` : ""}{u.company}
                            </span>
                          )}
                          {u.batch && (
                            <span className="inline-flex items-center gap-1">
                              <GraduationCap size={12} /> Batch {u.batch}
                            </span>
                          )}
                          {u.graduationYear && (
                            <span className="inline-flex items-center gap-1">
                              Class of {u.graduationYear}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] text-ink-soft/80">
                            Joined {timeAgo(u.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-mist/50">
                      <button
                        onClick={() => setActionUserId(isActionOpen ? null : u.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-mist/40 transition"
                      >
                        <MoreVertical size={14} />
                        Manage
                      </button>
                    </div>
                  </div>

                  {/* Expanded Manage Panel */}
                  {isActionOpen && (
                    <div className="mt-4 pt-3 border-t border-mist/60 bg-sky/20 -mx-4 -mb-4 p-4 rounded-b-2xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                          Account Controls for {u.name}
                        </span>
                        <button
                          onClick={() => setActionUserId(null)}
                          className="text-xs text-ink-soft hover:text-ink"
                        >
                          ✕ Close
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {/* Change Status */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-ink-soft">
                            Status
                          </label>
                          <div className="flex gap-1.5">
                            <button
                              disabled={isPending || u.status === "APPROVED"}
                              onClick={() => handleStatusChange(u.id, "APPROVED")}
                              className="flex-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-40"
                            >
                              Approve
                            </button>
                            <button
                              disabled={isPending || u.status === "REJECTED"}
                              onClick={() => handleStatusChange(u.id, "REJECTED")}
                              className="flex-1 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700 disabled:opacity-40"
                            >
                              Suspend
                            </button>
                          </div>
                        </div>

                        {/* Change Role */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-ink-soft">
                            Role Assignment
                          </label>
                          <select
                            disabled={isPending || isSelf}
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(
                                u.id,
                                e.target.value as "STUDENT" | "ALUMNI" | "TEACHER" | "ADMIN"
                              )
                            }
                            className="w-full rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none"
                          >
                            <option value="STUDENT">Student</option>
                            <option value="ALUMNI">Alumni</option>
                            <option value="TEACHER">Teacher</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>

                        {/* Danger Zone: Delete */}
                        <div className="space-y-1 flex flex-col justify-end">
                          <button
                            disabled={isPending || isSelf}
                            onClick={() => handleDelete(u.id, u.name)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-40 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400"
                            title={isSelf ? "You cannot delete yourself" : "Delete user"}
                          >
                            <Trash2 size={13} /> Delete User
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
