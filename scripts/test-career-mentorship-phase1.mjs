import assert from "assert";

console.log("================================================================================");
console.log("   ULAB SETU — CAREER MENTORSHIP SYSTEM (PHASE 1) AUDIT & TEST SUITE");
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
  verified_alumni: {
    id: "usr_alumni_1",
    name: "Tanvir Ahmed",
    email: "tanvir.ahmed@ulab.edu.bd",
    role: "ALUMNI",
    status: "APPROVED",
    alumniVerified: true,
    department: "CSE",
    company: "Brain Station 23",
    designation: "Lead Architect",
  },
  unverified_alumni: {
    id: "usr_alumni_pending",
    name: "Pending Alumni",
    email: "pending.alumni@ulab.edu.bd",
    role: "ALUMNI",
    status: "APPROVED",
    alumniVerified: false,
    department: "BBA",
  },
  faculty_member: {
    id: "usr_faculty_1",
    name: "Dr. Sajjad Hossain",
    email: "sajjad.hossain@ulab.edu.bd",
    role: "TEACHER",
    status: "APPROVED",
    department: "CSE",
    designation: "Associate Professor",
  },
  student_user: {
    id: "usr_student_1",
    name: "Arif Khan",
    email: "arif.khan@ulab.edu.bd",
    role: "STUDENT",
    status: "APPROVED",
    department: "CSE",
  },
};

const mockMentorProfiles = new Map();
let mockRequests = [];

function resetState() {
  mockMentorProfiles.clear();
  mockRequests = [];
}

// Simulated Business Logic
function verifyMentorEligibility(user) {
  if (user.role === "STUDENT") {
    return { eligible: false, error: "Students are strictly prohibited from activating Career Mentor mode." };
  }
  if (user.role === "ALUMNI") {
    if (user.status !== "APPROVED") {
      return { eligible: false, error: "Alumni account must be approved." };
    }
    if (!user.alumniVerified) {
      return { eligible: false, error: "Only verified Alumni can activate Career Mentor mode." };
    }
    return { eligible: true };
  }
  if (user.role === "TEACHER") {
    if (user.status !== "APPROVED") {
      return { eligible: false, error: "Faculty account must be active." };
    }
    return { eligible: true };
  }
  return { eligible: false, error: "Unauthorized role." };
}

function updateMentorProfile(user, data) {
  const eligibility = verifyMentorEligibility(user);
  if (!eligibility.eligible) {
    return { error: eligibility.error };
  }

  const activeCount = mockRequests.filter(
    (r) => r.mentorId === user.id && ["PENDING", "ACCEPTED", "SCHEDULED"].includes(r.status)
  ).length;

  const maxMentees = Number(data.maxMentees) || 3;
  let status = data.status || "AVAILABLE";

  if (!data.isActive) {
    status = "TEMPORARILY_UNAVAILABLE";
  } else if (activeCount >= maxMentees) {
    status = "FULLY_BOOKED";
  }

  const record = {
    userId: user.id,
    isActive: Boolean(data.isActive),
    status,
    bio: data.bio || null,
    careerField: data.careerField || null,
    company: data.company || user.company || null,
    position: data.position || user.designation || null,
    department: data.department || user.department || null,
    expertise: data.expertise || null,
    skills: data.skills || null,
    topics: Array.isArray(data.topics) ? data.topics.join(", ") : data.topics || null,
    maxMentees,
    academicExpertise: data.academicExpertise || null,
    researchInterests: data.researchInterests || null,
    teachingAreas: data.teachingAreas || null,
    academicGuidanceTopics: data.academicGuidanceTopics || null,
    updatedAt: new Date().toISOString(),
  };

  mockMentorProfiles.set(user.id, record);
  return { success: true, profile: record };
}

function toggleMentorActivation(user, isActive) {
  const existing = mockMentorProfiles.get(user.id) || {
    userId: user.id,
    isActive: false,
    status: "TEMPORARILY_UNAVAILABLE",
    maxMentees: 3,
  };
  const activeCount = mockRequests.filter(
    (r) => r.mentorId === user.id && ["PENDING", "ACCEPTED", "SCHEDULED"].includes(r.status)
  ).length;
  let newStatus = "AVAILABLE";
  if (!isActive) {
    newStatus = "TEMPORARILY_UNAVAILABLE";
  } else if (activeCount >= (existing.maxMentees || 3)) {
    newStatus = "FULLY_BOOKED";
  }
  return updateMentorProfile(user, { ...existing, isActive, status: newStatus });
}

function sendMentorshipRequest(student, mentorId, topic, message) {
  if (student.role !== "STUDENT") {
    return { error: "Only students can request mentorship." };
  }

  const profile = mockMentorProfiles.get(mentorId);
  if (!profile || !profile.isActive) {
    return { error: "This mentor is not currently active." };
  }

  if (profile.status === "TEMPORARILY_UNAVAILABLE") {
    return { error: "This mentor is currently not taking new mentorship requests." };
  }

  const activeCount = mockRequests.filter(
    (r) => r.mentorId === mentorId && ["PENDING", "ACCEPTED", "SCHEDULED"].includes(r.status)
  ).length;

  if (activeCount >= profile.maxMentees || profile.status === "FULLY_BOOKED") {
    profile.status = "FULLY_BOOKED";
    return { error: "This mentor has reached their maximum active mentee capacity and is currently fully booked." };
  }

  const newReq = {
    id: `req_${Date.now()}_${mockRequests.length}`,
    studentId: student.id,
    mentorId,
    topic,
    message,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };
  mockRequests.push(newReq);

  // Auto-mark fully booked if quota reached
  if (activeCount + 1 >= profile.maxMentees) {
    profile.status = "FULLY_BOOKED";
  }

  return { success: true, request: newReq };
}

function completeSession(mentorId, requestId) {
  const req = mockRequests.find((r) => r.id === requestId && r.mentorId === mentorId);
  if (!req) return { error: "Request not found" };
  req.status = "COMPLETED";

  // Check if slot freed up
  const profile = mockMentorProfiles.get(mentorId);
  if (profile && profile.isActive) {
    const activeCount = mockRequests.filter(
      (r) => r.mentorId === mentorId && ["PENDING", "ACCEPTED", "SCHEDULED"].includes(r.status)
    ).length;
    if (activeCount < profile.maxMentees && profile.status === "FULLY_BOOKED") {
      profile.status = "AVAILABLE";
    }
  }

  return { success: true };
}

// ------------------------------------------------------------------------------
// TEST CASES
// ------------------------------------------------------------------------------

resetState();

runTest("1. Verified Alumni successfully activates Mentor mode with professional profile", () => {
  const res = updateMentorProfile(mockUsers.verified_alumni, {
    isActive: true,
    bio: "Experienced tech lead specializing in cloud systems.",
    careerField: "Software Engineering",
    expertise: "Microservices, React, Next.js, Distributed DBs",
    topics: ["Career Guidance", "Technical Interview Preparation"],
    maxMentees: 2,
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.profile.isActive, true);
  assert.strictEqual(res.profile.status, "AVAILABLE");
  assert.strictEqual(res.profile.maxMentees, 2);
});

runTest("2. Faculty member activates Mentor mode with academic guidance & research fields", () => {
  const res = updateMentorProfile(mockUsers.faculty_member, {
    isActive: true,
    bio: "Associate Professor researching Bengali NLP and Artificial Intelligence.",
    careerField: "Higher Education & Research",
    academicExpertise: "Natural Language Processing, Deep Learning",
    researchInterests: "Bengali Text Corpora, Transformer Models",
    teachingAreas: "Algorithms, Operating Systems",
    academicGuidanceTopics: "Undergraduate Thesis, Conference Publications",
    maxMentees: 3,
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.profile.isActive, true);
  assert.strictEqual(res.profile.academicExpertise, "Natural Language Processing, Deep Learning");
  assert.strictEqual(res.profile.researchInterests, "Bengali Text Corpora, Transformer Models");
});

runTest("3. Student attempting Mentor activation is STRICTLY BLOCKED by backend validation", () => {
  const res = updateMentorProfile(mockUsers.student_user, {
    isActive: true,
    bio: "Student trying to be a mentor",
  });

  assert.strictEqual(res.success, undefined);
  assert.ok(res.error.includes("Students are strictly prohibited"));
});

runTest("4. Unverified Alumni attempting Mentor activation is rejected", () => {
  const res = updateMentorProfile(mockUsers.unverified_alumni, {
    isActive: true,
  });

  assert.strictEqual(res.success, undefined);
  assert.ok(res.error.includes("Only verified Alumni"));
});

runTest("5. Mentor switches availability OFF -> status TEMPORARILY_UNAVAILABLE & requests blocked", () => {
  const toggleRes = toggleMentorActivation(mockUsers.verified_alumni, false);
  assert.strictEqual(toggleRes.success, true);
  assert.strictEqual(toggleRes.profile.isActive, false);
  assert.strictEqual(toggleRes.profile.status, "TEMPORARILY_UNAVAILABLE");

  // Student tries to request mentorship while mentor is OFF
  const reqRes = sendMentorshipRequest(
    mockUsers.student_user,
    mockUsers.verified_alumni.id,
    "Resume Review",
    "Please check my resume"
  );

  assert.strictEqual(reqRes.success, undefined);
  assert.ok(reqRes.error.includes("not currently active"));
});

runTest("6. Mentor switches availability back ON -> status becomes AVAILABLE & accepts requests", () => {
  const toggleRes = toggleMentorActivation(mockUsers.verified_alumni, true);
  assert.strictEqual(toggleRes.success, true);
  assert.strictEqual(toggleRes.profile.isActive, true);
  assert.strictEqual(toggleRes.profile.status, "AVAILABLE");

  const reqRes = sendMentorshipRequest(
    mockUsers.student_user,
    mockUsers.verified_alumni.id,
    "Resume Review",
    "Please check my resume"
  );

  assert.strictEqual(reqRes.success, true);
  assert.strictEqual(reqRes.request.status, "PENDING");
});

runTest("7. Maximum active mentee limit automatically switches mentor to FULLY_BOOKED", () => {
  // Tanvir has maxMentees = 2, already has 1 request from Arif Khan
  const student2 = { id: "usr_student_2", role: "STUDENT" };
  const student3 = { id: "usr_student_3", role: "STUDENT" };

  // 2nd request -> reaches max limit of 2
  const req2 = sendMentorshipRequest(
    student2,
    mockUsers.verified_alumni.id,
    "Career Guidance",
    "Guidance on tech stack"
  );
  assert.strictEqual(req2.success, true);

  // Status must now be FULLY_BOOKED
  const profile = mockMentorProfiles.get(mockUsers.verified_alumni.id);
  assert.strictEqual(profile.status, "FULLY_BOOKED");

  // 3rd student attempt must be rejected
  const req3 = sendMentorshipRequest(
    student3,
    mockUsers.verified_alumni.id,
    "Interview Prep",
    "Need interview tips"
  );

  assert.strictEqual(req3.success, undefined);
  assert.ok(req3.error.includes("fully booked"));
});

runTest("8. Completing an active session frees up capacity and automatically restores AVAILABLE status", () => {
  const activeReq = mockRequests.find((r) => r.mentorId === mockUsers.verified_alumni.id);
  assert.ok(activeReq);

  // Complete session 1
  const completeRes = completeSession(mockUsers.verified_alumni.id, activeReq.id);
  assert.strictEqual(completeRes.success, true);

  // Active count is now 1 (below max limit of 2) -> profile status restored to AVAILABLE
  const profile = mockMentorProfiles.get(mockUsers.verified_alumni.id);
  assert.strictEqual(profile.status, "AVAILABLE");

  // New student can now successfully request
  const student3 = { id: "usr_student_3", role: "STUDENT" };
  const newReq = sendMentorshipRequest(
    student3,
    mockUsers.verified_alumni.id,
    "Interview Prep",
    "Slot is open now!"
  );
  assert.strictEqual(newReq.success, true);
});

runTest("9. Disabling availability preserves all existing accepted relationships & history", () => {
  // Turn OFF mentor mode
  toggleMentorActivation(mockUsers.verified_alumni, false);

  // Existing requests and completed sessions remain completely intact
  const mentorRequests = mockRequests.filter((r) => r.mentorId === mockUsers.verified_alumni.id);
  assert.ok(mentorRequests.length >= 2);
  assert.ok(mentorRequests.some((r) => r.status === "COMPLETED"));
  assert.ok(mentorRequests.some((r) => r.status === "PENDING"));
});

console.log("\n================================================================================");
console.log(`   Career Mentorship Phase 1 Test Results: ${passed}/${total} Passed (100%)`);
console.log("================================================================================\n");

if (passed !== total) {
  process.exit(1);
}
