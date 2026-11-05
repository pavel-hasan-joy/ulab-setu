export type AdminSubRole =
  | "SUPER_ADMIN"
  | "USER_ADMIN"
  | "JOB_MODERATOR"
  | "SUPPORT_ADMIN"
  | "ANALYST";

export type AdminPermission =
  | "dashboard:view"
  | "users:manage"
  | "alumni:manage"
  | "jobs:manage"
  | "applications:view"
  | "reports:manage"
  | "mentorship:view"
  | "tickets:manage"
  | "notifications:manage"
  | "analytics:view"
  | "admins:manage"
  | "settings:manage"
  | "audit:view";

export const ROLE_PERMISSIONS: Record<AdminSubRole, AdminPermission[]> = {
  SUPER_ADMIN: [
    "dashboard:view",
    "users:manage",
    "alumni:manage",
    "jobs:manage",
    "applications:view",
    "reports:manage",
    "mentorship:view",
    "tickets:manage",
    "notifications:manage",
    "analytics:view",
    "admins:manage",
    "settings:manage",
    "audit:view",
  ],
  USER_ADMIN: [
    "dashboard:view",
    "users:manage",
    "alumni:manage",
    "audit:view",
  ],
  JOB_MODERATOR: [
    "dashboard:view",
    "jobs:manage",
    "applications:view",
    "reports:manage",
  ],
  SUPPORT_ADMIN: [
    "dashboard:view",
    "tickets:manage",
    "notifications:manage",
    "mentorship:view",
  ],
  ANALYST: [
    "dashboard:view",
    "analytics:view",
    "audit:view",
  ],
};

export const SUB_ROLE_LABELS: Record<AdminSubRole, { label: string; tone: "gold" | "blue" | "sage" | "lilac" | "gray" }> = {
  SUPER_ADMIN: { label: "Super Admin", tone: "gold" },
  USER_ADMIN: { label: "User Admin", tone: "blue" },
  JOB_MODERATOR: { label: "Job Moderator", tone: "lilac" },
  SUPPORT_ADMIN: { label: "Support Admin", tone: "sage" },
  ANALYST: { label: "Analyst", tone: "gray" },
};

/**
 * Derives the administrative sub-role from user records.
 * Institutional super admins and root accounts resolve to SUPER_ADMIN.
 */
export function getAdminSubRole(user: { email: string; designation?: string | null }): AdminSubRole {
  if (user.email === "admin@ulab.edu.bd") {
    return "SUPER_ADMIN";
  }

  const designation = (user.designation || "").trim().toLowerCase();
  if (designation.includes("user admin")) return "USER_ADMIN";
  if (designation.includes("job moderator") || designation.includes("moderator")) return "JOB_MODERATOR";
  if (designation.includes("support admin") || designation.includes("support")) return "SUPPORT_ADMIN";
  if (designation.includes("analyst")) return "ANALYST";
  if (designation.includes("super admin") || designation.includes("head of administration")) return "SUPER_ADMIN";

  return "SUPER_ADMIN";
}
