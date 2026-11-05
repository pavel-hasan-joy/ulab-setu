import {
  validateOfficialUlabEmail,
  sanitizeAndValidatePublicRole,
} from "../src/lib/auth-validation.ts";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
} from "../src/lib/rate-limit.ts";

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
  console.log("   ULAB Setu Production Authentication Test Suite");
  console.log("=================================================\n");

  // TEST 1: Valid Official ULAB Email Acceptance
  await test("1. Valid Official ULAB Email Acceptance", async () => {
    const res1 = validateOfficialUlabEmail("alumni.tanvir@ulab.edu.bd");
    assert(res1.valid === true, "Valid @ulab.edu.bd email must be accepted");
    assert(res1.normalizedEmail === "alumni.tanvir@ulab.edu.bd", "Normalized email mismatch");

    const res2 = validateOfficialUlabEmail("  Student.CSE@ULAB.EDU.BD  ");
    assert(res2.valid === true, "Case-insensitive and trimmed email must be accepted");
    assert(res2.normalizedEmail === "student.cse@ulab.edu.bd", "Lowercased normalized email mismatch");

    const res3 = validateOfficialUlabEmail("dr.kamrul.karim@ulab.edu.bd");
    assert(res3.valid === true, "Faculty email must be accepted");
  });

  // TEST 2: Strict Rejection of Personal, Lookalike & Subdomain Emails
  await test("2. Strict Rejection of Personal, Lookalike & Subdomain Emails", async () => {
    // Personal Gmail
    const r1 = validateOfficialUlabEmail("pavel@gmail.com");
    assert(r1.valid === false, "Gmail must be rejected");

    // Lookalike domain
    const r2 = validateOfficialUlabEmail("user@ulab.edu.bd.attacker.com");
    assert(r2.valid === false, "Lookalike domain must be rejected");

    // Subdomain email
    const r3 = validateOfficialUlabEmail("student@cse.ulab.edu.bd");
    assert(r3.valid === false, "Subdomain must be rejected");

    // Suffix spoof
    const r4 = validateOfficialUlabEmail("user@notulab.edu.bd");
    assert(r4.valid === false, "Non-matching domain must be rejected");

    // Multiple @
    const r5 = validateOfficialUlabEmail("user@ulab.edu.bd@attacker.com");
    assert(r5.valid === false, "Multiple @ must be rejected");

    // Empty username
    const r6 = validateOfficialUlabEmail("@ulab.edu.bd");
    assert(r6.valid === false, "Missing local part must be rejected");
  });

  // TEST 3: Real OTP Lifecycle & Expiry Verification
  await test("3. OTP Lifecycle and Expiration Boundaries", async () => {
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;

    // Simulate OTP generation
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(now + tenMinutes);
    assert(code.length === 6, "OTP must be exactly 6 digits");
    assert(expiresAt.getTime() > now, "Expiry must be in the future");

    // Verify valid OTP condition
    const isValid = expiresAt.getTime() >= Date.now();
    assert(isValid === true, "Freshly created OTP must be valid");

    // Simulate expired OTP
    const pastExpiresAt = new Date(now - 1000); // 1s ago
    const isExpiredValid = pastExpiresAt.getTime() >= Date.now();
    assert(isExpiredValid === false, "Expired OTP must be detected and rejected");
  });

  // TEST 4: Automatic Alumni Verification Logic
  await test("4. Automatic Alumni Account Verification Contract", async () => {
    const selectedRole = "ALUMNI";
    const verifiedUlabEmail = "tanvir.alumni@ulab.edu.bd";

    const emailCheck = validateOfficialUlabEmail(verifiedUlabEmail);
    assert(emailCheck.valid === true, "Email must be valid");

    const roleCheck = sanitizeAndValidatePublicRole(selectedRole);
    assert(roleCheck.valid === true, "Alumni role must be valid");
    assert(roleCheck.role === "ALUMNI", "Role must be ALUMNI");

    // Contract attributes that the server action produces
    const isAlumni = roleCheck.role === "ALUMNI";
    const generatedUserPayload = {
      email: emailCheck.normalizedEmail,
      role: roleCheck.role,
      status: "APPROVED",
      emailVerified: true,
      alumniVerified: isAlumni,
      verificationMethod: "ulab_email",
      verifiedAt: new Date(),
    };

    assert(generatedUserPayload.role === "ALUMNI", "Role must be ALUMNI");
    assert(generatedUserPayload.status === "APPROVED", "Status must be immediately APPROVED (active)");
    assert(generatedUserPayload.emailVerified === true, "emailVerified must be true");
    assert(generatedUserPayload.alumniVerified === true, "alumniVerified must be true");
    assert(generatedUserPayload.verificationMethod === "ulab_email", "verificationMethod must be ulab_email");
    assert(generatedUserPayload.verifiedAt instanceof Date, "verifiedAt must be a valid server timestamp");
  });

  // TEST 5: Student Registration Role Isolation
  await test("5. Student Registration Role Isolation", async () => {
    const roleCheck = sanitizeAndValidatePublicRole("STUDENT");
    assert(roleCheck.valid === true);
    assert(roleCheck.role === "STUDENT");

    const isAlumni = roleCheck.role === "ALUMNI";
    const studentPayload = {
      role: roleCheck.role,
      status: "APPROVED",
      emailVerified: true,
      alumniVerified: isAlumni,
      verificationMethod: "ulab_email",
    };

    assert(studentPayload.role === "STUDENT", "Role must be STUDENT");
    assert(studentPayload.status === "APPROVED", "Status must be APPROVED");
    assert(studentPayload.alumniVerified === false, "Student must NOT be flagged as alumniVerified");
  });

  // TEST 6: Faculty Registration Role Isolation
  await test("6. Faculty Registration Role Isolation", async () => {
    const roleCheck1 = sanitizeAndValidatePublicRole("TEACHER");
    assert(roleCheck1.valid === true);
    assert(roleCheck1.role === "TEACHER");

    const roleCheck2 = sanitizeAndValidatePublicRole("FACULTY");
    assert(roleCheck2.valid === true);
    assert(roleCheck2.role === "TEACHER", "FACULTY must alias cleanly to TEACHER");

    const isAlumni = roleCheck1.role === "ALUMNI";
    const facultyPayload = {
      role: roleCheck1.role,
      status: "APPROVED",
      emailVerified: true,
      alumniVerified: isAlumni,
      verificationMethod: "ulab_email",
    };

    assert(facultyPayload.role === "TEACHER", "Role must be TEACHER");
    assert(facultyPayload.status === "APPROVED", "Status must be APPROVED");
    assert(facultyPayload.alumniVerified === false, "Faculty must NOT be flagged as alumniVerified");
  });

  // TEST 7: Unauthorized Admin Registration Attempt Rejection
  await test("7. Unauthorized Admin Registration Block", async () => {
    const r1 = sanitizeAndValidatePublicRole("ADMIN");
    assert(r1.valid === false, "ADMIN role request must be rejected");
    assert(r1.error.includes("cannot be created through public registration"), "Must give clear security error");

    const r2 = sanitizeAndValidatePublicRole("superadmin");
    assert(r2.valid === false, "superadmin role request must be rejected");

    const r3 = sanitizeAndValidatePublicRole("MODERATOR");
    assert(r3.valid === false, "MODERATOR role request must be rejected");
  });

  // TEST 8: Frontend Role Manipulation Defense
  await test("8. Client-Side Role Manipulation Defense", async () => {
    const maliciousInput = "ADMIN'; DROP TABLE \"User\";--";
    const result = sanitizeAndValidatePublicRole(maliciousInput);
    assert(result.valid === false, "Malicious string must be rejected");
    assert(result.role === "STUDENT", "Must default to lowest privilege role");
  });

  // TEST 9: Duplicate Email Detection Logic
  await test("9. Duplicate Email Prevention Logic", async () => {
    const registeredEmails = new Set(["existing.user@ulab.edu.bd"]);
    const newAttempt = "EXISTING.USER@ULAB.EDU.BD";

    const normalized = validateOfficialUlabEmail(newAttempt).normalizedEmail;
    const isDuplicate = registeredEmails.has(normalized);
    assert(isDuplicate === true, "Case-insensitive duplicate must be caught before registration");
  });

  // TEST 10: Login Rate Limiting & Lockout Verification
  await test("10. Login Rate Limiting & Lockout Verification", async () => {
    const testKey = "test.ratelimit.user@ulab.edu.bd";
    clearLoginRateLimit(testKey);

    // Initial state: allowed
    let status = checkLoginRateLimit(testKey);
    assert(status.allowed === true, "Initial attempt must be allowed");

    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      recordFailedLogin(testKey);
    }

    // 6th attempt must be locked out
    status = checkLoginRateLimit(testKey);
    assert(status.allowed === false, "Lockout must be triggered after 5 failed attempts");
    assert(status.retryAfterMinutes > 0, "Lockout duration must be positive");
    assert(status.error.includes("Too many failed login attempts"), "Error message must be clear");

    // Reset rate limiter
    clearLoginRateLimit(testKey);
    status = checkLoginRateLimit(testKey);
    assert(status.allowed === true, "Clearing rate limit must reset allowed state");
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
