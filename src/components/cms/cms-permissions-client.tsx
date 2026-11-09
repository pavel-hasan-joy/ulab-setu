"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  UserPlus,
  Search,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  KeyRound,
  Users,
  FileCheck2,
  Check,
} from "lucide-react";
import { Badge, Avatar, cn } from "@/components/ui";
import {
  type CmsRole,
  CMS_ROLES,
  CMS_ROLE_META,
  CMS_ROLE_CAPABILITIES,
  type CmsCapability,
} from "@/lib/cms-types";
import { assignCmsUserRole, revokeCmsUserRole, searchUsersForCms } from "@/app/actions/cms";

type CmsUserItem = {
  id: string;
  userId: string;
  role: string;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
    image: string | null;
    status: string;
  };
  assignedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type SearchedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  studentId: string | null;
  image: string | null;
  cmsRole: { id: string; role: string } | null;
};

type CmsPermissionsClientProps = {
  assignments: CmsUserItem[];
  currentActorId: string;
  isSuperAdmin: boolean;
};

export function CmsPermissionsClient({
  assignments,
  currentActorId,
  isSuperAdmin,
}: CmsPermissionsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  // Assignment Modal State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<CmsRole>("CONTENT_EDITOR");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Revoke state
  const [revokeTarget, setRevokeTarget] = useState<CmsUserItem | null>(null);

  // Live user search for modal
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchUsersForCms(searchQuery);
        setSearchResults(results as unknown as SearchedUser[]);
      } catch (err) {
        console.error("Search failed:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredAssignments = assignments.filter((item) => {
    const matchesSearch =
      item.user.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.user.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (item.user.department && item.user.department.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesRole = roleFilter === "ALL" || item.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setModalError("Please select a user to assign privileges.");
      return;
    }

    setModalError(null);
    setModalSuccess(null);

    const formData = new FormData();
    formData.append("targetUserId", selectedUser.id);
    formData.append("role", selectedRole);
    formData.append("notes", assignmentNotes);

    startTransition(async () => {
      const res = await assignCmsUserRole(undefined, formData);
      if (!res.success) {
        setModalError(res.error || "Failed to assign role.");
      } else {
        setModalSuccess(res.message || "Role assigned successfully!");
        setTimeout(() => {
          setModalOpen(false);
          setSelectedUser(null);
          setSearchQuery("");
          setAssignmentNotes("");
          setModalSuccess(null);
        }, 1200);
      }
    });
  };

  const handleRevokeConfirm = () => {
    if (!revokeTarget) return;

    startTransition(async () => {
      const res = await revokeCmsUserRole(revokeTarget.userId);
      if (!res.success) {
        alert(res.error || "Failed to revoke CMS role.");
      } else {
        setRevokeTarget(null);
      }
    });
  };

  const openEditRoleModal = (item: CmsUserItem) => {
    setSelectedUser({
      id: item.userId,
      name: item.user.name,
      email: item.user.email,
      role: item.user.role,
      department: item.user.department,
      studentId: null,
      image: item.user.image,
      cmsRole: { id: item.id, role: item.role },
    });
    setSelectedRole(item.role as CmsRole);
    setAssignmentNotes(item.notes || "");
    setModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* =========================================================================
          HEADER WITH BACK LINK & STATS
      ========================================================================= */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/cms"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft transition hover:text-ink"
            >
              <ArrowLeft size={14} /> Back to CMS Overview
            </Link>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            CMS Permission Governance
          </h1>
          <p className="text-xs text-ink-soft">
            Explicit role-based access control (RBAC) assigning editorial and publication capabilities to individual users.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedUser(null);
            setSearchQuery("");
            setAssignmentNotes("");
            setModalError(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-ulab-deep px-4 py-2.5 text-xs font-bold text-white shadow-lift transition hover:bg-ulab active:scale-98"
        >
          <UserPlus size={16} /> Assign CMS Role
        </button>
      </div>

      {/* =========================================================================
          ROLE SUMMARY CHIPS
      ========================================================================= */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {CMS_ROLES.map((role) => {
          const meta = CMS_ROLE_META[role];
          const count = assignments.filter((a) => a.role === role).length;

          return (
            <div
              key={role}
              className="rounded-2xl border border-mist/80 bg-surface/90 p-3.5 shadow-xs dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <Badge tone={meta.tone} className="text-[10px]">
                  {meta.label}
                </Badge>
                <span className="font-display text-lg font-bold text-ink">{count}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-[10px] text-ink-soft leading-tight">
                {meta.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          SEARCH & FILTER BAR
      ========================================================================= */}
      <div className="flex flex-col gap-3 rounded-2xl border border-mist/80 bg-surface/90 p-4 shadow-xs dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            placeholder="Search by name, email, or department..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="h-9 w-full rounded-xl border border-mist/80 bg-paper pl-9 pr-3 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-soft shrink-0">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-xl border border-mist/80 bg-paper px-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
          >
            <option value="ALL">All Roles ({assignments.length})</option>
            {CMS_ROLES.map((role) => (
              <option key={role} value={role}>
                {CMS_ROLE_META[role].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =========================================================================
          ASSIGNMENTS TABLE / ROSTER
      ========================================================================= */}
      <div className="overflow-hidden rounded-3xl border border-mist/80 bg-surface shadow-xs dark:border-white/10 dark:bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-mist/80 bg-paper/60 text-ink-soft dark:border-white/10 dark:bg-white/5">
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">User & Portal Role</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px]">Assigned CMS Role</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px]">Assignment Details</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px]">Assigned By</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist/60 dark:divide-white/5">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-ink-soft">
                    {assignments.length === 0
                      ? "No CMS user permissions assigned yet. System Super Admins have default bootstrap authority."
                      : "No user matches the specified search and filter criteria."}
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((item) => {
                  const roleMeta = CMS_ROLE_META[item.role as CmsRole] || {
                    label: item.role,
                    tone: "gray",
                  };
                  const isSelf = item.userId === currentActorId;

                  return (
                    <tr key={item.id} className="transition hover:bg-paper/40 dark:hover:bg-white/5">
                      {/* User */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={item.user.name} size={32} src={item.user.image} />
                          <div className="min-w-0">
                            <p className="font-bold text-ink truncate">{item.user.name}</p>
                            <p className="text-[11px] text-ink-soft truncate">{item.user.email}</p>
                            <span className="mt-0.5 inline-block rounded bg-mist/60 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-ink-soft dark:bg-white/10">
                              {item.user.role} {item.user.department ? `• ${item.user.department}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CMS Role */}
                      <td className="px-4 py-3.5">
                        <Badge tone={roleMeta.tone} className="px-2.5 py-0.5 text-[11px] font-semibold">
                          {roleMeta.label}
                        </Badge>
                      </td>

                      {/* Assignment Context / Notes */}
                      <td className="px-4 py-3.5">
                        <p className="text-[11px] text-ink-soft">
                          {item.notes || <span className="italic text-ink-soft/60">No context recorded</span>}
                        </p>
                        <p className="text-[10px] text-ink-soft/60 mt-0.5">
                          Assigned: {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </td>

                      {/* Assigned By */}
                      <td className="px-4 py-3.5">
                        {item.assignedBy ? (
                          <div>
                            <p className="font-semibold text-ink">{item.assignedBy.name}</p>
                            <p className="text-[10px] text-ink-soft">{item.assignedBy.email}</p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-ink-soft/60">System Initial</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditRoleModal(item)}
                            title="Edit CMS role"
                            className="rounded-lg p-1.5 text-ink-soft transition hover:bg-paper hover:text-ink dark:hover:bg-white/10"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setRevokeTarget(item)}
                            title={isSelf ? "Cannot revoke your own access" : "Revoke CMS permissions"}
                            className="rounded-lg p-1.5 text-ink-soft transition hover:bg-rose-wash hover:text-rose disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          ROLE CAPABILITY MATRIX ACCORDION / REFERENCE
      ========================================================================= */}
      <div className="rounded-3xl border border-mist/80 bg-surface/90 p-6 shadow-xs dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-2 border-b border-mist/70 pb-3 dark:border-white/10">
          <KeyRound size={16} className="text-gold-ink dark:text-gold-soft" />
          <h3 className="font-display text-sm font-bold text-ink">
            CMS Role & Capability Matrix (Least Privilege Standards)
          </h3>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-mist/60 text-ink-soft">
                <th className="py-2 pr-4 font-bold">Capability / Operation</th>
                {CMS_ROLES.map((r) => (
                  <th key={r} className="py-2 px-3 text-center font-bold">
                    {CMS_ROLE_META[r].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mist/40 text-[11px] dark:divide-white/5">
              {[
                { cap: "cms:overview:view" as CmsCapability, name: "View CMS Overview & Stats" },
                { cap: "cms:content:create" as CmsCapability, name: "Create New Content Drafts" },
                { cap: "cms:content:edit_own" as CmsCapability, name: "Edit Own Drafts" },
                { cap: "cms:content:edit" as CmsCapability, name: "Edit Any Draft Content" },
                { cap: "cms:content:submit_review" as CmsCapability, name: "Submit to Review Queue" },
                { cap: "cms:content:review" as CmsCapability, name: "Review Content & Leave Notes" },
                { cap: "cms:content:approve" as CmsCapability, name: "Approve or Request Changes" },
                { cap: "cms:content:publish" as CmsCapability, name: "Publish Approved Content" },
                { cap: "cms:content:schedule" as CmsCapability, name: "Schedule Future Publications" },
                { cap: "cms:content:unpublish" as CmsCapability, name: "Unpublish Live Content" },
                { cap: "cms:content:archive" as CmsCapability, name: "Archive Historical Content" },
                { cap: "cms:permissions:manage" as CmsCapability, name: "Manage CMS Roles & Users" },
              ].map((row) => (
                <tr key={row.cap}>
                  <td className="py-2.5 pr-4 font-medium text-ink">{row.name}</td>
                  {CMS_ROLES.map((r) => {
                    const has = CMS_ROLE_CAPABILITIES[r].includes(row.cap);
                    return (
                      <td key={r} className="py-2.5 px-3 text-center">
                        {has ? (
                          <span className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Check size={12} />
                          </span>
                        ) : (
                          <span className="text-ink-soft/40">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          ASSIGN / EDIT CMS ROLE MODAL
      ========================================================================= */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-ink/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-mist bg-surface p-6 shadow-lift dark:border-white/10 dark:bg-[#0f172a]"
            >
              <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-ulab/10 text-ulab dark:bg-ulab/20 dark:text-sky-300">
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-ink">
                      {selectedUser?.cmsRole ? "Update CMS Role Assignment" : "Assign User CMS Permissions"}
                    </h3>
                    <p className="text-[11px] text-ink-soft">
                      Grants specific editorial or publication rights without changing portal role.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-1.5 text-ink-soft hover:bg-paper dark:hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose/30 bg-rose-wash p-2.5 text-xs text-rose">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAssignSubmit} className="mt-4 space-y-4">
                {/* Select User Step */}
                {!selectedUser ? (
                  <div>
                    <label className="block text-xs font-bold text-ink">Search User Account *</label>
                    <div className="relative mt-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                      <input
                        type="text"
                        placeholder="Type user's name or @ulab.edu.bd email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9.5 w-full rounded-xl border border-mist/80 bg-paper pl-9 pr-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                      />
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-mist/80 bg-paper p-1 space-y-1 shadow-soft dark:border-white/10 dark:bg-white/5">
                        {searchResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              if (u.cmsRole) setSelectedRole(u.cmsRole.role as CmsRole);
                            }}
                            className="flex w-full items-center justify-between rounded-xl p-2 text-left text-xs transition hover:bg-surface dark:hover:bg-white/10"
                          >
                            <div className="flex items-center gap-2.5">
                              <Avatar name={u.name} size={28} src={u.image} />
                              <div>
                                <p className="font-bold text-ink">{u.name}</p>
                                <p className="text-[10px] text-ink-soft">{u.email}</p>
                              </div>
                            </div>
                            <span className="rounded bg-mist/60 px-2 py-0.5 text-[9px] font-bold uppercase text-ink-soft dark:bg-white/10">
                              {u.role}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-2xl border border-mist/80 bg-paper p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <Avatar name={selectedUser.name} size={32} src={selectedUser.image} />
                      <div>
                        <p className="font-bold text-xs text-ink">{selectedUser.name}</p>
                        <p className="text-[11px] text-ink-soft">{selectedUser.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-[11px] font-semibold text-ulab hover:underline dark:text-sky-400"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* CMS Role Selector */}
                <div>
                  <label className="block text-xs font-bold text-ink">Select CMS Role *</label>
                  <div className="mt-1 space-y-2">
                    {CMS_ROLES.map((role) => {
                      const meta = CMS_ROLE_META[role];
                      const isSelected = selectedRole === role;

                      return (
                        <label
                          key={role}
                          onClick={() => setSelectedRole(role)}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition",
                            isSelected
                              ? "border-ulab bg-ulab/5 dark:border-sky-400 dark:bg-sky-400/10"
                              : "border-mist/70 bg-paper/50 hover:bg-paper dark:border-white/10 dark:bg-white/5"
                          )}
                        >
                          <input
                            type="radio"
                            name="cmsRole"
                            checked={isSelected}
                            onChange={() => setSelectedRole(role)}
                            className="mt-1 size-3.5 text-ulab focus:ring-ulab"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-ink">{meta.label}</span>
                              <Badge tone={meta.tone} className="text-[9px]">
                                {role}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-[11px] text-ink-soft leading-tight">
                              {meta.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Administrative Notes */}
                <div>
                  <label className="block text-xs font-bold text-ink">Assignment Context / Notes</label>
                  <textarea
                    rows={2}
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    placeholder="e.g. Authorized editor for CSE Department publications and faculty news..."
                    className="mt-1 w-full rounded-xl border border-mist/80 bg-paper p-2.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-mist/70 pt-4 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-mist/80 px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-paper dark:border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !selectedUser}
                    className="inline-flex items-center gap-2 rounded-xl bg-ulab-deep px-5 py-2 text-xs font-bold text-white transition hover:bg-ulab disabled:opacity-60"
                  >
                    {isPending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Permission"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          REVOKE CONFIRMATION MODAL
      ========================================================================= */}
      <AnimatePresence>
        {revokeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRevokeTarget(null)}
              className="fixed inset-0 bg-ink/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-sm rounded-3xl border border-mist bg-surface p-6 shadow-lift dark:border-white/10 dark:bg-[#0f172a]"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-wash text-rose">
                <ShieldAlert size={22} />
              </div>
              <h3 className="mt-3 font-display text-base font-bold text-ink">Revoke CMS Access?</h3>
              <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                Are you sure you want to revoke <strong>{revokeTarget.role}</strong> privileges from{" "}
                <strong>{revokeTarget.user.name}</strong> ({revokeTarget.user.email})? They will immediately lose editorial and publication access.
              </p>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRevokeTarget(null)}
                  className="rounded-xl border border-mist/80 px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-paper dark:border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRevokeConfirm}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose px-4 py-2 text-xs font-bold text-white transition hover:bg-rose/90 disabled:opacity-60"
                >
                  {isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Revoke Privileges
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
