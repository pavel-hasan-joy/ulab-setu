import assert from "assert";

console.log("================================================================================");
console.log("   ULAB SETU — CAREER MENTORSHIP SYSTEM (PHASE 4) AUDIT & TEST SUITE");
console.log("   Dedicated Mentorship Messaging, Inbox Partitioning & Read-Only Concluded Mode");
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
// In-Memory Simulated Engine & Database for Mentorship Phase 4
// ------------------------------------------------------------------------------

const mockUsers = {
  student_1: {
    id: "usr_student_1",
    name: "Arif Khan",
    email: "arif.khan@ulab.edu.bd",
    role: "STUDENT",
    status: "APPROVED",
    department: "CSE",
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
    designation: "Professor",
  },
  intruder: {
    id: "usr_intruder",
    name: "Malicious Actor",
    email: "intruder@ulab.edu.bd",
    role: "STUDENT",
    status: "APPROVED",
  },
};

let dbConnections = [];
let dbMessages = [];
let dbNotifications = [];
let dbMentorshipRequests = [];

function resetDb() {
  dbConnections = [];
  dbMessages = [];
  dbNotifications = [];
  dbMentorshipRequests = [];
}

// Helper: establish mentorship connection upon request acceptance
function acceptMentorshipWorkflow(requestId, mentorId, studentId, topic) {
  const req = {
    id: requestId,
    mentorId,
    studentId,
    topic,
    status: "ACCEPTED",
  };
  dbMentorshipRequests.push(req);

  let conn = dbConnections.find(
    (c) =>
      c.type === "mentorship" &&
      ((c.fromId === mentorId && c.toId === studentId) ||
        (c.fromId === studentId && c.toId === mentorId))
  );

  if (!conn) {
    conn = {
      id: `conn_mentor_${mentorId}_${studentId}`,
      fromId: mentorId,
      toId: studentId,
      type: "mentorship",
      topic,
      mentorshipRequestId: requestId,
      status: "ACCEPTED",
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    dbConnections.push(conn);
  } else {
    conn.status = "ACCEPTED";
    conn.topic = topic;
    conn.isCompleted = false;
  }

  return conn;
}

// Helper: send message with validation, isolation & read-only guard
function sendMessageAction({ callerId, connectionId, body, attachment }) {
  const user = Object.values(mockUsers).find((u) => u.id === callerId);
  if (!user) return { error: "Unauthenticated" };

  const conn = dbConnections.find(
    (c) => c.id === connectionId && (c.fromId === user.id || c.toId === user.id)
  );
  if (!conn) return { error: "Conversation not found or unauthorized access." };

  if (conn.type === "mentorship" && conn.isCompleted) {
    return {
      error: "This career mentorship has been concluded. The conversation is preserved in read-only mode.",
    };
  }

  const recipientId = conn.fromId === user.id ? conn.toId : conn.fromId;
  const recipient = Object.values(mockUsers).find((u) => u.id === recipientId);

  const trimmedBody = (body || "").trim();
  if (!trimmedBody && !attachment) {
    return { error: "Message body or attachment is required." };
  }

  const msg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    connectionId,
    senderId: user.id,
    body: trimmedBody,
    attachment: attachment || null,
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
  };
  dbMessages.push(msg);

  // Dispatch notification
  if (conn.type === "mentorship") {
    dbNotifications.push({
      userId: recipientId,
      actorId: user.id,
      title: `Mentorship Message from ${user.name}`,
      body: trimmedBody.slice(0, 50),
      type: "MENTORSHIP",
      link: `/${recipient.role.toLowerCase()}/mentorship-messages?c=${connectionId}`,
    });
  } else {
    dbNotifications.push({
      userId: recipientId,
      actorId: user.id,
      title: `Message from ${user.name}`,
      body: trimmedBody.slice(0, 50),
      type: "MESSAGE",
      link: `/${recipient.role.toLowerCase()}/messages?c=${connectionId}`,
    });
  }

  return { success: true, messageId: msg.id };
}

// Helper: fetch messages with read indicator update
function fetchMessagesAction(callerId, connectionId) {
  const user = Object.values(mockUsers).find((u) => u.id === callerId);
  if (!user) return [];

  const conn = dbConnections.find(
    (c) => c.id === connectionId && (c.fromId === user.id || c.toId === user.id)
  );
  if (!conn) return []; // Unauthorized access blocked

  // Mark incoming messages as read
  dbMessages
    .filter((m) => m.connectionId === connectionId && m.senderId !== user.id && !m.isRead)
    .forEach((m) => {
      m.isRead = true;
      m.readAt = new Date().toISOString();
    });

  return dbMessages
    .filter((m) => m.connectionId === connectionId)
    .map((m) => ({
      ...m,
      mine: m.senderId === user.id,
    }));
}

// Helper: query inbox connections by type
function getInboxConnections(userId, type) {
  return dbConnections
    .filter((c) => c.type === type && (c.fromId === userId || c.toId === userId))
    .map((c) => {
      const otherId = c.fromId === userId ? c.toId : c.fromId;
      const other = Object.values(mockUsers).find((u) => u.id === otherId);
      const msgs = dbMessages.filter((m) => m.connectionId === c.id);
      const unreadCount = msgs.filter((m) => m.senderId !== userId && !m.isRead).length;
      return {
        ...c,
        otherUser: other,
        unreadCount,
        lastMessage: msgs[msgs.length - 1],
      };
    });
}

// ------------------------------------------------------------------------------
// TEST SUITE EXECUTION
// ------------------------------------------------------------------------------

resetDb();

// Test 1: General vs Mentorship Type Separation
runTest("1. Strict General vs Mentorship Inbox Separation", () => {
  // Create a general connection between Student 1 and Alumni Mentor
  const generalConn = {
    id: "conn_gen_1",
    fromId: mockUsers.student_1.id,
    toId: mockUsers.alumni_mentor.id,
    type: "general",
    status: "ACCEPTED",
    isCompleted: false,
    createdAt: new Date().toISOString(),
  };
  dbConnections.push(generalConn);

  // Create a mentorship connection between Student 1 and Alumni Mentor
  const mentorConn = acceptMentorshipWorkflow(
    "req_101",
    mockUsers.alumni_mentor.id,
    mockUsers.student_1.id,
    "Software Architecture & Career Roadmap"
  );

  assert.strictEqual(dbConnections.length, 2, "Both connections should exist simultaneously");
  assert.strictEqual(generalConn.type, "general");
  assert.strictEqual(mentorConn.type, "mentorship");

  // Query general inbox
  const studentGenInbox = getInboxConnections(mockUsers.student_1.id, "general");
  assert.strictEqual(studentGenInbox.length, 1);
  assert.strictEqual(studentGenInbox[0].id, generalConn.id);

  // Query mentorship inbox
  const studentMentorInbox = getInboxConnections(mockUsers.student_1.id, "mentorship");
  assert.strictEqual(studentMentorInbox.length, 1);
  assert.strictEqual(studentMentorInbox[0].id, mentorConn.id);
  assert.strictEqual(studentMentorInbox[0].topic, "Software Architecture & Career Roadmap");
});

// Test 2: Mentorship Connection Attributes
runTest("2. Mentorship Connection Attributes (Topic, Status, Completion Flag)", () => {
  const conn = dbConnections.find((c) => c.type === "mentorship");
  assert.ok(conn, "Mentorship connection must exist");
  assert.strictEqual(conn.topic, "Software Architecture & Career Roadmap");
  assert.strictEqual(conn.isCompleted, false);
  assert.strictEqual(conn.mentorshipRequestId, "req_101");
});

// Test 3: Messaging and Real-Time Read Indicators
runTest("3. Mentorship Chat Message Delivery & Read Indicator Tracking", () => {
  const mentorConn = dbConnections.find((c) => c.type === "mentorship");

  // Student sends a message
  const sendRes = sendMessageAction({
    callerId: mockUsers.student_1.id,
    connectionId: mentorConn.id,
    body: "Hello Brother, looking forward to discussing the career roadmap!",
  });
  assert.ok(sendRes.success, "Student should successfully send message");

  // Mentor inbox check: unread count should be 1
  let mentorInbox = getInboxConnections(mockUsers.alumni_mentor.id, "mentorship");
  assert.strictEqual(mentorInbox[0].unreadCount, 1, "Mentor should have 1 unread message");

  // Mentor fetches messages (opens the chat window)
  const messagesForMentor = fetchMessagesAction(mockUsers.alumni_mentor.id, mentorConn.id);
  assert.strictEqual(messagesForMentor.length, 1);
  assert.strictEqual(messagesForMentor[0].mine, false);
  assert.strictEqual(messagesForMentor[0].isRead, true, "Message should now be marked as read");
  assert.ok(messagesForMentor[0].readAt !== null, "readAt timestamp should be recorded");

  // Mentor inbox check again: unread count should be 0
  mentorInbox = getInboxConnections(mockUsers.alumni_mentor.id, "mentorship");
  assert.strictEqual(mentorInbox[0].unreadCount, 0, "Unread count must be 0 after viewing");

  // Student fetches messages: mine should be true, isRead should be true
  const messagesForStudent = fetchMessagesAction(mockUsers.student_1.id, mentorConn.id);
  assert.strictEqual(messagesForStudent[0].mine, true);
  assert.strictEqual(messagesForStudent[0].isRead, true);
});

// Test 4: Notification Routing for Mentorship vs General
runTest("4. Targeted In-App Notification Routing", () => {
  const notif = dbNotifications.find((n) => n.userId === mockUsers.alumni_mentor.id);
  assert.ok(notif, "Notification should be dispatched to recipient");
  assert.strictEqual(notif.type, "MENTORSHIP");
  assert.ok(
    notif.link.includes("/alumni/mentorship-messages?c="),
    `Notification link must point to mentorship messages: ${notif.link}`
  );
});

// Test 5: Unauthorized Intruder Access Rejection
runTest("5. Privacy & Access Control Enforcement", () => {
  const mentorConn = dbConnections.find((c) => c.type === "mentorship");

  // Intruder tries to send a message into private mentorship conversation
  const intruderSend = sendMessageAction({
    callerId: mockUsers.intruder.id,
    connectionId: mentorConn.id,
    body: "I am eavesdropping on your mentorship chat!",
  });
  assert.ok(intruderSend.error, "Intruder must be rejected from sending");

  // Intruder tries to fetch private mentorship messages
  const intruderMsgs = fetchMessagesAction(mockUsers.intruder.id, mentorConn.id);
  assert.strictEqual(intruderMsgs.length, 0, "Intruder must receive zero messages");
});

// Test 6: Concluded Mentorship Read-Only Mode
runTest("6. Concluded Mentorship Read-Only Lock & History Preservation", () => {
  const mentorConn = dbConnections.find((c) => c.type === "mentorship");

  // Conclude the mentorship session
  mentorConn.isCompleted = true;

  // Student tries to send a new message in concluded mentorship
  const postConcludeSend = sendMessageAction({
    callerId: mockUsers.student_1.id,
    connectionId: mentorConn.id,
    body: "Can I ask one more question?",
  });

  assert.ok(postConcludeSend.error, "Sending must be prohibited in concluded mentorship");
  assert.ok(
    postConcludeSend.error.includes("concluded") &&
      postConcludeSend.error.includes("read-only"),
    `Error message must explain read-only preservation: ${postConcludeSend.error}`
  );

  // Past messages must remain intact and retrievable by both participants
  const studentArchive = fetchMessagesAction(mockUsers.student_1.id, mentorConn.id);
  assert.strictEqual(studentArchive.length, 1, "Student can still view chat history");

  const mentorArchive = fetchMessagesAction(mockUsers.alumni_mentor.id, mentorConn.id);
  assert.strictEqual(mentorArchive.length, 1, "Mentor can still view chat history");
});

// Test 7: Faculty Mentorship Messaging Compatibility
runTest("7. Faculty Mentorship Messaging Workflow", () => {
  const facultyConn = acceptMentorshipWorkflow(
    "req_202",
    mockUsers.faculty_mentor.id,
    mockUsers.student_1.id,
    "Higher Studies & Thesis Guidance"
  );

  // Faculty sends advisory message
  const sendRes = sendMessageAction({
    callerId: mockUsers.faculty_mentor.id,
    connectionId: facultyConn.id,
    body: "Please prepare your preliminary literature review before our meeting.",
  });
  assert.ok(sendRes.success, "Faculty can send mentorship message");

  // Faculty inbox check
  const facultyInbox = getInboxConnections(mockUsers.faculty_mentor.id, "mentorship");
  assert.strictEqual(facultyInbox.length, 1);
  assert.strictEqual(facultyInbox[0].topic, "Higher Studies & Thesis Guidance");

  // Check notification routing to student
  const studentNotif = dbNotifications.find(
    (n) => n.userId === mockUsers.student_1.id && n.actorId === mockUsers.faculty_mentor.id
  );
  assert.ok(studentNotif);
  assert.strictEqual(studentNotif.type, "MENTORSHIP");
  assert.ok(studentNotif.link.includes("/student/mentorship-messages?c="));
});

console.log("\n--------------------------------------------------------------------------------");
console.log(`Phase 4 Mentorship Messaging Verification Results: ${passed}/${total} passed`);
console.log("--------------------------------------------------------------------------------\n");

if (passed === total) {
  console.log(">>> ALL CAREER MENTORSHIP PHASE 4 TESTS PASSED SUCCESSFULLY! <<<\n");
  process.exit(0);
} else {
  console.error(">>> SOME TESTS FAILED! <<<\n");
  process.exit(1);
}

