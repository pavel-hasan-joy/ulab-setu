import assert from "assert";

console.log("================================================================================");
console.log("   ULAB SETU — CAREER MENTORSHIP SYSTEM (PHASE 5) AUDIT & TEST SUITE");
console.log("   Admin CRM Integration, Feedback/Ratings, Safety Reports, Audit Logs & Analytics");
console.log("================================================================================\n");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// ------------------------------------------------------------------------------
// Mock Database State & Simulated Engine
// ------------------------------------------------------------------------------

const mockUsers = {
  super_admin: {
    id: "usr_admin_1",
    name: "Admin User",
    email: "admin@ulab.edu.bd",
    role: "ADMIN",
    status: "APPROVED",
  },
  student_1: {
    id: "usr_student_1",
    name: "Arif Khan",
    email: "arif.khan@ulab.edu.bd",
    role: "STUDENT",
    status: "APPROVED",
    department: "CSE",
  },
  student_2: {
    id: "usr_student_2",
    name: "Fatima Noor",
    email: "fatima.noor@ulab.edu.bd",
    role: "STUDENT",
    status: "APPROVED",
    department: "BBA",
  },
  alumni_mentor: {
    id: "usr_alumni_mentor",
    name: "Tanvir Ahmed",
    email: "tanvir.ahmed@ulab.edu.bd",
    role: "ALUMNI",
    status: "APPROVED",
    alumniVerified: true,
    isMentor: true,
    mentorAvailable: true,
    department: "CSE",
    company: "Brain Station 23",
    designation: "Lead Architect",
  },
  faculty_mentor: {
    id: "usr_faculty_mentor",
    name: "Dr. Sajjad Hossain",
    email: "sajjad.hossain@ulab.edu.bd",
    role: "TEACHER",
    status: "APPROVED",
    isMentor: true,
    mentorAvailable: true,
    department: "CSE",
    designation: "Professor",
  },
  unrelated_user: {
    id: "usr_stranger",
    name: "Stranger Danger",
    email: "stranger@ulab.edu.bd",
    role: "STUDENT",
    status: "APPROVED",
  },
};

let dbMentorProfiles = [];
let dbMentorshipRequests = [];
let dbMentorshipRelationships = [];
let dbMentorshipFeedbacks = [];
let dbMentorshipAuditLogs = [];
let dbUserReports = [];
let dbAdminAuditLogs = [];

function resetDb() {
  dbMentorProfiles = [
    {
      id: "prof_alumni",
      userId: mockUsers.alumni_mentor.id,
      isActive: true,
      status: "AVAILABLE",
      careerField: "Software Engineering",
      company: "Brain Station 23",
      position: "Lead Architect",
      department: "CSE",
      expertise: "Full Stack, Microservices, System Design",
      topics: "Career Guidance, Technical Interview",
      skills: "TypeScript, Node.js, Next.js",
      maxMentees: 3,
      averageRating: null,
      totalReviews: 0,
    },
    {
      id: "prof_faculty",
      userId: mockUsers.faculty_mentor.id,
      isActive: true,
      status: "AVAILABLE",
      careerField: "Academia & Research",
      position: "Professor",
      department: "CSE",
      expertise: "Machine Learning, Computer Vision",
      topics: "Research, Higher Studies",
      skills: "Python, PyTorch",
      maxMentees: 2,
      averageRating: null,
      totalReviews: 0,
    },
  ];
  dbMentorshipRequests = [];
  dbMentorshipRelationships = [];
  dbMentorshipFeedbacks = [];
  dbMentorshipAuditLogs = [];
  dbUserReports = [];
  dbAdminAuditLogs = [];
}

// Helper: Log audit trail
function logAudit(actorId, action, targetType, targetId, details) {
  dbMentorshipAuditLogs.push({
    id: `audit_${Date.now()}_${Math.random()}`,
    actorId,
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString(),
  });
}

// ------------------------------------------------------------------------------
// Action Simulations
// ------------------------------------------------------------------------------

function submitFeedbackAction({ callerId, relationshipId, rating, review, isAnonymous }) {
  const rel = dbMentorshipRelationships.find((r) => r.id === relationshipId);
  if (!rel) return { error: "Mentorship relationship not found." };

  if (rel.studentId !== callerId) {
    return { error: "Only the participating student can submit feedback for this mentorship." };
  }

  if (rel.status !== "COMPLETED") {
    return { error: "Feedback can only be submitted after the mentorship session is completed." };
  }

  const existing = dbMentorshipFeedbacks.find((f) => f.relationshipId === relationshipId);
  if (existing) {
    return { error: "Feedback has already been submitted for this mentorship relationship." };
  }

  if (!rating || rating < 1 || rating > 5) {
    return { error: "Rating must be an integer between 1 and 5." };
  }

  const feedback = {
    id: `fb_${Date.now()}`,
    relationshipId,
    studentId: rel.studentId,
    mentorId: rel.mentorId,
    rating: Math.round(rating),
    review: review?.trim() || null,
    isAnonymous: Boolean(isAnonymous),
    status: "PUBLISHED",
    isReported: false,
    createdAt: new Date().toISOString(),
  };
  dbMentorshipFeedbacks.push(feedback);

  // Recalculate average rating
  const mentorFeedbacks = dbMentorshipFeedbacks.filter(
    (f) => f.mentorId === rel.mentorId && f.status === "PUBLISHED"
  );
  const total = mentorFeedbacks.length;
  const avg = Number((mentorFeedbacks.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1));

  const prof = dbMentorProfiles.find((p) => p.userId === rel.mentorId);
  if (prof) {
    prof.averageRating = avg;
    prof.totalReviews = total;
  }

  logAudit(
    callerId,
    "FEEDBACK_SUBMISSION",
    "FEEDBACK",
    feedback.id,
    `Submitted rating: ${rating}/5 for mentor ${rel.mentorId}`
  );

  return { success: true, feedbackId: feedback.id };
}

function moderateFeedbackAction({ adminId, feedbackId, action, note }) {
  const admin = Object.values(mockUsers).find((u) => u.id === adminId && u.role === "ADMIN");
  if (!admin) return { error: "Unauthorized. Admin permission required." };

  const fb = dbMentorshipFeedbacks.find((f) => f.id === feedbackId);
  if (!fb) return { error: "Feedback record not found." };

  if (action === "DELETE") {
    dbMentorshipFeedbacks = dbMentorshipFeedbacks.filter((f) => f.id !== feedbackId);
  } else {
    fb.status = action === "PUBLISH" ? "PUBLISHED" : "HIDDEN";
    fb.adminNotes = note;
    fb.isReported = false;
  }

  // Recalculate rating
  const mentorFeedbacks = dbMentorshipFeedbacks.filter(
    (f) => f.mentorId === fb.mentorId && f.status === "PUBLISHED"
  );
  const total = mentorFeedbacks.length;
  const avg =
    total > 0
      ? Number((mentorFeedbacks.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1))
      : null;

  const prof = dbMentorProfiles.find((p) => p.userId === fb.mentorId);
  if (prof) {
    prof.averageRating = avg;
    prof.totalReviews = total;
  }

  logAudit(adminId, "ADMIN_MODERATION", "FEEDBACK", feedbackId, `Admin moderated feedback: ${action}`);

  return { success: true };
}

function reportMentorshipAction({ reporterId, targetType, targetId, reportedUserId, reason, details }) {
  if (!reason || !details) return { error: "Reason and details are required." };

  const report = {
    id: `rep_${Date.now()}`,
    reporterId,
    reportedUserId: reportedUserId || null,
    targetType: targetType === "FEEDBACK" ? "FEEDBACK" : "MENTORSHIP",
    targetId,
    reason,
    details,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };
  dbUserReports.push(report);

  if (targetType === "FEEDBACK") {
    const fb = dbMentorshipFeedbacks.find((f) => f.id === targetId);
    if (fb) fb.isReported = true;
  }

  logAudit(reporterId, "REPORT_SUBMISSION", targetType, targetId, `Report filed: ${reason}`);

  return { success: true, reportId: report.id };
}

function adminToggleMentorStatusAction({ adminId, mentorUserId, isActive }) {
  const admin = Object.values(mockUsers).find((u) => u.id === adminId && u.role === "ADMIN");
  if (!admin) return { error: "Unauthorized. Admin permission required." };

  const user = Object.values(mockUsers).find((u) => u.id === mentorUserId);
  if (!user) return { error: "Mentor user not found." };

  user.isMentor = isActive;
  user.mentorAvailable = isActive;

  const prof = dbMentorProfiles.find((p) => p.userId === mentorUserId);
  if (prof) {
    prof.isActive = isActive;
    prof.status = isActive ? "AVAILABLE" : "TEMPORARILY_UNAVAILABLE";
  }

  logAudit(
    adminId,
    "ADMIN_MODERATION",
    "MENTOR_PROFILE",
    mentorUserId,
    `Admin toggled mentor isActive to ${isActive}`
  );

  return { success: true };
}

function getAdminMentorshipData() {
  const totalMentors = Object.values(mockUsers).filter((u) => u.isMentor).length;
  const activeAlumniMentors = Object.values(mockUsers).filter((u) => u.isMentor && u.role === "ALUMNI").length;
  const activeFacultyMentors = Object.values(mockUsers).filter((u) => u.isMentor && u.role === "TEACHER").length;
  const availableMentors = Object.values(mockUsers).filter((u) => u.isMentor && u.mentorAvailable).length;
  const fullyBookedMentors = dbMentorProfiles.filter((p) => p.status === "FULLY_BOOKED").length;

  const totalRequests = dbMentorshipRequests.length;
  const pendingRequests = dbMentorshipRequests.filter((r) => r.status === "PENDING").length;
  const acceptedRequests = dbMentorshipRequests.filter((r) => r.status === "ACCEPTED" || r.status === "SCHEDULED").length;
  const activeRelationships = dbMentorshipRelationships.filter((r) => r.status === "ACTIVE").length;
  const completedMentorships = dbMentorshipRequests.filter((r) => r.status === "COMPLETED").length;
  const cancelledMentorships = dbMentorshipRequests.filter((r) => r.status === "CANCELLED" || r.status === "DECLINED").length;

  return {
    kpis: {
      totalMentors,
      activeAlumniMentors,
      activeFacultyMentors,
      availableMentors,
      fullyBookedMentors,
      totalRequests,
      pendingRequests,
      acceptedRequests,
      activeRelationships,
      completedMentorships,
      cancelledMentorships,
    },
    mentors: dbMentorProfiles.map((p) => {
      const u = Object.values(mockUsers).find((user) => user.id === p.userId);
      return { ...p, name: u.name, role: u.role, email: u.email, department: u.department };
    }),
    requests: dbMentorshipRequests,
    feedbacks: dbMentorshipFeedbacks,
    auditLogs: dbMentorshipAuditLogs,
    reports: dbUserReports,
  };
}

// ------------------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------------------

resetDb();

// Test 1: Real Database-Driven Stats & Aggregations
runTest("1. Admin Mentorship Dashboard Real Statistics Calculation", () => {
  // Add 1 pending, 1 accepted, 1 completed request
  dbMentorshipRequests.push({
    id: "req_1",
    studentId: mockUsers.student_1.id,
    mentorId: mockUsers.alumni_mentor.id,
    topic: "Career Guidance",
    status: "PENDING",
  });
  dbMentorshipRequests.push({
    id: "req_2",
    studentId: mockUsers.student_2.id,
    mentorId: mockUsers.alumni_mentor.id,
    topic: "Technical Interview",
    status: "ACCEPTED",
  });
  dbMentorshipRelationships.push({
    id: "rel_2",
    requestId: "req_2",
    studentId: mockUsers.student_2.id,
    mentorId: mockUsers.alumni_mentor.id,
    status: "ACTIVE",
  });
  dbMentorshipRequests.push({
    id: "req_3",
    studentId: mockUsers.student_1.id,
    mentorId: mockUsers.faculty_mentor.id,
    topic: "Higher Studies",
    status: "COMPLETED",
  });
  dbMentorshipRelationships.push({
    id: "rel_3",
    requestId: "req_3",
    studentId: mockUsers.student_1.id,
    mentorId: mockUsers.faculty_mentor.id,
    status: "COMPLETED",
  });

  const dashboard = getAdminMentorshipData();
  assert.strictEqual(dashboard.kpis.totalMentors, 2);
  assert.strictEqual(dashboard.kpis.activeAlumniMentors, 1);
  assert.strictEqual(dashboard.kpis.activeFacultyMentors, 1);
  assert.strictEqual(dashboard.kpis.totalRequests, 3);
  assert.strictEqual(dashboard.kpis.pendingRequests, 1);
  assert.strictEqual(dashboard.kpis.acceptedRequests, 1);
  assert.strictEqual(dashboard.kpis.activeRelationships, 1);
  assert.strictEqual(dashboard.kpis.completedMentorships, 1);
  assert.strictEqual(dashboard.kpis.cancelledMentorships, 0);
});

// Test 2: Mentor Search & Filter Integrity
runTest("2. Mentor Search, Role & Department Filter Verification", () => {
  const dashboard = getAdminMentorshipData();
  const searchMatch = dashboard.mentors.filter((m) =>
    m.name.toLowerCase().includes("tanvir") || m.expertise.toLowerCase().includes("microservices")
  );
  assert.strictEqual(searchMatch.length, 1);
  assert.strictEqual(searchMatch[0].name, "Tanvir Ahmed");

  const facultyFilter = dashboard.mentors.filter((m) => m.role === "TEACHER");
  assert.strictEqual(facultyFilter.length, 1);
  assert.strictEqual(facultyFilter[0].name, "Dr. Sajjad Hossain");
});

// Test 3: Admin Mentor Moderation Status Toggle
runTest("3. Admin Moderation Status Toggle for Policy/Security Violations", () => {
  const toggleRes = adminToggleMentorStatusAction({
    adminId: mockUsers.super_admin.id,
    mentorUserId: mockUsers.alumni_mentor.id,
    isActive: false,
  });
  assert.ok(toggleRes.success);

  const prof = dbMentorProfiles.find((p) => p.userId === mockUsers.alumni_mentor.id);
  assert.strictEqual(prof.isActive, false);
  assert.strictEqual(prof.status, "TEMPORARILY_UNAVAILABLE");

  // Re-enable
  adminToggleMentorStatusAction({
    adminId: mockUsers.super_admin.id,
    mentorUserId: mockUsers.alumni_mentor.id,
    isActive: true,
  });
  assert.strictEqual(prof.isActive, true);
  assert.strictEqual(prof.status, "AVAILABLE");
});

// Test 4: Feedback & Rating System Constraints
runTest("4. Mentorship Feedback Submission, 1-5 Scale & Duplicate Guard", () => {
  // Completed relationship "rel_3"
  const feedbackRes = submitFeedbackAction({
    callerId: mockUsers.student_1.id,
    relationshipId: "rel_3",
    rating: 5,
    review: "Dr. Sajjad was extremely helpful with my thesis roadmap and research ideas!",
    isAnonymous: false,
  });
  assert.ok(feedbackRes.success);
  assert.strictEqual(dbMentorshipFeedbacks.length, 1);

  // Mentor average rating check
  const prof = dbMentorProfiles.find((p) => p.userId === mockUsers.faculty_mentor.id);
  assert.strictEqual(prof.averageRating, 5.0);
  assert.strictEqual(prof.totalReviews, 1);

  // Duplicate submission guard
  const duplicateRes = submitFeedbackAction({
    callerId: mockUsers.student_1.id,
    relationshipId: "rel_3",
    rating: 4,
    review: "Attempting duplicate review",
  });
  assert.ok(duplicateRes.error, "Duplicate review must be rejected");

  // Non-completed relationship guard ("rel_2" is ACTIVE, not completed)
  const activeReviewRes = submitFeedbackAction({
    callerId: mockUsers.student_2.id,
    relationshipId: "rel_2",
    rating: 5,
    review: "Premature review",
  });
  assert.ok(activeReviewRes.error, "Reviewing an incomplete relationship must be blocked");

  // Unauthorized user guard
  const strangerReviewRes = submitFeedbackAction({
    callerId: mockUsers.unrelated_user.id,
    relationshipId: "rel_3",
    rating: 1,
    review: "I am a stranger",
  });
  assert.ok(strangerReviewRes.error, "Non-participating user must be blocked");
});

// Test 5: Admin Feedback Moderation
runTest("5. Admin Feedback Moderation (Hide, Publish, Recalculate Rating)", () => {
  const fb = dbMentorshipFeedbacks[0];

  // Admin hides feedback
  const hideRes = moderateFeedbackAction({
    adminId: mockUsers.super_admin.id,
    feedbackId: fb.id,
    action: "HIDE",
    note: "Violates comment guidelines",
  });
  assert.ok(hideRes.success);
  assert.strictEqual(fb.status, "HIDDEN");

  // Rating should drop to null/0 since the only review is hidden
  let prof = dbMentorProfiles.find((p) => p.userId === mockUsers.faculty_mentor.id);
  assert.strictEqual(prof.averageRating, null);
  assert.strictEqual(prof.totalReviews, 0);

  // Admin re-publishes feedback
  moderateFeedbackAction({
    adminId: mockUsers.super_admin.id,
    feedbackId: fb.id,
    action: "PUBLISH",
  });
  assert.strictEqual(fb.status, "PUBLISHED");
  prof = dbMentorProfiles.find((p) => p.userId === mockUsers.faculty_mentor.id);
  assert.strictEqual(prof.averageRating, 5.0);
  assert.strictEqual(prof.totalReviews, 1);
});

// Test 6: Safety Reporting System
runTest("6. Mentorship Reporting System (Student & Mentor Safety)", () => {
  const repRes = reportMentorshipAction({
    reporterId: mockUsers.student_1.id,
    targetType: "MENTOR",
    targetId: mockUsers.alumni_mentor.id,
    reportedUserId: mockUsers.alumni_mentor.id,
    reason: "UNPROFESSIONAL",
    details: "Mentor did not show up to scheduled Google Meet session without notice.",
  });
  assert.ok(repRes.success);
  assert.strictEqual(dbUserReports.length, 1);
  assert.strictEqual(dbUserReports[0].targetType, "MENTORSHIP");
  assert.strictEqual(dbUserReports[0].status, "PENDING");
});

// Test 7: Traceable Audit Trail
runTest("7. Traceable Mentorship Audit Log History", () => {
  assert.ok(dbMentorshipAuditLogs.length >= 3, "Audit trail must have recorded actions");
  const actionsRecorded = dbMentorshipAuditLogs.map((l) => l.action);
  assert.ok(actionsRecorded.includes("FEEDBACK_SUBMISSION"), "Feedback submission must be audited");
  assert.ok(actionsRecorded.includes("ADMIN_MODERATION"), "Admin moderation must be audited");
  assert.ok(actionsRecorded.includes("REPORT_SUBMISSION"), "Report submission must be audited");

  for (const log of dbMentorshipAuditLogs) {
    assert.ok(log.actorId, "Every log must have an actorId");
    assert.ok(log.createdAt, "Every log must have a timestamp");
  }
});

// Test 8: Security & Non-Admin Rejection
runTest("8. Non-Admin Security Boundary Rejection", () => {
  const unauthorizedToggle = adminToggleMentorStatusAction({
    adminId: mockUsers.student_1.id,
    mentorUserId: mockUsers.alumni_mentor.id,
    isActive: false,
  });
  assert.ok(unauthorizedToggle.error, "Student must not be allowed to moderate mentors");

  const unauthorizedMod = moderateFeedbackAction({
    adminId: mockUsers.student_2.id,
    feedbackId: dbMentorshipFeedbacks[0].id,
    action: "DELETE",
  });
  assert.ok(unauthorizedMod.error, "Student must not be allowed to moderate reviews");
});

console.log("\n--------------------------------------------------------------------------------");
console.log(`Phase 5 Admin Mentorship CRM Verification Results: ${passed}/${total} passed`);
console.log("--------------------------------------------------------------------------------\n");

if (passed === total) {
  console.log(">>> ALL CAREER MENTORSHIP PHASE 5 TESTS PASSED SUCCESSFULLY! <<<\n");
  process.exit(0);
} else {
  console.error(">>> SOME TESTS FAILED! <<<\n");
  process.exit(1);
}

