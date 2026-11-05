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
  ShieldCheck,
  GraduationCap,
  Briefcase,
  BookOpen,
  Calendar,
  Building2,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Clock,
  Mail,
  Phone,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import { Avatar, Badge, Card, EmptyState, Button, cn } from "@/components/ui";
import {
  setAdminUserStatus,
  changeUserRole,
  softDeleteUserByAdmin,
  restoreUserByAdmin,
  bulkSetUserStatus,
  bulkSoftDeleteUsers,
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
  emailVerified: boolean;
  alumniVerified: boolean;
  verificationMethod: string | null;
  verifiedAt: string | null;
  department: string | null;
  studentId: string | null;
  batch: string | null;
  graduationYear: string | null;
  company: string | null;
  designation: string | null;
  location: string | null;
  bio: string | null;
  skills: string | null;
  linkedin: string | null;
  github: string | null;
  phone: string | null;
  image: string | null;
  deletedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  activity: {
    jobsCount: number;
    applicationsCount: number;
    mentorshipCount: number;
  };
};

export function AdminUsersView({
  users,
  currentAdminId,
  currentAdminSubRole = "Super Admin",
  initialPreApprovedCount = 0,
}: {
  users: AdminUserRecord[];
  currentAdminId: string;
  currentAdminSubRole?: string;
  initialPreApprovedCount?: number;
}) {
  const [isPending, startTransition] = useTransition();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [alumniFilter, setAlumniFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [showSoftDeleted, setShowSoftDeleted] = useState(false);

  // Pagination State
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Users for Bulk Operations
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkConfirmAction, setBulkConfirmAction] = useState<"SUSPEND" | "REACTIVATE" | "DELETE" | null>(null);

  // User Details Panel (Drawer)
  const [drawerUser, setDrawerUser] = useState<AdminUserRecord | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Pre-approved Directory Import State
  const [preApprovedCount, setPreApprovedCount] = useState(initialPreApprovedCount);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadRole, setUploadRole] = useState("AUTO");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ImportDirectoryResult | null>(null);

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
    if (!confirm("Are you sure you want to clear the pre-approved directory? This will not affect registered users.")) return;
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

  // Metrics calculation
  const totalUsers = users.length;
  const activeStudents = users.filter((u) => u.role === "STUDENT" && u.status === "APPROVED").length;
  const verifiedAlumni = users.filter((u) => u.role === "ALUMNI" && u.alumniVerified).length;
  const totalFaculty = users.filter((u) => u.role === "TEACHER").length;
  const suspendedCount = users.filter((u) => u.status === "SUSPENDED" || u.deletedAt).length;

  // Multi-criteria Filtering
  const filteredUsers = useMemo(() => {
    const now = Date.now();
    return users.filter((u) => {
      // Soft deletion filter
      if (!showSoftDeleted && u.deletedAt) return false;
      if (showSoftDeleted && !u.deletedAt) return false;

      // Role filter
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;

      // Account status filter
      if (statusFilter !== "ALL" && u.status !== statusFilter) return false;

      // Alumni verification filter
      if (alumniFilter === "VERIFIED" && (!u.alumniVerified || u.role !== "ALUMNI")) return false;
      if (alumniFilter === "UNVERIFIED" && u.role === "ALUMNI" && u.alumniVerified) return false;

      // Department filter
      if (deptFilter !== "ALL" && u.department !== deptFilter) return false;

      // Registration date filter
      if (dateFilter !== "ALL") {
        const createdMs = new Date(u.createdAt).getTime();
        const diffDays = (now - createdMs) / (1000 * 60 * 60 * 24);
        if (dateFilter === "7D" && diffDays > 7) return false;
        if (dateFilter === "30D" && diffDays > 30) return false;
        if (dateFilter === "90D" && diffDays > 90) return false;
        if (dateFilter === "1Y" && diffDays > 365) return false;
      }

      // Keyword Search (Name, Email, Student ID, Department, Batch, Graduation Year, Company, Designation)
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.studentId && u.studentId.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.batch && u.batch.toLowerCase().includes(q)) ||
        (u.graduationYear && u.graduationYear.toLowerCase().includes(q)) ||
        (u.company && u.company.toLowerCase().includes(q)) ||
        (u.designation && u.designation.toLowerCase().includes(q))
      );
    });
  }, [users, search, roleFilter, statusFilter, alumniFilter, deptFilter, dateFilter, showSoftDeleted]);

  // Pagination calculation
  const totalFiltered = filteredUsers.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  // Select all on current page
  const allCurrentPageSelected =
    paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.includes(u.id));

  const handleToggleSelectAll = () => {
    if (allCurrentPageSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !paginatedUsers.some((u) => u.id === id)));
    } else {
      const pageIds = paginatedUsers.map((u) => u.id);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // CSV Export
  const handleExportCSV = (exportSelectedOnly = false) => {
    const listToExport = exportSelectedOnly
      ? users.filter((u) => selectedUserIds.includes(u.id))
      : filteredUsers;

    if (listToExport.length === 0) {
      alert("No user records to export.");
      return;
    }

    const headers = [
      "User ID",
      "Full Name",
      "Official Email",
      "Role",
      "Account Status",
      "Email Verified",
      "Alumni Verified",
      "Verification Method",
      "Department",
      "Student ID",
      "Admission Batch",
      "Graduation Year",
      "Company",
      "Designation",
      "Location",
      "Jobs Posted",
      "Applications Submitted",
      "Mentorships",
      "Joined Date",
      "Last Login",
    ];

    const rows = listToExport.map((u) => [
      `"${u.id}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.status}"`,
      `"${u.emailVerified ? "Yes" : "No"}"`,
      `"${u.alumniVerified ? "Yes (ULAB)" : "No"}"`,
      `"${u.verificationMethod || "None"}"`,
      `"${(u.department || "").replace(/"/g, '""')}"`,
      `"${u.studentId || ""}"`,
      `"${u.batch || ""}"`,
      `"${u.graduationYear || ""}"`,
      `"${(u.company || "").replace(/"/g, '""')}"`,
      `"${(u.designation || "").replace(/"/g, '""')}"`,
      `"${(u.location || "").replace(/"/g, '""')}"`,
      `"${u.activity.jobsCount}"`,
      `"${u.activity.applicationsCount}"`,
      `"${u.activity.mentorshipCount}"`,
      `"${new Date(u.createdAt).toISOString()}"`,
      `"${u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : "Never"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ulab_setu_users_${exportSelectedOnly ? "selected" : "export"}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Single User Actions
  const handleSetStatus = (userId: string, newStatus: "APPROVED" | "SUSPENDED" | "REJECTED") => {
    startTransition(async () => {
      try {
        await setAdminUserStatus(userId, newStatus);
        if (drawerUser && drawerUser.id === userId) {
          setDrawerUser((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to update account status.");
      }
    });
  };

  const handleSoftDelete = (userId: string) => {
    if (!confirm("Are you sure you want to soft-delete this user account? The account will be suspended.")) return;
    startTransition(async () => {
      try {
        await softDeleteUserByAdmin(userId);
        if (drawerUser && drawerUser.id === userId) {
          setDrawerUser((prev) => (prev ? { ...prev, status: "SUSPENDED", deletedAt: new Date().toISOString() } : null));
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to soft-delete user.");
      }
    });
  };

  const handleRestoreUser = (userId: string) => {
    startTransition(async () => {
      try {
        await restoreUserByAdmin(userId);
        if (drawerUser && drawerUser.id === userId) {
          setDrawerUser((prev) => (prev ? { ...prev, status: "APPROVED", deletedAt: null } : null));
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to restore user.");
      }
    });
  };

  // Bulk Actions Execution
  const executeBulkAction = () => {
    if (!bulkConfirmAction || selectedUserIds.length === 0) return;
    const action = bulkConfirmAction;
    setBulkConfirmAction(null);

    startTransition(async () => {
      try {
        if (action === "SUSPEND") {
          const count = await bulkSetUserStatus(selectedUserIds, "SUSPENDED");
          alert(`Successfully suspended ${count} user accounts.`);
        } else if (action === "REACTIVATE") {
          const count = await bulkSetUserStatus(selectedUserIds, "APPROVED");
          alert(`Successfully reactivated ${count} user accounts.`);
        } else if (action === "DELETE") {
          const count = await bulkSoftDeleteUsers(selectedUserIds);
          alert(`Successfully soft-deleted ${count} user accounts.`);
        }
        setSelectedUserIds([]);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Bulk operation failed.");
      }
    });
  };

  // Helper Copy Function
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* KPI & Summary Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>Total Members</span>
            <Building2 size={15} className="text-ulab" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{totalUsers}</p>
          <span className="text-[11px] text-ink-soft">Registered network</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>Active Students</span>
            <GraduationCap size={15} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{activeStudents}</p>
          <span className="text-[11px] text-emerald-600">Enrolled & Active</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>Verified Alumni</span>
            <ShieldCheck size={15} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{verifiedAlumni}</p>
          <span className="text-[11px] text-emerald-600">Auto-Verified (ULAB)</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>Faculty Members</span>
            <BookOpen size={15} className="text-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{totalFaculty}</p>
          <span className="text-[11px] text-ink-soft">Academic faculty</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>Suspended</span>
            <AlertTriangle size={15} className="text-rose" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose">{suspendedCount}</p>
          <span className="text-[11px] text-rose">Locked / Soft-deleted</span>
        </Card>
      </div>

      {/* Advanced Search & Filter Toolbar */}
      <Card className="p-4">
        <div className="space-y-3">
          {/* Top Row: Search & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-72 flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, email, student ID, department, batch, company..."
                className="h-10 w-full rounded-xl border border-mist/80 bg-paper pl-9 pr-3 text-xs text-ink placeholder:text-ink-soft/60 focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleExportCSV(false)}
                className="h-10 gap-1.5 px-3 text-xs font-semibold"
                title="Export current filtered view to CSV"
              >
                <Download size={14} /> Export CSV ({totalFiltered})
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowSoftDeleted((prev) => !prev)}
                className={cn(
                  "h-10 text-xs font-semibold transition-colors",
                  showSoftDeleted ? "bg-rose/10 text-rose" : "text-ink-soft hover:text-ink"
                )}
              >
                {showSoftDeleted ? "Viewing Soft-Deleted" : "View Deleted"}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowImportModal(true)}
                className="h-10 gap-1.5 px-3 text-xs font-semibold"
              >
                <Upload size={14} /> Import Roster
              </Button>
            </div>
          </div>

          {/* Bottom Row: Granular Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-mist/50 dark:border-white/5">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 rounded-xl border border-mist/80 bg-paper px-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
            >
              <option value="ALL">All Roles ({totalUsers})</option>
              <option value="STUDENT">Students</option>
              <option value="ALUMNI">Alumni</option>
              <option value="TEACHER">Faculty</option>
              <option value="ADMIN">Administrators</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 rounded-xl border border-mist/80 bg-paper px-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="APPROVED">Active (Approved)</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Alumni Verification Status Filter */}
            <select
              value={alumniFilter}
              onChange={(e) => {
                setAlumniFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 rounded-xl border border-mist/80 bg-paper px-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
            >
              <option value="ALL">All Alumni Verification</option>
              <option value="VERIFIED">Verified via ULAB Email</option>
              <option value="UNVERIFIED">Unverified Alumni</option>
            </select>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 max-w-44 rounded-xl border border-mist/80 bg-paper px-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Registration Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 rounded-xl border border-mist/80 bg-paper px-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
            >
              <option value="ALL">Joined: All Time</option>
              <option value="7D">Joined: Last 7 Days</option>
              <option value="30D">Joined: Last 30 Days</option>
              <option value="90D">Joined: Last 90 Days</option>
              <option value="1Y">Joined: This Year</option>
            </select>

            {/* Reset Filters */}
            {(search ||
              roleFilter !== "ALL" ||
              statusFilter !== "ALL" ||
              alumniFilter !== "ALL" ||
              deptFilter !== "ALL" ||
              dateFilter !== "ALL" ||
              showSoftDeleted) && (
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("ALL");
                  setStatusFilter("ALL");
                  setAlumniFilter("ALL");
                  setDeptFilter("ALL");
                  setDateFilter("ALL");
                  setShowSoftDeleted(false);
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs text-ink-soft hover:text-rose"
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Bulk Action Sticky Bar (Appears when items are selected) */}
      {selectedUserIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ulab/30 bg-ulab-wash/90 p-3.5 shadow-sm dark:border-ulab/40 dark:bg-ulab-deep/20">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-ulab text-xs font-bold text-white">
              {selectedUserIds.length}
            </span>
            <span className="text-xs font-semibold text-ink">User accounts selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleExportCSV(true)}
              className="h-8 gap-1 px-3 text-xs"
            >
              <Download size={13} /> Export Selected CSV
            </Button>

            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setBulkConfirmAction("REACTIVATE")}
              className="h-8 gap-1 px-3 text-xs text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
            >
              <UserCheck size={13} /> Bulk Reactivate
            </Button>

            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setBulkConfirmAction("SUSPEND")}
              className="h-8 gap-1 px-3 text-xs text-amber-700 hover:border-amber-500 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40"
            >
              <UserX size={13} /> Bulk Suspend
            </Button>

            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setBulkConfirmAction("DELETE")}
              className="h-8 gap-1 px-3 text-xs text-rose hover:border-rose hover:bg-rose/10"
            >
              <Trash2 size={13} /> Bulk Soft-Delete
            </Button>

            <button
              onClick={() => setSelectedUserIds([])}
              className="text-xs text-ink-soft hover:underline"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Main CRM User Management Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-mist/80 bg-paper/60 text-[11px] font-semibold text-ink-soft dark:border-white/10 dark:bg-white/5">
              <tr>
                <th className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={allCurrentPageSelected}
                    onChange={handleToggleSelectAll}
                    aria-label="Select all on page"
                    className="size-4 rounded border-mist text-ulab focus:ring-ulab"
                  />
                </th>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Department & Academic</th>
                <th className="px-4 py-3.5">Account Status</th>
                <th className="px-4 py-3.5">Email Verification</th>
                <th className="px-4 py-3.5">Alumni Verification</th>
                <th className="px-4 py-3.5">Joined Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist/60 text-ink dark:divide-white/5">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12">
                    <EmptyState
                      title="No users match your criteria"
                      body="Try adjusting filters or clear the active search query."
                    />
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  const isSelf = u.id === currentAdminId;

                  return (
                    <tr
                      key={u.id}
                      className={cn(
                        "transition-colors hover:bg-paper/80 dark:hover:bg-white/5",
                        isSelected && "bg-ulab-wash/40 dark:bg-ulab-wash/10"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectUser(u.id)}
                          aria-label={`Select ${u.name}`}
                          className="size-4 rounded border-mist text-ulab focus:ring-ulab"
                        />
                      </td>

                      {/* User Info (Avatar + Name + Student ID) */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size={36} src={u.image} />
                          <div>
                            <button
                              onClick={() => setDrawerUser(u)}
                              className="font-semibold text-ink hover:text-ulab hover:underline text-left block"
                            >
                              {u.name}
                            </button>
                            <span className="block text-[11px] text-ink-soft">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3.5">
                        {u.role === "STUDENT" && <Badge tone="blue">Student</Badge>}
                        {u.role === "ALUMNI" && <Badge tone="gold">Alumni</Badge>}
                        {u.role === "TEACHER" && <Badge tone="lilac">Faculty</Badge>}
                        {u.role === "ADMIN" && <Badge tone="gray">Admin</Badge>}
                      </td>

                      {/* Department & Academic Information */}
                      <td className="px-4 py-3.5 text-ink-soft">
                        <p className="font-medium text-ink">{u.department || "No department"}</p>
                        <p className="text-[11px]">
                          {u.batch && <span>Batch {u.batch}</span>}
                          {u.graduationYear && <span>Class of {u.graduationYear}</span>}
                          {u.studentId && <span className="font-mono"> • ID: {u.studentId}</span>}
                        </p>
                      </td>

                      {/* Account Status Badge */}
                      <td className="px-4 py-3.5">
                        {u.deletedAt ? (
                          <Badge tone="rose">Soft Deleted</Badge>
                        ) : u.status === "APPROVED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 size={11} /> Active
                          </span>
                        ) : u.status === "SUSPENDED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose">
                            <AlertCircle size={11} /> Suspended
                          </span>
                        ) : u.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            <Clock size={11} /> Pending
                          </span>
                        ) : (
                          <Badge tone="gray">{u.status}</Badge>
                        )}
                      </td>

                      {/* Email Verification Status */}
                      <td className="px-4 py-3.5">
                        {u.emailVerified ? (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 size={12} /> Confirmed
                          </span>
                        ) : (
                          <span className="text-ink-soft">Unconfirmed</span>
                        )}
                      </td>

                      {/* Alumni Verification Status (CRITICAL REQUIREMENT) */}
                      <td className="px-4 py-3.5">
                        {u.role === "ALUMNI" ? (
                          u.alumniVerified ? (
                            <span
                              title={`Verified via ${u.verificationMethod || "ulab_email"}`}
                              className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            >
                              <ShieldCheck size={12} className="text-emerald-600" /> Verified (ULAB)
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                              Unverified
                            </span>
                          )
                        ) : (
                          <span className="text-ink-soft/40">—</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 py-3.5 text-ink-soft whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            onClick={() => setDrawerUser(u)}
                            className="h-8 gap-1 px-2.5 text-[11px] font-medium"
                          >
                            <Eye size={12} /> View
                          </Button>

                          {!isSelf && (
                            <>
                              {u.status === "APPROVED" ? (
                                <button
                                  onClick={() => handleSetStatus(u.id, "SUSPENDED")}
                                  disabled={isPending}
                                  title="Suspend account"
                                  className="rounded-lg p-1.5 text-ink-soft hover:bg-rose/10 hover:text-rose"
                                >
                                  <UserX size={14} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSetStatus(u.id, "APPROVED")}
                                  disabled={isPending}
                                  title="Reactivate account"
                                  className="rounded-lg p-1.5 text-ink-soft hover:bg-emerald-50 hover:text-emerald-700"
                                >
                                  <UserCheck size={14} />
                                </button>
                              )}

                              {u.deletedAt ? (
                                <button
                                  onClick={() => handleRestoreUser(u.id)}
                                  disabled={isPending}
                                  title="Restore user account"
                                  className="rounded-lg p-1.5 text-ink-soft hover:bg-paper hover:text-ulab"
                                >
                                  <RotateCcw size={14} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSoftDelete(u.id)}
                                  disabled={isPending}
                                  title="Soft-delete user account"
                                  className="rounded-lg p-1.5 text-ink-soft hover:bg-rose/10 hover:text-rose"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist/80 bg-paper/40 px-4 py-3 text-xs text-ink-soft dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-ink">{totalFiltered === 0 ? 0 : startIndex + 1}</strong> to{" "}
              <strong className="text-ink">{Math.min(startIndex + pageSize, totalFiltered)}</strong> of{" "}
              <strong className="text-ink">{totalFiltered}</strong> registered members
            </span>

            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 rounded-lg border border-mist/80 bg-paper px-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="h-8 gap-1 px-2.5 text-xs"
            >
              <ChevronLeft size={13} /> Previous
            </Button>

            <span className="px-2 text-xs font-semibold text-ink">
              Page {safeCurrentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="h-8 gap-1 px-2.5 text-xs"
            >
              Next <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Slide-over User Details Panel Drawer */}
      {drawerUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative flex h-full w-full max-w-xl flex-col bg-paper shadow-2xl dark:bg-surface border-l border-mist dark:border-white/10 overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-mist/80 p-6 dark:border-white/10 bg-paper/60 dark:bg-white/5">
              <div className="flex items-center gap-4">
                <Avatar name={drawerUser.name} size={56} src={drawerUser.image} />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-ink">{drawerUser.name}</h2>
                    {drawerUser.role === "STUDENT" && <Badge tone="blue">Student</Badge>}
                    {drawerUser.role === "ALUMNI" && <Badge tone="gold">Alumni</Badge>}
                    {drawerUser.role === "TEACHER" && <Badge tone="lilac">Faculty</Badge>}
                    {drawerUser.role === "ADMIN" && <Badge tone="gray">Admin</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-ink-soft">{drawerUser.email}</span>
                    <button
                      onClick={() => handleCopyEmail(drawerUser.email)}
                      className="text-ink-soft hover:text-ulab"
                      title="Copy email"
                    >
                      <Copy size={12} />
                    </button>
                    {copiedEmail && <span className="text-[10px] text-emerald-600 font-semibold">Copied!</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDrawerUser(null)}
                className="rounded-xl p-2 text-ink-soft hover:bg-mist/40 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Action Strip inside Drawer */}
            {drawerUser.id !== currentAdminId && (
              <div className="flex items-center justify-between gap-3 border-b border-mist/60 bg-paper px-6 py-3 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-soft">Account State:</span>
                  {drawerUser.status === "APPROVED" ? (
                    <Badge tone="sage">Active</Badge>
                  ) : (
                    <Badge tone="rose">Suspended</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {drawerUser.status === "APPROVED" ? (
                    <Button
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleSetStatus(drawerUser.id, "SUSPENDED")}
                      className="h-7 text-xs text-rose hover:bg-rose/10"
                    >
                      <UserX size={13} className="mr-1" /> Suspend
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleSetStatus(drawerUser.id, "APPROVED")}
                      className="h-7 text-xs text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300"
                    >
                      <UserCheck size={13} className="mr-1" /> Reactivate
                    </Button>
                  )}

                  {drawerUser.deletedAt ? (
                    <Button
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleRestoreUser(drawerUser.id)}
                      className="h-7 text-xs"
                    >
                      <RotateCcw size={13} className="mr-1" /> Restore
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleSoftDelete(drawerUser.id)}
                      className="h-7 text-xs text-ink-soft hover:text-rose"
                    >
                      <Trash2 size={13} className="mr-1" /> Soft Delete
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-ink">
              {/* 1. Basic Information */}
              <div className="rounded-2xl border border-mist/70 p-4 dark:border-white/10 space-y-3">
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                  <Mail size={15} className="text-ulab" /> Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-ink-soft">
                  <div>
                    <span className="block text-[11px] font-semibold text-ink">Full Name</span>
                    <span>{drawerUser.name}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-ink">Official Email</span>
                    <span>{drawerUser.email}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-ink">Phone Contact</span>
                    <span>{drawerUser.phone || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-ink">Location</span>
                    <span>{drawerUser.location || "Dhaka, Bangladesh"}</span>
                  </div>
                </div>
                {drawerUser.bio && (
                  <div className="border-t border-mist/50 pt-2 text-ink-soft dark:border-white/5">
                    <span className="block text-[11px] font-semibold text-ink">Biography</span>
                    <p className="mt-1 leading-relaxed">{drawerUser.bio}</p>
                  </div>
                )}
              </div>

              {/* 2. Academic Information */}
              <div className="rounded-2xl border border-mist/70 p-4 dark:border-white/10 space-y-3">
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                  <GraduationCap size={15} className="text-blue-500" /> Academic Credentials
                </h3>
                <div className="grid grid-cols-2 gap-3 text-ink-soft">
                  <div>
                    <span className="block text-[11px] font-semibold text-ink">Department</span>
                    <span>{drawerUser.department || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-ink">Student ID</span>
                    <span className="font-mono">{drawerUser.studentId || "None recorded"}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-ink">Admission Year / Batch</span>
                    <span>{drawerUser.batch ? `Batch ${drawerUser.batch}` : "N/A"}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-ink">Graduation Year</span>
                    <span>{drawerUser.graduationYear ? `Class of ${drawerUser.graduationYear}` : "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* 3. Professional Information */}
              <div className="rounded-2xl border border-mist/70 p-4 dark:border-white/10 space-y-3">
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                  <Briefcase size={15} className="text-amber-500" /> Professional Background
                </h3>
                <div className="grid grid-cols-2 gap-3 text-ink-soft">
                  <div>
                    <span className="block text-[11px] font-semibold text-ink">Current Organization</span>
                    <span>{drawerUser.company || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-ink">Position / Academic Rank</span>
                    <span>{drawerUser.designation || "Not provided"}</span>
                  </div>
                </div>
                {drawerUser.skills && (
                  <div className="border-t border-mist/50 pt-2 text-ink-soft dark:border-white/5">
                    <span className="block text-[11px] font-semibold text-ink">Skills</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {drawerUser.skills.split(",").map((s) => (
                        <span
                          key={s}
                          className="rounded-md bg-paper px-2 py-0.5 text-[10px] font-medium text-ink dark:bg-white/10"
                        >
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {drawerUser.linkedin && (
                  <div className="border-t border-mist/50 pt-2 text-ink-soft dark:border-white/5">
                    <span className="block text-[11px] font-semibold text-ink">LinkedIn Profile</span>
                    <a
                      href={drawerUser.linkedin.startsWith("http") ? drawerUser.linkedin : `https://${drawerUser.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-ulab hover:underline"
                    >
                      {drawerUser.linkedin} <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>

              {/* 4. Verification Information (STRICTLY VIEW-ONLY) */}
              <div className="rounded-2xl border border-emerald-300/80 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20 space-y-3">
                <h3 className="font-display text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" /> Verification Details (Institutional)
                </h3>
                <div className="grid grid-cols-2 gap-3 text-ink-soft">
                  <div>
                    <span className="block text-[11px] font-semibold text-ink">Email Verification</span>
                    <span className={cn(drawerUser.emailVerified ? "text-emerald-700 font-semibold" : "text-amber-700")}>
                      {drawerUser.emailVerified ? "Confirmed Official ULAB" : "Pending Confirmation"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-ink">Alumni Verification Status</span>
                    {drawerUser.role === "ALUMNI" ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Verified Alumni
                      </span>
                    ) : (
                      <span className="text-ink-soft">Not Applicable (Role: {drawerUser.role})</span>
                    )}
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-ink">Verification Method</span>
                    <span className="font-mono">{drawerUser.verificationMethod || "ulab_email"}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-ink">Verification Date</span>
                    <span>
                      {drawerUser.verifiedAt
                        ? new Date(drawerUser.verifiedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Initial Registration"}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-100/60 p-2.5 text-[11px] text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <p>
                    <strong>Institutional Rule:</strong> Alumni verification is fully automatic through confirmed
                    @ulab.edu.bd email addresses. No manual Admin approval is required or permitted. Account suspension
                    and Alumni verification remain separate.
                  </p>
                </div>
              </div>

              {/* 5. Relevant User Activity History */}
              <div className="rounded-2xl border border-mist/70 p-4 dark:border-white/10 space-y-3">
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                  <Clock size={15} className="text-ulab" /> Relevant Activity & Engagement
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-paper p-3 text-center dark:bg-white/5">
                    <span className="text-[10px] text-ink-soft">Jobs Posted</span>
                    <p className="text-lg font-bold text-ink">{drawerUser.activity.jobsCount}</p>
                  </div>
                  <div className="rounded-xl bg-paper p-3 text-center dark:bg-white/5">
                    <span className="text-[10px] text-ink-soft">Applications</span>
                    <p className="text-lg font-bold text-ink">{drawerUser.activity.applicationsCount}</p>
                  </div>
                  <div className="rounded-xl bg-paper p-3 text-center dark:bg-white/5">
                    <span className="text-[10px] text-ink-soft">Mentorship</span>
                    <p className="text-lg font-bold text-ink">{drawerUser.activity.mentorshipCount}</p>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-mist/50 pt-3 text-[11px] text-ink-soft dark:border-white/5">
                  <div className="flex justify-between">
                    <span>Joined ULAB Setu:</span>
                    <strong className="text-ink">
                      {new Date(drawerUser.createdAt).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Login Timestamp:</span>
                    <strong className="text-ink">
                      {drawerUser.lastLoginAt
                        ? new Date(drawerUser.lastLoginAt).toLocaleString()
                        : "Never logged in"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {bulkConfirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6">
            <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose" /> Confirm Bulk Operation
            </h3>
            <p className="mt-2 text-xs text-ink-soft">
              Are you sure you want to <strong>{bulkConfirmAction.toLowerCase()}</strong> the{" "}
              <strong>{selectedUserIds.length}</strong> selected user accounts?
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setBulkConfirmAction(null)}>
                Cancel
              </Button>
              <Button
                variant={bulkConfirmAction === "DELETE" ? "danger" : "primary"}
                onClick={executeBulkAction}
                disabled={isPending}
              >
                {isPending ? "Executing…" : `Confirm ${bulkConfirmAction}`}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Pre-approved Directory Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between border-b border-mist/60 pb-3 dark:border-white/10">
              <h3 className="font-display text-base font-bold text-ink">Import Official University Roster</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-lg p-1 text-ink-soft hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="mt-4 space-y-4">
              <p className="text-xs text-ink-soft">
                Upload a CSV or Excel spreadsheet containing verified university members for pre-approval.
              </p>

              <div>
                <label className="block text-xs font-semibold text-ink">Select Roster File (.csv, .xlsx)</label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-xs text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Default Role</label>
                <select
                  value={uploadRole}
                  onChange={(e) => setUploadRole(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-mist bg-paper px-3 text-xs"
                >
                  <option value="AUTO">Auto-detect from spreadsheet</option>
                  <option value="STUDENT">Student</option>
                  <option value="ALUMNI">Alumni</option>
                  <option value="TEACHER">Faculty</option>
                </select>
              </div>

              {uploadResult && (
                <div
                  className={cn(
                    "rounded-xl p-3 text-xs",
                    uploadResult.success ? "bg-emerald-50 text-emerald-800" : "bg-rose/10 text-rose"
                  )}
                >
                  {uploadResult.message}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClearDirectory}
                  className="text-xs text-rose"
                >
                  Clear Directory ({preApprovedCount})
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setShowImportModal(false)}>
                    Close
                  </Button>
                  <Button type="submit" disabled={!selectedFile || isUploading}>
                    {isUploading ? "Uploading…" : "Import Roster"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
