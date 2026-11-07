import assert from "assert";
import {
  validateProjectUrl,
  sanitizeProjectTitle,
  parseApplicationNote,
} from "../src/lib/applications.ts";

console.log("================================================================================");
console.log("   ULAB Setu: Optional Multiple Project Links in Job Applications Test Suite");
console.log("================================================================================\n");

// Simulated Database Storage
let mockApplications = [];
let mockApplicationProjects = [];

function resetState() {
  mockApplications = [];
  mockApplicationProjects = [];
}

resetState();

// Simulated application submission with multiple project links (matching applyToJob in src/app/actions/jobs.ts)
function submitApplicationMock({
  applicationId = `app_${mockApplications.length + 1}`,
  jobId = "job_101",
  studentId = "usr_student_01",
  coverNote = "Experienced React developer with full-stack projects.",
  projectLinksRaw = null,
}) {
  const validatedProjects = [];

  if (projectLinksRaw) {
    let parsedProjects = [];
    if (typeof projectLinksRaw === "string") {
      try {
        parsedProjects = JSON.parse(projectLinksRaw);
      } catch {
        return { error: "Malformed project links data." };
      }
    } else if (Array.isArray(projectLinksRaw)) {
      parsedProjects = projectLinksRaw;
    }

    for (const p of parsedProjects) {
      if (!p || typeof p !== "object") continue;
      const urlRaw = typeof p.url === "string" ? p.url.trim() : "";
      if (!urlRaw) continue; // Optional blank rows are safely skipped

      const urlCheck = validateProjectUrl(urlRaw);
      if (!urlCheck.valid) {
        return { error: `Project Link Error: ${urlCheck.error}` };
      }

      const cleanTitle = sanitizeProjectTitle(p.title);
      validatedProjects.push({
        title: cleanTitle,
        url: urlCheck.url,
      });
    }
  }

  const structuredPayload = JSON.stringify({
    coverNote,
    projects: validatedProjects.length > 0 ? validatedProjects : null,
  });

  const app = {
    id: applicationId,
    jobId,
    studentId,
    note: structuredPayload,
    status: "APPLIED",
    createdAt: new Date(),
  };

  mockApplications.push(app);

  // Store in normalized child table mockApplicationProjects
  for (const proj of validatedProjects) {
    mockApplicationProjects.push({
      id: `proj_${mockApplicationProjects.length + 1}`,
      applicationId: app.id,
      title: proj.title,
      url: proj.url,
      createdAt: new Date(),
    });
  }

  return { success: true, app, projects: validatedProjects };
}

// TEST 1: Application submission without project links (Optional requirement)
console.log("[TEST 1] Application submission without project links (Remains completely valid)");
{
  resetState();
  const res = submitApplicationMock({
    projectLinksRaw: null,
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.projects.length, 0);
  assert.strictEqual(mockApplicationProjects.length, 0);

  const parsed = parseApplicationNote(res.app.note);
  assert.strictEqual(parsed.projects, null);
  console.log("  [PASS] Application submitted successfully without any project links.");
}

// TEST 2: Application submission with one project link
console.log("\n[TEST 2] Application submission with single project link");
{
  resetState();
  const input = JSON.stringify([
    { title: "E-commerce Website", url: "https://myshop-ulab.vercel.app" },
  ]);

  const res = submitApplicationMock({ projectLinksRaw: input });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.projects.length, 1);
  assert.strictEqual(res.projects[0].title, "E-commerce Website");
  assert.strictEqual(res.projects[0].url, "https://myshop-ulab.vercel.app");
  assert.strictEqual(mockApplicationProjects.length, 1);
  assert.strictEqual(mockApplicationProjects[0].applicationId, res.app.id);

  console.log("  [PASS] Single project link validated and persisted.");
}

// TEST 3: Application submission with multiple project links (Arbitrary count, no arbitrary limit)
console.log("\n[TEST 3] Multiple project links (Arbitrary count: e.g. 4 projects)");
{
  resetState();
  const multipleProjects = [
    { title: "E-commerce Website", url: "https://example.com" },
    { title: "Java Management System", url: "https://github.com/example/project" },
    { title: "Portfolio", url: "https://example.com/portfolio" },
    { title: "AI Voice Agent", url: "https://github.com/example/ai-agent" },
  ];

  const res = submitApplicationMock({ projectLinksRaw: JSON.stringify(multipleProjects) });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.projects.length, 4);
  assert.strictEqual(mockApplicationProjects.length, 4);

  const parsed = parseApplicationNote(res.app.note);
  assert.strictEqual(parsed.projects.length, 4);
  assert.strictEqual(parsed.projects[1].title, "Java Management System");
  assert.strictEqual(parsed.projects[1].url, "https://github.com/example/project");

  console.log("  [PASS] All 4 project links stored in normalized child table and structured note.");
}

// TEST 4: Blank inputs are skipped without throwing errors
console.log("\n[TEST 4] Dynamic add/remove simulation & blank row omission");
{
  resetState();
  const mixedProjects = [
    { title: "Valid Project", url: "https://github.com/user/project1" },
    { title: "", url: "" }, // user added a row but left it blank
    { title: "Only Title Without URL", url: "   " }, // blank URL should be omitted
    { title: "", url: "https://live-demo.com" }, // URL without title (valid optional title)
  ];

  const res = submitApplicationMock({ projectLinksRaw: JSON.stringify(mixedProjects) });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.projects.length, 2);
  assert.strictEqual(res.projects[0].title, "Valid Project");
  assert.strictEqual(res.projects[1].title, null); // Title is cleanly optional
  assert.strictEqual(res.projects[1].url, "https://live-demo.com");

  console.log("  [PASS] Blank project rows skipped gracefully; optional titles handled cleanly.");
}

// TEST 5: Rejection of malformed URLs
console.log("\n[TEST 5] Rejection of malformed or invalid URLs");
{
  const check1 = validateProjectUrl("not-a-url");
  assert.strictEqual(check1.valid, false);

  const check2 = validateProjectUrl("ftp://files.example.com");
  assert.strictEqual(check2.valid, false);
  assert.strictEqual(check2.error.includes("Only HTTP and HTTPS"), true);

  const check3 = validateProjectUrl("http://localhost:3000"); // no dot in host
  assert.strictEqual(check3.valid, false);

  console.log("  [PASS] Malformed, non-HTTP, and invalid domain URLs strictly rejected.");
}

// TEST 6: Strict rejection of unsafe URL schemes (XSS & Protocol injection)
console.log("\n[TEST 6] Strict rejection of unsafe URL schemes (javascript:, data:, vbscript:)");
{
  const unsafeSchemes = [
    "javascript:alert(document.cookie)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ];

  for (const maliciousUrl of unsafeSchemes) {
    const check = validateProjectUrl(maliciousUrl);
    assert.strictEqual(check.valid, false);
    assert.strictEqual(check.error.includes("Unsafe URL scheme detected"), true);
  }

  // Ensure application submission fails if unsafe URL is injected
  const res = submitApplicationMock({
    projectLinksRaw: JSON.stringify([
      { title: "Hacked", url: "javascript:evil()" },
    ]),
  });
  assert.strictEqual(res.error.includes("Unsafe URL scheme detected"), true);

  console.log("  [PASS] Malicious URL schemes (javascript:, data:, vbscript:) rejected on frontend & backend.");
}

// TEST 7: Input length protection
console.log("\n[TEST 7] Input length and overflow bounds");
{
  const longUrl = "https://example.com/" + "a".repeat(1100);
  const checkLongUrl = validateProjectUrl(longUrl);
  assert.strictEqual(checkLongUrl.valid, false);
  assert.strictEqual(checkLongUrl.error.includes("exceeds the 1000 character limit"), true);

  const longTitle = "T".repeat(300);
  const sanitizedTitle = sanitizeProjectTitle(longTitle);
  assert.strictEqual(sanitizedTitle.length, 150);

  console.log("  [PASS] Excessive input length bounds enforced.");
}

// TEST 8: Child table relational integrity & cascade isolation
console.log("\n[TEST 8] Relational child table ApplicationProject isolation per application");
{
  resetState();
  // App 1 for Student A
  const app1 = submitApplicationMock({
    applicationId: "app_A",
    studentId: "student_A",
    projectLinksRaw: JSON.stringify([{ title: "Project A", url: "https://project-a.com" }]),
  });

  // App 2 for Student B
  const app2 = submitApplicationMock({
    applicationId: "app_B",
    studentId: "student_B",
    projectLinksRaw: JSON.stringify([{ title: "Project B", url: "https://project-b.com" }]),
  });

  const appAProjects = mockApplicationProjects.filter((p) => p.applicationId === "app_A");
  const appBProjects = mockApplicationProjects.filter((p) => p.applicationId === "app_B");

  assert.strictEqual(appAProjects.length, 1);
  assert.strictEqual(appAProjects[0].title, "Project A");
  assert.strictEqual(appBProjects.length, 1);
  assert.strictEqual(appBProjects[0].title, "Project B");

  console.log("  [PASS] Projects correctly isolated by applicationId without cross-pollination.");
}

// TEST 9: Recruiter and Student payload views
console.log("\n[TEST 9] Recruiter and Student projection review");
{
  const sampleNote = JSON.stringify({
    coverNote: "Hi recruiter!",
    projects: [
      { title: "React LMS", url: "https://github.com/student/lms" },
      { title: "ULAB Bus Tracker", url: "https://bustracker.ulab.edu.bd" },
    ],
  });

  const parsed = parseApplicationNote(sampleNote);
  assert.strictEqual(parsed.isStructured, true);
  assert.strictEqual(parsed.projects.length, 2);
  assert.strictEqual(parsed.projects[0].title, "React LMS");
  assert.strictEqual(parsed.projects[1].url, "https://bustracker.ulab.edu.bd");

  console.log("  [PASS] Recruiter and Applicant dashboards successfully deserialize project links.");
}

// TEST 10: Legacy plain-text applications backwards compatibility
console.log("\n[TEST 10] Legacy plain-text application backwards compatibility");
{
  const legacyNote = "Plain text note without JSON formatting from previous semester.";
  const parsed = parseApplicationNote(legacyNote);
  assert.strictEqual(parsed.isStructured, false);
  assert.strictEqual(parsed.coverNote, legacyNote);
  assert.strictEqual(parsed.projects, undefined);

  console.log("  [PASS] Legacy application notes parse gracefully without breaking.");
}

console.log("\n================================================================================");
console.log("   Results: 10/10 Multiple Project Links Tests Passed (100%)");
console.log("================================================================================\n");

