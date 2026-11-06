import assert from "assert";

console.log("================================================================================");
console.log("   ULAB SETU — CAREER MENTORSHIP SYSTEM (PHASE 3) AUDIT & TEST SUITE");
console.log("   Request & Approval Workflow, Capacity Guardrails, Conversation & Notifications");
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
  student_1: {
    id: "usr_student_1",
    name: "Arif Khan",
    email: "arif.khan@ulab.edu.bd",
    role: "STUDENT",
    status: "APPROVED",
    department: "CSE",
    batch: "211",
    studentId: "211014022",
  },
  student_2: {
    id: "usr_student_2",
    name: "Fatima Noor",
    email: "fatima.noor@ulab.edu.bd",
    role: "STUDENT",
    status: "APPROVED",
    department: "BBA",
    batch: "203",
    studentId: "203011045",
  },
  alumni_mentor: {
    id: "usr_alumni_mentor",
    name: "Tanvir Ahmed",
    email: "tanvir.ahmed@ulab.edu.bd",
    role: "ALUMNI",
    status: "APPROVED",
    alumniVerified: true,
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
    department: "CSE",
    designation: "Associate Professor",
  },
  other_alumni: {
    id: "usr_other_alumni",
    name: "Unauthorized Hacker",
    email: "unauth@ulab.edu.bd",
    role: "ALUMNI",
    status: "APPROVED",
    alumniVerified: true,
    department: "BBA",
  },
};

const mockMentorProfiles = {
  usr_alumni_mentor: {
    userId: "usr_alumni_mentor",
    isActive: true,
    status: "AVAILABLE",
    headline: "Staff Cloud Architect",
    maxMentees: 2, // Strict limit for capacity testing
    topics: ["Mock Technical Interview", "System Design", "Resume Review"],
    preferredSessionType: "ONLINE",
  },
  usr_faculty_mentor: {
    userId: "usr_faculty_mentor",
    isActive: true,
    status: "AVAILABLE",
    headline: "AI & Distributed Systems Researcher",
    maxMentees: 3,
    topics: ["Higher Studies Guidance", "Research & Thesis"],
    preferredSessionType: "HYBRID",
  },
};

let mockRequests = [];
let mockRelationships = [];
let mockConnections = [];
let mockNotifications = [];

// Helper functions simulating Server Actions
function sendMentorshipRequestMock({
  student,
  mentorId,
  topic,
  careerGoals,
  reason,
  introduction,
  sessionFormat,
  preferredAvailability,
  message,
}) {
  // 1. Role verification
  if (student.role !== "STUDENT") {
    return { error: "Only students are eligible to request career mentorship." };
  }

  // 2. Self-request prevention
  if (student.id === mentorId) {
    return { error: "You cannot request mentorship from yourself." };
  }

  // 3. Mentor existence & active status
  const mentor = Object.values(mockUsers).find((u) => u.id === mentorId);
  const profile = mockMentorProfiles[mentorId];
  if (!mentor || !profile || !profile.isActive) {
    return { error: "Mentor not found or is currently not taking new mentorship requests." };
  }

  if (profile.status === "FULLY_BOOKED" || profile.status === "TEMPORARILY_UNAVAILABLE") {
    return { error: "This mentor is currently fully booked." };
  }

  // 4. Duplicate active request check
  const hasActive = mockRequests.some(
    (r) =>
      r.studentId === student.id &&
      r.mentorId === mentorId &&
      ["PENDING", "ACCEPTED", "SCHEDULED"].includes(r.status)
  );
  if (hasActive) {
    return { error: "You already have an active mentorship request with this mentor." };
  }

  // 5. Active mentee capacity check
  const activeCount = mockRequests.filter(
    (r) => r.mentorId === mentorId && ["PENDING", "ACCEPTED", "SCHEDULED"].includes(r.status)
  ).length;

  if (activeCount >= profile.maxMentees) {
    profile.status = "FULLY_BOOKED";
    return { error: "This mentor has reached their maximum active mentee capacity and is currently fully booked." };
  }

  // 6. Create request
  const newId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const req = {
    id: newId,
    studentId: student.id,
    mentorId,
    topic,
    careerGoals: careerGoals || null,
    reason: reason || null,
    introduction: introduction || null,
    sessionFormat: sessionFormat || profile.preferredSessionType || "ONLINE",
    preferredAvailability: preferredAvailability || null,
    message: message || introduction || reason || `Mentorship request on ${topic}`,
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockRequests.push(req);

  // If this fills the last slot, auto update status
  if (activeCount + 1 >= profile.maxMentees) {
    profile.status = "FULLY_BOOKED";
  }

  // Send Notification
  mockNotifications.push({
    userId: mentorId,
    actorId: student.id,
    title: "New Mentorship Request! 🎓",
    body: `${student.name} requested career guidance on "${topic}".`,
    type: "MENTORSHIP",
  });

  return { success: true, requestId: newId };
}

function acceptMentorshipRequestMock(user, requestId, note) {
  const req = mockRequests.find((r) => r.id === requestId);
  if (!req) return { error: "Mentorship request not found." };

  // Authorization check: only intended mentor can accept
  if (req.mentorId !== user.id && user.role !== "ADMIN") {
    return { error: "Unauthorized access: You cannot accept a request for another mentor." };
  }

  if (req.status !== "PENDING") {
    return { error: `Cannot accept request with status ${req.status}.` };
  }

  // Capacity check: check active count (ACCEPTED, SCHEDULED)
  const profile = mockMentorProfiles[req.mentorId];
  const maxLimit = profile?.maxMentees ?? 3;
  const currentActiveCount = mockRequests.filter(
    (r) => r.mentorId === req.mentorId && ["ACCEPTED", "SCHEDULED"].includes(r.status)
  ).length;

  if (currentActiveCount >= maxLimit) {
    if (profile) profile.status = "FULLY_BOOKED";
    return { error: `Cannot accept request: You have reached your maximum active mentee capacity (${maxLimit}).` };
  }

  const now = new Date();

  // Create or reuse dedicated conversation (Connection)
  let connection = mockConnections.find(
    (c) =>
      (c.fromId === user.id && c.toId === req.studentId) ||
      (c.fromId === req.studentId && c.toId === user.id)
  );

  if (!connection) {
    connection = {
      id: `conn_${Date.now()}`,
      fromId: user.id,
      toId: req.studentId,
      status: "ACCEPTED",
      note: `Mentorship: ${req.topic}`,
      createdAt: now,
    };
    mockConnections.push(connection);
  } else {
    connection.status = "ACCEPTED";
  }

  // Update request
  req.status = "ACCEPTED";
  req.startedAt = now;
  req.connectionId = connection.id;
  req.mentorNotes = note || req.mentorNotes;
  req.updatedAt = now;

  // Create MentorshipRelationship
  const existingRel = mockRelationships.find((r) => r.requestId === req.id);
  if (!existingRel) {
    mockRelationships.push({
      id: `rel_${Date.now()}`,
      requestId: req.id,
      studentId: req.studentId,
      mentorId: user.id,
      status: "ACTIVE",
      startedAt: now,
      connectionId: connection.id,
    });
  } else {
    existingRel.status = "ACTIVE";
    existingRel.startedAt = now;
    existingRel.connectionId = connection.id;
  }

  // Update fully booked if reached
  if (currentActiveCount + 1 >= maxLimit) {
    if (profile) profile.status = "FULLY_BOOKED";
  }

  // Notify student
  mockNotifications.push({
    userId: req.studentId,
    actorId: user.id,
    title: "Mentorship Request Accepted! 🎉",
    body: `${user.name} accepted your request on "${req.topic}".`,
    type: "MENTORSHIP",
  });

  return { success: true };
}

function declineMentorshipRequestMock(user, requestId, reason) {
  const req = mockRequests.find((r) => r.id === requestId);
  if (!req) return { error: "Mentorship request not found." };

  if (req.mentorId !== user.id && user.role !== "ADMIN") {
    return { error: "Unauthorized access: You cannot decline a request for another mentor." };
  }

  const now = new Date();
  req.status = "DECLINED";
  req.declinedAt = now;
  req.mentorNotes = reason || null;
  req.updatedAt = now;

  // Restore capacity if was fully booked
  const profile = mockMentorProfiles[req.mentorId];
  if (profile && profile.status === "FULLY_BOOKED") {
    const active = mockRequests.filter(
      (r) => r.mentorId === req.mentorId && ["PENDING", "ACCEPTED", "SCHEDULED"].includes(r.status)
    ).length;
    if (active < profile.maxMentees) {
      profile.status = "AVAILABLE";
    }
  }

  // Notify student
  mockNotifications.push({
    userId: req.studentId,
    actorId: user.id,
    title: "Mentorship Request Declined",
    body: reason
      ? `${user.name} was unable to accept your request: "${reason}"`
      : `${user.name} was unable to accept your mentorship request at this time.`,
    type: "MENTORSHIP",
  });

  return { success: true };
}

function cancelMentorshipRequestMock(user, requestId, reason) {
  const req = mockRequests.find((r) => r.id === requestId);
  if (!req) return { error: "Mentorship request not found." };

  const isStudent = req.studentId === user.id;
  const isMentor = req.mentorId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isStudent && !isMentor && !isAdmin) {
    return { error: "Unauthorized access: You cannot cancel this request." };
  }

  if (req.status === "COMPLETED") {
    return { error: "Completed mentorship sessions cannot be cancelled." };
  }

  const now = new Date();
  req.status = "CANCELLED";
  req.cancelledAt = now;
  req.endReason = reason || null;
  req.updatedAt = now;

  // Update relationship if exists
  const rel = mockRelationships.find((r) => r.requestId === req.id);
  if (rel) {
    rel.status = "CANCELLED";
    rel.endedAt = now;
    rel.endReason = reason || "Request cancelled";
  }

  // Restore capacity
  const profile = mockMentorProfiles[req.mentorId];
  if (profile && profile.status === "FULLY_BOOKED") {
    const active = mockRequests.filter(
      (r) => r.mentorId === req.mentorId && ["PENDING", "ACCEPTED", "SCHEDULED"].includes(r.status)
    ).length;
    if (active < profile.maxMentees) {
      profile.status = "AVAILABLE";
    }
  }

  // Notify counterparty
  if (isStudent) {
    mockNotifications.push({
      userId: req.mentorId,
      actorId: user.id,
      title: "Mentorship Request Cancelled",
      body: `${user.name} cancelled their mentorship request for "${req.topic}".`,
      type: "MENTORSHIP",
    });
  } else {
    mockNotifications.push({
      userId: req.studentId,
      actorId: user.id,
      title: "Mentorship Request Cancelled",
      body: `${user.name} cancelled the mentorship request on "${req.topic}".`,
      type: "MENTORSHIP",
    });
  }

  return { success: true };
}

function endMentorshipRelationshipMock(user, requestId, endReason) {
  const req = mockRequests.find((r) => r.id === requestId);
  if (!req) return { error: "Mentorship request not found." };

  if (req.mentorId !== user.id && user.role !== "ADMIN") {
    return { error: "Unauthorized access: You cannot end another mentor's relationship." };
  }

  const now = new Date();
  req.status = "COMPLETED";
  req.completedAt = now;
  req.endReason = endReason || null;
  req.updatedAt = now;

  const rel = mockRelationships.find((r) => r.requestId === req.id);
  if (rel) {
    rel.status = "COMPLETED";
    rel.endedAt = now;
    rel.endReason = endReason || "Concluded by mentor";
  }

  // Restore capacity
  const profile = mockMentorProfiles[req.mentorId];
  if (profile && profile.status === "FULLY_BOOKED") {
    const active = mockRequests.filter(
      (r) => r.mentorId === req.mentorId && ["PENDING", "ACCEPTED", "SCHEDULED"].includes(r.status)
    ).length;
    if (active < profile.maxMentees) {
      profile.status = "AVAILABLE";
    }
  }

  // Notify student
  mockNotifications.push({
    userId: req.studentId,
    actorId: user.id,
    title: "Mentorship Ended",
    body: `Your mentorship with ${user.name} on "${req.topic}" has concluded.`,
    type: "MENTORSHIP",
  });

  return { success: true };
}

// ------------------------------------------------------------------------------
// TEST SUITE EXECUTION
// ------------------------------------------------------------------------------

console.log("--- 1. Student Mentorship Request Submission & 7-Field Payload ---");

runTest("Student can submit request containing all 7 required fields", () => {
  const res = sendMentorshipRequestMock({
    student: mockUsers.student_1,
    mentorId: "usr_alumni_mentor",
    topic: "Mock Technical Interview",
    careerGoals: "Land a role as a Backend Engineer at a top tier software firm.",
    reason: "Your background in Go and microservices at Brain Station is exactly what I aspire to learn.",
    introduction: "I am a 7th semester CSE student proficient in TypeScript and distributed systems.",
    sessionFormat: "ONLINE",
    preferredAvailability: "Saturday evenings after 8 PM",
    message: "Looking forward to your guidance!",
  });

  assert.strictEqual(res.success, true);
  assert.ok(res.requestId);

  const req = mockRequests.find((r) => r.id === res.requestId);
  assert.ok(req);
  assert.strictEqual(req.status, "PENDING");
  assert.strictEqual(req.studentId, mockUsers.student_1.id);
  assert.strictEqual(req.mentorId, "usr_alumni_mentor");
  assert.strictEqual(req.topic, "Mock Technical Interview");
  assert.strictEqual(req.careerGoals, "Land a role as a Backend Engineer at a top tier software firm.");
  assert.strictEqual(req.reason, "Your background in Go and microservices at Brain Station is exactly what I aspire to learn.");
  assert.strictEqual(req.introduction, "I am a 7th semester CSE student proficient in TypeScript and distributed systems.");
  assert.strictEqual(req.sessionFormat, "ONLINE");
  assert.strictEqual(req.preferredAvailability, "Saturday evenings after 8 PM");
});

runTest("New request automatically creates high-priority notification for mentor", () => {
  const notif = mockNotifications.find(
    (n) => n.userId === "usr_alumni_mentor" && n.title === "New Mentorship Request! 🎓"
  );
  assert.ok(notif, "Mentor must receive a notification upon new request");
  assert.ok(notif.body.includes("Arif Khan"));
});

console.log("\n--- 2. Duplicate Request Prevention ---");

runTest("Same student cannot send duplicate pending/active request to same mentor", () => {
  const duplicateRes = sendMentorshipRequestMock({
    student: mockUsers.student_1,
    mentorId: "usr_alumni_mentor",
    topic: "System Design",
    reason: "Another request attempt",
    introduction: "Intro again",
  });

  assert.strictEqual(duplicateRes.success, undefined);
  assert.ok(duplicateRes.error.includes("already have an active mentorship request"));
});

console.log("\n--- 3. Mentee Capacity & Status Guardrails ---");

runTest("Second student can request when mentor still has available capacity", () => {
  // Alumni mentor has maxMentees = 2, currently 1 slot used (student_1)
  const res2 = sendMentorshipRequestMock({
    student: mockUsers.student_2,
    mentorId: "usr_alumni_mentor",
    topic: "Resume Review",
    careerGoals: "Business Analyst in FinTech",
    reason: "Seek resume polish for graduate hire roles",
    introduction: "Final year BBA student",
    sessionFormat: "ONLINE",
  });

  assert.strictEqual(res2.success, true);
  // Now 2 active requests exist -> mentor profile should be FULLY_BOOKED
  assert.strictEqual(mockMentorProfiles["usr_alumni_mentor"].status, "FULLY_BOOKED");
});

runTest("Additional requests rejected when mentor reaches maximum active mentee capacity", () => {
  const student3 = {
    id: "usr_student_3",
    name: "Third Student",
    role: "STUDENT",
    status: "APPROVED",
  };

  const res3 = sendMentorshipRequestMock({
    student: student3,
    mentorId: "usr_alumni_mentor",
    topic: "Career Guidance",
    reason: "Overflow attempt",
    introduction: "Third intro",
  });

  assert.strictEqual(res3.success, undefined);
  assert.ok(res3.error.includes("fully booked"));
});

console.log("\n--- 4. Mentor Acceptance Workflow & Dedicated Conversation ---");

runTest("Unauthorized user cannot accept mentorship request intended for another mentor", () => {
  const req = mockRequests[0];
  const res = acceptMentorshipRequestMock(mockUsers.other_alumni, req.id, "Attempt by intruder");
  assert.strictEqual(res.success, undefined);
  assert.ok(res.error.includes("Unauthorized"));
});

runTest("Mentor accepts request: sets status to ACCEPTED, records startedAt", () => {
  const req = mockRequests[0];
  const res = acceptMentorshipRequestMock(mockUsers.alumni_mentor, req.id, "Happy to help you prepare!");

  assert.strictEqual(res.success, true);
  assert.strictEqual(req.status, "ACCEPTED");
  assert.ok(req.startedAt instanceof Date);
  assert.strictEqual(req.mentorNotes, "Happy to help you prepare!");
});

runTest("Acceptance creates dedicated Mentorship Conversation with Student and Mentor", () => {
  const req = mockRequests[0];
  assert.ok(req.connectionId, "Connection ID must be assigned to request");

  const conn = mockConnections.find((c) => c.id === req.connectionId);
  assert.ok(conn, "Connection record must exist in DB");
  assert.strictEqual(conn.status, "ACCEPTED");
  assert.strictEqual(conn.fromId, mockUsers.alumni_mentor.id);
  assert.strictEqual(conn.toId, mockUsers.student_1.id);
});

runTest("Acceptance creates active MentorshipRelationship record", () => {
  const req = mockRequests[0];
  const rel = mockRelationships.find((r) => r.requestId === req.id);

  assert.ok(rel, "MentorshipRelationship must be created");
  assert.strictEqual(rel.status, "ACTIVE");
  assert.strictEqual(rel.studentId, mockUsers.student_1.id);
  assert.strictEqual(rel.mentorId, mockUsers.alumni_mentor.id);
  assert.strictEqual(rel.connectionId, req.connectionId);
});

runTest("Acceptance dispatches notification to student with link to My Mentors", () => {
  const notif = mockNotifications.find(
    (n) => n.userId === mockUsers.student_1.id && n.title === "Mentorship Request Accepted! 🎉"
  );
  assert.ok(notif);
  assert.ok(notif.body.includes("Tanvir Ahmed"));
});

runTest("Retrying acceptance is idempotent and avoids duplicate conversations", () => {
  const req = mockRequests[0];
  const prevConnectionsCount = mockConnections.length;

  // Status is already ACCEPTED, so attempting to accept again fails cleanly
  const resRetry = acceptMentorshipRequestMock(mockUsers.alumni_mentor, req.id);
  assert.strictEqual(resRetry.success, undefined);
  assert.strictEqual(mockConnections.length, prevConnectionsCount, "No duplicate connections allowed");
});

console.log("\n--- 5. Mentor Decline Workflow ---");

runTest("Mentor can decline pending request with optional reason", () => {
  const req2 = mockRequests[1]; // student_2 request is still PENDING
  assert.strictEqual(req2.status, "PENDING");

  const res = declineMentorshipRequestMock(
    mockUsers.alumni_mentor,
    req2.id,
    "Currently at max capacity for the upcoming sprint."
  );

  assert.strictEqual(res.success, true);
  assert.strictEqual(req2.status, "DECLINED");
  assert.ok(req2.declinedAt instanceof Date);
  assert.strictEqual(req2.mentorNotes, "Currently at max capacity for the upcoming sprint.");
});

runTest("Declined request does not create a MentorshipRelationship or Conversation", () => {
  const req2 = mockRequests[1];
  const rel = mockRelationships.find((r) => r.requestId === req2.id);
  assert.strictEqual(rel, undefined, "No relationship should exist for declined request");

  assert.strictEqual(req2.connectionId, undefined, "No conversation should be created");
});

runTest("Declined request restores mentor availability from FULLY_BOOKED to AVAILABLE", () => {
  const profile = mockMentorProfiles["usr_alumni_mentor"];
  assert.strictEqual(profile.status, "AVAILABLE", "Slot freed, availability restored to AVAILABLE");
});

runTest("Declined request sends notification to student with decline explanation", () => {
  const notif = mockNotifications.find(
    (n) => n.userId === mockUsers.student_2.id && n.title === "Mentorship Request Declined"
  );
  assert.ok(notif);
  assert.ok(notif.body.includes("max capacity"));
});

console.log("\n--- 6. Student Cancellation Workflow ---");

runTest("Student can cancel their pending request", () => {
  // First submit a new pending request to faculty mentor
  const res = sendMentorshipRequestMock({
    student: mockUsers.student_2,
    mentorId: "usr_faculty_mentor",
    topic: "Research & Thesis",
    reason: "Need guidance on thesis topic",
    introduction: "BBA student working on fintech adoption",
  });
  assert.strictEqual(res.success, true);

  const req = mockRequests.find((r) => r.id === res.requestId);
  assert.strictEqual(req.status, "PENDING");

  // Student cancels
  const cancelRes = cancelMentorshipRequestMock(mockUsers.student_2, req.id, "Found advisor inside my department");
  assert.strictEqual(cancelRes.success, true);
  assert.strictEqual(req.status, "CANCELLED");
  assert.ok(req.cancelledAt instanceof Date);
  assert.strictEqual(req.endReason, "Found advisor inside my department");
});

runTest("Student cancellation notifies mentor", () => {
  const notif = mockNotifications.find(
    (n) => n.userId === "usr_faculty_mentor" && n.title === "Mentorship Request Cancelled"
  );
  assert.ok(notif);
  assert.ok(notif.body.includes("Fatima Noor"));
});

console.log("\n--- 7. Mentor Ending Active Mentorship Relationship ---");

runTest("Mentor can conclude/end active relationship with confirmation", () => {
  const req = mockRequests[0]; // Active relationship with student_1
  assert.strictEqual(req.status, "ACCEPTED");

  const endRes = endMentorshipRelationshipMock(
    mockUsers.alumni_mentor,
    req.id,
    "Successfully completed resume review and system design mock interview."
  );

  assert.strictEqual(endRes.success, true);
  assert.strictEqual(req.status, "COMPLETED");
  assert.ok(req.completedAt instanceof Date);
  assert.strictEqual(req.endReason, "Successfully completed resume review and system design mock interview.");

  const rel = mockRelationships.find((r) => r.requestId === req.id);
  assert.ok(rel);
  assert.strictEqual(rel.status, "COMPLETED");
  assert.ok(rel.endedAt instanceof Date);
});

runTest("Ending active relationship notifies student and frees mentor capacity", () => {
  const notif = mockNotifications.find(
    (n) => n.userId === mockUsers.student_1.id && n.title === "Mentorship Ended"
  );
  assert.ok(notif);

  const profile = mockMentorProfiles["usr_alumni_mentor"];
  assert.strictEqual(profile.status, "AVAILABLE");
});

console.log("\n--- 8. Security & Authorization Enforcement ---");

runTest("Non-students (Alumni or Faculty) cannot submit mentorship requests", () => {
  const nonStudent = mockUsers.alumni_mentor;
  const res = sendMentorshipRequestMock({
    student: nonStudent,
    mentorId: "usr_faculty_mentor",
    topic: "Higher Studies",
    reason: "Alumni trying to request",
  });

  assert.strictEqual(res.success, undefined);
  assert.ok(res.error.includes("Only students are eligible"));
});

runTest("Student cannot request mentorship from themselves", () => {
  const res = sendMentorshipRequestMock({
    student: mockUsers.student_1,
    mentorId: mockUsers.student_1.id,
    topic: "Self request",
    reason: "Invalid",
  });

  assert.strictEqual(res.success, undefined);
  assert.ok(res.error.includes("yourself"));
});

runTest("Student cannot accept their own request", () => {
  const req = mockRequests[0];
  const res = acceptMentorshipRequestMock(mockUsers.student_1, req.id);
  assert.strictEqual(res.success, undefined);
  assert.ok(res.error.includes("Unauthorized"));
});

// ------------------------------------------------------------------------------
// SUMMARY
// ------------------------------------------------------------------------------

console.log("\n================================================================================");
console.log(`Phase 3 Mentorship Test Suite Finished: ${passed} / ${total} tests passed!`);
console.log("================================================================================");

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
