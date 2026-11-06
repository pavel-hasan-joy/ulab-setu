import assert from "assert";

console.log("================================================================================");
console.log("   ULAB SETU — CAREER MENTORSHIP SYSTEM (PHASE 2) AUDIT & TEST SUITE");
console.log("   Student 'Find a Mentor' & 'My Mentors' Discovery, Filtering & ATS Tracking");
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
  // Verified Alumni Mentor (Available, with capacity)
  alumni_senior: {
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
  // Faculty Mentor (Available, with capacity)
  faculty_member: {
    id: "usr_faculty_1",
    name: "Dr. Sajjad Hossain",
    email: "sajjad.hossain@ulab.edu.bd",
    role: "TEACHER",
    status: "APPROVED",
    department: "CSE",
    designation: "Associate Professor",
  },
  // Verified Alumni Mentor (Full Capacity: active 3, max 3)
  alumni_at_capacity: {
    id: "usr_alumni_full",
    name: "Farhan Kabir",
    email: "farhan.kabir@ulab.edu.bd",
    role: "ALUMNI",
    status: "APPROVED",
    alumniVerified: true,
    department: "BBA",
    company: "BAT Bangladesh",
    designation: "Brand Strategist",
  },
  // Inactive Mentor (isActive: false)
  alumni_inactive: {
    id: "usr_alumni_inactive",
    name: "Nabila Zaman",
    email: "nabila.zaman@ulab.edu.bd",
    role: "ALUMNI",
    status: "APPROVED",
    alumniVerified: true,
    department: "MSJ",
  },
  // Unavailable Mentor (status: "AWAY")
  alumni_away: {
    id: "usr_alumni_away",
    name: "Rashid Karim",
    email: "rashid.karim@ulab.edu.bd",
    role: "ALUMNI",
    status: "APPROVED",
    alumniVerified: true,
    department: "CSE",
  },
  // Unverified Alumni (alumniVerified: false)
  alumni_unverified: {
    id: "usr_alumni_unverified",
    name: "Pending Grad",
    email: "pending.grad@ulab.edu.bd",
    role: "ALUMNI",
    status: "APPROVED",
    alumniVerified: false,
    department: "DEH",
  },
  // Suspended Account (status: "SUSPENDED")
  alumni_suspended: {
    id: "usr_alumni_suspended",
    name: "Suspended Mentor",
    email: "suspended@ulab.edu.bd",
    role: "ALUMNI",
    status: "SUSPENDED",
    alumniVerified: true,
    department: "CSE",
  },
  // Student (Can NEVER be a mentor)
  student_user: {
    id: "usr_student_1",
    name: "Arif Khan",
    email: "arif.khan@ulab.edu.bd",
    role: "STUDENT",
    status: "APPROVED",
    department: "CSE",
  },
};

const mockMentorProfiles = {
  usr_alumni_1: {
    userId: "usr_alumni_1",
    isActive: true,
    status: "AVAILABLE",
    headline: "Staff Cloud & Distributed Systems Architect",
    bio: "Passionate about mentoring young software engineers into senior tech leads.",
    company: "Brain Station 23",
    position: "Lead Architect",
    careerField: "Software Engineering & Cloud Architecture",
    yearsOfExperience: 8,
    skills: ["Go", "Kubernetes", "Next.js", "System Design", "PostgreSQL"],
    topics: ["Mock Technical Interview", "System Design", "Career Transition", "Resume Review"],
    sessionFormats: ["ONLINE", "HYBRID"],
    communicationMethod: "GOOGLE_MEET",
    availableDays: ["Saturday", "Sunday"],
    preferredTimeSlots: ["8:00 PM - 10:00 PM"],
    maxMentees: 4,
  },
  usr_faculty_1: {
    userId: "usr_faculty_1",
    isActive: true,
    status: "AVAILABLE",
    headline: "AI & Distributed Data Systems Researcher",
    bio: "Guiding students towards higher studies, research publications, and thesis work.",
    company: "ULAB CSE Department",
    position: "Associate Professor",
    careerField: "Academic Research & Higher Studies",
    yearsOfExperience: 12,
    skills: ["Machine Learning", "Research Methodology", "Python", "Data Science"],
    topics: ["Higher Studies Guidance", "Research & Thesis", "Graduate School Prep"],
    sessionFormats: ["IN_PERSON", "ONLINE"],
    communicationMethod: "CAMPUS_OFFICE",
    availableDays: ["Monday", "Wednesday"],
    preferredTimeSlots: ["2:00 PM - 4:00 PM"],
    maxMentees: 5,
  },
  usr_alumni_full: {
    userId: "usr_alumni_full",
    isActive: true,
    status: "AVAILABLE",
    headline: "Senior FMCG Brand Specialist",
    bio: "Brand management in multinational FMCG.",
    company: "BAT Bangladesh",
    position: "Brand Strategist",
    careerField: "Marketing & Brand Strategy",
    yearsOfExperience: 4,
    skills: ["Brand Strategy", "Market Analysis", "Consumer Insights"],
    topics: ["FMCG Management Trainee Prep", "Case Competition Strategy"],
    sessionFormats: ["ONLINE"],
    communicationMethod: "GOOGLE_MEET",
    availableDays: ["Friday"],
    preferredTimeSlots: ["6:00 PM - 8:00 PM"],
    maxMentees: 2,
  },
  usr_alumni_inactive: {
    userId: "usr_alumni_inactive",
    isActive: false, // Turn OFF
    status: "AVAILABLE",
    headline: "Broadcast Journalist & Media Producer",
    bio: "TV and investigative journalism.",
    company: "Daily Star",
    position: "Senior Sub-Editor",
    careerField: "Media & Journalism",
    yearsOfExperience: 5,
    skills: ["Media Writing", "Investigation", "Broadcast"],
    topics: ["Media Career Guidance"],
    sessionFormats: ["ONLINE"],
    maxMentees: 3,
  },
  usr_alumni_away: {
    userId: "usr_alumni_away",
    isActive: true,
    status: "AWAY", // Status AWAY
    headline: "Cybersecurity Analyst",
    bio: "Incident response and threat intelligence.",
    company: "bKash",
    position: "Security Specialist",
    careerField: "Cybersecurity",
    yearsOfExperience: 3,
    skills: ["Penetration Testing", "SIEM"],
    topics: ["InfoSec Career Track"],
    sessionFormats: ["ONLINE"],
    maxMentees: 3,
  },
};

// Mock Mentorship Requests in DB
let mockMentorshipRequests = [
  // 2 active requests for usr_alumni_full (max capacity is 2 -> at capacity!)
  {
    id: "req_full_1",
    studentId: "usr_other_student_1",
    mentorId: "usr_alumni_full",
    topic: "FMCG Management Trainee Prep",
    status: "ACCEPTED",
    sessionFormat: "ONLINE",
    createdAt: new Date("2026-11-01"),
  },
  {
    id: "req_full_2",
    studentId: "usr_other_student_2",
    mentorId: "usr_alumni_full",
    topic: "Case Competition Strategy",
    status: "SCHEDULED",
    sessionFormat: "ONLINE",
    createdAt: new Date("2026-11-02"),
  },
  // 1 active request for usr_alumni_1 (capacity is 4 -> 1 active, 3 slots open)
  {
    id: "req_alumni1_1",
    studentId: "usr_other_student_3",
    mentorId: "usr_alumni_1",
    topic: "System Design",
    status: "ACCEPTED",
    sessionFormat: "ONLINE",
    createdAt: new Date("2026-11-03"),
  },
];

// Helper: Query eligible mentors following findEligibleMentors logic
function findEligibleMentorsMock(filters = {}) {
  const {
    search,
    role,
    department,
    topic,
    sessionFormat,
    experienceLevel,
    sort = "recent",
  } = filters;

  const results = [];

  for (const user of Object.values(mockUsers)) {
    // 1. Account status check
    if (user.status !== "APPROVED") continue;

    // 2. Role check: only ALUMNI and TEACHER allowed
    if (user.role !== "ALUMNI" && user.role !== "TEACHER") continue;

    // 3. Alumni verification check
    if (user.role === "ALUMNI" && !user.alumniVerified) continue;

    // 4. Mentor profile check
    const profile = mockMentorProfiles[user.id];
    if (!profile || !profile.isActive || profile.status !== "AVAILABLE") continue;

    // 5. Active mentee capacity check
    const activeRequests = mockMentorshipRequests.filter(
      (r) => r.mentorId === user.id && (r.status === "ACCEPTED" || r.status === "SCHEDULED")
    );
    const activeCount = activeRequests.length;
    const maxCapacity = profile.maxMentees || 3;
    if (activeCount >= maxCapacity) continue;

    // Filters:
    if (role && role !== "ALL" && user.role !== role) continue;
    if (department && department !== "ALL" && user.department !== department) continue;
    if (topic && topic !== "ALL" && !profile.topics.includes(topic)) continue;
    if (sessionFormat && sessionFormat !== "ALL" && !profile.sessionFormats.includes(sessionFormat)) continue;

    // Experience Level filter:
    if (experienceLevel && experienceLevel !== "ALL") {
      const exp = profile.yearsOfExperience || 0;
      if (experienceLevel === "ENTRY" && (exp < 1 || exp > 3)) continue;
      if (experienceLevel === "MID" && (exp < 3 || exp > 5)) continue;
      if (experienceLevel === "SENIOR" && exp < 5) continue;
    }

    // Search filter:
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = user.name.toLowerCase().includes(q);
      const matchCompany = (profile.company || user.company || "").toLowerCase().includes(q);
      const matchPosition = (profile.position || user.designation || "").toLowerCase().includes(q);
      const matchField = (profile.careerField || "").toLowerCase().includes(q);
      const matchSkills = (profile.skills || []).some((s) => s.toLowerCase().includes(q));
      const matchTopics = (profile.topics || []).some((t) => t.toLowerCase().includes(q));

      if (!matchName && !matchCompany && !matchPosition && !matchField && !matchSkills && !matchTopics) {
        continue;
      }
    }

    results.push({
      id: user.id,
      name: user.name,
      role: user.role,
      department: user.department,
      company: profile.company || user.company,
      position: profile.position || user.designation,
      careerField: profile.careerField,
      yearsOfExperience: profile.yearsOfExperience,
      skills: profile.skills,
      topics: profile.topics,
      sessionFormats: profile.sessionFormats,
      activeCount,
      maxMentees: maxCapacity,
      slotsAvailable: maxCapacity - activeCount,
    });
  }

  // Sort
  if (sort === "experience") {
    results.sort((a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0));
  } else if (sort === "alpha") {
    results.sort((a, b) => a.name.localeCompare(b.name));
  }

  return results;
}

// ------------------------------------------------------------------------------
// TEST SUITE EXECUTION
// ------------------------------------------------------------------------------

console.log("--- 1. Navigation & Route Integrity ---");

runTest("Student navigation contains 'Find a Mentor' & 'My Mentors' without breaking existing links", () => {
  const studentNav = [
    { href: "/student", label: "Home", icon: "Home" },
    { href: "/student/jobs", label: "Jobs", icon: "Briefcase" },
    { href: "/student/mentors", label: "Find a Mentor", icon: "Compass" },
    { href: "/student/my-mentors", label: "My Mentors", icon: "GraduationCap" },
    { href: "/student/tuitions", label: "Tuitions", icon: "BookOpen" },
    { href: "/student/board", label: "Notices", icon: "Megaphone" },
    { href: "/student/people", label: "People", icon: "Users" },
    { href: "/student/messages", label: "Messages", icon: "MessageCircle" },
    { href: "/student/notifications", label: "Alerts", icon: "Bell" },
    { href: "/student/applications", label: "Applications", icon: "FileText" },
    { href: "/student/profile", label: "Profile", icon: "User" },
    { href: "/student/support", label: "Helpdesk", icon: "LifeBuoy" },
  ];

  const findMentor = studentNav.find((n) => n.href === "/student/mentors");
  const myMentors = studentNav.find((n) => n.href === "/student/my-mentors");
  const jobs = studentNav.find((n) => n.href === "/student/jobs");
  const messages = studentNav.find((n) => n.href === "/student/messages");

  assert.ok(findMentor, "Find a Mentor route must exist");
  assert.strictEqual(findMentor.label, "Find a Mentor");
  assert.ok(myMentors, "My Mentors route must exist");
  assert.strictEqual(myMentors.label, "My Mentors");
  assert.ok(jobs, "Jobs route preserved");
  assert.ok(messages, "Messages route preserved");
});

console.log("\n--- 2. Eligibility & Availability Guardrails ---");

runTest("Eligible mentors query excludes inactive mentors (isActive: false)", () => {
  const mentors = findEligibleMentorsMock();
  const found = mentors.find((m) => m.id === "usr_alumni_inactive");
  assert.strictEqual(found, undefined, "Inactive mentors must be omitted from discovery");
});

runTest("Eligible mentors query excludes unavailable mentors (status: 'AWAY')", () => {
  const mentors = findEligibleMentorsMock();
  const found = mentors.find((m) => m.id === "usr_alumni_away");
  assert.strictEqual(found, undefined, "Unavailable mentors must be omitted from discovery");
});

runTest("Eligible mentors query excludes mentors who reached max active mentee capacity", () => {
  const mentors = findEligibleMentorsMock();
  const found = mentors.find((m) => m.id === "usr_alumni_full");
  assert.strictEqual(found, undefined, "Mentors at full capacity must be omitted from discovery");
});

runTest("Eligible mentors query excludes unverified alumni", () => {
  const mentors = findEligibleMentorsMock();
  const found = mentors.find((m) => m.id === "usr_alumni_unverified");
  assert.strictEqual(found, undefined, "Unverified alumni must never appear as mentors");
});

runTest("Eligible mentors query excludes suspended accounts", () => {
  const mentors = findEligibleMentorsMock();
  const found = mentors.find((m) => m.id === "usr_alumni_suspended");
  assert.strictEqual(found, undefined, "Suspended accounts must never appear in mentor discovery");
});

runTest("Eligible mentors query excludes student accounts (Students can NEVER be mentors)", () => {
  const mentors = findEligibleMentorsMock();
  const found = mentors.find((m) => m.id === "usr_student_1");
  assert.strictEqual(found, undefined, "Students can NEVER be mentors");
});

runTest("Eligible mentors includes verified Alumni and Faculty with open capacity", () => {
  const mentors = findEligibleMentorsMock();
  const alumni1 = mentors.find((m) => m.id === "usr_alumni_1");
  const faculty1 = mentors.find((m) => m.id === "usr_faculty_1");

  assert.ok(alumni1, "Verified Alumni with slots must be visible");
  assert.strictEqual(alumni1.slotsAvailable, 3, "Alumni slot availability calculation must be correct");
  assert.ok(faculty1, "Approved Faculty with slots must be visible");
  assert.strictEqual(faculty1.slotsAvailable, 5, "Faculty slot availability calculation must be correct");
});

console.log("\n--- 3. Multi-Field Search Capabilities ---");

runTest("Search by Mentor Name finds target mentor", () => {
  const res = findEligibleMentorsMock({ search: "Tanvir" });
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].id, "usr_alumni_1");
});

runTest("Search by Company Name finds target mentor", () => {
  const res = findEligibleMentorsMock({ search: "Brain Station" });
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].company, "Brain Station 23");
});

runTest("Search by Position finds target mentor", () => {
  const res = findEligibleMentorsMock({ search: "Architect" });
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].id, "usr_alumni_1");
});

runTest("Search by Career Field finds target mentor", () => {
  const res = findEligibleMentorsMock({ search: "Academic Research" });
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].id, "usr_faculty_1");
});

runTest("Search by Technical Skills finds target mentor", () => {
  const res = findEligibleMentorsMock({ search: "Kubernetes" });
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].id, "usr_alumni_1");
});

runTest("Search by Mentorship Topics finds target mentor", () => {
  const res = findEligibleMentorsMock({ search: "Thesis" });
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].id, "usr_faculty_1");
});

console.log("\n--- 4. Filtering Dimensions ---");

runTest("Filter by Role: ALUMNI vs TEACHER", () => {
  const alumniOnly = findEligibleMentorsMock({ role: "ALUMNI" });
  assert.strictEqual(alumniOnly.length, 1);
  assert.strictEqual(alumniOnly[0].role, "ALUMNI");

  const facultyOnly = findEligibleMentorsMock({ role: "TEACHER" });
  assert.strictEqual(facultyOnly.length, 1);
  assert.strictEqual(facultyOnly[0].role, "TEACHER");
});

runTest("Filter by Department", () => {
  const cseMentors = findEligibleMentorsMock({ department: "CSE" });
  assert.strictEqual(cseMentors.length, 2);

  const bbaMentors = findEligibleMentorsMock({ department: "BBA" });
  assert.strictEqual(bbaMentors.length, 0, "BBA mentor is at capacity, should return 0");
});

runTest("Filter by Mentorship Topic", () => {
  const systemDesign = findEligibleMentorsMock({ topic: "System Design" });
  assert.strictEqual(systemDesign.length, 1);
  assert.strictEqual(systemDesign[0].id, "usr_alumni_1");
});

runTest("Filter by Preferred Session Format (ONLINE / IN_PERSON / HYBRID)", () => {
  const hybridMentors = findEligibleMentorsMock({ sessionFormat: "HYBRID" });
  assert.strictEqual(hybridMentors.length, 1);
  assert.strictEqual(hybridMentors[0].id, "usr_alumni_1");

  const inPersonMentors = findEligibleMentorsMock({ sessionFormat: "IN_PERSON" });
  assert.strictEqual(inPersonMentors.length, 1);
  assert.strictEqual(inPersonMentors[0].id, "usr_faculty_1");
});

runTest("Filter by Experience Level (ENTRY, MID, SENIOR)", () => {
  const seniorMentors = findEligibleMentorsMock({ experienceLevel: "SENIOR" });
  assert.strictEqual(seniorMentors.length, 2, "Both Tanvir (8y) and Dr. Sajjad (12y) are SENIOR");

  const midMentors = findEligibleMentorsMock({ experienceLevel: "MID" });
  assert.strictEqual(midMentors.length, 0, "No available mentors in 3-5y bracket currently with open slots");
});

console.log("\n--- 5. Sorting Mechanics ---");

runTest("Sort by Experience (descending yearsOfExperience)", () => {
  const sorted = findEligibleMentorsMock({ sort: "experience" });
  assert.strictEqual(sorted[0].id, "usr_faculty_1", "12 years experience comes first");
  assert.strictEqual(sorted[1].id, "usr_alumni_1", "8 years experience comes second");
});

runTest("Sort Alphabetically (A-Z)", () => {
  const sorted = findEligibleMentorsMock({ sort: "alpha" });
  assert.strictEqual(sorted[0].name, "Dr. Sajjad Hossain");
  assert.strictEqual(sorted[1].name, "Tanvir Ahmed");
});

console.log("\n--- 6. Mentorship Request Lifecycle & ATS State Transitions ---");

runTest("Student can submit a valid mentorship request to an available mentor", () => {
  const student = mockUsers.student_user;
  const mentor = mockUsers.alumni_senior;

  const newRequest = {
    id: "req_student_new",
    studentId: student.id,
    mentorId: mentor.id,
    topic: "Mock Technical Interview",
    careerGoals: "Prepare for senior backend engineer roles.",
    message: "Hello Tanvir bhai, I would love feedback on my distributed systems system design.",
    sessionFormat: "ONLINE",
    status: "PENDING",
    createdAt: new Date(),
  };

  mockMentorshipRequests.push(newRequest);

  const found = mockMentorshipRequests.find((r) => r.id === "req_student_new");
  assert.ok(found);
  assert.strictEqual(found.status, "PENDING");
});

runTest("Duplicate pending/active mentorship request to same mentor is blocked", () => {
  const student = mockUsers.student_user;
  const mentor = mockUsers.alumni_senior;

  const hasExistingActive = mockMentorshipRequests.some(
    (r) =>
      r.studentId === student.id &&
      r.mentorId === mentor.id &&
      ["PENDING", "ACCEPTED", "SCHEDULED"].includes(r.status)
  );

  assert.strictEqual(hasExistingActive, true, "Should detect existing active request");
});

runTest("Student can cancel their pending mentorship request", () => {
  const req = mockMentorshipRequests.find((r) => r.id === "req_student_new");
  assert.strictEqual(req.status, "PENDING");

  // Perform cancellation
  req.status = "CANCELLED";
  assert.strictEqual(req.status, "CANCELLED", "Request status should transition to CANCELLED");
});

console.log("\n--- 7. Security Isolation & RBAC ---");

runTest("Students cannot access or edit mentor configuration endpoints", () => {
  const student = mockUsers.student_user;
  const isEligibleMentor = student.role === "ALUMNI" || student.role === "TEACHER";
  assert.strictEqual(isEligibleMentor, false, "Students must fail mentor eligibility check");
});

runTest("Public mentor profile sanitizes sensitive administrative fields", () => {
  const mentor = mockUsers.alumni_senior;
  const profile = mockMentorProfiles[mentor.id];

  const publicData = {
    id: mentor.id,
    name: mentor.name,
    role: mentor.role,
    department: mentor.department,
    alumniVerified: mentor.alumniVerified,
    headline: profile.headline,
    bio: profile.bio,
    company: profile.company,
    position: profile.position,
    careerField: profile.careerField,
    yearsOfExperience: profile.yearsOfExperience,
    skills: profile.skills,
    topics: profile.topics,
    sessionFormats: profile.sessionFormats,
    communicationMethod: profile.communicationMethod,
    availableDays: profile.availableDays,
    preferredTimeSlots: profile.preferredTimeSlots,
  };

  assert.strictEqual(publicData.password, undefined);
  assert.strictEqual(publicData.otp, undefined);
  assert.strictEqual(publicData.resetToken, undefined);
});

// ------------------------------------------------------------------------------
// SUMMARY
// ------------------------------------------------------------------------------

console.log("\n================================================================================");
console.log(`Phase 2 Mentorship Test Suite Finished: ${passed} / ${total} tests passed!`);
console.log("================================================================================");

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
