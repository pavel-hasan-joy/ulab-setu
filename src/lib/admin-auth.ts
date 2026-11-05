import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "./auth";
import {
  type AdminSubRole,
  type AdminPermission,
  ROLE_PERMISSIONS,
  SUB_ROLE_LABELS,
  getAdminSubRole,
} from "./admin-permissions";

export {
  type AdminSubRole,
  type AdminPermission,
  ROLE_PERMISSIONS,
  SUB_ROLE_LABELS,
  getAdminSubRole,
};

/**
 * Server-side authorization check enforcing backend permissions for Admin operations.
 */
export async function requireAdminPermission(permission: AdminPermission) {
  const user = await requireUser("ADMIN");
  const subRole = getAdminSubRole(user);

  const allowed = ROLE_PERMISSIONS[subRole]?.includes(permission);
  if (!allowed) {
    redirect(`/admin/access-denied?denied=${encodeURIComponent(permission)}`);
  }

  return { user, subRole };
}
