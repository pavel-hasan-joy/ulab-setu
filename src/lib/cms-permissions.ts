import {
  type CmsRole,
  type CmsCapability,
  type CmsContentStatus,
  CMS_ROLE_CAPABILITIES,
  VALID_STATUS_TRANSITIONS,
  CMS_STATUS_META,
  CMS_ROLE_META,
  CMS_CONTENT_TYPE_META,
  type CmsContentType,
} from "./cms-types";

/**
 * Checks whether a given CMS role possesses a specific CMS capability.
 */
export function hasCmsCapability(
  role: CmsRole | null | undefined,
  capability: CmsCapability
): boolean {
  if (!role) return false;
  const capabilities = CMS_ROLE_CAPABILITIES[role];
  return capabilities?.includes(capability) ?? false;
}

/**
 * Validates whether a state transition from `currentStatus` to `targetStatus`
 * is legitimate under the state machine and permitted for the actor's CMS role.
 */
export function canTransitionContentStatus(params: {
  currentStatus: CmsContentStatus;
  targetStatus: CmsContentStatus;
  actorRole: CmsRole;
  isAuthor: boolean;
}): { allowed: boolean; reason?: string } {
  const { currentStatus, targetStatus, actorRole, isAuthor } = params;

  // 1. Check state machine validity
  const validNextStates = VALID_STATUS_TRANSITIONS[currentStatus];
  if (!validNextStates || !validNextStates.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Illegal transition: Cannot change status from "${CMS_STATUS_META[currentStatus]?.label}" to "${CMS_STATUS_META[targetStatus]?.label}".`,
    };
  }

  // 2. Role-specific authority rules
  switch (targetStatus) {
    case "IN_REVIEW":
      // Author, Contributor, Editor, or Admin can submit for review
      if (
        actorRole === "CMS_ADMIN" ||
        actorRole === "CONTENT_EDITOR" ||
        (actorRole === "CONTRIBUTOR" && isAuthor)
      ) {
        return { allowed: true };
      }
      return { allowed: false, reason: "You do not have permission to submit this content for review." };

    case "CHANGES_REQUESTED":
    case "APPROVED":
      // Only Reviewer or CMS Admin can review/approve
      if (actorRole === "CMS_ADMIN" || actorRole === "CONTENT_REVIEWER") {
        return { allowed: true };
      }
      return { allowed: false, reason: "Only Content Reviewers or CMS Administrators can approve or request changes." };

    case "SCHEDULED":
    case "PUBLISHED":
    case "UNPUBLISHED":
      // Only Publisher or CMS Admin can publish / schedule / unpublish
      if (actorRole === "CMS_ADMIN" || actorRole === "PUBLISHER") {
        return { allowed: true };
      }
      return { allowed: false, reason: "Only Publishers or CMS Administrators have publishing authority." };

    case "ARCHIVED":
      // Publisher or CMS Admin can archive
      if (actorRole === "CMS_ADMIN" || actorRole === "PUBLISHER") {
        return { allowed: true };
      }
      return { allowed: false, reason: "Only Publishers or CMS Administrators can archive content." };

    case "DRAFT":
      // Returning to draft
      if (actorRole === "CMS_ADMIN" || actorRole === "CONTENT_EDITOR" || (actorRole === "CONTRIBUTOR" && isAuthor)) {
        return { allowed: true };
      }
      return { allowed: false, reason: "You do not have permission to revert this content to draft." };

    default:
      return { allowed: false, reason: "Unauthorized status transition." };
  }
}

/**
 * Checks whether an actor can edit content depending on ownership and role.
 */
export function canEditContent(params: {
  actorRole: CmsRole;
  isAuthor: boolean;
  status: CmsContentStatus;
}): boolean {
  const { actorRole, isAuthor, status } = params;

  // Once published, only CMS_ADMIN or PUBLISHER can modify or unpublish
  if (status === "PUBLISHED" || status === "ARCHIVED") {
    return actorRole === "CMS_ADMIN";
  }

  // In review: locked from author edits until reviewed or returned to draft
  if (status === "IN_REVIEW") {
    return actorRole === "CMS_ADMIN";
  }

  // DRAFT or CHANGES_REQUESTED:
  if (actorRole === "CMS_ADMIN" || actorRole === "CONTENT_EDITOR") {
    return true;
  }
  if (actorRole === "CONTRIBUTOR" && isAuthor) {
    return true;
  }

  return false;
}

export function getCmsRoleBadge(role: CmsRole) {
  return CMS_ROLE_META[role] || { label: role, tone: "gray", description: "" };
}

export function getCmsStatusBadge(status: CmsContentStatus) {
  return CMS_STATUS_META[status] || { label: status, tone: "gray", description: "" };
}

export function getCmsContentTypeMeta(type: CmsContentType) {
  return CMS_CONTENT_TYPE_META[type] || { label: type, description: "", phase: 2, icon: "FileText" };
}
