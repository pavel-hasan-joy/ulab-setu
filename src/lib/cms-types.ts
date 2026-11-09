import { z } from "zod";

/**
 * CMS Content Types supported across the 5 phases.
 */
export const CMS_CONTENT_TYPES = [
  "PAGE",
  "HOMEPAGE_SECTION",
  "NEWS",
  "ANNOUNCEMENT",
  "EVENT",
  "FAQ",
  "ALUMNI_STORY",
  "RESOURCE",
] as const;

export type CmsContentType = (typeof CMS_CONTENT_TYPES)[number];

export const CMS_CONTENT_TYPE_META: Record<
  CmsContentType,
  { label: string; description: string; phase: number; icon: string }
> = {
  PAGE: {
    label: "Static Page",
    description: "Institutional landing pages, departmental profiles, and custom documents.",
    phase: 2,
    icon: "FileText",
  },
  HOMEPAGE_SECTION: {
    label: "Homepage Block",
    description: "Dynamic hero banners, statistic counters, spotlights, and campus highlights.",
    phase: 3,
    icon: "Sparkles",
  },
  NEWS: {
    label: "News Article",
    description: "University press releases, achievements, media coverage, and campus stories.",
    phase: 2,
    icon: "Newspaper",
  },
  ANNOUNCEMENT: {
    label: "Announcement",
    description: "Critical notices, administrative advisories, circulars, and deadlines.",
    phase: 2,
    icon: "Bell",
  },
  EVENT: {
    label: "Campus Event",
    description: "Workshops, seminars, hackathons, reunions, and convocations with RSVP details.",
    phase: 2,
    icon: "Calendar",
  },
  FAQ: {
    label: "FAQ Item",
    description: "Frequently asked questions for admissions, career guidance, and campus life.",
    phase: 2,
    icon: "HelpCircle",
  },
  ALUMNI_STORY: {
    label: "Alumni Story",
    description: "Spotlights and career profiles of successful ULAB graduates.",
    phase: 2,
    icon: "Award",
  },
  RESOURCE: {
    label: "Downloadable Resource",
    description: "Course materials, brochures, academic forms, and career guides.",
    phase: 2,
    icon: "FolderGit2",
  },
};

/**
 * 8-Stage Strict Content Lifecycle.
 */
export const CMS_CONTENT_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "UNPUBLISHED",
  "ARCHIVED",
] as const;

export type CmsContentStatus = (typeof CMS_CONTENT_STATUSES)[number];

export const CMS_STATUS_META: Record<
  CmsContentStatus,
  { label: string; tone: "gray" | "blue" | "gold" | "sage" | "rose" | "lilac"; description: string }
> = {
  DRAFT: {
    label: "Draft",
    tone: "gray",
    description: "Work-in-progress content visible only to author and editors.",
  },
  IN_REVIEW: {
    label: "In Review",
    tone: "gold",
    description: "Submitted for editorial and administrative review.",
  },
  CHANGES_REQUESTED: {
    label: "Changes Requested",
    tone: "rose",
    description: "Returned to the author with reviewer feedback for adjustments.",
  },
  APPROVED: {
    label: "Approved",
    tone: "blue",
    description: "Editorial review passed; ready for scheduling or direct publishing.",
  },
  SCHEDULED: {
    label: "Scheduled",
    tone: "lilac",
    description: "Queued for automatic publication at a future timestamp.",
  },
  PUBLISHED: {
    label: "Published",
    tone: "sage",
    description: "Live and accessible to targeted audience or public.",
  },
  UNPUBLISHED: {
    label: "Unpublished",
    tone: "gold",
    description: "Taken down from live display; preserved in draft/inactive state.",
  },
  ARCHIVED: {
    label: "Archived",
    tone: "gray",
    description: "Historical content retired from active workflows.",
  },
};

/**
 * Valid Status Transitions Matrix enforcing the Content Lifecycle.
 */
export const VALID_STATUS_TRANSITIONS: Record<CmsContentStatus, readonly CmsContentStatus[]> = {
  DRAFT: ["IN_REVIEW", "ARCHIVED"],
  IN_REVIEW: ["CHANGES_REQUESTED", "APPROVED", "DRAFT"],
  CHANGES_REQUESTED: ["DRAFT", "IN_REVIEW"],
  APPROVED: ["SCHEDULED", "PUBLISHED", "DRAFT"],
  SCHEDULED: ["PUBLISHED", "DRAFT", "APPROVED"],
  PUBLISHED: ["UNPUBLISHED", "ARCHIVED"],
  UNPUBLISHED: ["DRAFT", "ARCHIVED", "PUBLISHED"],
  ARCHIVED: ["DRAFT"],
} as const;

/**
 * CMS-Specific Roles (Independent of User main roles: STUDENT | ALUMNI | TEACHER | ADMIN).
 */
export const CMS_ROLES = [
  "CMS_ADMIN",
  "CONTENT_EDITOR",
  "CONTENT_REVIEWER",
  "PUBLISHER",
  "CONTRIBUTOR",
] as const;

export type CmsRole = (typeof CMS_ROLES)[number];

export const CMS_ROLE_META: Record<
  CmsRole,
  { label: string; tone: "gold" | "blue" | "sage" | "lilac" | "gray"; description: string }
> = {
  CMS_ADMIN: {
    label: "CMS Administrator",
    tone: "gold",
    description: "Complete authority: manage all content, approve, publish, and assign CMS permissions.",
  },
  CONTENT_EDITOR: {
    label: "Content Editor",
    tone: "blue",
    description: "Create and edit authorized content; submit items for review.",
  },
  CONTENT_REVIEWER: {
    label: "Content Reviewer",
    tone: "sage",
    description: "Review submitted content, add feedback, and approve or request revisions.",
  },
  PUBLISHER: {
    label: "Publisher",
    tone: "sage",
    description: "Publish approved items, manage scheduling calendars, and unpublish content.",
  },
  CONTRIBUTOR: {
    label: "Contributor",
    tone: "lilac",
    description: "Create assigned content and edit own drafts; submit to review queue.",
  },
};

/**
 * Fine-grained CMS capabilities.
 */
export type CmsCapability =
  | "cms:overview:view"
  | "cms:content:view"
  | "cms:content:create"
  | "cms:content:edit"
  | "cms:content:edit_own"
  | "cms:content:submit_review"
  | "cms:content:review"
  | "cms:content:approve"
  | "cms:content:publish"
  | "cms:content:schedule"
  | "cms:content:unpublish"
  | "cms:content:archive"
  | "cms:content:delete"
  | "cms:history:view"
  | "cms:permissions:manage";

export const CMS_ROLE_CAPABILITIES: Record<CmsRole, readonly CmsCapability[]> = {
  CMS_ADMIN: [
    "cms:overview:view",
    "cms:content:view",
    "cms:content:create",
    "cms:content:edit",
    "cms:content:edit_own",
    "cms:content:submit_review",
    "cms:content:review",
    "cms:content:approve",
    "cms:content:publish",
    "cms:content:schedule",
    "cms:content:unpublish",
    "cms:content:archive",
    "cms:content:delete",
    "cms:history:view",
    "cms:permissions:manage",
  ],
  CONTENT_EDITOR: [
    "cms:overview:view",
    "cms:content:view",
    "cms:content:create",
    "cms:content:edit",
    "cms:content:edit_own",
    "cms:content:submit_review",
    "cms:history:view",
  ],
  CONTENT_REVIEWER: [
    "cms:overview:view",
    "cms:content:view",
    "cms:content:review",
    "cms:content:approve",
    "cms:history:view",
  ],
  PUBLISHER: [
    "cms:overview:view",
    "cms:content:view",
    "cms:content:publish",
    "cms:content:schedule",
    "cms:content:unpublish",
    "cms:content:archive",
    "cms:history:view",
  ],
  CONTRIBUTOR: [
    "cms:overview:view",
    "cms:content:view",
    "cms:content:create",
    "cms:content:edit_own",
    "cms:content:submit_review",
    "cms:history:view",
  ],
};

/**
 * Zod validation schemas for CMS entities and mutations.
 */
export const createCmsContentSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters long.").max(200, "Title is too long."),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters long.")
    .max(120, "Slug is too long.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers, and hyphens."),
  contentType: z.enum(CMS_CONTENT_TYPES, { message: "Invalid content type." }),
  summary: z.string().trim().max(500, "Summary must be under 500 characters.").optional(),
  body: z.string().optional(),
  category: z.string().trim().max(100).optional(),
  tags: z.string().trim().max(200).optional(),
  featuredImage: z.union([z.literal(""), z.string().trim().url("Featured image must be a valid URL.")]).optional(),
  priority: z.coerce.number().int().min(0).max(100).default(0),
  metaTitle: z.string().trim().max(120).optional(),
  metaDescription: z.string().trim().max(200).optional(),
});

export const updateCmsStatusSchema = z.object({
  contentId: z.string().min(1, "Content ID is required."),
  newStatus: z.enum(CMS_CONTENT_STATUSES, { message: "Invalid status." }),
  reviewNotes: z.string().trim().max(1000).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const assignCmsRoleSchema = z.object({
  targetUserId: z.string().min(1, "Target user ID is required."),
  role: z.enum(CMS_ROLES, { message: "Invalid CMS role." }),
  notes: z.string().trim().max(500).optional(),
});
