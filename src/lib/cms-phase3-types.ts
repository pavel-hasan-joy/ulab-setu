import { z } from "zod";

// ============================================================================
// 1. NEWS & ANNOUNCEMENTS
// ============================================================================

export const ANNOUNCEMENT_CATEGORIES = [
  "Official University Notice",
  "Scholarship",
  "Career Opportunity",
  "Seminar",
  "Workshop",
  "Research",
  "Club Event",
  "Important Announcement",
] as const;

export const CONTENT_AUDIENCES = [
  "PUBLIC",
  "STUDENT",
  "ALUMNI",
  "TEACHER",
  "AUTHENTICATED",
] as const;

export type ContentAudience = (typeof CONTENT_AUDIENCES)[number];

export const announcementSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  contentType: z.enum(["NEWS", "ANNOUNCEMENT"]).default("ANNOUNCEMENT"),
  summary: z.string().trim().min(5, "Short description is required").max(500),
  body: z.string().trim().min(10, "Detailed content is required"),
  category: z.string().trim().min(1, "Category is required"),
  targetAudience: z.enum(CONTENT_AUDIENCES).default("PUBLIC"),
  featuredImage: z.string().trim().url().optional().or(z.literal("")),
  attachmentUrl: z.string().trim().url().optional().or(z.literal("")),
  registrationUrl: z.string().trim().url().optional().or(z.literal("")),
  tags: z.string().trim().optional(),
  priority: z.number().int().min(0).max(10).default(0),
  expiresAt: z.string().optional().or(z.literal("")),
  scheduledAt: z.string().optional().or(z.literal("")),
  notifyUsers: z.boolean().default(false),
});

export type AnnouncementFormData = z.infer<typeof announcementSchema>;

// ============================================================================
// 2. EVENTS MANAGEMENT
// ============================================================================

export const EVENT_CATEGORIES = [
  "Career Fair",
  "Job Fair",
  "Alumni Reunion",
  "Workshop",
  "Seminar",
  "Coding Competition",
  "Research Conference",
  "University Program",
  "Other",
] as const;

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Event title must be at least 3 characters").max(200),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
    summary: z.string().trim().min(5, "Short description is required").max(500),
    body: z.string().trim().min(10, "Detailed event description is required"),
    category: z.string().trim().min(1, "Event category is required"),
    targetAudience: z.enum(CONTENT_AUDIENCES).default("PUBLIC"),
    posterImage: z.string().trim().url().optional().or(z.literal("")),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    startTime: z.string().trim().min(1, "Start time is required"), // e.g. "10:00 AM"
    endTime: z.string().trim().min(1, "End time is required"),     // e.g. "04:00 PM"
    timeZone: z.string().default("Asia/Dhaka"),
    venue: z.string().trim().min(1, "Venue or Campus location is required"),
    meetingUrl: z.string().trim().url().optional().or(z.literal("")),
    organizer: z.string().trim().min(1, "Organizer name is required"),
    registrationUrl: z.string().trim().url().optional().or(z.literal("")),
    registrationDeadline: z.string().optional().or(z.literal("")),
    priority: z.number().int().min(0).max(10).default(0),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start;
    },
    {
      message: "End date must be on or after start date",
      path: ["endDate"],
    }
  );

export type EventFormData = z.infer<typeof eventSchema>;

export type EventStatusState = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";

export function getDerivedEventState(
  startDateStr: string,
  endDateStr: string,
  cmsStatus: string
): EventStatusState {
  if (cmsStatus === "ARCHIVED" || cmsStatus === "UNPUBLISHED") {
    return "CANCELLED";
  }

  const now = new Date();
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  // Extend end date to midnight of that day
  end.setHours(23, 59, 59, 999);

  if (now < start) {
    return "UPCOMING";
  } else if (now >= start && now <= end) {
    return "ONGOING";
  } else {
    return "COMPLETED";
  }
}

// ============================================================================
// 3. FAQ MANAGEMENT
// ============================================================================

export const FAQ_CATEGORIES = [
  "Account Registration",
  "Alumni Verification",
  "Student Portal",
  "Job Applications",
  "Mentorship",
  "Messaging",
  "Privacy and Security",
  "General Support",
] as const;

export const faqSchema = z.object({
  question: z.string().trim().min(5, "Question must be at least 5 characters").max(300),
  answer: z.string().trim().min(10, "Answer must be at least 10 characters"),
  category: z.string().trim().min(1, "Category is required"),
  displayOrder: z.number().int().min(0).default(0),
});

export type FaqFormData = z.infer<typeof faqSchema>;

// ============================================================================
// 4. ALUMNI STORIES & TESTIMONIALS
// ============================================================================

export const alumniStorySchema = z.object({
  title: z.string().trim().min(3, "Story headline must be at least 3 characters").max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  alumniUserId: z.string().optional().or(z.literal("")),
  alumniName: z.string().trim().min(2, "Alumni name is required"),
  graduationBatch: z.string().trim().optional(),
  currentCompany: z.string().trim().min(1, "Current company is required"),
  currentDesignation: z.string().trim().min(1, "Designation is required"),
  summary: z.string().trim().min(10, "Brief journey overview is required").max(400),
  storyContent: z.string().trim().min(20, "Detailed story is required"),
  approvedPhotoUrl: z.string().trim().url().optional().or(z.literal("")),
  linkedinUrl: z.string().trim().url().optional().or(z.literal("")),
  isFeatured: z.boolean().default(false),
  hasConsent: z.boolean().refine((val) => val === true, {
    message: "Explicit consent from the alumnus is mandatory before public publishing.",
  }),
});

export type AlumniStoryFormData = z.infer<typeof alumniStorySchema>;

// ============================================================================
// 5. RESOURCE LIBRARY
// ============================================================================

export const RESOURCE_CATEGORIES = [
  "CV Writing Guides",
  "Interview Preparation",
  "Career Development",
  "Programming Learning Resources",
  "Scholarship Guides",
  "Higher Studies Guides",
  "Internship Preparation",
  "Research Resources",
  "University Guidelines",
] as const;

export const resourceSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  summary: z.string().trim().min(5, "Short overview is required").max(400),
  body: z.string().trim().min(10, "Full resource description/guide is required"),
  category: z.string().trim().min(1, "Category is required"),
  coverImage: z.string().trim().url().optional().or(z.literal("")),
  fileUrl: z.string().trim().url("Valid file URL or approved external link is required"),
  fileType: z.string().trim().default("PDF"),
  fileSizeLabel: z.string().trim().optional(),
  authorOrSource: z.string().trim().min(1, "Author or authoritative source is required"),
  targetAudience: z.enum(CONTENT_AUDIENCES).default("PUBLIC"),
  tags: z.string().trim().optional(),
});

export type ResourceFormData = z.infer<typeof resourceSchema>;

