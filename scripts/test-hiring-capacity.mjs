import assert from "assert";
import {
  isJobAcceptingApplications,
  syncJobCapacityStatus,
  JOB_STATUS_LABELS,
  FULL_CAPACITY_NOTIFICATION_BODY,
  REOPENED_NOTIFICATION_BODY,
} from "../src/lib/jobs.ts";

console.log("================================================================================");
console.log("   ULAB Setu: Hiring Capacity & Automatic Job Visibility Test Suite");
console.log("================================================================================\n");

// Simulated Database Storage & Engine
let mockJobs = [];
let mockApplications = [];
let mockNotifications = [];
let lockMutex = false;

function resetDb() {
  mockJobs = [];
  mockApplications = [];
  mockNotifications = [];
  lockMutex = false;
}

resetDb();

const mockTx = {
  job: {
    findUnique: async ({ where }) => {
      const j = mockJobs.find((item) => item.id === where.id);
      return j ? { ...j } : null;
    },
    update: async ({ where, data }) => {
      const idx = mockJobs.findIndex((item) => item.id === where.id);
      if (idx === -1) throw new Error("Job not found");
      const current = mockJobs[idx];
      const updated = {
        ...current,
        ...data,
        capacityFilledEvents: data.capacityFilledEvents?.increment
          ? (current.capacityFilledEvents || 0) + data.capacityFilledEvents.increment
          : (data.capacityFilledEvents ?? current.capacityFilledEvents ?? 0),
      };
      mockJobs[idx] = updated;
      return { ...updated };
    },
    findMany: async ({ where }) => {
      return mockJobs.filter((j) => {
        if (where.active !== undefined && j.active !== where.active) return false;
        if (where.status && j.status !== where.status) return false;
        if (where.id && j.id !== where.id) return false;
        return true;
      });
    },
  },
  application: {
    findUnique: async ({ where }) => {
      const a = mockApplications.find((item) => item.id === where.id);
      if (!a) return null;
      const j = mockJobs.find((job) => job.id === a.jobId);
      return { ...a, job: j ? { ...j } : null };
    },
    findFirst: async ({ where }) => {
      const a = mockApplications.find((item) => item.id === where.id);
      if (!a) return null;
      const j = mockJobs.find((job) => job.id === a.jobId);
      return { ...a, job: j ? { ...j } : null };
    },
    count: async ({ where }) => {
      return mockApplications.filter((a) => {
        if (where.jobId && a.jobId !== where.jobId) return false;
        if (where.status && a.status !== where.status) return false;
        if (where.id?.not && a.id === where.id.not) return false;
        return true;
      }).length;
    },
    findMany: async ({ where }) => {
      return mockApplications.filter((a) => {
        if (where.jobId && a.jobId !== where.jobId) return false;
        if (where.status?.in && !where.status.in.includes(a.status)) return false;
        return true;
      });
    },
    update: async ({ where, data }) => {
      const idx = mockApplications.findIndex((item) => item.id === where.id);
      if (idx === -1) throw new Error("Application not found");
      mockApplications[idx] = { ...mockApplications[idx], ...data };
      return { ...mockApplications[idx] };
    },
    create: async ({ data }) => {
      const newApp = { id: `app_${mockApplications.length + 1}`, ...data, createdAt: new Date() };
      mockApplications.push(newApp);
      return { ...newApp };
    },
  },
  notification: {
    create: async ({ data }) => {
      const notif = { id: `notif_${mockNotifications.length + 1}`, ...data, createdAt: new Date() };
      mockNotifications.push(notif);
      return { ...notif };
    },
    findMany: async ({ where }) => {
      return mockNotifications.filter((n) => {
        if (where.userId && n.userId !== where.userId) return false;
        return true;
      });
    },
  },
};

// Transaction wrapper with concurrency mutual exclusion simulation
async function runTransaction(callback) {
  // If lockMutex is true, simulate atomic check
  while (lockMutex) {
    await new Promise((r) => setTimeout(r, 10));
  }
  lockMutex = true;
  try {
    return await callback(mockTx);
  } finally {
    lockMutex = false;
  }
}

// Simulated setApplicationStatus from src/app/actions/jobs.ts
async function setApplicationStatusMock(applicationId, newStatus, actorId = "usr_recruiter_01") {
  return await runTransaction(async (tx) => {
    const app = await tx.application.findFirst({
      where: { id: applicationId },
    });
    if (!app) return { error: "Application not found or unauthorized" };

    if (newStatus === "INTERVIEW" && app.status === "REJECTED") {
      return { error: "Cannot schedule an interview for a rejected applicant. Please reopen the application first." };
    }

    if (newStatus === "SELECTED" && app.status !== "SELECTED") {
      if (app.job.hiringCapacity && app.job.hiringCapacity > 0) {
        const curCount = await tx.application.count({
          where: { jobId: app.job.id, status: "SELECTED", id: { not: applicationId } },
        });
        if (curCount >= app.job.hiringCapacity) {
          return {
            error: `Hiring capacity reached! This position has ${app.job.hiringCapacity} opening(s), all of which are already selected.`,
          };
        }
      }
    }

    await tx.application.update({
      where: { id: applicationId },
      data: { status: newStatus, statusUpdatedAt: new Date() },
    });

    await syncJobCapacityStatus(tx, app.job.id, actorId);
    return { success: true };
  });
}

// Simulated applyToJob from src/app/actions/jobs.ts
async function applyToJobMock(jobId, studentId) {
  const existing = mockApplications.find((a) => a.jobId === jobId && a.studentId === studentId && a.status !== "WITHDRAWN");
  if (existing) {
    return { error: "You have already submitted an application for this job posting." };
  }

  const job = mockJobs.find((j) => j.id === jobId);
  if (!job || !isJobAcceptingApplications(job)) {
    if (job?.status === "FILLED") {
      return { error: "This position has reached its hiring capacity and is no longer accepting new applications." };
    }
    return { error: "This job is no longer open or its deadline has passed." };
  }

  if (job.hiringCapacity && job.hiringCapacity > 0) {
    const curCount = mockApplications.filter((a) => a.jobId === jobId && a.status === "SELECTED").length;
    if (curCount >= job.hiringCapacity) {
      return { error: "This position has reached its hiring capacity and is no longer accepting new applications." };
    }
  }

  const newApp = {
    id: `app_${mockApplications.length + 1}`,
    jobId,
    studentId,
    status: "APPLIED",
    createdAt: new Date(),
  };
  mockApplications.push(newApp);
  return { success: true, application: newApp };
}

async function runTestSuite() {
  // [SCENARIO 1]: Job with hiring capacity of 3
  console.log("[SCENARIO 1] Creating Job with Hiring Capacity = 3");
  const job1 = {
    id: "job_fullstack_01",
    title: "Senior Full-Stack Developer",
    company: "Apex Bangladesh",
    hiringCapacity: 3,
    status: "PUBLISHED",
    active: true,
    deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days in future
    capacityFilledEvents: 0,
    postedById: "usr_recruiter_01",
  };
  mockJobs.push(job1);

  assert.strictEqual(job1.hiringCapacity, 3);
  assert.strictEqual(job1.status, "PUBLISHED");
  assert.strictEqual(isJobAcceptingApplications(job1), true);
  console.log("  [PASS] Job successfully configured with capacity of 3.\n");

  // Create 4 applications from 4 different students
  const app1 = (await applyToJobMock(job1.id, "student_01")).application;
  const app2 = (await applyToJobMock(job1.id, "student_02")).application;
  const app3 = (await applyToJobMock(job1.id, "student_03")).application;
  const app4 = (await applyToJobMock(job1.id, "student_04")).application;

  // [SCENARIO 2]: Select one applicant
  console.log("[SCENARIO 2] Select One Applicant (Candidate 1)");
  const res1 = await setApplicationStatusMock(app1.id, "SELECTED");
  assert.strictEqual(res1.success, true);
  let updatedJob = mockJobs.find((j) => j.id === job1.id);
  let selectedCount = mockApplications.filter((a) => a.jobId === job1.id && a.status === "SELECTED").length;
  assert.strictEqual(selectedCount, 1);
  assert.strictEqual(updatedJob.status, "PUBLISHED");
  assert.strictEqual(updatedJob.active, true);
  console.log(`  [PASS] Selected ${selectedCount}/3; job remains Published & Active.\n`);

  // [SCENARIO 3]: Select two applicants
  console.log("[SCENARIO 3] Select Two Applicants (Candidate 2)");
  const res2 = await setApplicationStatusMock(app2.id, "SELECTED");
  assert.strictEqual(res2.success, true);
  updatedJob = mockJobs.find((j) => j.id === job1.id);
  selectedCount = mockApplications.filter((a) => a.jobId === job1.id && a.status === "SELECTED").length;
  assert.strictEqual(selectedCount, 2);
  assert.strictEqual(updatedJob.status, "PUBLISHED");
  assert.strictEqual(updatedJob.active, true);
  console.log(`  [PASS] Selected ${selectedCount}/3; job remains Published & Active.\n`);

  // [SCENARIO 4]: Select the third applicant
  console.log("[SCENARIO 4] Select the Third Applicant (Candidate 3)");
  const res3 = await setApplicationStatusMock(app3.id, "SELECTED");
  assert.strictEqual(res3.success, true);
  updatedJob = mockJobs.find((j) => j.id === job1.id);
  selectedCount = mockApplications.filter((a) => a.jobId === job1.id && a.status === "SELECTED").length;
  assert.strictEqual(selectedCount, 3);
  console.log(`  [PASS] Selected ${selectedCount}/3; hiring capacity threshold met.\n`);

  // [SCENARIO 5]: Verify automatic hiding
  console.log("[SCENARIO 5] Verify Automatic Job Hiding at Full Capacity");
  assert.strictEqual(updatedJob.status, "FILLED");
  assert.strictEqual(updatedJob.active, false);
  assert.strictEqual(isJobAcceptingApplications(updatedJob), false);

  // Verify excluded from public search
  const publicList = mockJobs.filter((j) => j.active === true && j.status === "PUBLISHED");
  assert.strictEqual(publicList.some((j) => j.id === job1.id), false);

  // Verify new applicants cannot apply
  const blockedApply = await applyToJobMock(job1.id, "student_05");
  assert.strictEqual(blockedApply.error, "This position has reached its hiring capacity and is no longer accepting new applications.");

  // Verify waitlisted applicant (Candidate 4) received full capacity notification
  const student4Notifs = mockNotifications.filter((n) => n.userId === "student_04");
  assert.strictEqual(student4Notifs.length, 1);
  assert.strictEqual(student4Notifs[0].body, FULL_CAPACITY_NOTIFICATION_BODY);
  console.log("  [PASS] Job automatically hidden (FILLED/inactive), search excluded, new applies blocked, waitlist notified.\n");

  // [SCENARIO 6]: Reject one previously selected applicant
  console.log("[SCENARIO 6] Reject One Previously Selected Applicant (Candidate 2 -> REJECTED)");
  const rejRes = await setApplicationStatusMock(app2.id, "REJECTED");
  assert.strictEqual(rejRes.success, true);
  selectedCount = mockApplications.filter((a) => a.jobId === job1.id && a.status === "SELECTED").length;
  assert.strictEqual(selectedCount, 2);
  console.log(`  [PASS] Slot released; selected count recalculated to ${selectedCount}/3.\n`);

  // [SCENARIO 7]: Verify automatic reopening
  console.log("[SCENARIO 7] Verify Automatic Job Reopening");
  updatedJob = mockJobs.find((j) => j.id === job1.id);
  assert.strictEqual(updatedJob.status, "PUBLISHED");
  assert.strictEqual(updatedJob.active, true);
  assert.strictEqual(isJobAcceptingApplications(updatedJob), true);

  // Verify reopened notification dispatched to Candidate 4
  const reopenedNotifs = mockNotifications.filter((n) => n.userId === "student_04" && n.body === REOPENED_NOTIFICATION_BODY);
  assert.strictEqual(reopenedNotifs.length, 1);
  console.log("  [PASS] Job automatically reopened to PUBLISHED, active: true; candidate received opportunity update.\n");

  // [SCENARIO 8]: Verify another applicant can now apply
  console.log("[SCENARIO 8] Verify Candidate 5 Can Now Apply");
  const newApplyRes = await applyToJobMock(job1.id, "student_05");
  assert.strictEqual(newApplyRes.success, true);
  assert.strictEqual(newApplyRes.application.status, "APPLIED");
  console.log("  [PASS] Candidate 5 successfully applied after reopening.\n");

  // [SCENARIO 9]: Verify no reopening after the deadline
  console.log("[SCENARIO 9] Verify No Reopening After Deadline Passed");
  // Fill it back to 3/3 with Candidate 5
  await setApplicationStatusMock(newApplyRes.application.id, "SELECTED");
  updatedJob = mockJobs.find((j) => j.id === job1.id);
  assert.strictEqual(updatedJob.status, "FILLED");

  // Advance deadline to the past
  updatedJob.deadline = new Date(Date.now() - 24 * 3600 * 1000);

  // Now reject one selected candidate
  await setApplicationStatusMock(newApplyRes.application.id, "REJECTED");
  updatedJob = mockJobs.find((j) => j.id === job1.id);
  assert.strictEqual(updatedJob.status, "EXPIRED");
  assert.strictEqual(updatedJob.active, false);
  assert.strictEqual(isJobAcceptingApplications(updatedJob), false);
  console.log("  [PASS] Expired job remains EXPIRED and inactive when slot is released.\n");

  // Reset deadline to future for remaining checks
  updatedJob.deadline = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  updatedJob.status = "PUBLISHED";
  updatedJob.active = true;

  // [SCENARIO 10]: Verify manually paused jobs never reopen automatically
  console.log("[SCENARIO 10] Verify Manually Paused Jobs Never Reopen Automatically");
  updatedJob.status = "PAUSED";
  updatedJob.active = false;

  // Reject Candidate 1
  await setApplicationStatusMock(app1.id, "REJECTED");
  updatedJob = mockJobs.find((j) => j.id === job1.id);
  assert.strictEqual(updatedJob.status, "PAUSED");
  assert.strictEqual(updatedJob.active, false);
  console.log("  [PASS] Manually PAUSED jobs never automatically reopen.\n");

  // [SCENARIO 11]: Test simultaneous applicant selection (race condition safety)
  console.log("[SCENARIO 11] Testing Simultaneous Applicant Selection Concurrency");
  const raceJob = {
    id: "job_race_01",
    title: "Solo Security Architect",
    company: "ULAB Cyber",
    hiringCapacity: 1, // Only 1 spot available!
    status: "PUBLISHED",
    active: true,
    capacityFilledEvents: 0,
    postedById: "usr_recruiter_01",
  };
  mockJobs.push(raceJob);

  const candA = (await applyToJobMock(raceJob.id, "cand_A")).application;
  const candB = (await applyToJobMock(raceJob.id, "cand_B")).application;

  // Simulate two concurrent recruiters selecting candA and candB at the exact same millisecond
  const [selectA, selectB] = await Promise.all([
    setApplicationStatusMock(candA.id, "SELECTED"),
    setApplicationStatusMock(candB.id, "SELECTED"),
  ]);

  const outcomes = [selectA, selectB];
  const successCount = outcomes.filter((o) => o.success === true).length;
  const errorCount = outcomes.filter((o) => o.error && o.error.includes("Hiring capacity reached")).length;

  assert.strictEqual(successCount, 1);
  assert.strictEqual(errorCount, 1);
  const raceSelected = mockApplications.filter((a) => a.jobId === raceJob.id && a.status === "SELECTED").length;
  assert.strictEqual(raceSelected, 1);
  console.log("  [PASS] Concurrency lock strictly prevented exceeding hiring capacity (1 success, 1 rejected).\n");

  // [SCENARIO 12]: Verify notification deduplication
  console.log("[SCENARIO 12] Verify Notification Deduplication");
  const initialEvents = (mockJobs.find((j) => j.id === raceJob.id)).capacityFilledEvents;
  assert.strictEqual(initialEvents, 1);

  // Calling syncJobCapacityStatus again on already filled job
  await syncJobCapacityStatus(mockTx, raceJob.id, "usr_recruiter_01");
  const subsequentEvents = (mockJobs.find((j) => j.id === raceJob.id)).capacityFilledEvents;
  assert.strictEqual(subsequentEvents, 1);
  console.log("  [PASS] Notification deduplication verified; duplicate capacity events are prevented.\n");

  // [SCENARIO 13]: Verify existing jobs and applications remain intact
  console.log("[SCENARIO 13] Verify Legacy Jobs (hiringCapacity: null) Remain Intact");
  const legacyJob = {
    id: "job_legacy_01",
    title: "General Software Engineer",
    company: "Legacy Tech",
    hiringCapacity: null, // Legacy unconfigured capacity
    status: "PUBLISHED",
    active: true,
    postedById: "usr_recruiter_01",
  };
  mockJobs.push(legacyJob);

  assert.strictEqual(legacyJob.hiringCapacity, null);
  assert.strictEqual(isJobAcceptingApplications(legacyJob), true);

  const legApp1 = (await applyToJobMock(legacyJob.id, "cand_leg_1")).application;
  const legApp2 = (await applyToJobMock(legacyJob.id, "cand_leg_2")).application;

  await setApplicationStatusMock(legApp1.id, "SELECTED");
  await setApplicationStatusMock(legApp2.id, "SELECTED");

  const legJobUpdated = mockJobs.find((j) => j.id === legacyJob.id);
  assert.strictEqual(legJobUpdated.status, "PUBLISHED");
  assert.strictEqual(legJobUpdated.active, true);
  console.log("  [PASS] Legacy jobs without configured limit continue working with unrestricted selection.\n");

  console.log("================================================================================");
  console.log("   Results: All 13/13 Hiring Capacity Scenarios Passed (100%)");
  console.log("================================================================================\n");
}

runTestSuite().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
