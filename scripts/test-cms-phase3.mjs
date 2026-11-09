import assert from "node:assert";
import {
  ANNOUNCEMENT_CATEGORIES,
  CONTENT_AUDIENCES,
  announcementSchema,
  eventSchema,
  getDerivedEventState,
  faqSchema,
  alumniStorySchema,
  resourceSchema,
} from "../src/lib/cms-phase3-types.ts";

console.log("🧪 Running ULAB Setu CMS Phase 3 Automated Test Suite...\n");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Reason:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// 1. News & Announcements Validation
// ---------------------------------------------------------------------------
console.log("📢 1. News & Announcements Validation:");

runTest("1.1 Validates complete announcement schema with category and audience", () => {
  const valid = announcementSchema.safeParse({
    title: "VC Scholarship Application Notice 2026",
    slug: "vc-scholarship-2026",
    contentType: "ANNOUNCEMENT",
    summary: "Full tuition waiver applications open for Fall 2026 students.",
    body: "Eligibility: Minimum 3.80 CGPA across past 3 semesters. Submit directly to registrar.",
    category: "Scholarship",
    targetAudience: "STUDENT",
    featuredImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
    attachmentUrl: "https://ulab.edu.bd/docs/scholarship-form.pdf",
    registrationUrl: "https://forms.gle/sampleform",
    tags: "scholarship, fall2026",
    priority: 5,
    notifyUsers: true,
  });
  assert.strictEqual(valid.success, true);
});

runTest("1.2 Rejects invalid slug with uppercase letters or spaces", () => {
  const invalid = announcementSchema.safeParse({
    title: "Bad Slug Notice",
    slug: "Bad Slug-With Space",
    summary: "Short summary text here",
    body: "Long enough body copy to meet length requirement",
    category: "Official University Notice",
  });
  assert.strictEqual(invalid.success, false);
});

runTest("1.3 Supports all 5 defined target audiences", () => {
  assert.strictEqual(CONTENT_AUDIENCES.length, 5);
  for (const aud of ["PUBLIC", "STUDENT", "ALUMNI", "TEACHER", "AUTHENTICATED"]) {
    assert(CONTENT_AUDIENCES.includes(aud));
  }
});

// ---------------------------------------------------------------------------
// 2. Events Management & Timezone
// ---------------------------------------------------------------------------
console.log("\n📅 2. Events Management & Schedule Validation:");

runTest("2.1 Validates event schema and Asia/Dhaka schedule constraints", () => {
  const valid = eventSchema.safeParse({
    title: "ULAB National Career Fair & Hackathon 2026",
    slug: "career-fair-2026",
    summary: "Over 50 tech and corporate employers recruiting on campus.",
    body: "Bring 10 copies of CV. On-spot technical interviews and networking.",
    category: "Career Fair",
    targetAudience: "PUBLIC",
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    startTime: "10:00 AM",
    endTime: "05:00 PM",
    timeZone: "Asia/Dhaka",
    venue: "ULAB Permanent Campus Auditorium",
    organizer: "ULAB Career Services & Alumni Affairs",
    registrationUrl: "https://ulab.edu.bd/career-fair",
    priority: 10,
  });
  assert.strictEqual(valid.success, true);
});

runTest("2.2 Rejects event with endDate before startDate", () => {
  const invalidDates = eventSchema.safeParse({
    title: "Time Travel Event",
    slug: "time-travel",
    summary: "Short summary text here",
    body: "Long enough body copy to meet minimum requirements",
    category: "Workshop",
    startDate: "2026-12-10",
    endDate: "2026-12-05", // Invalid: before start
    startTime: "10:00 AM",
    endTime: "04:00 PM",
    venue: "Campus",
    organizer: "Club",
  });
  assert.strictEqual(invalidDates.success, false);
});

runTest("2.3 Correctly derives event states (UPCOMING, ONGOING, COMPLETED)", () => {
  // Future dates
  const futureState = getDerivedEventState("2099-01-01", "2099-01-05", "PUBLISHED");
  assert.strictEqual(futureState, "UPCOMING");

  // Past dates
  const pastState = getDerivedEventState("2020-01-01", "2020-01-05", "PUBLISHED");
  assert.strictEqual(pastState, "COMPLETED");

  // Archived
  const archivedState = getDerivedEventState("2099-01-01", "2099-01-05", "ARCHIVED");
  assert.strictEqual(archivedState, "CANCELLED");
});

// ---------------------------------------------------------------------------
// 3. FAQ Management
// ---------------------------------------------------------------------------
console.log("\n❓ 3. FAQ Management:");

runTest("3.1 Validates FAQ schema and category", () => {
  const valid = faqSchema.safeParse({
    question: "How do I request an internal alumni job referral?",
    answer: "Visit the Jobs portal, find an opening with 'Referral Available' tagged, and apply with your verified profile.",
    category: "Job Applications",
    displayOrder: 1,
  });
  assert.strictEqual(valid.success, true);
});

// ---------------------------------------------------------------------------
// 4. Alumni Stories & Consent
// ---------------------------------------------------------------------------
console.log("\n🌟 4. Alumni Stories & Mandatory Consent:");

runTest("4.1 Enforces mandatory alumnus consent before publishing", () => {
  const withoutConsent = alumniStorySchema.safeParse({
    title: "From Lab to Leadership",
    slug: "lab-to-leadership",
    alumniName: "Tanvir Rahman",
    graduationBatch: "CSE 2017",
    currentCompany: "Google",
    currentDesignation: "Staff Software Engineer",
    summary: "Journey from Beribadh lab to international tech.",
    storyContent: "Detailed story narrative containing over twenty characters...",
    isFeatured: true,
    hasConsent: false, // Refused consent
  });
  assert.strictEqual(withoutConsent.success, false, "Must reject story without explicit consent");

  const withConsent = alumniStorySchema.safeParse({
    title: "From Lab to Leadership",
    slug: "lab-to-leadership",
    alumniName: "Tanvir Rahman",
    graduationBatch: "CSE 2017",
    currentCompany: "Google",
    currentDesignation: "Staff Software Engineer",
    summary: "Journey from Beribadh lab to international tech.",
    storyContent: "Detailed story narrative containing over twenty characters...",
    isFeatured: true,
    hasConsent: true,
  });
  assert.strictEqual(withConsent.success, true);
});

// ---------------------------------------------------------------------------
// 5. Resource Library
// ---------------------------------------------------------------------------
console.log("\n📚 5. Resource Library:");

runTest("5.1 Validates resource item with downloadable URL and audience", () => {
  const valid = resourceSchema.safeParse({
    title: "Standard ULAB Software Engineering CV Template (2026)",
    slug: "tech-cv-template-2026",
    summary: "ATS-friendly modern CV template verified by alumni hiring managers.",
    body: "Includes sections for project links, tech stack badges, and university credentials.",
    category: "CV Writing Guides",
    fileUrl: "https://ulab.edu.bd/careers/cv-template.pdf",
    fileType: "PDF Document",
    authorOrSource: "ULAB Career Services",
    targetAudience: "PUBLIC",
    tags: "resume, ats, tech",
  });
  assert.strictEqual(valid.success, true);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("\n========================================================");
console.log(`🏁 CMS Phase 3 Test Results: ${passed} / ${total} passed`);
console.log("========================================================\n");

if (passed !== total) {
  process.exit(1);
}
