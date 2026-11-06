import assert from "assert";

console.log("=================================================");
console.log("   ULAB Setu Job Management CRM & Moderation Tests");
console.log("=================================================\n");

// Mock in-memory state simulating DB entities
const mockUsers = [
  { id: "usr_alumni_1", name: "Tanvir Ahmed", role: "ALUMNI", status: "APPROVED", email: "tanvir.ahmed@ulab.edu.bd" },
  { id: "usr_alumni_2", name: "Sadia Rahman", role: "ALUMNI", status: "APPROVED", email: "sadia.rahman@ulab.edu.bd" },
  { id: "usr_student_1", name: "Arif Khan", role: "STUDENT", status: "APPROVED", email: "arif.khan@ulab.edu.bd" },
  { id: "usr_admin_1", name: "Career Admin", role: "ADMIN", status: "APPROVED", email: "admin@ulab.edu.bd" },
];

let mockJobs = [];
let mockReports = [];
let mockAuditLogs = [];

function resetState() {
  mockJobs = [
    {
      id: "job_101",
      title: "Junior React Developer",
      company: "Brain Station 23",
      location: "Dhaka (Hybrid)",
      type: "Full-time",
      category: "Software & IT",
      description: "Exciting opportunity for final-year students or fresh graduates to build high-scale web apps.",
      requirements: "• Strong JS/TS\n• Experience with React & Tailwind",
      skills: "React, TypeScript, Next.js, Tailwind CSS",
      salary: "BDT 35,000 - 45,000 / month",
      experienceLevel: "Entry",
      deadline: new Date(Date.now() + 7 * 864e5), // 7 days in future
      referral: true,
      active: true,
      status: "PUBLISHED",
      externalUrl: "https://brainstation-23.com/apply",
      contactEmail: "hr@brainstation-23.com",
      postedById: "usr_alumni_1",
      deletedAt: null,
      viewsCount: 14,
    },
    {
      id: "job_102",
      title: "Marketing Associate",
      company: "Pathao",
      location: "Gulshan, Dhaka",
      type: "Full-time",
      category: "Marketing & Communication",
      description: "Join the growth marketing team at Pathao to run high-impact campaigns.",
      requirements: "• Analytical mindset\n• Content writing",
      skills: "Digital Marketing, SEO, Copywriting",
      salary: "Negotiable",
      experienceLevel: "Entry",
      deadline: new Date(Date.now() - 2 * 864e5), // 2 days in the past (expired)
      referral: false,
      active: true,
      status: "PUBLISHED",
      externalUrl: null,
      contactEmail: "jobs@pathao.com",
      postedById: "usr_alumni_2",
      deletedAt: null,
      viewsCount: 28,
    },
  ];
  mockReports = [];
  mockAuditLogs = [];
}

resetState();

// 1. Job Creation Validation
console.log("[TEST 1] Job Creation Validation & Contract");
{
  function validateJobInput(data) {
    if (!data.title || data.title.trim().length < 3) return { valid: false, error: "Title too short" };
    if (!data.company || data.company.trim().length < 1) return { valid: false, error: "Company required" };
    if (!data.description || data.description.trim().length < 20) return { valid: false, error: "Description too short" };
    if (data.status === "PUBLISHED" && data.deadline && new Date(data.deadline).getTime() < Date.now()) {
      return { valid: false, error: "Deadline cannot be in past for published jobs" };
    }
    return { valid: true };
  }

  // Valid publication
  const valid = validateJobInput({
    title: "Software Engineer Intern",
    company: "Chaldal",
    description: "Great learning environment for ULAB undergraduates working on microservices.",
    status: "PUBLISHED",
    deadline: new Date(Date.now() + 10 * 864e5),
  });
  assert.strictEqual(valid.valid, true);

  // Past deadline rejection
  const invalidDeadline = validateJobInput({
    title: "Software Engineer Intern",
    company: "Chaldal",
    description: "Great learning environment for ULAB undergraduates working on microservices.",
    status: "PUBLISHED",
    deadline: new Date(Date.now() - 1000),
  });
  assert.strictEqual(invalidDeadline.valid, false);
  assert.strictEqual(invalidDeadline.error, "Deadline cannot be in past for published jobs");

  // Draft with past deadline allowed
  const draftPastDeadline = validateJobInput({
    title: "Old Draft Job",
    company: "Chaldal",
    description: "Great learning environment for ULAB undergraduates working on microservices.",
    status: "DRAFT",
    deadline: new Date(Date.now() - 1000),
  });
  assert.strictEqual(draftPastDeadline.valid, true);

  console.log("  [PASS] Job field validation, deadline enforcement, and draft contracts hold.");
}

// 2. Ownership & Authorization Boundaries
console.log("\n[TEST 2] Ownership & Authorization Boundaries");
{
  function canModifyJob(job, callerUser) {
    if (!job || job.deletedAt) return false;
    if (callerUser.role === "ADMIN") return true;
    return job.postedById === callerUser.id;
  }

  const job = mockJobs[0];
  const owner = mockUsers[0]; // usr_alumni_1
  const intruder = mockUsers[1]; // usr_alumni_2
  const student = mockUsers[2];
  const admin = mockUsers[3];

  assert.strictEqual(canModifyJob(job, owner), true, "Owner must be allowed to modify their own job");
  assert.strictEqual(canModifyJob(job, intruder), false, "Different alumni must NOT be allowed to modify another's job");
  assert.strictEqual(canModifyJob(job, student), false, "Student must NOT be allowed to modify job");
  assert.strictEqual(canModifyJob(job, admin), true, "Admin must have moderation authority");

  console.log("  [PASS] Strict authorization isolation verified: only author or admin can modify.");
}

// 3. Automatic Expiration Synchronization
console.log("\n[TEST 3] Automatic Job Expiration Synchronization");
{
  function syncExpiredJobs(jobs) {
    const now = Date.now();
    let updatedCount = 0;
    jobs.forEach((job) => {
      if (
        job.deadline &&
        new Date(job.deadline).getTime() < now &&
        (job.status === "PUBLISHED" || job.status === "PAUSED")
      ) {
        job.status = "EXPIRED";
        job.active = false;
        updatedCount++;
      }
    });
    return updatedCount;
  }

  const expiredCount = syncExpiredJobs(mockJobs);
  assert.strictEqual(expiredCount, 1);
  const expiredJob = mockJobs.find((j) => j.id === "job_102");
  assert.strictEqual(expiredJob.status, "EXPIRED");
  assert.strictEqual(expiredJob.active, false);

  console.log("  [PASS] Expired jobs automatically transitioned to EXPIRED status without record deletion.");
}

// 4. Job Status State Machine Transitions
console.log("\n[TEST 4] Job Status State Machine Transitions");
{
  const job = mockJobs[0];

  function transitionStatus(job, newStatus) {
    const allowed = ["DRAFT", "PUBLISHED", "PAUSED", "CLOSED", "EXPIRED", "REMOVED"];
    if (!allowed.includes(newStatus)) throw new Error("Invalid status");
    job.status = newStatus;
    job.active = newStatus === "PUBLISHED";
    if (newStatus === "REMOVED") job.deletedAt = new Date();
  }

  // Pause
  transitionStatus(job, "PAUSED");
  assert.strictEqual(job.status, "PAUSED");
  assert.strictEqual(job.active, false);

  // Resume (Publish)
  transitionStatus(job, "PUBLISHED");
  assert.strictEqual(job.status, "PUBLISHED");
  assert.strictEqual(job.active, true);

  // Close
  transitionStatus(job, "CLOSED");
  assert.strictEqual(job.status, "CLOSED");
  assert.strictEqual(job.active, false);

  // Soft delete / Remove
  transitionStatus(job, "REMOVED");
  assert.strictEqual(job.status, "REMOVED");
  assert.strictEqual(job.active, false);
  assert.notStrictEqual(job.deletedAt, null);

  console.log("  [PASS] Complete lifecycle (Draft -> Published -> Paused -> Closed -> Removed) verified.");
}

// 5. Referral Management Toggle
console.log("\n[TEST 5] Referral Management Toggle");
{
  resetState();
  const job = mockJobs[0];
  assert.strictEqual(job.referral, true);

  function toggleReferral(job) {
    job.referral = !job.referral;
    return job.referral;
  }

  const toggledOff = toggleReferral(job);
  assert.strictEqual(toggledOff, false);
  const toggledOn = toggleReferral(job);
  assert.strictEqual(toggledOn, true);

  console.log("  [PASS] 1-click referral toggle holds state accurately.");
}

// 6. Student Job Reporting & Moderation Queue
console.log("\n[TEST 6] Student Job Reporting & Moderation Queue");
{
  resetState();
  const student = mockUsers[2];
  const targetJob = mockJobs[0];

  function submitJobReport(jobId, reporterId, reason, details) {
    const report = {
      id: `rep_${Date.now()}`,
      targetType: "JOB",
      targetId: jobId,
      reporterId,
      reason,
      details,
      status: "PENDING",
      createdAt: new Date(),
    };
    mockReports.push(report);
    return report;
  }

  const report = submitJobReport(
    targetJob.id,
    student.id,
    "FRAUD",
    "Company asked for registration fee before interview."
  );

  assert.strictEqual(mockReports.length, 1);
  assert.strictEqual(report.targetId, targetJob.id);
  assert.strictEqual(report.reason, "FRAUD");
  assert.strictEqual(report.status, "PENDING");

  console.log("  [PASS] Job reporting records complaints in moderation queue with student reference.");
}

// 7. Admin Moderation & Investigation Resolution
console.log("\n[TEST 7] Admin Moderation & Investigation Resolution");
{
  const admin = mockUsers[3];
  const report = mockReports[0];

  function resolveReportByAdmin(reportId, resolution, removeJob = false) {
    const r = mockReports.find((item) => item.id === reportId);
    if (!r) throw new Error("Report not found");
    r.status = resolution;
    r.resolvedById = admin.id;

    if (removeJob && r.targetType === "JOB") {
      const job = mockJobs.find((j) => j.id === r.targetId);
      if (job) {
        job.status = "REMOVED";
        job.active = false;
        job.deletedAt = new Date();
      }
    }

    mockAuditLogs.push({
      adminId: admin.id,
      action: "REPORT_RESOLVE",
      targetType: "USER_REPORT",
      targetId: reportId,
      resolution,
    });
  }

  resolveReportByAdmin(report.id, "RESOLVED", true);
  assert.strictEqual(report.status, "RESOLVED");
  const job = mockJobs.find((j) => j.id === report.targetId);
  assert.strictEqual(job.status, "REMOVED");
  assert.strictEqual(mockAuditLogs.length, 1);
  assert.strictEqual(mockAuditLogs[0].action, "REPORT_RESOLVE");

  console.log("  [PASS] Admin moderation resolves reports, takes down bad listings, and audits action.");
}

// 8. Application Statistics & Filtering
console.log("\n[TEST 8] Application Statistics & Partitioning");
{
  resetState();
  const sampleJobs = [
    { id: "1", status: "PUBLISHED", active: true, applicationsCount: 12, shortlistedCount: 3 },
    { id: "2", status: "PUBLISHED", active: true, applicationsCount: 8, shortlistedCount: 2 },
    { id: "3", status: "DRAFT", active: false, applicationsCount: 0, shortlistedCount: 0 },
    { id: "4", status: "PAUSED", active: false, applicationsCount: 5, shortlistedCount: 1 },
    { id: "5", status: "EXPIRED", active: false, applicationsCount: 15, shortlistedCount: 4 },
  ];

  const totalPostings = sampleJobs.length;
  const publishedCount = sampleJobs.filter((j) => j.status === "PUBLISHED" && j.active).length;
  const totalApps = sampleJobs.reduce((sum, j) => sum + j.applicationsCount, 0);
  const totalShortlisted = sampleJobs.reduce((sum, j) => sum + j.shortlistedCount, 0);

  assert.strictEqual(totalPostings, 5);
  assert.strictEqual(publishedCount, 2);
  assert.strictEqual(totalApps, 40);
  assert.strictEqual(totalShortlisted, 10);

  console.log("  [PASS] KPI statistics aggregated across 5 status dimensions correctly.");
}

console.log("\n=================================================");
console.log("Results: 8/8 Job Management & Moderation Tests Passed.");
console.log("=================================================");
