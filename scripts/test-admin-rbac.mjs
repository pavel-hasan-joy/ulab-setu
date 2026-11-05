import {
  ROLE_PERMISSIONS,
  getAdminSubRole,
  SUB_ROLE_LABELS,
} from "../src/lib/admin-permissions.ts";

const results = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: "PASSED" });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    results.push({ name, status: "FAILED", error: err.message });
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

async function run() {
  console.log("=================================================");
  console.log("   ULAB Setu Admin RBAC & Dashboard Test Suite");
  console.log("=================================================\n");

  // TEST 1: Super Admin has complete access to all 13 sections
  await test("1. Super Admin Full System Permission Matrix", async () => {
    const superAdminRole = "SUPER_ADMIN";
    const perms = ROLE_PERMISSIONS[superAdminRole];

    const requiredSections = [
      "dashboard:view",
      "users:manage",
      "alumni:manage",
      "jobs:manage",
      "applications:view",
      "reports:manage",
      "mentorship:view",
      "tickets:manage",
      "notifications:manage",
      "analytics:view",
      "admins:manage",
      "settings:manage",
      "audit:view",
    ];

    for (const req of requiredSections) {
      assert(perms.includes(req), `Super Admin must have ${req} permission`);
    }
  });

  // TEST 2: User Admin role boundaries
  await test("2. User Admin Scope & Boundaries", async () => {
    const perms = ROLE_PERMISSIONS["USER_ADMIN"];
    assert(perms.includes("users:manage"), "User Admin must manage users");
    assert(perms.includes("alumni:manage"), "User Admin must view alumni");
    assert(!perms.includes("jobs:manage"), "User Admin must NOT moderate jobs");
    assert(!perms.includes("admins:manage"), "User Admin must NOT manage admins");
    assert(!perms.includes("settings:manage"), "User Admin must NOT edit settings");
  });

  // TEST 3: Job Moderator role boundaries
  await test("3. Job Moderator Scope & Boundaries", async () => {
    const perms = ROLE_PERMISSIONS["JOB_MODERATOR"];
    assert(perms.includes("jobs:manage"), "Job Moderator must manage jobs");
    assert(perms.includes("applications:view"), "Job Moderator must view applications");
    assert(perms.includes("reports:manage"), "Job Moderator must manage reports");
    assert(!perms.includes("users:manage"), "Job Moderator must NOT manage users");
    assert(!perms.includes("admins:manage"), "Job Moderator must NOT manage admins");
  });

  // TEST 4: Support Admin role boundaries
  await test("4. Support Admin Scope & Boundaries", async () => {
    const perms = ROLE_PERMISSIONS["SUPPORT_ADMIN"];
    assert(perms.includes("tickets:manage"), "Support Admin must manage tickets");
    assert(perms.includes("notifications:manage"), "Support Admin must manage notifications");
    assert(perms.includes("mentorship:view"), "Support Admin must view mentorship");
    assert(!perms.includes("jobs:manage"), "Support Admin must NOT manage jobs");
    assert(!perms.includes("admins:manage"), "Support Admin must NOT manage admins");
  });

  // TEST 5: Analyst read-only boundaries
  await test("5. Analyst Read-Only Scope & Boundaries", async () => {
    const perms = ROLE_PERMISSIONS["ANALYST"];
    assert(perms.includes("analytics:view"), "Analyst must view analytics");
    assert(perms.includes("audit:view"), "Analyst must view audit logs");
    assert(!perms.includes("users:manage"), "Analyst must NOT edit users");
    assert(!perms.includes("jobs:manage"), "Analyst must NOT manage jobs");
    assert(!perms.includes("tickets:manage"), "Analyst must NOT edit tickets");
    assert(!perms.includes("settings:manage"), "Analyst must NOT modify settings");
  });

  // TEST 6: Sub-Role Derivation from User Profile
  await test("6. Sub-Role Derivation from Profile Metadata", async () => {
    // 1. Root admin email
    const rootSubRole = getAdminSubRole({ email: "admin@ulab.edu.bd", designation: "" });
    assert(rootSubRole === "SUPER_ADMIN", "admin@ulab.edu.bd must always resolve to SUPER_ADMIN");

    // 2. Custom designations
    assert(
      getAdminSubRole({ email: "moderator@ulab.edu.bd", designation: "Job Moderator" }) === "JOB_MODERATOR"
    );
    assert(
      getAdminSubRole({ email: "support@ulab.edu.bd", designation: "Support Admin" }) === "SUPPORT_ADMIN"
    );
    assert(
      getAdminSubRole({ email: "analyst@ulab.edu.bd", designation: "Data Analyst" }) === "ANALYST"
    );
    assert(
      getAdminSubRole({ email: "useradmin@ulab.edu.bd", designation: "User Admin" }) === "USER_ADMIN"
    );
  });

  console.log("\n=================================================");
  const passedCount = results.filter((r) => r.status === "PASSED").length;
  console.log(`Results: ${passedCount}/${results.length} Tests Passed successfully.`);
  console.log("=================================================");

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("Test runner crashed:", e);
  process.exit(1);
});
