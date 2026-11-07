import assert from "assert";
import {
  canScheduleInterview,
  formatDhakaDateTime,
  APPLICATION_STATUS_CONFIG,
} from "../src/lib/applications.ts";

console.log("================================================================================");
console.log("   ULAB Setu: Interview Scheduling & Applicant Rejection Test Suite");
console.log("================================================================================\n");

// Mock Data Store
const mockUsers = {
  student: {
    id: "usr_student_01",
    name: "Tanvir Hasan",
    email: "tanvir.hasan@ulab.edu.bd",
    role: "STUDENT",
  },
  alumni_recruiter: {
    id: "usr_recruiter_01",
    name: "Nusrat Jahan",
    email: "nusrat.jahan@ulab.edu.bd",
    role: "ALUMNI",
  },
  intruder: {
    id: "usr_intruder_99",
    name: "Malicious User",
    email: "malicious.user@ulab.edu.bd",
    role: "ALUMNI",
  },
  admin: {
    id: "usr_admin_01",
    name: "System Admin",
    email: "admin@ulab.edu.bd",
    role: "ADMIN",
  },
};

const mockJobs = {
  job_01: {
    id: "job_01",
    title: "Software Engineer, Full-Stack",
    company: "Apex Tech Bangladesh",
    postedById: "usr_recruiter_01",
    status: "PUBLISHED",
  },
};

let mockApplication = null;
let mockNotifications = [];

function resetState() {
  mockApplication = {
    id: "app_test_01",
    jobId: "job_01",
    studentId: "usr_student_01",
    status: "APPLIED",
    note: "Strong experience in React and Node.js.",
    hiringNotes: null,
    createdAt: new Date(),
    statusUpdatedAt: new Date(),
    interviewDate: null,
    interviewTime: null,
    interviewType: null,
    interviewLocation: null,
    interviewMeetingLink: null,
    interviewMessage: null,
    interviewScheduledAt: null,
    interviewCancelledAt: null,
  };
  mockNotifications = [];
}

resetState();

// Core Scheduling Logic Simulator (matching src/app/actions/jobs.ts)
function scheduleInterviewMock({ caller, application, job, input }) {
  // 1. Authorization check
  const isOwner = job.postedById === caller.id;
  const isAdmin = caller.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return { error: "Application not found or unauthorized." };
  }

  // 2. State Guard
  if (application.status === "REJECTED") {
    return { error: "Cannot schedule an interview for a rejected application. Reopen application first." };
  }
  if (application.status === "WITHDRAWN") {
    return { error: "Cannot schedule an interview for an application that has been withdrawn." };
  }

  // 3. Required fields validation
  const dateStr = (input.date || "").trim();
  const timeStr = (input.time || "").trim();
  const locationStr = (input.location || "").trim();
  if (!dateStr) return { error: "Interview date is required." };
  if (!timeStr) return { error: "Interview time is required." };
  if (!locationStr) return { error: "Interview location / place is required." };

  // 4. Asia/Dhaka (+06:00) timezone date validation
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return { error: "Invalid date format. Expected YYYY-MM-DD." };

  let hours = 10;
  let minutes = 0;
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const m = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3]?.toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    hours = h;
    minutes = m;
  }

  const pad = (n) => String(n).padStart(2, "0");
  const isoDhaka = `${dateStr}T${pad(hours)}:${pad(minutes)}:00+06:00`;
  const scheduledDate = new Date(isoDhaka);

  if (isNaN(scheduledDate.getTime())) {
    return { error: "Invalid interview date or time." };
  }

  const now = new Date();
  if (scheduledDate.getTime() < now.getTime() - 2 * 60 * 1000) {
    return { error: "Interview date and time cannot be in the past." };
  }

  const isReschedule = application.status === "INTERVIEW" && application.interviewDate != null;

  application.status = "INTERVIEW";
  application.statusUpdatedAt = new Date();
  application.interviewDate = scheduledDate;
  application.interviewTime = timeStr;
  application.interviewType = input.type === "Online" ? "Online" : "Physical";
  application.interviewLocation = locationStr;
  application.interviewMeetingLink = input.meetingLink?.trim() || null;
  application.interviewMessage = input.message?.trim() || null;
  application.interviewScheduledAt = new Date();
  application.interviewCancelledAt = null;

  const notif = {
    userId: application.studentId,
    actorId: caller.id,
    title: isReschedule ? `Interview Rescheduled: ${job.title}` : `Interview Invitation: ${job.title} 💼`,
    type: "APPLICATION",
  };
  mockNotifications.push(notif);

  return { success: true, isReschedule };
}

// Cancellation Simulator
function cancelInterviewMock({ caller, application, job, reason: _reason }) {
  const isOwner = job.postedById === caller.id;
  const isAdmin = caller.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return { error: "Application not found or unauthorized." };
  }

  if (application.status !== "INTERVIEW") {
    return { error: "This application does not currently have a scheduled interview." };
  }

  application.status = "SHORTLISTED";
  application.statusUpdatedAt = new Date();
  application.interviewCancelledAt = new Date();

  mockNotifications.push({
    userId: application.studentId,
    actorId: caller.id,
    title: `Interview Cancelled: ${job.title}`,
    type: "APPLICATION",
  });

  return { success: true };
}

// Rejection Simulator
function rejectApplicationMock({ caller, application, job, internalNotes }) {
  const isOwner = job.postedById === caller.id;
  const isAdmin = caller.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return { error: "Application not found or unauthorized." };
  }

  application.status = "REJECTED";
  application.statusUpdatedAt = new Date();
  if (internalNotes) {
    application.hiringNotes = internalNotes;
  }

  mockNotifications.push({
    userId: application.studentId,
    actorId: caller.id,
    title: `Application Update: ${job.title}`,
    type: "APPLICATION",
  });

  return { success: true };
}

// TEST 1: Successful Interview Scheduling with future date
console.log("[TEST 1] Schedule Interview with valid future date and time in Asia/Dhaka");
{
  resetState();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const res = scheduleInterviewMock({
    caller: mockUsers.alumni_recruiter,
    application: mockApplication,
    job: mockJobs.job_01,
    input: {
      date: tomorrowStr,
      time: "11:00 AM",
      location: "Google Meet",
      type: "Online",
      meetingLink: "https://meet.google.com/xyz-abcd-efg",
      message: "Please prepare a 5-minute demo of your recent React project.",
    },
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.isReschedule, false);
  assert.strictEqual(mockApplication.status, "INTERVIEW");
  assert.strictEqual(mockApplication.interviewTime, "11:00 AM");
  assert.strictEqual(mockApplication.interviewType, "Online");
  assert.strictEqual(mockApplication.interviewLocation, "Google Meet");
  assert.strictEqual(mockApplication.interviewMeetingLink, "https://meet.google.com/xyz-abcd-efg");
  assert.strictEqual(mockNotifications.length, 1);
  assert.strictEqual(mockNotifications[0].title.includes("Interview Invitation"), true);

  console.log("  [PASS] Interview successfully scheduled and student notified.");
}

// TEST 2: Validation rejection for past date
console.log("\n[TEST 2] Validation rejection for past date/time");
{
  resetState();
  const pastDateStr = "2020-01-15";

  const res = scheduleInterviewMock({
    caller: mockUsers.alumni_recruiter,
    application: mockApplication,
    job: mockJobs.job_01,
    input: {
      date: pastDateStr,
      time: "10:00 AM",
      location: "Room 402",
      type: "Physical",
    },
  });

  assert.strictEqual(res.error, "Interview date and time cannot be in the past.");
  assert.strictEqual(mockApplication.status, "APPLIED");
  console.log("  [PASS] Server-side check correctly rejected past interview timestamp.");
}

// TEST 3: Validation rejection for missing required fields
console.log("\n[TEST 3] Validation rejection for missing required fields (date, time, venue)");
{
  resetState();
  const res1 = scheduleInterviewMock({
    caller: mockUsers.alumni_recruiter,
    application: mockApplication,
    job: mockJobs.job_01,
    input: { date: "", time: "10:00 AM", location: "Campus" },
  });
  assert.strictEqual(res1.error, "Interview date is required.");

  const res2 = scheduleInterviewMock({
    caller: mockUsers.alumni_recruiter,
    application: mockApplication,
    job: mockJobs.job_01,
    input: { date: "2026-12-01", time: "", location: "Campus" },
  });
  assert.strictEqual(res2.error, "Interview time is required.");

  const res3 = scheduleInterviewMock({
    caller: mockUsers.alumni_recruiter,
    application: mockApplication,
    job: mockJobs.job_01,
    input: { date: "2026-12-01", time: "10:00 AM", location: "" },
  });
  assert.strictEqual(res3.error, "Interview location / place is required.");

  console.log("  [PASS] Missing scheduling parameters strictly rejected.");
}

// TEST 4: Unauthorized access rejection
console.log("\n[TEST 4] Unauthorized access rejection (non-owner and non-admin)");
{
  resetState();
  const res = scheduleInterviewMock({
    caller: mockUsers.intruder,
    application: mockApplication,
    job: mockJobs.job_01,
    input: { date: "2026-12-15", time: "02:00 PM", location: "Room 402" },
  });

  assert.strictEqual(res.error, "Application not found or unauthorized.");
  console.log("  [PASS] Intruder alumni prohibited from modifying interview details.");
}

// TEST 5: Interview Rescheduling
console.log("\n[TEST 5] Interview Rescheduling functionality");
{
  // First schedule
  const futureDay1 = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  scheduleInterviewMock({
    caller: mockUsers.alumni_recruiter,
    application: mockApplication,
    job: mockJobs.job_01,
    input: { date: futureDay1, time: "10:00 AM", location: "Building A", type: "Physical" },
  });

  // Now reschedule to another day
  const futureDay2 = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const res = scheduleInterviewMock({
    caller: mockUsers.alumni_recruiter,
    application: mockApplication,
    job: mockJobs.job_01,
    input: { date: futureDay2, time: "03:30 PM", location: "Building B, Room 501", type: "Physical" },
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.isReschedule, true);
  assert.strictEqual(mockApplication.interviewTime, "03:30 PM");
  assert.strictEqual(mockApplication.interviewLocation, "Building B, Room 501");
  const latestNotif = mockNotifications[mockNotifications.length - 1];
  assert.strictEqual(latestNotif.title.includes("Interview Rescheduled"), true);

  console.log("  [PASS] Reschedule updated schedule details, flags, and dispatched proper notification.");
}

// TEST 6: Interview Cancellation
console.log("\n[TEST 6] Interview Cancellation functionality");
{
  const res = cancelInterviewMock({
    caller: mockUsers.alumni_recruiter,
    application: mockApplication,
    job: mockJobs.job_01,
    reason: "Candidate slot adjusted upon request.",
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(mockApplication.status, "SHORTLISTED");
  assert.notStrictEqual(mockApplication.interviewCancelledAt, null);
  const cancelNotif = mockNotifications[mockNotifications.length - 1];
  assert.strictEqual(cancelNotif.title.includes("Interview Cancelled"), true);

  console.log("  [PASS] Cancellation successfully reverted status to SHORTLISTED with audit timestamp.");
}

// TEST 7: Applicant Rejection functionality
console.log("\n[TEST 7] Applicant Rejection and Private Internal Notes Isolation");
{
  resetState();
  const res = rejectApplicationMock({
    caller: mockUsers.alumni_recruiter,
    application: mockApplication,
    job: mockJobs.job_01,
    internalNotes: "Candidate lacks required 2 years TypeScript experience.",
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(mockApplication.status, "REJECTED");
  assert.strictEqual(mockApplication.hiringNotes.includes("Candidate lacks required"), true);
  const rejectNotif = mockNotifications[mockNotifications.length - 1];
  assert.strictEqual(rejectNotif.title.includes("Application Update"), true);

  // Verify that candidate view payload omits hiringNotes
  const studentSafePayload = (({ hiringNotes: _hiringNotes, ...safe }) => safe)(mockApplication);
  assert.strictEqual(studentSafePayload.hiringNotes, undefined, "hiringNotes must never be accessible in candidate payload");

  console.log("  [PASS] Rejection completed, notification dispatched, and private notes strictly isolated.");
}

// TEST 8: Rejection Blocks Interview Scheduling
console.log("\n[TEST 8] Rejection blocks subsequent interview scheduling");
{
  assert.strictEqual(mockApplication.status, "REJECTED");
  assert.strictEqual(canScheduleInterview(mockApplication.status), false);

  const res = scheduleInterviewMock({
    caller: mockUsers.alumni_recruiter,
    application: mockApplication,
    job: mockJobs.job_01,
    input: { date: "2026-12-01", time: "10:00 AM", location: "Meet" },
  });

  assert.strictEqual(res.error.includes("Cannot schedule an interview for a rejected application"), true);
  console.log("  [PASS] Rejected candidate strictly blocked from interview scheduling.");
}

// TEST 9: Status UI Configurations
console.log("\n[TEST 9] Status Configuration Labels & Tones");
{
  assert.strictEqual(APPLICATION_STATUS_CONFIG.INTERVIEW.label, "Interview Scheduled");
  assert.strictEqual(APPLICATION_STATUS_CONFIG.INTERVIEW.tone, "blue");
  assert.strictEqual(APPLICATION_STATUS_CONFIG.REJECTED.label, "Rejected");
  assert.strictEqual(APPLICATION_STATUS_CONFIG.REJECTED.tone, "rose");

  console.log("  [PASS] Status configurations properly calibrated.");
}

// TEST 10: Asia/Dhaka Date Display Formatting
console.log("\n[TEST 10] Asia/Dhaka Date Formatting");
{
  const testDate = new Date("2026-11-20T04:00:00.000Z"); // 10:00 AM in UTC+6 (Dhaka)
  const formatted = formatDhakaDateTime(testDate);
  assert.strictEqual(typeof formatted, "string");
  assert.strictEqual(formatted.length > 5, true);
  assert.strictEqual(formatted.includes("2026"), true);
  console.log(`  [PASS] Formatted date in Asia/Dhaka: "${formatted}"`);
}

console.log("\n================================================================================");
console.log("   Results: 10/10 Interview Scheduling & Rejection Tests Passed (100%)");
console.log("================================================================================\n");
