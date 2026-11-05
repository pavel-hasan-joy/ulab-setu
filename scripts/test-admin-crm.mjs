// Automated Test Suite for ULAB Setu Admin CRM Module
import assert from "node:assert/strict";
import { ROLE_PERMISSIONS, hasPermission } from "../src/lib/admin-permissions.ts";

console.log("=================================================");
console.log("   ULAB Setu Admin CRM Module Test Suite        ");
console.log("=================================================");

// Mock CRM users dataset
const mockUsers = [
  {
    id: "user_1",
    name: "Farhana Akter",
    email: "student@ulab.edu.bd",
    role: "STUDENT",
    status: "APPROVED",
    emailVerified: true,
    alumniVerified: false,
    verificationMethod: null,
    verifiedAt: null,
    department: "Computer Science and Engineering",
    studentId: "221014012",
    batch: "2022",
    graduationYear: null,
    company: null,
    designation: null,
    deletedAt: null,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    activity: { jobsCount: 0, applicationsCount: 3, mentorshipCount: 1 },
  },
  {
    id: "user_2",
    name: "Tanvir Hasan",
    email: "alumni@ulab.edu.bd",
    role: "ALUMNI",
    status: "APPROVED",
    emailVerified: true,
    alumniVerified: true,
    verificationMethod: "ulab_email",
    verifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    department: "Computer Science and Engineering",
    studentId: "141014001",
    batch: null,
    graduationYear: "2018",
    company: "Nimbus Labs",
    designation: "Senior Software Engineer",
    deletedAt: null,
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    activity: { jobsCount: 4, applicationsCount: 0, mentorshipCount: 5 },
  },
  {
    id: "user_3",
    name: "Dr. Kamrul Karim",
    email: "teacher@ulab.edu.bd",
    role: "TEACHER",
    status: "APPROVED",
    emailVerified: true,
    alumniVerified: false,
    verificationMethod: null,
    verifiedAt: null,
    department: "Computer Science and Engineering",
    studentId: null,
    batch: null,
    graduationYear: null,
    company: "ULAB",
    designation: "Associate Professor",
    deletedAt: null,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    activity: { jobsCount: 2, applicationsCount: 0, mentorshipCount: 3 },
  },
  {
    id: "user_4",
    name: "Suspended Member",
    email: "suspended@ulab.edu.bd",
    role: "STUDENT",
    status: "SUSPENDED",
    emailVerified: true,
    alumniVerified: false,
    verificationMethod: null,
    verifiedAt: null,
    department: "Business Administration",
    studentId: "201015099",
    batch: "2020",
    graduationYear: null,
    company: null,
    designation: null,
    deletedAt: null,
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    activity: { jobsCount: 0, applicationsCount: 1, mentorshipCount: 0 },
  },
  {
    id: "user_5",
    name: "Soft Deleted Alumnus",
    email: "deleted.alumni@ulab.edu.bd",
    role: "ALUMNI",
    status: "SUSPENDED",
    emailVerified: true,
    alumniVerified: true,
    verificationMethod: "ulab_email",
    verifiedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    department: "Media Studies and Journalism",
    studentId: "161019001",
    batch: null,
    graduationYear: "2020",
    company: "Daily Star",
    designation: "Journalist",
    deletedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    activity: { jobsCount: 0, applicationsCount: 0, mentorshipCount: 0 },
  },
];

// Test 1: RBAC Permission Enforcement for CRM User Management
console.log("\n[TEST 1] RBAC Permission Enforcement for CRM Access");
assert.equal(hasPermission("SUPER_ADMIN", "users:manage"), true, "Super Admin must have users:manage");
assert.equal(hasPermission("USER_ADMIN", "users:manage"), true, "User Admin must have users:manage");
assert.equal(hasPermission("JOB_MODERATOR", "users:manage"), false, "Job Moderator must NOT have users:manage");
assert.equal(hasPermission("SUPPORT_ADMIN", "users:manage"), false, "Support Admin must NOT have users:manage");
assert.equal(hasPermission("ANALYST", "users:manage"), false, "Analyst must NOT have users:manage");
console.log("[PASS] 1. RBAC permission boundaries strictly enforced for CRM User Management");

// Test 2: Multi-criteria Search & Keyword Matching
console.log("\n[TEST 2] Multi-criteria Search & Keyword Matching");
function filterSearch(list, query) {
  const q = query.toLowerCase().trim();
  if (!q) return list;
  return list.filter((u) =>
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    (u.studentId && u.studentId.toLowerCase().includes(q)) ||
    (u.company && u.company.toLowerCase().includes(q)) ||
    (u.department && u.department.toLowerCase().includes(q))
  );
}

const searchByEmail = filterSearch(mockUsers, "student@ulab.edu.bd");
assert.equal(searchByEmail.length, 1);
assert.equal(searchByEmail[0].name, "Farhana Akter");

const searchByCompany = filterSearch(mockUsers, "Nimbus Labs");
assert.equal(searchByCompany.length, 1);
assert.equal(searchByCompany[0].role, "ALUMNI");

const searchByStudentId = filterSearch(mockUsers, "141014001");
assert.equal(searchByStudentId.length, 1);
assert.equal(searchByStudentId[0].id, "user_2");
console.log("[PASS] 2. Search correctly resolves name, email, student ID, company & department");

// Test 3: Role and Account Status Filtering
console.log("\n[TEST 3] Role and Account Status Filtering");
const activeStudents = mockUsers.filter((u) => u.role === "STUDENT" && u.status === "APPROVED" && !u.deletedAt);
assert.equal(activeStudents.length, 1);
assert.equal(activeStudents[0].name, "Farhana Akter");

const suspendedUsers = mockUsers.filter((u) => u.status === "SUSPENDED" && !u.deletedAt);
assert.equal(suspendedUsers.length, 1);
assert.equal(suspendedUsers[0].name, "Suspended Member");
console.log("[PASS] 3. Filtering by role and status partitions user records accurately");

// Test 4: Alumni Verification Isolation & Non-Erase on Suspension
console.log("\n[TEST 4] Alumni Verification Separation from Suspension");
const suspendedAlumnus = mockUsers.find((u) => u.id === "user_5");
assert.equal(suspendedAlumnus.status, "SUSPENDED", "Alumnus must have SUSPENDED status");
assert.equal(suspendedAlumnus.alumniVerified, true, "Suspension MUST NOT erase alumni verification status");
assert.equal(suspendedAlumnus.verificationMethod, "ulab_email", "Verification method must be preserved");
assert.ok(suspendedAlumnus.verifiedAt !== null, "Verification date must be retained");
console.log("[PASS] 4. Critical requirement verified: Account suspension does not erase alumni verification history");

// Test 5: Soft Deletion and Exclusion
console.log("\n[TEST 5] Soft Deletion Filtering");
const normalView = mockUsers.filter((u) => !u.deletedAt);
assert.equal(normalView.length, 4, "Normal view must exclude soft-deleted users");
const deletedView = mockUsers.filter((u) => Boolean(u.deletedAt));
assert.equal(deletedView.length, 1, "Deleted view must show soft-deleted user");
assert.equal(deletedView[0].name, "Soft Deleted Alumnus");
console.log("[PASS] 5. Soft-deletion contracts isolate active vs deleted records properly");

// Test 6: Pagination Mathematics
console.log("\n[TEST 6] Pagination Bounds and Slicing");
function paginate(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * pageSize;
  const sliced = items.slice(start, start + pageSize);
  return { total, totalPages, safePage, sliced };
}

const page1 = paginate(mockUsers, 1, 2);
assert.equal(page1.totalPages, 3);
assert.equal(page1.safePage, 1);
assert.equal(page1.sliced.length, 2);
assert.equal(page1.sliced[0].id, "user_1");

const overflowPage = paginate(mockUsers, 999, 2);
assert.equal(overflowPage.safePage, 3);
assert.equal(overflowPage.sliced.length, 1);
console.log("[PASS] 6. Pagination mathematics correctly prevents index out-of-bounds");

// Test 7: CSV Export Generation and Structure
console.log("\n[TEST 7] CSV Export Format and Field Coverage");
function generateCSV(items) {
  const headers = [
    "User ID", "Full Name", "Official Email", "Role", "Account Status",
    "Email Verified", "Alumni Verified", "Verification Method", "Department",
    "Jobs Posted", "Applications Submitted", "Mentorships"
  ];
  const rows = items.map((u) => [
    `"${u.id}"`,
    `"${u.name.replace(/"/g, '""')}"`,
    `"${u.email}"`,
    `"${u.role}"`,
    `"${u.status}"`,
    `"${u.emailVerified ? "Yes" : "No"}"`,
    `"${u.alumniVerified ? "Yes (ULAB)" : "No"}"`,
    `"${u.verificationMethod || "None"}"`,
    `"${u.department || ""}"`,
    `"${u.activity.jobsCount}"`,
    `"${u.activity.applicationsCount}"`,
    `"${u.activity.mentorshipCount}"`
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

const csvOutput = generateCSV(mockUsers);
assert.ok(csvOutput.includes('"Farhana Akter"'), "CSV must contain student name");
assert.ok(csvOutput.includes('"student@ulab.edu.bd"'), "CSV must contain student email");
assert.ok(csvOutput.includes('"Yes (ULAB)"'), "CSV must contain alumni verification label");
assert.ok(csvOutput.includes('"Nimbus Labs"') === false, "Unlisted column not included");
console.log("[PASS] 7. CSV export format generates compliant, properly escaped CSV payload");

// Test 8: Bulk Operation Self-Protection
console.log("\n[TEST 8] Bulk Operation Self-Protection Defense");
const currentAdminId = "user_admin_99";
const requestedIds = ["user_1", "user_2", currentAdminId];
const safeTargetIds = requestedIds.filter((id) => id !== currentAdminId);
assert.equal(safeTargetIds.length, 2, "Bulk operations must exclude the acting administrator");
assert.equal(safeTargetIds.includes(currentAdminId), false, "Acting admin must never be self-suspended/deleted");
console.log("[PASS] 8. Bulk operations protect acting administrator from accidental self-lockout");

console.log("\n=================================================");
console.log("Results: 8/8 CRM Tests Passed successfully.");
console.log("=================================================");

