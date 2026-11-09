"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  type CmsContentStatus,
  type CmsContentType,
  createCmsContentSchema,
  assignCmsRoleSchema,
  CMS_CONTENT_TYPES,
} from "@/lib/cms-types";
import { canTransitionContentStatus } from "@/lib/cms-permissions";
import {
  requireCmsCapability,
  recordCmsAuditLog,
} from "@/lib/cms-auth";
import { parseCmsBlocks, type CmsBlock } from "@/lib/cms-blocks";
import {
  homepageContentSchema,
  DEFAULT_HOMEPAGE_CONTENT,
  HOMEPAGE_CMS_SLUG,
  type HomepageContent,
} from "@/lib/cms-homepage";

export type CmsActionState = {
  success?: boolean;
  error?: string;
  fields?: Record<string, string>;
  message?: string;
  at?: number;
};

/**
 * Retrieves real database-backed overview statistics for the CMS Dashboard.
 */
export async function getCmsDashboardStats() {
  await requireCmsCapability("cms:overview:view");

  const [
    totalContent,
    publishedContent,
    draftContent,
    pendingReview,
    scheduledContent,
    archivedContent,
    typeCounts,
    recentActivity,
    recentlyUpdated,
    pendingApprovalQueue,
    upcomingScheduled,
    activeCmsRoleCount,
  ] = await Promise.all([
    db.cmsContent.count({ where: { deletedAt: null } }),
    db.cmsContent.count({ where: { status: "PUBLISHED", deletedAt: null } }),
    db.cmsContent.count({ where: { status: "DRAFT", deletedAt: null } }),
    db.cmsContent.count({ where: { status: "IN_REVIEW", deletedAt: null } }),
    db.cmsContent.count({ where: { status: "SCHEDULED", deletedAt: null } }),
    db.cmsContent.count({ where: { status: "ARCHIVED", deletedAt: null } }),
    db.cmsContent.groupBy({
      by: ["contentType"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    db.adminAuditLog.findMany({
      where: {
        targetType: {
          in: ["CMS_CONTENT", "CMS_ROLE", "CMS_REVISION", "CMS_FEEDBACK"],
        },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: { id: true, name: true, email: true, role: true, image: true },
        },
      },
    }),
    db.cmsContent.findMany({
      where: { deletedAt: null },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true, image: true } },
        lastEditedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    db.cmsContent.findMany({
      where: { status: "IN_REVIEW", deletedAt: null },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    db.cmsContent.findMany({
      where: { status: "SCHEDULED", deletedAt: null },
      take: 5,
      orderBy: { scheduledAt: "asc" },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    }),
    db.cmsUserRole.count(),
  ]);

  const byTypeMap: Record<string, number> = {};
  for (const type of CMS_CONTENT_TYPES) {
    byTypeMap[type] = 0;
  }
  for (const item of typeCounts) {
    byTypeMap[item.contentType] = item._count._all;
  }

  return {
    metrics: {
      totalContent,
      publishedContent,
      draftContent,
      pendingReview,
      scheduledContent,
      archivedContent,
      activeCmsRoleCount,
    },
    byType: byTypeMap,
    recentActivity,
    recentlyUpdated,
    pendingApprovalQueue,
    upcomingScheduled,
  };
}

/**
 * Retrieves the roster of users who currently possess assigned CMS roles.
 */
export async function getCmsUserRolesList() {
  await requireCmsCapability("cms:permissions:manage");

  return db.cmsUserRole.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          image: true,
          status: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Search users across the portal to grant CMS privileges.
 */
export async function searchUsersForCms(query: string) {
  await requireCmsCapability("cms:permissions:manage");

  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return [];

  return db.user.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: clean } },
        { email: { contains: clean } },
        { studentId: { contains: clean } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      studentId: true,
      image: true,
      cmsRole: {
        select: {
          id: true,
          role: true,
        },
      },
    },
    take: 10,
  });
}

/**
 * Server Action: Explicitly assign or update a user's CMS role.
 * - Prevents non-CMS Admin access.
 * - Prevents self-assignment or privilege escalation.
 * - Records audit log.
 */
export async function assignCmsUserRole(
  _: CmsActionState | undefined,
  formData: FormData
): Promise<CmsActionState> {
  const currentActor = await requireCmsCapability("cms:permissions:manage");

  const raw = {
    targetUserId: String(formData.get("targetUserId") || "").trim(),
    role: String(formData.get("role") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
  };

  const parsed = assignCmsRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input data.",
      fields: raw,
      at: Date.now(),
    };
  }

  const { targetUserId, role, notes } = parsed.data;

  // Prevent self-role modification to avoid privilege escalations or accidental self-lockouts
  if (targetUserId === currentActor.id) {
    return {
      success: false,
      error: "For security reasons, administrators cannot modify their own CMS role.",
      fields: raw,
      at: Date.now(),
    };
  }

  // Target user check
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!targetUser) {
    return {
      success: false,
      error: "Target user account not found.",
      fields: raw,
      at: Date.now(),
    };
  }

  // Upsert CMS Role assignment
  const assignment = await db.cmsUserRole.upsert({
    where: { userId: targetUserId },
    update: {
      role,
      notes: notes || null,
      assignedById: currentActor.id,
      updatedAt: new Date(),
    },
    create: {
      userId: targetUserId,
      role,
      notes: notes || null,
      assignedById: currentActor.id,
    },
  });

  // Record in AdminAuditLog
  await recordCmsAuditLog({
    actorId: currentActor.id,
    action: "ASSIGN_CMS_ROLE",
    targetType: "CMS_ROLE",
    targetId: assignment.id,
    details: {
      targetUserId,
      targetUserEmail: targetUser.email,
      targetUserName: targetUser.name,
      assignedRole: role,
      notes,
    },
  });

  revalidatePath("/admin/cms");
  revalidatePath("/admin/cms/permissions");

  return {
    success: true,
    message: `Successfully assigned ${role} role to ${targetUser.name} (${targetUser.email}).`,
    at: Date.now(),
  };
}

/**
 * Server Action: Revoke CMS privileges from a user.
 */
export async function revokeCmsUserRole(targetUserId: string): Promise<CmsActionState> {
  const currentActor = await requireCmsCapability("cms:permissions:manage");

  if (targetUserId === currentActor.id) {
    return {
      success: false,
      error: "You cannot revoke your own CMS administrative permissions.",
      at: Date.now(),
    };
  }

  const existing = await db.cmsUserRole.findUnique({
    where: { userId: targetUserId },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!existing) {
    return {
      success: false,
      error: "No active CMS role found for this user.",
      at: Date.now(),
    };
  }

  await db.cmsUserRole.delete({
    where: { userId: targetUserId },
  });

  await recordCmsAuditLog({
    actorId: currentActor.id,
    action: "REVOKE_CMS_ROLE",
    targetType: "CMS_ROLE",
    targetId: existing.id,
    details: {
      targetUserId,
      targetUserEmail: existing.user.email,
      revokedRole: existing.role,
    },
  });

  revalidatePath("/admin/cms");
  revalidatePath("/admin/cms/permissions");

  return {
    success: true,
    message: `Revoked ${existing.role} access from ${existing.user.name}.`,
    at: Date.now(),
  };
}

/**
 * Server Action: Create new CMS content in initial DRAFT state.
 */
export async function createCmsContent(
  _: CmsActionState | undefined,
  formData: FormData
): Promise<CmsActionState> {
  const actor = await requireCmsCapability("cms:content:create");

  const raw = {
    title: String(formData.get("title") || "").trim(),
    slug: String(formData.get("slug") || "").trim().toLowerCase(),
    contentType: String(formData.get("contentType") || "").trim() as CmsContentType,
    summary: String(formData.get("summary") || "").trim(),
    body: String(formData.get("body") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    tags: String(formData.get("tags") || "").trim(),
    featuredImage: String(formData.get("featuredImage") || "").trim(),
    priority: formData.get("priority") ? Number(formData.get("priority")) : 0,
    metaTitle: String(formData.get("metaTitle") || "").trim(),
    metaDescription: String(formData.get("metaDescription") || "").trim(),
  };

  const parsed = createCmsContentSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation error.",
      fields: Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [k, String(v)])
      ),
      at: Date.now(),
    };
  }

  const { title, slug, contentType, summary, body, category, tags, featuredImage, priority, metaTitle, metaDescription } = parsed.data;

  // Check slug uniqueness
  const existingSlug = await db.cmsContent.findUnique({
    where: { slug },
  });

  if (existingSlug) {
    return {
      success: false,
      error: `A content item with the slug "${slug}" already exists. Please choose a unique slug.`,
      fields: Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [k, String(v)])
      ),
      at: Date.now(),
    };
  }

  // Create content record and initial revision v1 atomically
  const newContent = await db.cmsContent.create({
    data: {
      title,
      slug,
      contentType,
      status: "DRAFT",
      summary: summary || null,
      body: body || null,
      category: category || null,
      tags: tags || null,
      featuredImage: featuredImage || null,
      priority,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      authorId: actor.id,
      lastEditedById: actor.id,
      revisions: {
        create: {
          version: 1,
          title,
          slug,
          summary: summary || null,
          body: body || null,
          statusAtRevision: "DRAFT",
          changeSummary: "Initial draft creation",
          createdById: actor.id,
        },
      },
    },
  });

  // Record audit log
  await recordCmsAuditLog({
    actorId: actor.id,
    action: "CREATE_CMS_CONTENT",
    targetType: "CMS_CONTENT",
    targetId: newContent.id,
    details: {
      title,
      slug,
      contentType,
      status: "DRAFT",
    },
  });

  revalidatePath("/admin/cms");

  return {
    success: true,
    message: `Draft "${title}" created successfully.`,
    at: Date.now(),
  };
}

/**
 * Server Action: Validates and transitions content status along the strict lifecycle.
 */
export async function transitionCmsContentStatus(
  contentId: string,
  targetStatus: CmsContentStatus,
  options?: { reviewNotes?: string; scheduledAt?: string }
): Promise<CmsActionState> {
  const actor = await requireCmsCapability("cms:content:view");

  const content = await db.cmsContent.findUnique({
    where: { id: contentId },
    include: { author: { select: { id: true, email: true } } },
  });

  if (!content) {
    return { success: false, error: "Content item not found." };
  }

  const isAuthor = content.authorId === actor.id;
  const currentStatus = content.status as CmsContentStatus;

  // Validate status transition against the state machine and actor's role
  const check = canTransitionContentStatus({
    currentStatus,
    targetStatus,
    actorRole: actor.cmsRole,
    isAuthor,
  });

  if (!check.allowed) {
    return { success: false, error: check.reason || "Unauthorized status transition." };
  }

  const now = new Date();
  const updateData: Record<string, unknown> = {
    status: targetStatus,
    lastEditedById: actor.id,
    updatedAt: now,
  };

  if (targetStatus === "IN_REVIEW") {
    updateData.reviewNotes = null;
  }

  if (targetStatus === "CHANGES_REQUESTED") {
    updateData.reviewedById = actor.id;
    updateData.reviewNotes = options?.reviewNotes || "Changes requested by reviewer.";
  }

  if (targetStatus === "APPROVED") {
    updateData.reviewedById = actor.id;
    updateData.reviewNotes = options?.reviewNotes || "Approved by reviewer.";
  }

  if (targetStatus === "SCHEDULED") {
    if (!options?.scheduledAt) {
      return { success: false, error: "A scheduled publication timestamp is required." };
    }
    const schedDate = new Date(options.scheduledAt);
    if (isNaN(schedDate.getTime()) || schedDate.getTime() <= now.getTime()) {
      return { success: false, error: "Scheduled date must be set in the future." };
    }
    updateData.scheduledAt = schedDate;
  }

  if (targetStatus === "PUBLISHED") {
    updateData.publishedById = actor.id;
    updateData.publishedAt = now;
  }

  if (targetStatus === "UNPUBLISHED") {
    updateData.publishedAt = null;
  }

  if (targetStatus === "ARCHIVED") {
    updateData.archivedAt = now;
  }

  // Update content and log revision
  const countRevisions = await db.cmsRevision.count({ where: { contentId } });
  const nextVersion = countRevisions + 1;

  await db.$transaction([
    db.cmsContent.update({
      where: { id: contentId },
      data: updateData,
    }),
    db.cmsRevision.create({
      data: {
        contentId,
        version: nextVersion,
        title: content.title,
        slug: content.slug,
        summary: content.summary,
        body: content.body,
        statusAtRevision: targetStatus,
        changeSummary: `Status transitioned from ${currentStatus} to ${targetStatus}${options?.reviewNotes ? `: ${options.reviewNotes}` : ""}`,
        createdById: actor.id,
      },
    }),
  ]);

  await recordCmsAuditLog({
    actorId: actor.id,
    action: `CMS_TRANSITION_${targetStatus}`,
    targetType: "CMS_CONTENT",
    targetId: contentId,
    details: {
      fromStatus: currentStatus,
      toStatus: targetStatus,
      notes: options?.reviewNotes,
      scheduledAt: options?.scheduledAt,
    },
  });

  revalidatePath("/admin/cms");

  return {
    success: true,
    message: `Content status updated to ${targetStatus}.`,
    at: Date.now(),
  };
}

// ============================================================================
// PHASE 2: PAGES MANAGEMENT & HOMEPAGE MANAGER SERVER ACTIONS
// ============================================================================

/**
 * Fetch all CMS pages for the Pages Manager table with filtering and search.
 */
export async function getCmsPagesList(filters?: {
  query?: string;
  status?: string;
}) {
  await requireCmsCapability("cms:content:view");

  const where: any = {
    contentType: "PAGE",
    deletedAt: null,
  };

  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters?.query && filters.query.trim().length > 0) {
    const q = filters.query.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
  }

  const pages = await db.cmsContent.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { id: true, name: true, email: true, image: true } },
      lastEditedBy: { select: { id: true, name: true, email: true } },
      publishedBy: { select: { id: true, name: true, email: true } },
      _count: { select: { revisions: true } },
    },
  });

  return pages;
}

/**
 * Fetch a single CMS Page by ID (with blocks and revisions) for editing or preview.
 */
export async function getCmsPageById(id: string) {
  await requireCmsCapability("cms:content:view");

  const page = await db.cmsContent.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true, image: true } },
      lastEditedBy: { select: { id: true, name: true, email: true } },
      publishedBy: { select: { id: true, name: true, email: true } },
      revisions: {
        orderBy: { version: "desc" },
        take: 10,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return page;
}

/**
 * Upsert or Save a Page with structured content blocks.
 */
export async function saveCmsPage(params: {
  id?: string;
  title: string;
  slug: string;
  summary?: string;
  blocks: CmsBlock[];
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  status?: CmsContentStatus;
  publishImmediately?: boolean;
}): Promise<CmsActionState & { pageId?: string }> {
  const actor = await requireCmsCapability("cms:content:edit");

  // Validate slug
  const cleanSlug = params.slug.trim().toLowerCase();
  if (!cleanSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
    return {
      success: false,
      error: "Slug must contain only lowercase alphanumeric characters and hyphens (e.g., 'about-us').",
    };
  }

  // Validate title
  if (!params.title || params.title.trim().length < 2) {
    return { success: false, error: "Title must be at least 2 characters long." };
  }

  // Parse and validate blocks
  const structuredData = JSON.stringify(params.blocks);

  // Check unique slug conflict (excluding current page if editing)
  const existingWithSlug = await db.cmsContent.findUnique({
    where: { slug: cleanSlug },
    select: { id: true },
  });

  if (existingWithSlug && existingWithSlug.id !== params.id) {
    return {
      success: false,
      error: `The URL slug '/p/${cleanSlug}' is already in use by another page.`,
    };
  }

  let targetStatus: CmsContentStatus = params.status || "DRAFT";
  if (params.publishImmediately) {
    // Requires publish capability
    const canPublish = actor.cmsRole === "CMS_ADMIN" || actor.cmsRole === "PUBLISHER";
    if (!canPublish) {
      return {
        success: false,
        error: "Your CMS role does not have authorization to publish pages directly.",
      };
    }
    targetStatus = "PUBLISHED";
  }

  const now = new Date();

  if (params.id) {
    // UPDATE EXISTING PAGE
    const existing = await db.cmsContent.findUnique({
      where: { id: params.id },
      include: { _count: { select: { revisions: true } } },
    });

    if (!existing || existing.deletedAt) {
      return { success: false, error: "Page not found or has been deleted." };
    }

    const nextVersion = existing._count.revisions + 1;

    await db.$transaction([
      db.cmsContent.update({
        where: { id: params.id },
        data: {
          title: params.title.trim(),
          slug: cleanSlug,
          summary: params.summary?.trim() || null,
          structuredData,
          metaTitle: params.metaTitle?.trim() || null,
          metaDescription: params.metaDescription?.trim() || null,
          featuredImage: params.featuredImage?.trim() || null,
          status: targetStatus,
          lastEditedById: actor.id,
          publishedById: targetStatus === "PUBLISHED" ? actor.id : existing.publishedById,
          publishedAt: targetStatus === "PUBLISHED" ? (existing.publishedAt || now) : existing.publishedAt,
        },
      }),
      db.cmsRevision.create({
        data: {
          contentId: params.id,
          version: nextVersion,
          title: params.title.trim(),
          slug: cleanSlug,
          summary: params.summary?.trim() || null,
          structuredData,
          statusAtRevision: targetStatus,
          changeSummary: `Page updated by ${actor.name || actor.email}${params.publishImmediately ? " and published" : ""}`,
          createdById: actor.id,
        },
      }),
    ]);

    await recordCmsAuditLog({
      actorId: actor.id,
      action: "CMS_PAGE_UPDATE",
      targetType: "CMS_CONTENT",
      targetId: params.id,
      details: { title: params.title, slug: cleanSlug, status: targetStatus, version: nextVersion },
    });

    revalidatePath("/admin/cms/pages");
    revalidatePath(`/p/${cleanSlug}`);

    return {
      success: true,
      message: `Page "${params.title}" successfully saved.`,
      pageId: params.id,
      at: Date.now(),
    };
  } else {
    // CREATE NEW PAGE
    const created = await db.$transaction(async (tx) => {
      const page = await tx.cmsContent.create({
        data: {
          title: params.title.trim(),
          slug: cleanSlug,
          contentType: "PAGE",
          status: targetStatus,
          summary: params.summary?.trim() || null,
          structuredData,
          metaTitle: params.metaTitle?.trim() || null,
          metaDescription: params.metaDescription?.trim() || null,
          featuredImage: params.featuredImage?.trim() || null,
          authorId: actor.id,
          lastEditedById: actor.id,
          publishedById: targetStatus === "PUBLISHED" ? actor.id : null,
          publishedAt: targetStatus === "PUBLISHED" ? now : null,
        },
      });

      await tx.cmsRevision.create({
        data: {
          contentId: page.id,
          version: 1,
          title: page.title,
          slug: page.slug,
          summary: page.summary,
          structuredData,
          statusAtRevision: targetStatus,
          changeSummary: "Initial page creation with structured blocks.",
          createdById: actor.id,
        },
      });

      return page;
    });

    await recordCmsAuditLog({
      actorId: actor.id,
      action: "CMS_PAGE_CREATE",
      targetType: "CMS_CONTENT",
      targetId: created.id,
      details: { title: created.title, slug: created.slug, status: targetStatus },
    });

    revalidatePath("/admin/cms/pages");
    revalidatePath(`/p/${cleanSlug}`);

    return {
      success: true,
      message: `Page "${created.title}" successfully created.`,
      pageId: created.id,
      at: Date.now(),
    };
  }
}

/**
 * Soft deletes / archives a CMS page.
 */
export async function deleteCmsPage(id: string): Promise<CmsActionState> {
  const actor = await requireCmsCapability("cms:content:archive");

  const page = await db.cmsContent.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true, contentType: true },
  });

  if (!page) {
    return { success: false, error: "Page not found." };
  }

  await db.cmsContent.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: "ARCHIVED",
    },
  });

  await recordCmsAuditLog({
    actorId: actor.id,
    action: "CMS_PAGE_DELETE",
    targetType: "CMS_CONTENT",
    targetId: id,
    details: { title: page.title, slug: page.slug },
  });

  revalidatePath("/admin/cms/pages");
  revalidatePath(`/p/${page.slug}`);

  return {
    success: true,
    message: `Page "${page.title}" has been archived.`,
    at: Date.now(),
  };
}

/**
 * Loads current Homepage CMS configuration for the Homepage Manager.
 */
export async function getHomepageManagerData(): Promise<{
  content: HomepageContent;
  status: CmsContentStatus;
  lastUpdated?: string;
  lastEditorName?: string;
}> {
  await requireCmsCapability("cms:content:view");

  const record = await db.cmsContent.findUnique({
    where: { slug: HOMEPAGE_CMS_SLUG },
    include: {
      lastEditedBy: { select: { name: true, email: true } },
    },
  });

  if (!record || !record.structuredData) {
    return {
      content: DEFAULT_HOMEPAGE_CONTENT,
      status: "DRAFT",
    };
  }

  try {
    const parsed = JSON.parse(record.structuredData);
    const valid = homepageContentSchema.safeParse(parsed);
    return {
      content: valid.success ? valid.data : DEFAULT_HOMEPAGE_CONTENT,
      status: record.status as CmsContentStatus,
      lastUpdated: record.updatedAt.toISOString(),
      lastEditorName: record.lastEditedBy?.name || record.lastEditedBy?.email || undefined,
    };
  } catch {
    return {
      content: DEFAULT_HOMEPAGE_CONTENT,
      status: record.status as CmsContentStatus,
    };
  }
}

/**
 * Saves and optionally publishes Homepage Content through the CMS.
 */
export async function saveHomepageContent(
  contentData: HomepageContent,
  publishImmediately: boolean = false
): Promise<CmsActionState> {
  const actor = await requireCmsCapability("cms:content:edit");

  const parsed = homepageContentSchema.safeParse(contentData);
  if (!parsed.success) {
    return {
      success: false,
      error: `Validation error: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
    };
  }

  if (publishImmediately) {
    const canPublish = actor.cmsRole === "CMS_ADMIN" || actor.cmsRole === "PUBLISHER";
    if (!canPublish) {
      return {
        success: false,
        error: "Your CMS role does not have authorization to publish homepage changes live.",
      };
    }
  }

  const targetStatus: CmsContentStatus = publishImmediately ? "PUBLISHED" : "DRAFT";
  const structuredData = JSON.stringify(parsed.data);
  const now = new Date();

  const existing = await db.cmsContent.findUnique({
    where: { slug: HOMEPAGE_CMS_SLUG },
    include: { _count: { select: { revisions: true } } },
  });

  if (existing) {
    const nextVersion = existing._count.revisions + 1;
    await db.$transaction([
      db.cmsContent.update({
        where: { id: existing.id },
        data: {
          title: "Homepage Main Content",
          summary: "Live homepage copy, hero content, and promotional sections.",
          structuredData,
          status: targetStatus,
          lastEditedById: actor.id,
          publishedById: publishImmediately ? actor.id : existing.publishedById,
          publishedAt: publishImmediately ? (existing.publishedAt || now) : existing.publishedAt,
        },
      }),
      db.cmsRevision.create({
        data: {
          contentId: existing.id,
          version: nextVersion,
          title: "Homepage Main Content",
          slug: HOMEPAGE_CMS_SLUG,
          structuredData,
          statusAtRevision: targetStatus,
          changeSummary: `Homepage content updated by ${actor.name || actor.email}${publishImmediately ? " and published live" : ""}`,
          createdById: actor.id,
        },
      }),
    ]);

    await recordCmsAuditLog({
      actorId: actor.id,
      action: publishImmediately ? "CMS_HOMEPAGE_PUBLISH" : "CMS_HOMEPAGE_SAVE",
      targetType: "CMS_CONTENT",
      targetId: existing.id,
      details: { status: targetStatus, version: nextVersion },
    });
  } else {
    // First-time creation
    const created = await db.cmsContent.create({
      data: {
        title: "Homepage Main Content",
        slug: HOMEPAGE_CMS_SLUG,
        contentType: "PAGE",
        status: targetStatus,
        summary: "Live homepage copy, hero content, and promotional sections.",
        structuredData,
        authorId: actor.id,
        lastEditedById: actor.id,
        publishedById: publishImmediately ? actor.id : null,
        publishedAt: publishImmediately ? now : null,
      },
    });

    await db.cmsRevision.create({
      data: {
        contentId: created.id,
        version: 1,
        title: created.title,
        slug: created.slug,
        structuredData,
        statusAtRevision: targetStatus,
        changeSummary: "Initial homepage content setup.",
        createdById: actor.id,
      },
    });

    await recordCmsAuditLog({
      actorId: actor.id,
      action: publishImmediately ? "CMS_HOMEPAGE_PUBLISH" : "CMS_HOMEPAGE_SAVE",
      targetType: "CMS_CONTENT",
      targetId: created.id,
      details: { status: targetStatus, version: 1 },
    });
  }

  // Targeted cache revalidation
  revalidatePath("/");
  revalidatePath("/admin/cms/homepage");

  return {
    success: true,
    message: publishImmediately
      ? "Homepage content successfully published to live website!"
      : "Homepage content draft successfully saved.",
    at: Date.now(),
  };
}

// ============================================================================
// PHASE 3: NEWS, ANNOUNCEMENTS, EVENTS, FAQS, ALUMNI STORIES & RESOURCES
// ============================================================================

/**
 * Generic query for Phase 3 CMS items with filter, audience, and search support.
 */
export async function getCmsPhase3Items(params: {
  contentType: CmsContentType;
  status?: string;
  category?: string;
  query?: string;
}) {
  await requireCmsCapability("cms:content:view");

  const where: any = {
    contentType: params.contentType,
    deletedAt: null,
  };

  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }

  if (params.category && params.category !== "ALL") {
    where.category = params.category;
  }

  if (params.query && params.query.trim().length > 0) {
    const q = params.query.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
  }

  const items = await db.cmsContent.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { id: true, name: true, email: true, image: true, role: true } },
      lastEditedBy: { select: { id: true, name: true, email: true } },
      publishedBy: { select: { id: true, name: true, email: true } },
      _count: { select: { revisions: true } },
    },
  });

  return items;
}

/**
 * Generic Save (Create/Update) for Phase 3 Content Entities.
 */
export async function saveCmsPhase3Item(params: {
  id?: string;
  title: string;
  slug: string;
  contentType: CmsContentType;
  summary?: string;
  body?: string;
  category?: string;
  tags?: string;
  priority?: number;
  featuredImage?: string;
  structuredData?: any;
  status?: CmsContentStatus;
  publishImmediately?: boolean;
  scheduledAt?: string;
  notifyUsers?: boolean;
}): Promise<CmsActionState & { itemId?: string }> {
  const actor = await requireCmsCapability("cms:content:edit");

  // Validate clean slug
  const cleanSlug = params.slug.trim().toLowerCase();
  if (!cleanSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
    return {
      success: false,
      error: "Slug must contain only lowercase alphanumeric characters and hyphens (e.g., 'campus-hackathon-2026').",
    };
  }

  if (!params.title || params.title.trim().length < 3) {
    return { success: false, error: "Title must be at least 3 characters long." };
  }

  // Check slug uniqueness
  const existingWithSlug = await db.cmsContent.findUnique({
    where: { slug: cleanSlug },
    select: { id: true },
  });

  if (existingWithSlug && existingWithSlug.id !== params.id) {
    return {
      success: false,
      error: `The URL slug '${cleanSlug}' is already in use by another content item.`,
    };
  }

  let targetStatus: CmsContentStatus = params.status || "DRAFT";
  if (params.publishImmediately) {
    const canPublish = actor.cmsRole === "CMS_ADMIN" || actor.cmsRole === "PUBLISHER";
    if (!canPublish) {
      return {
        success: false,
        error: "Your CMS role does not have authorization to publish content live.",
      };
    }
    targetStatus = "PUBLISHED";
  }

  const structuredDataStr = params.structuredData ? JSON.stringify(params.structuredData) : null;
  const now = new Date();
  const scheduledDate = params.scheduledAt ? new Date(params.scheduledAt) : null;

  let itemId: string;

  if (params.id) {
    // UPDATE
    const existing = await db.cmsContent.findUnique({
      where: { id: params.id },
      include: { _count: { select: { revisions: true } } },
    });

    if (!existing || existing.deletedAt) {
      return { success: false, error: "Content item not found or deleted." };
    }

    const nextVersion = existing._count.revisions + 1;

    await db.$transaction([
      db.cmsContent.update({
        where: { id: params.id },
        data: {
          title: params.title.trim(),
          slug: cleanSlug,
          summary: params.summary?.trim() || null,
          body: params.body?.trim() || null,
          category: params.category || null,
          tags: params.tags || null,
          priority: params.priority || 0,
          featuredImage: params.featuredImage || null,
          structuredData: structuredDataStr,
          status: targetStatus,
          scheduledAt: scheduledDate,
          lastEditedById: actor.id,
          publishedById: targetStatus === "PUBLISHED" ? actor.id : existing.publishedById,
          publishedAt: targetStatus === "PUBLISHED" ? (existing.publishedAt || now) : existing.publishedAt,
        },
      }),
      db.cmsRevision.create({
        data: {
          contentId: params.id,
          version: nextVersion,
          title: params.title.trim(),
          slug: cleanSlug,
          summary: params.summary?.trim() || null,
          body: params.body?.trim() || null,
          structuredData: structuredDataStr,
          statusAtRevision: targetStatus,
          changeSummary: `Updated by ${actor.name || actor.email}${params.publishImmediately ? " and published" : ""}`,
          createdById: actor.id,
        },
      }),
    ]);

    itemId = params.id;

    await recordCmsAuditLog({
      actorId: actor.id,
      action: `CMS_${params.contentType}_UPDATE`,
      targetType: "CMS_CONTENT",
      targetId: params.id,
      details: { title: params.title, slug: cleanSlug, status: targetStatus, version: nextVersion },
    });
  } else {
    // CREATE
    const created = await db.$transaction(async (tx) => {
      const item = await tx.cmsContent.create({
        data: {
          title: params.title.trim(),
          slug: cleanSlug,
          contentType: params.contentType,
          status: targetStatus,
          summary: params.summary?.trim() || null,
          body: params.body?.trim() || null,
          category: params.category || null,
          tags: params.tags || null,
          priority: params.priority || 0,
          featuredImage: params.featuredImage || null,
          structuredData: structuredDataStr,
          scheduledAt: scheduledDate,
          authorId: actor.id,
          lastEditedById: actor.id,
          publishedById: targetStatus === "PUBLISHED" ? actor.id : null,
          publishedAt: targetStatus === "PUBLISHED" ? now : null,
        },
      });

      await tx.cmsRevision.create({
        data: {
          contentId: item.id,
          version: 1,
          title: item.title,
          slug: item.slug,
          summary: item.summary,
          body: item.body,
          structuredData: structuredDataStr,
          statusAtRevision: targetStatus,
          changeSummary: `Initial ${params.contentType} creation.`,
          createdById: actor.id,
        },
      });

      return item;
    });

    itemId = created.id;

    await recordCmsAuditLog({
      actorId: actor.id,
      action: `CMS_${params.contentType}_CREATE`,
      targetType: "CMS_CONTENT",
      targetId: created.id,
      details: { title: created.title, slug: created.slug, status: targetStatus },
    });
  }

  // Optional: Targeted Platform Notification if requested and published
  if (params.notifyUsers && targetStatus === "PUBLISHED") {
    try {
      const audience = params.structuredData?.targetAudience || "PUBLIC";
      let userWhere: any = { status: "APPROVED" };
      if (audience === "STUDENT") userWhere.role = "STUDENT";
      else if (audience === "ALUMNI") userWhere.role = "ALUMNI";
      else if (audience === "TEACHER") userWhere.role = "TEACHER";

      const recipientUsers = await db.user.findMany({
        where: userWhere,
        select: { id: true },
        take: 300,
      });

      if (recipientUsers.length > 0) {
        let routePrefix = "/news";
        if (params.contentType === "EVENT") routePrefix = "/events";
        else if (params.contentType === "RESOURCE") routePrefix = "/resources";

        await db.notification.createMany({
          data: recipientUsers.map((u) => ({
            userId: u.id,
            actorId: actor.id,
            title: `Announcement: ${params.title}`,
            body: params.summary || "A new official university announcement has been published.",
            type: "SYSTEM_BROADCAST",
            link: `${routePrefix}/${cleanSlug}`,
          })),
        });
      }
    } catch (notifErr) {
      console.error("Failed to deliver broadcast notifications:", notifErr);
    }
  }

  // Revalidations
  revalidatePath("/admin/cms");
  revalidatePath("/admin/cms/news");
  revalidatePath("/admin/cms/events");
  revalidatePath("/admin/cms/faqs");
  revalidatePath("/admin/cms/stories");
  revalidatePath("/admin/cms/resources");
  revalidatePath("/news");
  revalidatePath("/events");
  revalidatePath("/faqs");
  revalidatePath("/stories");
  revalidatePath("/resources");
  revalidatePath(`/news/${cleanSlug}`);
  revalidatePath(`/events/${cleanSlug}`);

  return {
    success: true,
    message: `${params.contentType} item successfully saved!`,
    itemId,
    at: Date.now(),
  };
}

/**
 * Public Data Fetcher for Announcements / News with audience enforcement.
 */
export async function getPublicAnnouncements(userRole?: string | null) {
  const allowedAudiences = ["PUBLIC"];
  if (userRole) {
    allowedAudiences.push("AUTHENTICATED", userRole);
  }

  const items = await db.cmsContent.findMany({
    where: {
      contentType: { in: ["NEWS", "ANNOUNCEMENT"] },
      status: "PUBLISHED",
      deletedAt: null,
    },
    orderBy: [{ priority: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { name: true, role: true, image: true, designation: true } },
    },
  });

  // Filter items matching allowed audiences from structuredData safely
  return items.filter((item) => {
    if (!item.structuredData) return true;
    try {
      const meta = JSON.parse(item.structuredData);
      const aud = meta.targetAudience || "PUBLIC";
      return allowedAudiences.includes(aud);
    } catch {
      return true;
    }
  });
}

/**
 * Public Data Fetcher for Events with audience enforcement.
 */
export async function getPublicEvents(userRole?: string | null) {
  const allowedAudiences = ["PUBLIC"];
  if (userRole) {
    allowedAudiences.push("AUTHENTICATED", userRole);
  }

  const events = await db.cmsContent.findMany({
    where: {
      contentType: "EVENT",
      status: "PUBLISHED",
      deletedAt: null,
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { name: true, designation: true } },
    },
  });

  return events.filter((e) => {
    if (!e.structuredData) return true;
    try {
      const meta = JSON.parse(e.structuredData);
      const aud = meta.targetAudience || "PUBLIC";
      return allowedAudiences.includes(aud);
    } catch {
      return true;
    }
  });
}

/**
 * Public Data Fetcher for FAQs grouped by category.
 */
export async function getPublicFaqs() {
  const faqs = await db.cmsContent.findMany({
    where: {
      contentType: "FAQ",
      status: "PUBLISHED",
      deletedAt: null,
    },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });

  return faqs;
}

/**
 * Public Data Fetcher for Alumni Stories.
 */
export async function getPublicAlumniStories() {
  const stories = await db.cmsContent.findMany({
    where: {
      contentType: "ALUMNI_STORY",
      status: "PUBLISHED",
      deletedAt: null,
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { name: true, role: true, image: true } },
    },
  });

  return stories;
}

/**
 * Public Data Fetcher for Resource Library with audience check.
 */
export async function getPublicResources(userRole?: string | null) {
  const allowedAudiences = ["PUBLIC"];
  if (userRole) {
    allowedAudiences.push("AUTHENTICATED", userRole);
  }

  const resources = await db.cmsContent.findMany({
    where: {
      contentType: "RESOURCE",
      status: "PUBLISHED",
      deletedAt: null,
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { name: true } },
    },
  });

  return resources.filter((r) => {
    if (!r.structuredData) return true;
    try {
      const meta = JSON.parse(r.structuredData);
      const aud = meta.targetAudience || "PUBLIC";
      return allowedAudiences.includes(aud);
    } catch {
      return true;
    }
  });
}
