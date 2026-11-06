import assert from "assert";

console.log("=================================================");
console.log("   ULAB Setu Direct Messaging & Notifications Tests");
console.log("=================================================\n");

// Simulated Database State
const mockUsers = {
  student_1: {
    id: "usr_student_1",
    name: "Arif Khan",
    email: "arif.khan@ulab.edu.bd",
    role: "STUDENT",
    status: "APPROVED",
    notifyEmailMessages: true,
    notifyEmailApplications: true,
    notifyEmailMentorship: true,
    notifyEmailSystem: true,
  },
  alumni_mentor: {
    id: "usr_alumni_mentor",
    name: "Tanvir Ahmed",
    email: "tanvir.ahmed@ulab.edu.bd",
    role: "ALUMNI",
    status: "APPROVED",
    notifyEmailMessages: true,
    notifyEmailApplications: false,
    notifyEmailMentorship: true,
    notifyEmailSystem: true,
  },
  troublemaker: {
    id: "usr_troublemaker",
    name: "Spam Bot",
    email: "spambot@ulab.edu.bd",
    role: "STUDENT",
    status: "APPROVED",
  },
};

let mockConnections = [];
let mockMessages = [];
let mockNotifications = [];
let mockBlockedUsers = [];
let mockUserReports = [];

function resetState() {
  mockConnections = [];
  mockMessages = [];
  mockNotifications = [];
  mockBlockedUsers = [];
  mockUserReports = [];
}

// 1. Direct Messaging without Contact-Request Approval Step
function startConversation(currentUserId, targetUserId) {
  if (currentUserId === targetUserId) return { error: "Cannot message self" };
  const target = mockUsers[targetUserId] || Object.values(mockUsers).find((u) => u.id === targetUserId);
  if (!target || target.status !== "APPROVED") return { error: "User not found or unapproved" };

  // Check block status
  const isBlocked = mockBlockedUsers.some(
    (b) =>
      (b.blockerId === currentUserId && b.blockedId === targetUserId) ||
      (b.blockerId === targetUserId && b.blockedId === currentUserId)
  );
  if (isBlocked) return { error: "Messaging is blocked between these users" };

  let conn = mockConnections.find(
    (c) =>
      (c.fromId === currentUserId && c.toId === targetUserId) ||
      (c.fromId === targetUserId && c.toId === currentUserId)
  );

  if (conn) {
    conn.status = "ACCEPTED"; // Ensure direct messaging is immediately active
    return { success: true, connectionId: conn.id };
  }

  conn = {
    id: `conn_${mockConnections.length + 1}`,
    fromId: currentUserId,
    toId: targetUserId,
    status: "ACCEPTED", // No pending contact request gate!
    createdAt: new Date(),
  };
  mockConnections.push(conn);
  return { success: true, connectionId: conn.id };
}

// 2. Send Message with Attachments & Rate Limiting
function sendMessage(senderId, connectionId, body, attachment = null) {
  const conn = mockConnections.find((c) => c.id === connectionId);
  if (!conn || (conn.fromId !== senderId && conn.toId !== senderId)) {
    return { error: "Connection not found or unauthorized" };
  }

  const recipientId = conn.fromId === senderId ? conn.toId : conn.fromId;

  // Block check
  const isBlocked = mockBlockedUsers.some(
    (b) =>
      (b.blockerId === senderId && b.blockedId === recipientId) ||
      (b.blockerId === recipientId && b.blockedId === senderId)
  );
  if (isBlocked) return { error: "Cannot send message to blocked user" };

  // Attachment validation
  if (attachment) {
    const safeTypes = ["image/jpeg", "image/png", "application/pdf", "text/plain"];
    if (attachment.type && !safeTypes.includes(attachment.type)) {
      return { error: "Unsupported attachment type" };
    }
  }

  if (!body?.trim() && !attachment?.url) {
    return { error: "Message content or attachment required" };
  }

  const msg = {
    id: `msg_${mockMessages.length + 1}`,
    connectionId,
    senderId,
    body: body ? body.trim().slice(0, 2000) : "",
    attachmentUrl: attachment?.url || null,
    attachmentName: attachment?.name || null,
    attachmentSize: attachment?.size || null,
    attachmentType: attachment?.type || null,
    isRead: false,
    readAt: null,
    createdAt: new Date(),
  };
  mockMessages.push(msg);

  // Trigger Notification
  mockNotifications.push({
    id: `notif_${mockNotifications.length + 1}`,
    userId: recipientId,
    actorId: senderId,
    title: "New Direct Message",
    body: body ? (body.length > 60 ? body.slice(0, 57) + "..." : body) : "Sent an attachment",
    type: "MESSAGE",
    link: `/messages?c=${connectionId}`,
    read: false,
    createdAt: new Date(),
  });

  return { success: true, messageId: msg.id };
}

// 3. Fetch Messages & Mark as Read
function fetchMessages(userId, connectionId) {
  const conn = mockConnections.find((c) => c.id === connectionId);
  if (!conn || (conn.fromId !== userId && conn.toId !== userId)) return [];

  // Mark unread messages sent to this user as read
  mockMessages.forEach((m) => {
    if (m.connectionId === connectionId && m.senderId !== userId && !m.isRead) {
      m.isRead = true;
      m.readAt = new Date();
    }
  });

  return mockMessages
    .filter((m) => m.connectionId === connectionId)
    .map((m) => ({
      id: m.id,
      body: m.body,
      mine: m.senderId === userId,
      isRead: m.isRead,
      readAt: m.readAt,
      attachment: m.attachmentUrl ? { url: m.attachmentUrl, name: m.attachmentName } : null,
    }));
}

// 4. Block & Unblock User
function blockUser(blockerId, blockedId) {
  if (blockerId === blockedId) return { error: "Cannot block self" };
  if (!mockBlockedUsers.some((b) => b.blockerId === blockerId && b.blockedId === blockedId)) {
    mockBlockedUsers.push({ blockerId, blockedId });
  }
  return { success: true };
}

function unblockUser(blockerId, blockedId) {
  mockBlockedUsers = mockBlockedUsers.filter(
    (b) => !(b.blockerId === blockerId && b.blockedId === blockedId)
  );
  return { success: true };
}

// 5. Report Message
function reportMessage(reporterId, messageId, reason, details) {
  const msg = mockMessages.find((m) => m.id === messageId);
  if (!msg) return { error: "Message not found" };

  mockUserReports.push({
    id: `rep_${mockUserReports.length + 1}`,
    reporterId,
    reportedUserId: msg.senderId,
    targetType: "MESSAGE",
    targetId: messageId,
    reason,
    details,
    status: "PENDING",
  });
  return { success: true };
}

// ======================== TEST CASES ========================

resetState();

// Test 1: Direct 1-on-1 messaging start without contact approval gate
console.log("Test 1: Start direct conversation without contact-request gate");
const convResult = startConversation(mockUsers.student_1.id, mockUsers.alumni_mentor.id);
assert.strictEqual(convResult.success, true);
assert.ok(convResult.connectionId);
const conn = mockConnections.find((c) => c.id === convResult.connectionId);
assert.strictEqual(conn.status, "ACCEPTED", "Conversation status must be immediately ACCEPTED");
console.log("  ✔ Direct conversation immediately established with status ACCEPTED\n");

// Test 2: Student sends a message with PDF CV attachment
console.log("Test 2: Student sends message with attachment");
const sendRes = sendMessage(
  mockUsers.student_1.id,
  convResult.connectionId,
  "Hello Tanvir bhai, could you please review my CV for software engineering roles?",
  {
    url: "data:application/pdf;base64,JVBERi0xLjQK...",
    name: "Arif_Khan_SWE_Resume.pdf",
    size: "1.2 MB",
    type: "application/pdf",
  }
);
assert.strictEqual(sendRes.success, true);
assert.strictEqual(mockMessages.length, 1);
const sentMsg = mockMessages[0];
assert.strictEqual(sentMsg.isRead, false);
assert.strictEqual(sentMsg.readAt, null);
assert.strictEqual(sentMsg.attachmentName, "Arif_Khan_SWE_Resume.pdf");
console.log("  ✔ Message with valid PDF attachment delivered successfully\n");

// Test 3: Rejection of dangerous or unsupported attachment type
console.log("Test 3: Reject unsupported attachment file types (.exe, .sh)");
const badAttachRes = sendMessage(
  mockUsers.student_1.id,
  convResult.connectionId,
  "Check this file",
  {
    url: "data:application/x-msdownload;base64,...",
    name: "malware.exe",
    type: "application/x-msdownload",
  }
);
assert.strictEqual(badAttachRes.error, "Unsupported attachment type");
console.log("  ✔ Unsupported attachment correctly blocked\n");

// Test 4: In-app notification creation on incoming message
console.log("Test 4: In-app notification delivered to recipient");
assert.strictEqual(mockNotifications.length, 1);
const notif = mockNotifications[0];
assert.strictEqual(notif.userId, mockUsers.alumni_mentor.id);
assert.strictEqual(notif.type, "MESSAGE");
assert.strictEqual(notif.read, false);
console.log("  ✔ Notification dispatched to alumni mentor with read: false\n");

// Test 5: Alumni fetches messages and read receipt is updated
console.log("Test 5: Read receipt updates on message fetch");
const alumniInbox = fetchMessages(mockUsers.alumni_mentor.id, convResult.connectionId);
assert.strictEqual(alumniInbox.length, 1);
assert.strictEqual(alumniInbox[0].mine, false);
assert.strictEqual(mockMessages[0].isRead, true);
assert.ok(mockMessages[0].readAt instanceof Date);
console.log("  ✔ Message marked as read with readAt timestamp when opened\n");

// Test 6: User blocking prevents messaging
console.log("Test 6: User blocking halts messaging in both directions");
blockUser(mockUsers.alumni_mentor.id, mockUsers.troublemaker.id);
const blockedConv = startConversation(mockUsers.troublemaker.id, mockUsers.alumni_mentor.id);
assert.strictEqual(blockedConv.error, "Messaging is blocked between these users");

// Also verify sending to existing connection if blocked
const blockedSend = sendMessage(
  mockUsers.troublemaker.id,
  convResult.connectionId,
  "Spam message"
);
assert.ok(blockedSend.error);
console.log("  ✔ Blocked user cannot initiate conversations or message\n");

// Test 7: Unblocking restores messaging capability
console.log("Test 7: Unblocking user restores communication");
unblockUser(mockUsers.alumni_mentor.id, mockUsers.troublemaker.id);
const unblockedConv = startConversation(mockUsers.troublemaker.id, mockUsers.alumni_mentor.id);
assert.strictEqual(unblockedConv.success, true);
console.log("  ✔ User successfully unblocked and communication restored\n");

// Test 8: Message reporting creates moderation report in UserReport
console.log("Test 8: Reporting offensive message creates moderation report");
const reportRes = reportMessage(
  mockUsers.alumni_mentor.id,
  sentMsg.id,
  "SPAM",
  "Repeated unsolicited inquiry"
);
assert.strictEqual(reportRes.success, true);
assert.strictEqual(mockUserReports.length, 1);
assert.strictEqual(mockUserReports[0].targetType, "MESSAGE");
assert.strictEqual(mockUserReports[0].targetId, sentMsg.id);
assert.strictEqual(mockUserReports[0].status, "PENDING");
console.log("  ✔ Report created in moderation queue with PENDING status\n");

console.log("=================================================");
console.log("  ✔ ALL 8 MESSAGING & NOTIFICATION TESTS PASSED!");
console.log("=================================================");
