import "server-only";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAdminSubRole } from "@/lib/admin-permissions";
import {
  type CmsRole,
  type CmsCapability,
  CMS_ROLES,
} from "./cms-types";
import { hasCmsCapability } from "./cms-permissions";

export type ResolvedCmsUser = {
  id: string;
  name: string;
  email: string;
  role: string; // App role (STUDENT | ALUMNI | TEACHER | ADMIN)
  image?: string | null;
  cmsRole: CmsRole;
  isSystemAdmin: boolean;
};

/**
 * Resolves the active CMS role for a user.
 * 1. Explicit CmsUserRole assignment takes precedence.
 * 2. System administrators (role === "ADMIN") possess bootstrap CMS_ADMIN capabilities.
 * 3. General users without an explicit CMS assignment have NO CMS access (deny-by-default).
 */
export async function getEffectiveCmsRole(userId: string): Promise<CmsRole | null> {
  const [explicitAssignment, userRecord] = await Promise.all([
    db.cmsUserRole.findUnique({
      where: { userId },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true, designation: true },
    }),
  ]);

  if (explicitAssignment && CMS_ROLES.includes(explicitAssignment.role as CmsRole)) {
    return explicitAssignment.role as CmsRole;
  }

  // Initial bootstrap: System administrators have CMS_ADMIN privileges
  if (userRecord && userRecord.role === "ADMIN") {
    const adminSubRole = getAdminSubRole({
      email: userRecord.email,
      designation: userRecord.designation,
    });
    if (adminSubRole === "SUPER_ADMIN") {
      return "CMS_ADMIN";
    }
  }

  return null;
}

/**
 * Enforces that the current authenticated user has CMS access and
 * holds the specified capability. Redirects or throws if unauthorized.
 */
export async function requireCmsCapability(
  capability: CmsCapability
): Promise<ResolvedCmsUser> {
  const sessionUser = await requireUser();

  const cmsRole = await getEffectiveCmsRole(sessionUser.id);
  if (!cmsRole) {
    redirect("/admin/access-denied?denied=cms:unauthorized");
  }

  const allowed = hasCmsCapability(cmsRole, capability);
  if (!allowed) {
    redirect(`/admin/access-denied?denied=${encodeURIComponent(capability)}`);
  }

  return {
    id: sessionUser.id,
    name: sessionUser.name,
    email: sessionUser.email,
    role: sessionUser.role,
    image: sessionUser.image,
    cmsRole,
    isSystemAdmin: sessionUser.role === "ADMIN",
  };
}

/**
 * Audit helper for CMS operations using existing AdminAuditLog table.
 */
export async function recordCmsAuditLog(params: {
  actorId: string;
  action: string;
  targetType: "CMS_CONTENT" | "CMS_ROLE" | "CMS_REVISION" | "CMS_FEEDBACK" | "CMS_MEDIA";
  targetId?: string;
  details?: Record<string, unknown> | string;
}) {
  try {
    const detailsString =
      typeof params.details === "object"
        ? JSON.stringify(params.details)
        : params.details || null;

    await db.adminAuditLog.create({
      data: {
        adminId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId || null,
        details: detailsString,
      },
    });
  } catch (err) {
    console.error("Failed to write CMS audit log:", err);
  }
}
