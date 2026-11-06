import { db } from "@/lib/db";

export type SettingCategory =
  | "PLATFORM"
  | "NOTIFICATION"
  | "PRIVACY"
  | "ROLES"
  | "JOBS"
  | "SUPPORT"
  | "SECURITY";

export type SettingDefinition = {
  key: string;
  category: SettingCategory;
  label: string;
  description: string;
  type: "boolean" | "text" | "number" | "select";
  options?: Array<{ label: string; value: string }>;
  defaultValue: string;
};

export const SYSTEM_SETTING_DEFINITIONS: SettingDefinition[] = [
  // 1. Platform Information
  {
    key: "platform_name",
    category: "PLATFORM",
    label: "Platform Name",
    description: "Official public branding across the portal and notifications.",
    type: "text",
    defaultValue: "ULAB Setu",
  },
  {
    key: "platform_tagline",
    category: "PLATFORM",
    label: "Institutional Tagline",
    description: "Header subtitle displayed on public and welcome screens.",
    type: "text",
    defaultValue: "ULAB Alumni-Student Professional & Mentorship Bridge",
  },
  {
    key: "support_email",
    category: "PLATFORM",
    label: "Official Support Email",
    description: "Incoming contact address for inquiries and account assistance.",
    type: "text",
    defaultValue: "support@ulab.edu.bd",
  },
  {
    key: "contact_phone",
    category: "PLATFORM",
    label: "Campus Helpdesk Phone",
    description: "Physical university phone helpline number.",
    type: "text",
    defaultValue: "+880 2 223361255",
  },
  {
    key: "maintenance_mode",
    category: "PLATFORM",
    label: "Maintenance Mode",
    description: "Temporarily limit access to platform for non-admin accounts during infrastructure upgrades.",
    type: "boolean",
    defaultValue: "false",
  },
  {
    key: "announcement_banner",
    category: "PLATFORM",
    label: "Global Announcement Banner",
    description: "Broadcast message shown at the top of member dashboards (leave blank to hide).",
    type: "text",
    defaultValue: "Welcome to ULAB Setu! Connect with verified alumni mentors, explore exclusive campus opportunities, and advance your career.",
  },
  {
    key: "enforce_ulab_domain",
    category: "PLATFORM",
    label: "Enforce @ulab.edu.bd Domain",
    description: "Strictly reject personal non-institutional email addresses during registration.",
    type: "boolean",
    defaultValue: "true",
  },

  // 2. Notification Preferences
  {
    key: "email_notifications_enabled",
    category: "NOTIFICATION",
    label: "Master Email Dispatch",
    description: "Toggle global automated email delivery for OTPs, alerts, and status changes.",
    type: "boolean",
    defaultValue: "true",
  },
  {
    key: "notification_retention_days",
    category: "NOTIFICATION",
    label: "Notification Retention Window",
    description: "Number of days in-app notification records are retained before automatic cleanup.",
    type: "number",
    defaultValue: "90",
  },
  {
    key: "digest_frequency",
    category: "NOTIFICATION",
    label: "Activity Digest Cadence",
    description: "Default frequency for consolidated opportunity and network digests.",
    type: "select",
    options: [
      { label: "Real-time Instant Delivery", value: "INSTANT" },
      { label: "Daily Evening Summary", value: "DAILY" },
      { label: "Weekly Career Roundup", value: "WEEKLY" },
    ],
    defaultValue: "DAILY",
  },
  {
    key: "job_alert_broadcast",
    category: "NOTIFICATION",
    label: "Broadcast New Published Jobs",
    description: "Send automated notifications to relevant students when alumni publish matching jobs.",
    type: "boolean",
    defaultValue: "true",
  },
  {
    key: "mentorship_instant_alerts",
    category: "NOTIFICATION",
    label: "Instant Mentorship Alerts",
    description: "Immediately alert mentors upon receipt of a new student request.",
    type: "boolean",
    defaultValue: "true",
  },

  // 3. User Privacy Settings
  {
    key: "default_profile_visibility",
    category: "PRIVACY",
    label: "Default Profile Visibility",
    description: "Initial discovery scope assigned to newly registered students and alumni.",
    type: "select",
    options: [
      { label: "All Verified Campus Members", value: "CAMPUS_MEMBERS" },
      { label: "Direct Connections Only", value: "CONNECTIONS_ONLY" },
      { label: "Strictly Private Until Approved", value: "PRIVATE" },
    ],
    defaultValue: "CAMPUS_MEMBERS",
  },
  {
    key: "allow_alumni_directory_indexing",
    category: "PRIVACY",
    label: "Alumni Directory Searchability",
    description: "Enable students and faculty to browse and discover verified alumni profiles.",
    type: "boolean",
    defaultValue: "true",
  },
  {
    key: "mask_phone_numbers_by_default",
    category: "PRIVACY",
    label: "Mask Personal Phone Numbers",
    description: "Conceal phone & WhatsApp numbers on profiles unless explicitly set to public by the user.",
    type: "boolean",
    defaultValue: "true",
  },
  {
    key: "direct_messaging_policy",
    category: "PRIVACY",
    label: "Direct Messaging Access Policy",
    description: "Controls which members can initiate direct messages across student and alumni roles.",
    type: "select",
    options: [
      { label: "Open Campus (Students & Alumni can freely initiate)", value: "OPEN_CAMPUS" },
      { label: "Accepted Connections & Mentorship Only", value: "CONNECTED_ONLY" },
    ],
    defaultValue: "OPEN_CAMPUS",
  },

  // 4. Role and Permission Settings
  {
    key: "alumni_auto_approval",
    category: "ROLES",
    label: "Alumni Zero-Delay Auto-Approval",
    description: "Instantly verify and approve alumni accounts upon confirming official @ulab.edu.bd OTP.",
    type: "boolean",
    defaultValue: "true",
  },
  {
    key: "student_monthly_application_limit",
    category: "ROLES",
    label: "Monthly Job Application Quota",
    description: "Maximum number of distinct job applications a student can submit in a 30-day window.",
    type: "number",
    defaultValue: "30",
  },
  {
    key: "faculty_mentor_eligibility",
    category: "ROLES",
    label: "Faculty Mentorship Participation",
    description: "Allow university faculty and lecturers to register as active research and academic mentors.",
    type: "boolean",
    defaultValue: "true",
  },
  {
    key: "preapproved_alumni_import_enabled",
    category: "ROLES",
    label: "Enable Registrar CSV Pre-Approvals",
    description: "Allow administrators to ingest university convocation rosters for 1-click verification.",
    type: "boolean",
    defaultValue: "true",
  },

  // 5. Job-related Configuration
  {
    key: "job_default_expiry_days",
    category: "JOBS",
    label: "Default Job Posting Lifespan",
    description: "Standard active duration in days from publication date before automatic expiration.",
    type: "number",
    defaultValue: "30",
  },
  {
    key: "allow_external_job_links",
    category: "JOBS",
    label: "Permit External Application Links",
    description: "Allow alumni employers to provide external company careers portals or Google Forms.",
    type: "boolean",
    defaultValue: "true",
  },
  {
    key: "require_salary_range",
    category: "JOBS",
    label: "Mandate Compensation Transparency",
    description: "Require alumni employers to specify a salary range or 'Negotiable' tag before publishing.",
    type: "boolean",
    defaultValue: "false",
  },
  {
    key: "auto_archive_expired_jobs",
    category: "JOBS",
    label: "Auto-Archive Expired Postings",
    description: "Automatically change job status from Published to Expired when the deadline passes.",
    type: "boolean",
    defaultValue: "true",
  },

  // 6. Support Configuration
  {
    key: "support_ticket_auto_close_days",
    category: "SUPPORT",
    label: "Resolved Ticket Auto-Close",
    description: "Number of days resolved support tickets remain before automatically moving to Closed.",
    type: "number",
    defaultValue: "7",
  },
  {
    key: "max_open_tickets_per_user",
    category: "SUPPORT",
    label: "Concurrent Open Ticket Limit",
    description: "Maximum active (Open or In Progress) tickets permitted per individual user.",
    type: "number",
    defaultValue: "3",
  },
  {
    key: "escalation_alert_email",
    category: "SUPPORT",
    label: "Escalation Lead Contact",
    description: "Administrator destination email for urgent priority tickets and safety violations.",
    type: "text",
    defaultValue: "admin@ulab.edu.bd",
  },
  {
    key: "moderation_auto_flag_threshold",
    category: "SUPPORT",
    label: "Auto-Flag Content Threshold",
    description: "Number of member reports required to automatically place a job or post in moderation hold.",
    type: "number",
    defaultValue: "3",
  },

  // 7. Security Configuration
  {
    key: "max_login_attempts",
    category: "SECURITY",
    label: "Failed Login Lockout Threshold",
    description: "Permitted incorrect credential submissions before temporary IP/account cooldown.",
    type: "number",
    defaultValue: "5",
  },
  {
    key: "lockout_duration_minutes",
    category: "SECURITY",
    label: "Lockout Cooldown Window (Minutes)",
    description: "Temporary block duration following threshold-exceeded failed authentications.",
    type: "number",
    defaultValue: "15",
  },
  {
    key: "session_token_ttl_days",
    category: "SECURITY",
    label: "Session Token Validity (Days)",
    description: "Stateless JWT HTTP-only cookie lifespan before re-authentication is required.",
    type: "number",
    defaultValue: "7",
  },
  {
    key: "enforce_password_complexity",
    category: "SECURITY",
    label: "Enforce Complex Passwords",
    description: "Require min 8 characters including mixed case, digits, and special characters.",
    type: "boolean",
    defaultValue: "true",
  },
];

/**
 * Retrieve all system settings from database, seeded with defaults if missing.
 */
export async function getSystemSettings(): Promise<Record<string, string>> {
  try {
    const records = await db.systemSetting.findMany();
    const map: Record<string, string> = {};

    for (const def of SYSTEM_SETTING_DEFINITIONS) {
      map[def.key] = def.defaultValue;
    }

    for (const record of records) {
      map[record.key] = record.value;
    }

    return map;
  } catch (error) {
    console.warn("Could not query SystemSetting table, using runtime defaults:", error);
    const fallback: Record<string, string> = {};
    for (const def of SYSTEM_SETTING_DEFINITIONS) {
      fallback[def.key] = def.defaultValue;
    }
    return fallback;
  }
}

/**
 * Retrieve a single system setting value by key.
 */
export async function getSystemSetting(key: string, defaultValue?: string): Promise<string> {
  try {
    const record = await db.systemSetting.findUnique({ where: { key } });
    if (record) return record.value;
  } catch {
    // ignore
  }

  if (defaultValue !== undefined) return defaultValue;
  const def = SYSTEM_SETTING_DEFINITIONS.find((d) => d.key === key);
  return def ? def.defaultValue : "";
}

