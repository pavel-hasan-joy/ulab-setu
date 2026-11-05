"use client";

import { useState } from "react";
import { assignAdminSubRole } from "@/app/actions/admin";

export function AdminSubRoleSelector({
  adminId,
  currentTitle,
  isSelf,
}: {
  adminId: string;
  currentTitle: string;
  isSelf: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [subRole, setSubRole] = useState(currentTitle || "Super Admin");

  const handleChange = async (newRole: string) => {
    setLoading(true);
    setSubRole(newRole);
    try {
      await assignAdminSubRole(adminId, newRole);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update admin role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        disabled={loading || isSelf}
        value={subRole}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-xl border border-mist/80 bg-paper px-2.5 py-1 text-xs font-semibold text-ink focus:border-ulab focus:outline-none disabled:opacity-50 dark:border-white/10 dark:bg-white/5"
      >
        <option value="Super Admin">Super Admin</option>
        <option value="User Admin">User Admin</option>
        <option value="Job Moderator">Job Moderator</option>
        <option value="Support Admin">Support Admin</option>
        <option value="Analyst">Analyst</option>
      </select>
      {isSelf && <span className="text-[10px] text-ink-soft">(Current Session)</span>}
    </div>
  );
}
