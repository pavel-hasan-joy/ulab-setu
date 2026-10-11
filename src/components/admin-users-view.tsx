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
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";
import { Avatar, Badge, Card, EmptyState, timeAgo } from "@/components/ui";
import {
  setAdminUserStatus,
  changeUserRole,
  deleteUserByAdmin,
  importDirectoryMembers,
  clearPreApprovedDirectory,
  type ImportDirectoryResult,
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
  initialPreApprovedCount = 0,
}: {
  users: AdminUserRecord[];
  currentAdminId: string;
  initialPreApprovedCount?: number;
}) {
  const [preApprovedCount, setPreApprovedCount] = useState(initialPreApprovedCount);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadRole, setUploadRole] = useState("AUTO");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ImportDirectoryResult | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDownloadSampleCSV = () => {
    const csvContent =
      "Name,Email,Student ID,Role,Department,Designation,Graduation Year\n" +
      "Tanvir Ahmed,tanvir.ahmed@ulab.edu.bd,191014022,ALUMNI,CSE,Software Engineer,2023\n" +
      "Dr. Sajjad Hossain,sajjad.hossain@ulab.edu.bd,,TEACHER,CSE,Associate Professor,\n" +
      "Farhana Yasmin,farhana.yasmin@ulab.edu.bd,182015045,ALUMNI,BBA,Product Manager,2022\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ulab_directory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSampleExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const sampleData = [
        {
          "Name": "Tanvir Ahmed",
          "Email": "tanvir.ahmed@ulab.edu.bd",
          "Student ID": "191014022",
          "Role": "ALUMNI",
          "Department": "CSE",
          "Designation": "Software Engineer",
          "Graduation Year": "2023",
        },
        {
          "Name": "Dr. Sajjad Hossain",
          "Email": "sajjad.hossain@ulab.edu.bd",
          "Student ID": "",
          "Role": "TEACHER",
          "Department": "CSE",
          "Designation": "Associate Professor",
          "Graduation Year": "",
        },
        {
          "Name": "Farhana Yasmin",
          "Email": "farhana.yasmin@ulab.edu.bd",
          "Student ID": "182015045",
          "Role": "ALUMNI",
          "Department": "BBA",
          "Designation": "Product Manager",
          "Graduation Year": "2022",
        },
      ];
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Directory");
      XLSX.writeFile(workbook, "ulab_directory_template.xlsx");
    } catch {
      handleDownloadSampleCSV();
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("defaultRole", uploadRole);

    setIsUploading(true);
    setUploadResult(null);

    try {
      const res = await importDirectoryMembers(null, formData);
      setUploadResult(res);
      if (res.success) {
        setPreApprovedCount((prev) => prev + res.imported);
        setSelectedFile(null);
      }
    } catch (err: unknown) {
      setUploadResult({
        success: false,
        message: err instanceof Error ? err.message : "Upload failed",
        totalParsed: 0,
        imported: 0,
        autoApprovedCount: 0,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearDirectory = () => {
    if (!confirm("Are you sure you want to clear the pre-approved directory? This will not affect already registered users.")) return;
    startTransition(async () => {
      try {
        await clearPreApprovedDirectory();
        setPreApprovedCount(0);
        setUploadResult({
          success: true,
          message: "Pre-approved directory cleared.",
          totalParsed: 0,
          imported: 0,
          autoApprovedCount: 0,
        });
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to clear directory");
      }
    });
  };

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-7">
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
        <Card className="p-4 text-center border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Pre-Approved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {preApprovedCount}
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
            {/* Import Directory Button */}
            <button
              onClick={() => {
                setShowImportModal(true);
                setUploadResult(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-ulab-deep px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-ulab-deep/90 active:scale-95"
              title="Upload verified faculty or alumni records (Excel / CSV)"
            >
              <Upload size={15} />
              Import Directory (Excel/CSV)
            </button>

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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-mist bg-surface p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ulab-deep/10 text-ulab-deep">
                    <FileSpreadsheet size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-ink">
                    Import Verified Directory
                  </h3>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  Upload an Excel (.xlsx, .xls) or CSV file. Matching signups will be auto-approved, and any pending accounts will be verified immediately.
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-mist hover:text-ink transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFileUpload} className="space-y-4">
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                  Choose Spreadsheet File
                </label>
                <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-mist p-6 text-center hover:border-ulab-deep/50 transition cursor-pointer bg-mist/20">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setSelectedFile(e.target.files[0]);
                        setUploadResult(null);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FileSpreadsheet size={32} className="text-ulab-deep mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-ink">
                        Click or drag Excel (.xlsx, .xls) or CSV file here
                      </p>
                      <p className="text-xs text-ink-soft mt-1">
                        Columns supported: Name, Email, Student ID, Role, Department, Designation, Graduation Year
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Default Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                  Role Assignment
                </label>
                <select
                  value={uploadRole}
                  onChange={(e) => setUploadRole(e.target.value)}
                  className="w-full rounded-xl border border-mist bg-surface px-3 py-2 text-xs font-medium text-ink focus:border-ulab-light focus:outline-none"
                >
                  <option value="AUTO">Auto-detect from Role column (Recommended)</option>
                  <option value="ALUMNI">All records in file are Alumni</option>
                  <option value="TEACHER">All records in file are Teachers / Faculty</option>
                </select>
              </div>

              {/* Sample Templates */}
              <div className="rounded-xl border border-mist/80 bg-mist/30 p-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-ink-soft font-medium flex items-center gap-1.5">
                  <Sparkles size={14} className="text-gold-ink" /> Need a format template?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSampleExcel}
                    className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink hover:text-ulab-deep transition shadow-sm"
                  >
                    <Download size={12} /> Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCSV}
                    className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink hover:text-ulab-deep transition shadow-sm"
                  >
                    <Download size={12} /> CSV (.csv)
                  </button>
                </div>
              </div>

              {/* Result Banner */}
              {uploadResult && (
                <div
                  className={`rounded-xl p-3 text-xs flex items-start gap-2.5 ${
                    uploadResult.success
                      ? "border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : "border border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
                  }`}
                >
                  {uploadResult.success ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold">{uploadResult.message}</p>
                    {uploadResult.success && (
                      <p className="mt-0.5 opacity-90">
                        Parsed: {uploadResult.totalParsed} | Imported/Updated: {uploadResult.imported} | Auto-approved pending users: {uploadResult.autoApprovedCount}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                {preApprovedCount > 0 ? (
                  <button
                    type="button"
                    disabled={isPending || isUploading}
                    onClick={handleClearDirectory}
                    className="text-xs text-rose-600 hover:text-rose-700 underline font-medium disabled:opacity-50"
                  >
                    Clear Directory ({preApprovedCount})
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="rounded-xl border border-mist px-4 py-2 text-xs font-semibold text-ink hover:bg-mist transition"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || isUploading}
                    className="inline-flex items-center gap-2 rounded-xl bg-ulab-deep px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-ulab-deep/90 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        Upload & Auto-Approve
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
