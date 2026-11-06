import assert from "assert";

console.log("=================================================");
console.log("   ULAB Setu Analytics, Reports & Settings Tests");
console.log("=================================================\n");

// Simulated Database State
const mockSettingsDb = new Map();
const mockAuditLogs = [];

const SYSTEM_SETTING_DEFINITIONS = [
  { key: "platform_name", category: "PLATFORM", label: "Platform Name", type: "text", defaultValue: "ULAB Setu" },
  { key: "platform_tagline", category: "PLATFORM", label: "Tagline", type: "text", defaultValue: "ULAB Alumni-Student Bridge" },
  { key: "support_email", category: "PLATFORM", label: "Support Email", type: "text", defaultValue: "support@ulab.edu.bd" },
  { key: "contact_phone", category: "PLATFORM", label: "Phone", type: "text", defaultValue: "+880 2 223361255" },
  { key: "maintenance_mode", category: "PLATFORM", label: "Maintenance Mode", type: "boolean", defaultValue: "false" },
  { key: "announcement_banner", category: "PLATFORM", label: "Banner", type: "text", defaultValue: "Welcome to ULAB Setu!" },
  { key: "enforce_ulab_domain", category: "PLATFORM", label: "Enforce Domain", type: "boolean", defaultValue: "true" },

  { key: "email_notifications_enabled", category: "NOTIFICATION", label: "Email Dispatch", type: "boolean", defaultValue: "true" },
  { key: "notification_retention_days", category: "NOTIFICATION", label: "Retention Window", type: "number", defaultValue: "90" },
  { key: "digest_frequency", category: "NOTIFICATION", label: "Digest Cadence", type: "select", defaultValue: "DAILY" },
  { key: "job_alert_broadcast", category: "NOTIFICATION", label: "Job Alert Broadcast", type: "boolean", defaultValue: "true" },
  { key: "mentorship_instant_alerts", category: "NOTIFICATION", label: "Mentorship Alerts", type: "boolean", defaultValue: "true" },

  { key: "default_profile_visibility", category: "PRIVACY", label: "Profile Visibility", type: "select", defaultValue: "CAMPUS_MEMBERS" },
  { key: "allow_alumni_directory_indexing", category: "PRIVACY", label: "Alumni Directory", type: "boolean", defaultValue: "true" },
  { key: "mask_phone_numbers_by_default", category: "PRIVACY", label: "Mask Phone Numbers", type: "boolean", defaultValue: "true" },
  { key: "direct_messaging_policy", category: "PRIVACY", label: "Messaging Access", type: "select", defaultValue: "OPEN_CAMPUS" },

  { key: "alumni_auto_approval", category: "ROLES", label: "Alumni Auto-Approval", type: "boolean", defaultValue: "true" },
  { key: "student_monthly_application_limit", category: "ROLES", label: "Application Limit", type: "number", defaultValue: "30" },
  { key: "faculty_mentor_eligibility", category: "ROLES", label: "Faculty Mentorship", type: "boolean", defaultValue: "true" },
  { key: "preapproved_alumni_import_enabled", category: "ROLES", label: "Registrar Pre-Approval", type: "boolean", defaultValue: "true" },

  { key: "job_default_expiry_days", category: "JOBS", label: "Default Job Expiry", type: "number", defaultValue: "30" },
  { key: "allow_external_job_links", category: "JOBS", label: "External Links", type: "boolean", defaultValue: "true" },
  { key: "require_salary_range", category: "JOBS", label: "Mandate Salary", type: "boolean", defaultValue: "false" },
  { key: "auto_archive_expired_jobs", category: "JOBS", label: "Auto-Archive Expired", type: "boolean", defaultValue: "true" },

  { key: "support_ticket_auto_close_days", category: "SUPPORT", label: "Auto-Close Days", type: "number", defaultValue: "7" },
  { key: "max_open_tickets_per_user", category: "SUPPORT", label: "Max Open Tickets", type: "number", defaultValue: "3" },
  { key: "escalation_alert_email", category: "SUPPORT", label: "Escalation Contact", type: "text", defaultValue: "admin@ulab.edu.bd" },
  { key: "moderation_auto_flag_threshold", category: "SUPPORT", label: "Auto-Flag Threshold", type: "number", defaultValue: "3" },

  { key: "max_login_attempts", category: "SECURITY", label: "Max Login Attempts", type: "number", defaultValue: "5" },
  { key: "lockout_duration_minutes", category: "SECURITY", label: "Lockout Cooldown", type: "number", defaultValue: "15" },
  { key: "session_token_ttl_days", category: "SECURITY", label: "Session Token TTL", type: "number", defaultValue: "7" },
  { key: "enforce_password_complexity", category: "SECURITY", label: "Password Complexity", type: "boolean", defaultValue: "true" },
];

function getSettings() {
  const map = {};
  for (const def of SYSTEM_SETTING_DEFINITIONS) {
    map[def.key] = mockSettingsDb.has(def.key) ? mockSettingsDb.get(def.key) : def.defaultValue;
  }
  return map;
}

function saveSettings(adminId, incomingSettings) {
  const updatedKeys = [];
  for (const [key, value] of Object.entries(incomingSettings)) {
    const def = SYSTEM_SETTING_DEFINITIONS.find((d) => d.key === key);
    if (!def) continue;

    let sanitized = String(value ?? "").trim();
    if (def.type === "boolean") {
      sanitized = sanitized === "true" ? "true" : "false";
    } else if (def.type === "number") {
      const num = parseInt(sanitized, 10);
      sanitized = isNaN(num) ? def.defaultValue : String(num);
    }
    mockSettingsDb.set(key, sanitized);
    updatedKeys.push(key);
  }

  mockAuditLogs.push({
    adminId,
    action: "SETTINGS_UPDATE",
    targetType: "SYSTEM_SETTINGS",
    keys: updatedKeys,
  });

  return { success: true, count: updatedKeys.length };
}

function resetCategory(adminId, category) {
  const categoryDefs = SYSTEM_SETTING_DEFINITIONS.filter((d) => d.category === category);
  for (const def of categoryDefs) {
    mockSettingsDb.set(def.key, def.defaultValue);
  }
  mockAuditLogs.push({
    adminId,
    action: "SETTINGS_RESET_CATEGORY",
    targetType: "SYSTEM_SETTINGS",
    category,
  });
  return { success: true, count: categoryDefs.length };
}

// Analytics Mock Aggregators
function aggregateUserData(users) {
  const total = users.length;
  const students = users.filter((u) => u.role === "STUDENT").length;
  const alumni = users.filter((u) => u.role === "ALUMNI").length;
  const teachers = users.filter((u) => u.role === "TEACHER").length;
  const admins = users.filter((u) => u.role === "ADMIN").length;
  const emailVerified = users.filter((u) => u.emailVerified).length;
  const verifiedAlumni = users.filter((u) => u.role === "ALUMNI" && u.alumniVerified).length;
  const activeAccounts = users.filter((u) => u.status === "APPROVED").length;

  return {
    total,
    students,
    alumni,
    teachers,
    admins,
    emailVerified,
    verifiedAlumni,
    activeAccounts,
    activePercentage: Math.round((activeAccounts / (total || 1)) * 100),
  };
}

function aggregateJobData(jobs, now = new Date()) {
  const total = jobs.length;
  const published = jobs.filter((j) => j.status === "PUBLISHED").length;
  const expired = jobs.filter((j) => j.status === "EXPIRED" || (j.deadline && new Date(j.deadline) < now)).length;
  const referral = jobs.filter((j) => j.referral).length;

  return { total, published, expired, referral };
}

function aggregateApplications(apps) {
  const byStatus = {
    APPLIED: 0,
    VIEWED: 0,
    SHORTLISTED: 0,
    INTERVIEW: 0,
    SELECTED: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
  };
  for (const a of apps) {
    if (byStatus[a.status] !== undefined) byStatus[a.status] += 1;
  }
  return { total: apps.length, byStatus };
}

function calculateAvgResolutionTime(tickets) {
  let totalHours = 0;
  let count = 0;
  for (const t of tickets) {
    if ((t.status === "RESOLVED" || t.status === "CLOSED") && t.resolvedAt) {
      const diff = (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
      if (diff >= 0) {
        totalHours += diff;
        count += 1;
      }
    }
  }
  return count > 0 ? Math.round((totalHours / count) * 10) / 10 : 0;
}

function generateCSV(headers, rows) {
  return [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((val) => {
          const str = String(val ?? "").replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(",")
    ),
  ].join("\n");
}

let passed = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// ----------------------------------------------------
// 1. Settings Schema & Definitions Tests
// ----------------------------------------------------
runTest("Settings: All 7 required categories exist with 25+ definitions", () => {
  const categories = new Set(SYSTEM_SETTING_DEFINITIONS.map((d) => d.category));
  assert.ok(categories.has("PLATFORM"));
  assert.ok(categories.has("NOTIFICATION"));
  assert.ok(categories.has("PRIVACY"));
  assert.ok(categories.has("ROLES"));
  assert.ok(categories.has("JOBS"));
  assert.ok(categories.has("SUPPORT"));
  assert.ok(categories.has("SECURITY"));
  assert.strictEqual(categories.size, 7);
  assert.ok(SYSTEM_SETTING_DEFINITIONS.length >= 25);
});

runTest("Settings: Initial retrieval yields all default configuration values", () => {
  const settings = getSettings();
  assert.strictEqual(settings.platform_name, "ULAB Setu");
  assert.strictEqual(settings.enforce_ulab_domain, "true");
  assert.strictEqual(settings.email_notifications_enabled, "true");
  assert.strictEqual(settings.student_monthly_application_limit, "30");
  assert.strictEqual(settings.max_login_attempts, "5");
});

runTest("Settings: Updating configuration persists values and records audit log", () => {
  const res = saveSettings("admin_pavel", {
    platform_name: "ULAB Setu Enterprise",
    student_monthly_application_limit: "45",
    require_salary_range: "true",
  });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.count, 3);

  const updated = getSettings();
  assert.strictEqual(updated.platform_name, "ULAB Setu Enterprise");
  assert.strictEqual(updated.student_monthly_application_limit, "45");
  assert.strictEqual(updated.require_salary_range, "true");

  assert.ok(mockAuditLogs.some((l) => l.action === "SETTINGS_UPDATE"));
});

runTest("Settings: Input sanitation correctly handles boolean and invalid number values", () => {
  saveSettings("admin_pavel", {
    maintenance_mode: "not_a_bool", // should sanitize to false
    max_login_attempts: "invalid_num", // should fallback to default "5"
  });
  const current = getSettings();
  assert.strictEqual(current.maintenance_mode, "false");
  assert.strictEqual(current.max_login_attempts, "5");
});

runTest("Settings: Reset category restores baseline values for that section", () => {
  saveSettings("admin_pavel", {
    alumni_auto_approval: "false",
    student_monthly_application_limit: "100",
  });
  assert.strictEqual(getSettings().alumni_auto_approval, "false");

  const resetRes = resetCategory("admin_pavel", "ROLES");
  assert.strictEqual(resetRes.success, true);
  const afterReset = getSettings();
  assert.strictEqual(afterReset.alumni_auto_approval, "true");
  assert.strictEqual(afterReset.student_monthly_application_limit, "30");
});

// ----------------------------------------------------
// 2. User & Demographic Analytics Tests
// ----------------------------------------------------
runTest("Analytics: User aggregation calculates accurate counts and verification percentages", () => {
  const mockUsers = [
    { id: "1", role: "STUDENT", status: "APPROVED", emailVerified: true, alumniVerified: false },
    { id: "2", role: "STUDENT", status: "APPROVED", emailVerified: true, alumniVerified: false },
    { id: "3", role: "ALUMNI", status: "APPROVED", emailVerified: true, alumniVerified: true },
    { id: "4", role: "TEACHER", status: "APPROVED", emailVerified: true, alumniVerified: false },
    { id: "5", role: "ADMIN", status: "APPROVED", emailVerified: true, alumniVerified: false },
    { id: "6", role: "STUDENT", status: "PENDING", emailVerified: false, alumniVerified: false },
  ];

  const userStats = aggregateUserData(mockUsers);
  assert.strictEqual(userStats.total, 6);
  assert.strictEqual(userStats.students, 3);
  assert.strictEqual(userStats.alumni, 1);
  assert.strictEqual(userStats.teachers, 1);
  assert.strictEqual(userStats.admins, 1);
  assert.strictEqual(userStats.emailVerified, 5);
  assert.strictEqual(userStats.verifiedAlumni, 1);
  assert.strictEqual(userStats.activeAccounts, 5);
  assert.strictEqual(userStats.activePercentage, 83);
});

// ----------------------------------------------------
// 3. Job & ATS Analytics Tests
// ----------------------------------------------------
runTest("Analytics: Job metrics accurately identify published, expired and referral jobs", () => {
  const now = new Date("2026-11-06T12:00:00Z");
  const past = new Date("2026-10-01T12:00:00Z");
  const future = new Date("2026-12-01T12:00:00Z");

  const mockJobs = [
    { id: "j1", status: "PUBLISHED", referral: true, deadline: future },
    { id: "j2", status: "PUBLISHED", referral: false, deadline: future },
    { id: "j3", status: "EXPIRED", referral: false, deadline: past },
    { id: "j4", status: "PUBLISHED", referral: true, deadline: past }, // Deadline passed
  ];

  const jobStats = aggregateJobData(mockJobs, now);
  assert.strictEqual(jobStats.total, 4);
  assert.strictEqual(jobStats.published, 3);
  assert.strictEqual(jobStats.expired, 2); // j3 explicit EXPIRED + j4 passed deadline
  assert.strictEqual(jobStats.referral, 2);
});

runTest("Analytics: ATS Application funnel tallies all 7 lifecycle stages", () => {
  const mockApps = [
    { id: "a1", status: "APPLIED" },
    { id: "a2", status: "VIEWED" },
    { id: "a3", status: "SHORTLISTED" },
    { id: "a4", status: "INTERVIEW" },
    { id: "a5", status: "SELECTED" },
    { id: "a6", status: "REJECTED" },
    { id: "a7", status: "WITHDRAWN" },
    { id: "a8", status: "APPLIED" },
  ];

  const appStats = aggregateApplications(mockApps);
  assert.strictEqual(appStats.total, 8);
  assert.strictEqual(appStats.byStatus.APPLIED, 2);
  assert.strictEqual(appStats.byStatus.SELECTED, 1);
  assert.strictEqual(appStats.byStatus.REJECTED, 1);
});

// ----------------------------------------------------
// 4. Support & Resolution Time Tests
// ----------------------------------------------------
runTest("Analytics: Support ticket resolution time calculation produces accurate averages", () => {
  const mockTickets = [
    {
      id: "t1",
      status: "RESOLVED",
      createdAt: "2026-11-01T10:00:00Z",
      resolvedAt: "2026-11-01T14:00:00Z", // 4 hours
    },
    {
      id: "t2",
      status: "CLOSED",
      createdAt: "2026-11-02T10:00:00Z",
      resolvedAt: "2026-11-02T16:00:00Z", // 6 hours
    },
    {
      id: "t3",
      status: "OPEN",
      createdAt: "2026-11-03T10:00:00Z",
      resolvedAt: null, // Still open
    },
  ];

  const avgHours = calculateAvgResolutionTime(mockTickets);
  assert.strictEqual(avgHours, 5.0); // (4 + 6) / 2 = 5
});

// ----------------------------------------------------
// 5. CSV Report Generation & Privacy Sanitization Tests
// ----------------------------------------------------
runTest("Reports: CSV generation outputs valid escaped formatting without exposing passwords", () => {
  const headers = ["User ID", "Full Name", "Email", "Role", "Department"];
  const rows = [
    ["usr_101", 'Tanvir "Architect" Ahmed', "tanvir@ulab.edu.bd", "ALUMNI", "CSE"],
    ["usr_102", "Sadia Rahman", "sadia@ulab.edu.bd", "STUDENT", "BBA"],
  ];

  const csv = generateCSV(headers, rows);
  assert.ok(csv.includes("User ID,Full Name,Email,Role,Department"));
  assert.ok(csv.includes('"usr_101","Tanvir ""Architect"" Ahmed","tanvir@ulab.edu.bd","ALUMNI","CSE"'));
  // Ensure no password hashes or sensitive keys exist in columns
  assert.strictEqual(csv.includes("passwordHash"), false);
  assert.strictEqual(csv.includes("resetToken"), false);
});

console.log("\n=================================================");
console.log(`   Analytics & Settings Test Suite: ${passed}/${totalTests} Passed`);
console.log("=================================================\n");

if (passed !== totalTests) {
  process.exit(1);
}

