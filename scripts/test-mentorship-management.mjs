import assert from "assert";

console.log("=================================================");
console.log("   ULAB Setu Alumni Mentorship Management Tests");
console.log("=================================================\n");

// Simulated Database State
const mockUsers = {
  alumni_mentor: {
    id: "usr_alumni_mentor",
    name: "Tanvir Ahmed",
    email: "tanvir.ahmed@ulab.edu.bd",
    role: "ALUMNI",
    department: "CSE",
    company: "Brain Station 23",
    designation: "Lead Software Architect",
    skills: "React, Node.js, System Design, PostgreSQL",
    status: "APPROVED",
    alumniVerified: true,
    isMentor: false,
    mentorAvailable: true,
    mentorTopics: null,
    mentorExpertise: null,
    mentorSessionFormat: "ONLINE",
    mentorAvailabilityNote: null,
    mentorMaxMentees: 3,
  },
  student_mentee: {
    id: "usr_student_mentee",
    name: "Arif Khan",
    email: "arif.khan@ulab.edu.bd",
    role: "STUDENT",
    department: "CSE",
    status: "APPROVED",
  },
  other_student: {
    id: "usr_other_student",
    name: "Sadia Rahman",
    email: "sadia.rahman@ulab.edu.bd",
    role: "STUDENT",
    department: "BBA",
    status: "APPROVED",
  },
};

let mockRequests = [];
let mockNotifications = [];
let mockRelationships = [];
let mockConnections = [];

function resetState() {
  mockRequests = [];
  mockNotifications = [];
  mockRelationships = [];
  mockConnections = [];
}

// 1. Mentor Profile Update
function updateMentorProfile(userId, data) {
  const user = Object.values(mockUsers).find((u) => u.id === userId);
  if (!user) return { error: "User not found" };

  if (user.role !== "ALUMNI" && user.role !== "TEACHER" && user.role !== "ADMIN") {
    return { error: "Only Alumni and Faculty can offer mentorship" };
  }

  user.isMentor = Boolean(data.isMentor);
  user.mentorAvailable = Boolean(data.mentorAvailable);
  user.mentorTopics = Array.isArray(data.mentorTopics)
    ? data.mentorTopics.join(", ")
    : data.mentorTopics || null;
  user.mentorExpertise = data.mentorExpertise || null;
  user.mentorSessionFormat = data.mentorSessionFormat || "ONLINE";
  user.mentorAvailabilityNote = data.mentorAvailabilityNote || null;
  user.mentorMaxMentees = data.mentorMaxMentees || 3;

  return { success: true };
}

// 2. Student Mentor Discovery
function browseMentors({ department, skill, topic, q } = {}) {
  return Object.values(mockUsers).filter((u) => {
    if (!u.isMentor || u.status !== "APPROVED") return false;
    if (department && u.department !== department) return false;
    if (skill && (!u.skills || !u.skills.toLowerCase().includes(skill.toLowerCase()))) return false;
    if (topic && (!u.mentorTopics || !u.mentorTopics.toLowerCase().includes(topic.toLowerCase())))
      return false;
    if (q) {
      const match =
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        (u.company && u.company.toLowerCase().includes(q.toLowerCase()));
      if (!match) return false;
    }
    return true;
  });
}

// 3. Send Mentorship Request
function sendRequest(studentId, { mentorId, topic, message, careerGoals, sessionFormat }) {
  const student = Object.values(mockUsers).find((u) => u.id === studentId);
  if (!student || student.role !== "STUDENT") return { error: "Only students can request mentorship" };

  if (studentId === mentorId) return { error: "Cannot request mentorship from self" };

  const mentor = Object.values(mockUsers).find((u) => u.id === mentorId);
  if (!mentor || !mentor.isMentor || mentor.status !== "APPROVED") {
    return { error: "Mentor not found or inactive" };
  }
  if (!mentor.mentorAvailable) {
    return { error: "Mentor is currently not accepting new requests" };
  }

  // Duplicate active check
  const existing = mockRequests.find(
    (r) =>
      r.studentId === studentId &&
      r.mentorId === mentorId &&
      ["PENDING", "ACCEPTED", "SCHEDULED"].includes(r.status)
  );
  if (existing) {
    return { error: "Active mentorship request already exists with this mentor" };
  }

  const req = {
    id: `req_${mockRequests.length + 1}`,
    studentId,
    mentorId,
    topic: topic.trim(),
    message: message.trim(),
    careerGoals: careerGoals?.trim() || null,
    sessionFormat: sessionFormat || mentor.mentorSessionFormat || "ONLINE",
    status: "PENDING",
    scheduledAt: null,
    sessionLink: null,
    mentorNotes: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockRequests.push(req);

  mockNotifications.push({
    userId: mentorId,
    actorId: studentId,
    title: "New Mentorship Request! 🎓",
    type: "MENTORSHIP",
  });

  return { success: true, requestId: req.id };
}

// 4. Mentor Accept Request
function acceptRequest(mentorId, requestId, note = null) {
  const req = mockRequests.find((r) => r.id === requestId);
  if (!req) return { error: "Request not found" };

  if (req.mentorId !== mentorId) return { error: "Unauthorized" };
  if (req.status !== "PENDING") return { error: "Request is not in pending status" };

  req.status = "ACCEPTED";
  if (note) req.mentorNotes = note;
  req.updatedAt = new Date();

  // Create isolated dedicated connection for this specific request
  let conn = mockConnections.find((c) => c.mentorshipRequestId === requestId);
  if (!conn) {
    conn = {
      id: `conn_${mockConnections.length + 1}`,
      mentorshipRequestId: requestId,
      fromId: mentorId,
      toId: req.studentId,
      type: "mentorship",
      isCompleted: false,
      messages: [],
    };
    mockConnections.push(conn);
  }

  // Create relationship
  let rel = mockRelationships.find((r) => r.requestId === requestId);
  if (!rel) {
    rel = {
      id: `rel_${mockRelationships.length + 1}`,
      requestId,
      studentId: req.studentId,
      mentorId,
      status: "ACTIVE",
      startedAt: new Date(),
      endedAt: null,
      endReason: null,
      connectionId: conn.id,
    };
    mockRelationships.push(rel);
  }

  mockNotifications.push({
    userId: req.studentId,
    actorId: mentorId,
    title: "Mentorship Request Accepted! 🎉",
    type: "MENTORSHIP",
  });

  return { success: true };
}

// 5. Mentor Schedule Session
function scheduleSession(mentorId, requestId, { scheduledAt, sessionLink, note }) {
  const req = mockRequests.find((r) => r.id === requestId);
  if (!req) return { error: "Request not found" };

  if (req.mentorId !== mentorId) return { error: "Unauthorized" };

  const parsedDate = new Date(scheduledAt);
  if (isNaN(parsedDate.getTime())) return { error: "Invalid date" };

  req.status = "SCHEDULED";
  req.scheduledAt = parsedDate;
  req.sessionLink = sessionLink || null;
  if (note) req.mentorNotes = note;
  req.updatedAt = new Date();

  mockNotifications.push({
    userId: req.studentId,
    actorId: mentorId,
    title: "Mentorship Session Scheduled! 📅",
    type: "MENTORSHIP",
  });

  return { success: true };
}

// 6. Mentor Complete Session
function completeSession(mentorId, requestId, feedbackNotes = null) {
  const req = mockRequests.find((r) => r.id === requestId);
  if (!req) return { error: "Request not found" };

  if (req.mentorId !== mentorId) return { error: "Unauthorized" };

  req.status = "COMPLETED";
  req.completedAt = new Date();
  if (feedbackNotes) req.mentorNotes = feedbackNotes;
  req.updatedAt = new Date();

  mockNotifications.push({
    userId: req.studentId,
    actorId: mentorId,
    title: "Mentorship Session Completed 🌟",
    type: "MENTORSHIP",
  });

  return { success: true };
}

// 7. Student Cancel Request
function cancelRequest(userId, requestId) {
  const req = mockRequests.find((r) => r.id === requestId);
  if (!req) return { error: "Request not found" };

  if (req.studentId !== userId) return { error: "Unauthorized" };
  if (req.status === "COMPLETED") return { error: "Cannot cancel completed session" };

  req.status = "CANCELLED";
  req.updatedAt = new Date();

  return { success: true };
}

// 8. Remove from My Mentors (Soft removal, archive conversation, restore availability)
function removeMentorshipRelationship(userId, requestId, reason = "Removed by student") {
  const req = mockRequests.find((r) => r.id === requestId);
  if (!req) return { error: "Request not found" };

  if (req.studentId !== userId && req.mentorId !== userId) {
    return { error: "Unauthorized" };
  }

  const rel = mockRelationships.find((r) => r.requestId === requestId);
  if (rel) {
    rel.status = "CANCELLED";
    rel.endedAt = new Date();
    rel.endReason = reason;
  }

  req.status = "CANCELLED";
  req.updatedAt = new Date();

  const conn = mockConnections.find((c) => c.mentorshipRequestId === requestId);
  if (conn) {
    conn.isCompleted = true; // Historical conversation archived
  }

  mockNotifications.push({
    userId: req.studentId === userId ? req.mentorId : req.studentId,
    actorId: userId,
    title: "Mentorship Removed",
    type: "MENTORSHIP",
  });

  return { success: true };
}

// ======================== RUN TESTS ========================

resetState();

// Test 1: Alumni enables mentor registration & configures profile
console.log("Test 1: Alumni activates mentor profile with topics and availability");
const regRes = updateMentorProfile(mockUsers.alumni_mentor.id, {
  isMentor: true,
  mentorAvailable: true,
  mentorTopics: ["Career Guidance", "Technical Interview Preparation", "Resume & CV Review"],
  mentorExpertise: "Full-Stack Web, Cloud Native Architecture, FinTech",
  mentorSessionFormat: "ONLINE",
  mentorAvailabilityNote: "Saturdays 7-9 PM",
  mentorMaxMentees: 4,
});
assert.strictEqual(regRes.success, true);
assert.strictEqual(mockUsers.alumni_mentor.isMentor, true);
assert.strictEqual(mockUsers.alumni_mentor.mentorAvailable, true);
console.log("  ✔ Alumni registered as active mentor with custom topics & expertise\n");

// Test 2: Student discovers mentors matching department & topic
console.log("Test 2: Student searches available mentors by department & topic");
const mentorsFound = browseMentors({
  department: "CSE",
  topic: "Technical Interview",
});
assert.strictEqual(mentorsFound.length, 1);
assert.strictEqual(mentorsFound[0].name, "Tanvir Ahmed");
console.log("  ✔ Mentor search successfully resolved matching criteria\n");

// Test 3: Student sends mentorship request with career goals
console.log("Test 3: Student sends mentorship request");
const reqRes = sendRequest(mockUsers.student_mentee.id, {
  mentorId: mockUsers.alumni_mentor.id,
  topic: "Technical Interview Preparation",
  message: "Hi Tanvir bhai, I am preparing for software engineering mock interviews.",
  careerGoals: "Land a backend engineering role at a fintech company upon graduation.",
  sessionFormat: "ONLINE",
});
assert.strictEqual(reqRes.success, true);
assert.strictEqual(mockRequests.length, 1);
const req = mockRequests[0];
assert.strictEqual(req.status, "PENDING");
assert.strictEqual(req.careerGoals, "Land a backend engineering role at a fintech company upon graduation.");
assert.strictEqual(mockNotifications.length, 1);
console.log("  ✔ Mentorship request created with PENDING status and mentor notified\n");

// Test 4: Duplicate active request prevention
console.log("Test 4: Prevent duplicate active mentorship requests");
const dupRes = sendRequest(mockUsers.student_mentee.id, {
  mentorId: mockUsers.alumni_mentor.id,
  topic: "Career Guidance",
  message: "Another inquiry",
});
assert.ok(dupRes.error);
console.log("  ✔ Duplicate request correctly blocked\n");

// Test 5: Mentor accepts the request
console.log("Test 5: Mentor accepts request -> transitions to ACCEPTED");
const acceptRes = acceptRequest(
  mockUsers.alumni_mentor.id,
  req.id,
  "Happy to connect and review mock questions."
);
assert.strictEqual(acceptRes.success, true);
assert.strictEqual(req.status, "ACCEPTED");
assert.strictEqual(req.mentorNotes, "Happy to connect and review mock questions.");
console.log("  ✔ Request accepted and student notified\n");

// Test 6: Mentor schedules session
console.log("Test 6: Mentor schedules meeting datetime and Google Meet link");
const schedRes = scheduleSession(mockUsers.alumni_mentor.id, req.id, {
  scheduledAt: "2026-11-14T19:00:00Z",
  sessionLink: "https://meet.google.com/abc-defg-hij",
  note: "Have your GitHub repository and resume ready.",
});
assert.strictEqual(schedRes.success, true);
assert.strictEqual(req.status, "SCHEDULED");
assert.ok(req.scheduledAt instanceof Date);
assert.strictEqual(req.sessionLink, "https://meet.google.com/abc-defg-hij");
console.log("  ✔ Session scheduled with meeting link -> status SCHEDULED\n");

// Test 7: Unauthorized user blocked from modifying session
console.log("Test 7: Other student blocked from modifying session");
const badSched = scheduleSession(mockUsers.other_student.id, req.id, {
  scheduledAt: "2026-11-15T19:00:00Z",
});
assert.strictEqual(badSched.error, "Unauthorized");
console.log("  ✔ Strict authorization boundary blocks intruders\n");

// Test 8: Session completion
console.log("Test 8: Mentor marks session as completed with feedback notes");
const compRes = completeSession(
  mockUsers.alumni_mentor.id,
  req.id,
  "Excellent mock interview. Arif demonstrated solid data structure knowledge."
);
assert.strictEqual(compRes.success, true);
assert.strictEqual(req.status, "COMPLETED");
assert.ok(req.completedAt instanceof Date);
console.log("  ✔ Session successfully marked COMPLETED with feedback\n");

// Test 9: Student cannot cancel completed session
console.log("Test 9: Completed session cannot be cancelled");
const badCancel = cancelRequest(mockUsers.student_mentee.id, req.id);
assert.strictEqual(badCancel.error, "Cannot cancel completed session");
console.log("  ✔ Completed session immutable to cancellation\n");

// Test 10: Cancellation of pending request
console.log("Test 10: Cancellation of active/pending request");
const req2 = sendRequest(mockUsers.other_student.id, {
  mentorId: mockUsers.alumni_mentor.id,
  topic: "Resume & CV Review",
  message: "Please review my resume",
});
assert.strictEqual(req2.success, true);
const cancelRes = cancelRequest(mockUsers.other_student.id, req2.requestId);
assert.strictEqual(cancelRes.success, true);
const cancelledReq = mockRequests.find((r) => r.id === req2.requestId);
assert.strictEqual(cancelledReq.status, "CANCELLED");
console.log("  ✔ Pending request successfully cancelled by student\n");

// Test 11: Student removes mentor from My Mentors (Soft removal, archive conversation, relationship preserved)
console.log("Test 11: Student removes mentor from My Mentors");
// Create active relationship between other_student and alumni_mentor
const req3 = sendRequest(mockUsers.other_student.id, {
  mentorId: mockUsers.alumni_mentor.id,
  topic: "System Architecture",
  message: "I need guidance on microservices",
});
assert.strictEqual(req3.success, true);
const accept3 = acceptRequest(mockUsers.alumni_mentor.id, req3.requestId);
assert.strictEqual(accept3.success, true);

// Add a mock message to connection
const conn3 = mockConnections.find((c) => c.mentorshipRequestId === req3.requestId);
assert.ok(conn3);
conn3.messages.push({ id: "msg_1", text: "Welcome to mentorship session!" });

// Now student removes mentor
const removeRes = removeMentorshipRelationship(
  mockUsers.other_student.id,
  req3.requestId,
  "Finished project milestone"
);
assert.strictEqual(removeRes.success, true);

const rel3 = mockRelationships.find((r) => r.requestId === req3.requestId);
assert.ok(rel3, "Historical relationship record MUST be preserved in database");
assert.strictEqual(rel3.status, "CANCELLED");
assert.ok(rel3.endedAt instanceof Date);
assert.strictEqual(rel3.endReason, "Finished project milestone");
assert.strictEqual(conn3.isCompleted, true, "Connection is marked completed/archived");
assert.strictEqual(conn3.messages.length, 1, "Chat history preserved in read-only archive");
console.log("  ✔ Mentor relationship cleanly removed, historical data preserved, chat archived\n");

// Test 12: Mentor remains available and searchable in Browse after removal
console.log("Test 12: Mentor remains searchable in Find a Mentor");
const availableMentors = browseMentors({ department: "CSE" });
assert.ok(availableMentors.some((m) => m.id === mockUsers.alumni_mentor.id));
console.log("  ✔ Removed mentor remains discoverable for new sessions\n");

// Test 13: Student sends new request to the same mentor after removal
console.log("Test 13: Student sends a brand new request to the same mentor after removal");
const reRequest = sendRequest(mockUsers.other_student.id, {
  mentorId: mockUsers.alumni_mentor.id,
  topic: "Advanced Distributed Systems",
  message: "Hi Tanvir bhai, starting a new project and would love to work together again.",
});
assert.strictEqual(reRequest.success, true);
assert.notStrictEqual(reRequest.requestId, req3.requestId, "New request gets fresh ID");
console.log("  ✔ Re-request successfully created with fresh request ID\n");

// Test 14: Dedicated new connection created without mixing old conversation
console.log("Test 14: Dedicated new connection created upon acceptance without mixing chat");
const acceptReReq = acceptRequest(mockUsers.alumni_mentor.id, reRequest.requestId);
assert.strictEqual(acceptReReq.success, true);

const newConn = mockConnections.find((c) => c.mentorshipRequestId === reRequest.requestId);
assert.ok(newConn);
assert.notStrictEqual(newConn.id, conn3.id, "New session gets dedicated connection ID");
assert.strictEqual(newConn.messages.length, 0, "New chat thread is completely fresh and unmixed");
console.log("  ✔ Dedicated isolated connection created for subsequent mentorship session\n");

// Test 15: Unlimited mentor requests — student can request >10 different mentors
console.log("Test 15: Unlimited mentor requests (more than 10 different mentors)");
for (let i = 1; i <= 12; i++) {
  const dynamicMentorId = `dyn_mentor_${i}`;
  mockUsers[dynamicMentorId] = {
    id: dynamicMentorId,
    name: `Mentor ${i}`,
    email: `mentor${i}@ulab.edu.bd`,
    role: "ALUMNI",
    department: "CSE",
    status: "APPROVED",
    isMentor: true,
    mentorAvailable: true,
  };
  const multiRes = sendRequest(mockUsers.student_mentee.id, {
    mentorId: dynamicMentorId,
    topic: `Topic ${i}`,
    message: `Inquiry ${i}`,
  });
  assert.strictEqual(multiRes.success, true, `Should allow request ${i} without arbitrary cap`);
}
console.log("  ✔ Student successfully requested 12 different mentors without arbitrary 10-request limits\n");

// Test 16: Duplicate pending request to same mentor is strictly blocked
console.log("Test 16: Duplicate pending request strictly blocked");
const dupPendingRes = sendRequest(mockUsers.student_mentee.id, {
  mentorId: "dyn_mentor_1",
  topic: "Duplicate topic",
  message: "Should be blocked",
});
assert.ok(dupPendingRes.error);
assert.strictEqual(dupPendingRes.error, "Active mentorship request already exists with this mentor");
console.log("  ✔ Duplicate pending request safely blocked with validation error\n");

console.log("=================================================");
console.log("  ✔ ALL 16 MENTORSHIP MANAGEMENT TESTS PASSED!");
console.log("=================================================");

