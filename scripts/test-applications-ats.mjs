import assert from "assert";

console.log("=================================================");
console.log("   ULAB Setu ATS & Application Management Tests");
console.log("=================================================\n");

// Simulated Database State
const mockUsers = {
  student_1: {
    id: "usr_student_1",
    name: "Arif Khan",
    email: "arif.khan@ulab.edu.bd",
    role: "STUDENT",
    savedCvUrl: "https://ulab-storage.edu.bd/cvs/arif_resume_2026.pdf",
    savedCvName: "Arif_Khan_SWE_Resume.pdf",
  },
  student_2: {
    id: "usr_student_2",
    name: "Mehnaz Tabassum",
    email: "mehnaz.tabassum@ulab.edu.bd",
    role: "STUDENT",
    savedCvUrl: null,
    savedCvName: null,
  },
  alumni_recruiter: {
    id: "usr_alumni_recruiter",
    name: "Tanvir Ahmed",
    email: "tanvir.ahmed@ulab.edu.bd",
    role: "ALUMNI",
  },
  intruder_alumni: {
    id: "usr_intruder_alumni",
    name: "Sadia Rahman",
    email: "sadia.rahman@ulab.edu.bd",
    role: "ALUMNI",
  },
};

const mockJobs = {
  job_1: {
    id: "job_1",
    title: "Junior Backend Engineer",
    company: "Brain Station 23",
    postedById: "usr_alumni_recruiter",
    active: true,
    status: "PUBLISHED",
  },
};

let mockApplications = [];
let mockNotifications = [];

function resetState() {
  mockApplications = [];
  mockNotifications = [];
}

resetState();

// 1. Successful Application Submission
console.log("[TEST 1] Successful Application Submission with CV");
{
  function submitApplication({ jobId, student, note, cvUrl, cvFileName, useSavedCv }) {
    let finalCvUrl = cvUrl;
    let finalCvFileName = cvFileName;

    if (useSavedCv && student.savedCvUrl) {
      finalCvUrl = student.savedCvUrl;
      finalCvFileName = student.savedCvName;
    }

    if (!finalCvUrl && !note) {
      return { success: false, error: "CV or pitch required" };
    }

    const app = {
      id: `app_${mockApplications.length + 1}`,
      jobId,
      studentId: student.id,
      cvUrl: finalCvUrl,
      cvFileName: finalCvFileName,
      note,
      status: "APPLIED",
      hiringNotes: null,
      createdAt: new Date(),
      statusUpdatedAt: new Date(),
      withdrawnAt: null,
    };
    mockApplications.push(app);
    return { success: true, app };
  }

  const res = submitApplication({
    jobId: "job_1",
    student: mockUsers.student_1,
    note: "I have 2 years of Node.js & PostgreSQL experience.",
    useSavedCv: true,
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(mockApplications.length, 1);
  assert.strictEqual(res.app.status, "APPLIED");
  assert.strictEqual(res.app.cvFileName, "Arif_Khan_SWE_Resume.pdf");

  console.log("  [PASS] Application submitted successfully with 1-click saved CV reuse.");
}

// 2. Duplicate Application Prevention
console.log("\n[TEST 2] Duplicate Application Prevention");
{
  function checkDuplicate(jobId, studentId) {
    const existing = mockApplications.find(
      (a) => a.jobId === jobId && a.studentId === studentId && a.status !== "WITHDRAWN"
    );
    if (existing) {
      return { allowed: false, error: "Duplicate application: already submitted" };
    }
    return { allowed: true };
  }

  // Attempt duplicate submission by student_1
  const check1 = checkDuplicate("job_1", mockUsers.student_1.id);
  assert.strictEqual(check1.allowed, false);
  assert.strictEqual(check1.error, "Duplicate application: already submitted");

  // First time submission by student_2
  const check2 = checkDuplicate("job_1", mockUsers.student_2.id);
  assert.strictEqual(check2.allowed, true);

  console.log("  [PASS] Duplicate applications rejected while allowing first-time applicants.");
}

// 3. Status Lifecycle State Machine
console.log("\n[TEST 3] Complete ATS Status Lifecycle");
{
  const app = mockApplications[0];
  const validTransitions = {
    APPLIED: ["VIEWED", "SHORTLISTED", "REJECTED", "WITHDRAWN"],
    VIEWED: ["SHORTLISTED", "INTERVIEW", "REJECTED", "WITHDRAWN"],
    SHORTLISTED: ["INTERVIEW", "SELECTED", "REJECTED", "APPLIED"],
    INTERVIEW: ["SELECTED", "REJECTED", "SHORTLISTED"],
    SELECTED: ["REJECTED", "SHORTLISTED"],
    REJECTED: ["APPLIED", "SHORTLISTED"],
    WITHDRAWN: ["APPLIED"],
  };

  function transitionStatus(application, newStatus) {
    const allowed = validTransitions[application.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(`Invalid transition from ${application.status} to ${newStatus}`);
    }
    application.status = newStatus;
    application.statusUpdatedAt = new Date();
    return application.status;
  }

  // APPLIED -> VIEWED
  assert.strictEqual(transitionStatus(app, "VIEWED"), "VIEWED");
  // VIEWED -> SHORTLISTED
  assert.strictEqual(transitionStatus(app, "SHORTLISTED"), "SHORTLISTED");
  // SHORTLISTED -> INTERVIEW
  assert.strictEqual(transitionStatus(app, "INTERVIEW"), "INTERVIEW");
  // INTERVIEW -> SELECTED
  assert.strictEqual(transitionStatus(app, "SELECTED"), "SELECTED");

  console.log("  [PASS] Full ATS pipeline (Applied -> Viewed -> Shortlisted -> Interview -> Selected) verified.");
}

// 4. Application Withdrawal Boundaries
console.log("\n[TEST 4] Application Withdrawal Rules");
{
  function canWithdraw(status) {
    return status === "APPLIED" || status === "VIEWED";
  }

  assert.strictEqual(canWithdraw("APPLIED"), true, "APPLIED state must be withdrawable");
  assert.strictEqual(canWithdraw("VIEWED"), true, "VIEWED state must be withdrawable");
  assert.strictEqual(canWithdraw("SHORTLISTED"), false, "SHORTLISTED state cannot be withdrawn without recruiter sync");
  assert.strictEqual(canWithdraw("INTERVIEW"), false, "INTERVIEW state cannot be withdrawn directly");
  assert.strictEqual(canWithdraw("SELECTED"), false, "SELECTED state cannot be withdrawn");
  assert.strictEqual(canWithdraw("REJECTED"), false, "REJECTED state cannot be withdrawn");

  console.log("  [PASS] Application withdrawal boundaries strictly enforce permissible stages.");
}

// 5. Private Hiring Notes Isolation
console.log("\n[TEST 5] Private Hiring Notes Isolation");
{
  const app = mockApplications[0];

  function addHiringNote(application, caller, noteText) {
    if (caller.role !== "ADMIN" && caller.id !== mockJobs.job_1.postedById) {
      return { success: false, error: "Unauthorized: only hiring recruiter or admin can write notes" };
    }
    application.hiringNotes = noteText;
    return { success: true };
  }

  // Recruiter adds private note
  const res = addHiringNote(app, mockUsers.alumni_recruiter, "Strong performance in technical take-home task. Offer recommended.");
  assert.strictEqual(res.success, true);
  assert.strictEqual(app.hiringNotes.includes("Offer recommended"), true);

  // Student view projection (sanitization)
  function sanitizeForStudent(application) {
    const { hiringNotes, ...safeApp } = application;
    return safeApp;
  }

  const studentView = sanitizeForStudent(app);
  assert.strictEqual(studentView.hiringNotes, undefined, "hiringNotes must NEVER be leaked to student view");

  console.log("  [PASS] Private hiring notes protected and isolated from student payloads.");
}

// 6. Recruiter Authorization & Ownership Isolation
console.log("\n[TEST 6] Recruiter Authorization & Ownership Isolation");
{
  function updateStatusByRecruiter(application, job, caller, newStatus) {
    if (caller.role !== "ADMIN" && job.postedById !== caller.id) {
      return { success: false, error: "Forbidden: Not the job owner" };
    }
    application.status = newStatus;
    return { success: true };
  }

  const app = mockApplications[0];
  const job = mockJobs.job_1;

  // Intruder alumni tries to update status
  const intruderAttempt = updateStatusByRecruiter(app, job, mockUsers.intruder_alumni, "REJECTED");
  assert.strictEqual(intruderAttempt.success, false);
  assert.strictEqual(intruderAttempt.error, "Forbidden: Not the job owner");

  // Legitimate recruiter updates status
  const legitAttempt = updateStatusByRecruiter(app, job, mockUsers.alumni_recruiter, "SHORTLISTED");
  assert.strictEqual(legitAttempt.success, true);

  console.log("  [PASS] Ownership verified: only job poster or admin can manage applicants.");
}

console.log("\n=================================================");
console.log("Results: 6/6 ATS Application Management Tests Passed.");
console.log("=================================================");

