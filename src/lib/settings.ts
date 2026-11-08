import { db } from "@/lib/db";

export type SettingCategory =
  | "PLATFORM"
  | "PRIVACY"
  | "ROLES"
  | "JOBS"
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

  // 2. User Privacy Settings
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

  // 3. Role and Permission Settings
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

  // 4. Job-related Configuration
  {
    key: "require_salary_range",
    category: "JOBS",
    label: "Mandate Compensation Transparency",
    description: "Require alumni employers to specify a salary range or 'Negotiable' tag before publishing.",
    type: "boolean",
    defaultValue: "false",
  },

  // 5. Security Configuration
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
      if (SYSTEM_SETTING_DEFINITIONS.some((d) => d.key === record.key)) {
        map[record.key] = record.value;
      }
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
