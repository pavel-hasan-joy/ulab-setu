import assert from "assert";

console.log("=================================================");
console.log("   ULAB Setu Support Tickets & Moderation Tests");
console.log("=================================================\n");

// Simulated Database State
const mockUsers = {
  student_1: {
    id: "usr_student_1",
    name: "Arif Khan",
    email: "arif.khan@ulab.edu.bd",
    role: "STUDENT",
    status: "APPROVED",
  },
  intruder_student: {
    id: "usr_intruder",
    name: "Sadia Rahman",
    email: "sadia.rahman@ulab.edu.bd",
    role: "STUDENT",
    status: "APPROVED",
  },
  support_admin: {
    id: "usr_support_admin",
    name: "Helpdesk Manager",
    email: "helpdesk@ulab.edu.bd",
    role: "ADMIN",
    status: "APPROVED",
  },
  bad_actor: {
    id: "usr_bad_actor",
    name: "Spam Recruiter",
    email: "fake.recruiter@ulab.edu.bd",
    role: "ALUMNI",
    status: "APPROVED",
  },
};

let mockTickets = [];
let mockTicketMessages = [];
let mockReports = [];
let mockAuditLogs = [];
let mockNotifications = [];

function resetState() {
  mockTickets = [];
  mockTicketMessages = [];
  mockReports = [];
  mockAuditLogs = [];
  mockNotifications = [];
}

// 1. Ticket Creation
function createTicket(userId, { subject, category, priority = "MEDIUM", description }) {
  const user = Object.values(mockUsers).find((u) => u.id === userId);
  if (!user) return { error: "User not found" };

  if (!subject || subject.trim().length < 5) {
    return { error: "Subject must be at least 5 characters" };
  }
  if (!description || description.trim().length < 10) {
    return { error: "Description must be at least 10 characters" };
  }

  const validCategories = [
    "LOGIN",
    "VERIFICATION",
    "PROFILE",
    "JOB_POSTING",
    "JOB_APPLICATION",
    "MESSAGING",
    "TECHNICAL",
    "OTHER",
  ];
  if (!validCategories.includes(category)) {
    return { error: "Invalid category" };
  }

  const ticketNumber = `TICK-${1000 + mockTickets.length + 1}`;
  const ticket = {
    id: `tick_${mockTickets.length + 1}`,
    ticketNumber,
    userId,
    subject: subject.trim(),
    category,
    priority,
    status: "OPEN",
    description: description.trim(),
    assignedToId: null,
    resolution: null,
    internalNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockTickets.push(ticket);

  // Initial message in thread
  mockTicketMessages.push({
    id: `tmsg_${mockTicketMessages.length + 1}`,
    ticketId: ticket.id,
    authorId: userId,
    body: description.trim(),
    isInternal: false,
    createdAt: new Date(),
  });

  return { success: true, ticketId: ticket.id, ticketNumber };
}

// 2. Ticket Assignment
function assignTicket(adminId, ticketId, targetAgentId) {
  const admin = Object.values(mockUsers).find((u) => u.id === adminId);
  if (!admin || admin.role !== "ADMIN") return { error: "Unauthorized" };

  const ticket = mockTickets.find((t) => t.id === ticketId);
  if (!ticket) return { error: "Ticket not found" };

  ticket.assignedToId = targetAgentId;
  if (ticket.status === "OPEN") {
    ticket.status = "IN_PROGRESS";
  }
  ticket.updatedAt = new Date();

  mockAuditLogs.push({
    action: "ASSIGN_TICKET",
    adminId,
    ticketId,
    targetAgentId,
  });

  return { success: true };
}

// 3. Ticket Reply & Internal Notes
function replyToTicket(authorId, ticketId, body, isInternal = false) {
  const user = Object.values(mockUsers).find((u) => u.id === authorId);
  if (!user) return { error: "User not found" };

  const ticket = mockTickets.find((t) => t.id === ticketId);
  if (!ticket) return { error: "Ticket not found" };

  const isAdmin = user.role === "ADMIN";

  if (!isAdmin && ticket.userId !== authorId) {
    return { error: "Unauthorized access to this ticket" };
  }

  const effectiveInternal = isAdmin ? Boolean(isInternal) : false;

  const msg = {
    id: `tmsg_${mockTicketMessages.length + 1}`,
    ticketId,
    authorId,
    body: body.trim(),
    isInternal: effectiveInternal,
    createdAt: new Date(),
  };
  mockTicketMessages.push(msg);

  if (isAdmin && !effectiveInternal) {
    ticket.status = "WAITING_FOR_USER";
  } else if (!isAdmin) {
    ticket.status = "IN_PROGRESS";
  }
  ticket.updatedAt = new Date();

  return { success: true, messageId: msg.id };
}

// 4. Ticket Status Update
function updateTicketStatus(userId, ticketId, status, resolution = null) {
  const user = Object.values(mockUsers).find((u) => u.id === userId);
  if (!user) return { error: "User not found" };

  const ticket = mockTickets.find((t) => t.id === ticketId);
  if (!ticket) return { error: "Ticket not found" };

  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    if (ticket.userId !== userId) return { error: "Unauthorized" };
    if (status !== "CLOSED" && status !== "OPEN") return { error: "User can only close or reopen ticket" };
  }

  ticket.status = status;
  if (resolution) ticket.resolution = resolution;
  ticket.updatedAt = new Date();

  return { success: true };
}

// 5. Submit User Report
function submitReport(reporterId, { targetType, targetId, reportedUserId, reason, details }) {
  if (reportedUserId && reportedUserId === reporterId) {
    return { error: "Cannot report self" };
  }

  const report = {
    id: `rep_${mockReports.length + 1}`,
    reporterId,
    targetType,
    targetId: targetId || null,
    reportedUserId: reportedUserId || null,
    reason,
    details: details || null,
    status: "PENDING",
    actionTaken: "NONE",
    resolutionNotes: null,
    resolvedById: null,
    createdAt: new Date(),
  };
  mockReports.push(report);
  return { success: true, reportId: report.id };
}

// 6. Admin Moderate Report
function moderateReport(adminId, reportId, { status, moderationAction, resolutionNotes }) {
  const admin = Object.values(mockUsers).find((u) => u.id === adminId);
  if (!admin || admin.role !== "ADMIN") return { error: "Unauthorized" };

  const report = mockReports.find((r) => r.id === reportId);
  if (!report) return { error: "Report not found" };

  report.status = status;
  report.actionTaken = moderationAction || "NONE";
  report.resolutionNotes = resolutionNotes || null;
  report.resolvedById = adminId;
  report.resolvedAt = new Date();

  if (moderationAction === "SUSPENDED" && report.reportedUserId) {
    const accused = Object.values(mockUsers).find((u) => u.id === report.reportedUserId);
    if (accused) accused.status = "SUSPENDED";
  }

  mockAuditLogs.push({
    action: "MODERATE_REPORT",
    adminId,
    reportId,
    moderationAction,
  });

  return { success: true };
}

// ======================== RUN TEST SUITE ========================

resetState();

// Test 1: Ticket creation with validation & unique human-readable ticket number
console.log("Test 1: User creates support ticket across valid categories");
const tRes = createTicket(mockUsers.student_1.id, {
  subject: "Cannot update profile graduation year",
  category: "PROFILE",
  priority: "HIGH",
  description: "When I try to select 2026 as my graduation year, the form resets without saving.",
});
assert.strictEqual(tRes.success, true);
assert.strictEqual(tRes.ticketNumber, "TICK-1001");
const ticket = mockTickets[0];
assert.strictEqual(ticket.status, "OPEN");
assert.strictEqual(mockTicketMessages.length, 1);
console.log("  ✔ Support ticket TICK-1001 created in OPEN status with initial thread message\n");

// Test 2: Input validation boundaries
console.log("Test 2: Rejection of short subjects and invalid categories");
const badRes = createTicket(mockUsers.student_1.id, {
  subject: "Help",
  category: "INVALID_CAT",
  description: "Bug",
});
assert.ok(badRes.error);
console.log("  ✔ Input validation blocks invalid categories & undersized text\n");

// Test 3: Support Admin assigns ticket to staff
console.log("Test 3: Support Admin assigns ticket to an agent");
const assignRes = assignTicket(
  mockUsers.support_admin.id,
  ticket.id,
  mockUsers.support_admin.id
);
assert.strictEqual(assignRes.success, true);
assert.strictEqual(ticket.assignedToId, mockUsers.support_admin.id);
assert.strictEqual(ticket.status, "IN_PROGRESS", "Assignment transitions ticket to IN_PROGRESS");
console.log("  ✔ Ticket assigned to agent and status automatically moved to IN_PROGRESS\n");

// Test 4: Support Admin sends public reply to user
console.log("Test 4: Admin replies to user -> status transitions to WAITING_FOR_USER");
const replyRes = replyToTicket(
  mockUsers.support_admin.id,
  ticket.id,
  "Hi Arif, we have cleared the cache on your account. Could you please try again now?",
  false
);
assert.strictEqual(replyRes.success, true);
assert.strictEqual(ticket.status, "WAITING_FOR_USER");
console.log("  ✔ Admin public reply transitions status to WAITING_FOR_USER\n");

// Test 5: User replies back to support agent
console.log("Test 5: User responds -> status transitions back to IN_PROGRESS");
const userReply = replyToTicket(
  mockUsers.student_1.id,
  ticket.id,
  "Thank you! It worked after refreshing.",
  false
);
assert.strictEqual(userReply.success, true);
assert.strictEqual(ticket.status, "IN_PROGRESS");
console.log("  ✔ User reply transitions status back to IN_PROGRESS\n");

// Test 6: Internal staff notes isolation
console.log("Test 6: Internal staff notes recorded and isolated from regular users");
const internalNote = replyToTicket(
  mockUsers.support_admin.id,
  ticket.id,
  "Resolved via cache flush on PostgreSQL profile row.",
  true // Internal Note
);
assert.strictEqual(internalNote.success, true);
const staffMsg = mockTicketMessages.find((m) => m.id === internalNote.messageId);
assert.strictEqual(staffMsg.isInternal, true);

// Verify user view filtering
const userVisibleMessages = mockTicketMessages.filter(
  (m) => m.ticketId === ticket.id && !m.isInternal
);
assert.strictEqual(userVisibleMessages.length, 3);
assert.ok(!userVisibleMessages.some((m) => m.isInternal));
console.log("  ✔ Internal note recorded for staff while completely hidden from user views\n");

// Test 7: Unauthorized user blocked from ticket thread
console.log("Test 7: Intruder blocked from viewing/replying to other users' tickets");
const intruderReply = replyToTicket(
  mockUsers.intruder_student.id,
  ticket.id,
  "I am snooping",
  false
);
assert.strictEqual(intruderReply.error, "Unauthorized access to this ticket");
console.log("  ✔ Strict authorization boundary blocks non-ticket owners\n");

// Test 8: Ticket Resolution and Closure
console.log("Test 8: Ticket resolution with resolution remarks");
const resolveRes = updateTicketStatus(
  mockUsers.support_admin.id,
  ticket.id,
  "RESOLVED",
  "Profile update issue resolved."
);
assert.strictEqual(resolveRes.success, true);
assert.strictEqual(ticket.status, "RESOLVED");
assert.strictEqual(ticket.resolution, "Profile update issue resolved.");
console.log("  ✔ Ticket marked RESOLVED with resolution remarks\n");

// Test 9: User Reporting against fake recruiter / suspicious account
console.log("Test 9: User reports suspicious job / account for community safety");
const repRes = submitReport(mockUsers.student_1.id, {
  targetType: "USER",
  reportedUserId: mockUsers.bad_actor.id,
  reason: "FAKE_JOB",
  details: "This user posted a job requiring money for interviews.",
});
assert.strictEqual(repRes.success, true);
assert.strictEqual(mockReports.length, 1);
const report = mockReports[0];
assert.strictEqual(report.status, "PENDING");
assert.strictEqual(report.reason, "FAKE_JOB");
console.log("  ✔ Misconduct report submitted with PENDING status in moderation queue\n");

// Test 10: Admin investigates and suspends bad actor
console.log("Test 10: Admin executes enforcement action (SUSPENDED) on bad actor");
const modRes = moderateReport(mockUsers.support_admin.id, report.id, {
  status: "RESOLVED",
  moderationAction: "SUSPENDED",
  resolutionNotes: "Confirmed fee-charging scam. User account permanently suspended.",
});
assert.strictEqual(modRes.success, true);
assert.strictEqual(report.status, "RESOLVED");
assert.strictEqual(report.actionTaken, "SUSPENDED");
assert.strictEqual(mockUsers.bad_actor.status, "SUSPENDED");
assert.strictEqual(mockAuditLogs.length, 2);
console.log("  ✔ Admin moderation suspends bad actor and logs audit event\n");

console.log("=================================================");
console.log("  ✔ ALL 10 SUPPORT & REPORTING TESTS PASSED!");
console.log("=================================================");
