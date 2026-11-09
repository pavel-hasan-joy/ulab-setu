import assert from "assert";
import {
  CMS_ROLES,
  CMS_CONTENT_TYPES,
  CMS_CONTENT_STATUSES,
  CMS_ROLE_CAPABILITIES,
  createCmsContentSchema,
  assignCmsRoleSchema,
} from "../src/lib/cms-types.ts";
import {
  hasCmsCapability,
  canTransitionContentStatus,
  canEditContent,
} from "../src/lib/cms-permissions.ts";
import { ROLE_PERMISSIONS } from "../src/lib/admin-permissions.ts";

console.log("================================================================================");
console.log("   ULAB SETU CMS — PHASE 1 ARCHITECTURE & PERMISSIONS AUDIT SUITE");
console.log("================================================================================\n");

let passed = 0;
let total = 0;

function runAudit(name, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// ==============================================================================
// 1. CMS ROLE & CAPABILITY MATRIX AUDIT (LEAST PRIVILEGE)
// ==============================================================================

runAudit("1.1: Verification of 5 dedicated CMS Roles and Metadata contracts", () => {
  const expectedRoles = ["CMS_ADMIN", "CONTENT_EDITOR", "CONTENT_REVIEWER", "PUBLISHER", "CONTRIBUTOR"];
  assert.strictEqual(CMS_ROLES.length, 5);
  for (const r of expectedRoles) {
    assert.ok(CMS_ROLES.includes(r), `Role ${r} must exist in CMS_ROLES`);
  }
});

runAudit("1.2: CMS_ADMIN holds complete capabilities including permission governance", () => {
  const required = [
    "cms:overview:view",
    "cms:content:create",
    "cms:content:edit",
    "cms:content:review",
    "cms:content:approve",
    "cms:content:publish",
    "cms:content:schedule",
    "cms:content:unpublish",
    "cms:content:archive",
    "cms:content:delete",
    "cms:history:view",
    "cms:permissions:manage",
  ];
  for (const cap of required) {
    assert.strictEqual(
      hasCmsCapability("CMS_ADMIN", cap),
      true,
      `CMS_ADMIN must have ${cap}`
    );
  }
});

runAudit("1.3: CONTENT_EDITOR cannot publish directly or manage permissions", () => {
  assert.strictEqual(hasCmsCapability("CONTENT_EDITOR", "cms:content:create"), true);
  assert.strictEqual(hasCmsCapability("CONTENT_EDITOR", "cms:content:edit"), true);
  assert.strictEqual(hasCmsCapability("CONTENT_EDITOR", "cms:content:submit_review"), true);
  // Denied:
  assert.strictEqual(hasCmsCapability("CONTENT_EDITOR", "cms:content:publish"), false);
  assert.strictEqual(hasCmsCapability("CONTENT_EDITOR", "cms:content:approve"), false);
  assert.strictEqual(hasCmsCapability("CONTENT_EDITOR", "cms:permissions:manage"), false);
});

runAudit("1.4: CONTENT_REVIEWER cannot publish directly or create content", () => {
  assert.strictEqual(hasCmsCapability("CONTENT_REVIEWER", "cms:content:review"), true);
  assert.strictEqual(hasCmsCapability("CONTENT_REVIEWER", "cms:content:approve"), true);
  // Denied:
  assert.strictEqual(hasCmsCapability("CONTENT_REVIEWER", "cms:content:create"), false);
  assert.strictEqual(hasCmsCapability("CONTENT_REVIEWER", "cms:content:publish"), false);
  assert.strictEqual(hasCmsCapability("CONTENT_REVIEWER", "cms:permissions:manage"), false);
});

runAudit("1.5: PUBLISHER cannot manage permissions or approve reviews", () => {
  assert.strictEqual(hasCmsCapability("PUBLISHER", "cms:content:publish"), true);
  assert.strictEqual(hasCmsCapability("PUBLISHER", "cms:content:schedule"), true);
  assert.strictEqual(hasCmsCapability("PUBLISHER", "cms:content:unpublish"), true);
  // Denied:
  assert.strictEqual(hasCmsCapability("PUBLISHER", "cms:content:approve"), false);
  assert.strictEqual(hasCmsCapability("PUBLISHER", "cms:permissions:manage"), false);
});

runAudit("1.6: CONTRIBUTOR can only edit own drafts and submit to review queue", () => {
  assert.strictEqual(hasCmsCapability("CONTRIBUTOR", "cms:content:create"), true);
  assert.strictEqual(hasCmsCapability("CONTRIBUTOR", "cms:content:edit_own"), true);
  assert.strictEqual(hasCmsCapability("CONTRIBUTOR", "cms:content:submit_review"), true);
  // Denied:
  assert.strictEqual(hasCmsCapability("CONTRIBUTOR", "cms:content:edit"), false);
  assert.strictEqual(hasCmsCapability("CONTRIBUTOR", "cms:content:review"), false);
  assert.strictEqual(hasCmsCapability("CONTRIBUTOR", "cms:content:approve"), false);
  assert.strictEqual(hasCmsCapability("CONTRIBUTOR", "cms:content:publish"), false);
});

runAudit("1.7: Unassigned or Non-CMS users have zero CMS capabilities (Deny-by-default)", () => {
  const allCaps = CMS_ROLE_CAPABILITIES.CMS_ADMIN;
  for (const cap of allCaps) {
    assert.strictEqual(hasCmsCapability(null, cap), false);
    assert.strictEqual(hasCmsCapability(undefined, cap), false);
  }
});

// ==============================================================================
// 2. CONTENT LIFECYCLE TRANSITION STATE MACHINE
// ==============================================================================

runAudit("2.1: 8-stage Lifecycle Definition verification", () => {
  const expected = [
    "DRAFT",
    "IN_REVIEW",
    "CHANGES_REQUESTED",
    "APPROVED",
    "SCHEDULED",
    "PUBLISHED",
    "UNPUBLISHED",
    "ARCHIVED",
  ];
  assert.strictEqual(CMS_CONTENT_STATUSES.length, 8);
  for (const s of expected) {
    assert.ok(CMS_CONTENT_STATUSES.includes(s));
  }
});

runAudit("2.2: Contributor submission flow (DRAFT -> IN_REVIEW allowed for own draft)", () => {
  const res = canTransitionContentStatus({
    currentStatus: "DRAFT",
    targetStatus: "IN_REVIEW",
    actorRole: "CONTRIBUTOR",
    isAuthor: true,
  });
  assert.strictEqual(res.allowed, true);

  // Rejected if not the author
  const resOthers = canTransitionContentStatus({
    currentStatus: "DRAFT",
    targetStatus: "IN_REVIEW",
    actorRole: "CONTRIBUTOR",
    isAuthor: false,
  });
  assert.strictEqual(resOthers.allowed, false);
});

runAudit("2.3: Bypass protection (Direct DRAFT -> PUBLISHED strictly blocked)", () => {
  for (const role of CMS_ROLES) {
    const res = canTransitionContentStatus({
      currentStatus: "DRAFT",
      targetStatus: "PUBLISHED",
      actorRole: role,
      isAuthor: true,
    });
    assert.strictEqual(res.allowed, false, `Direct publish from DRAFT must be blocked for ${role}`);
  }
});

runAudit("2.4: Editorial Review Gate (IN_REVIEW -> APPROVED only permitted for Reviewer or Admin)", () => {
  // Allowed
  assert.strictEqual(
    canTransitionContentStatus({
      currentStatus: "IN_REVIEW",
      targetStatus: "APPROVED",
      actorRole: "CONTENT_REVIEWER",
      isAuthor: false,
    }).allowed,
    true
  );
  assert.strictEqual(
    canTransitionContentStatus({
      currentStatus: "IN_REVIEW",
      targetStatus: "APPROVED",
      actorRole: "CMS_ADMIN",
      isAuthor: false,
    }).allowed,
    true
  );

  // Blocked for editor and contributor
  assert.strictEqual(
    canTransitionContentStatus({
      currentStatus: "IN_REVIEW",
      targetStatus: "APPROVED",
      actorRole: "CONTENT_EDITOR",
      isAuthor: true,
    }).allowed,
    false
  );
  assert.strictEqual(
    canTransitionContentStatus({
      currentStatus: "IN_REVIEW",
      targetStatus: "APPROVED",
      actorRole: "CONTRIBUTOR",
      isAuthor: true,
    }).allowed,
    false
  );
});

runAudit("2.5: Publishing Gate (APPROVED -> PUBLISHED only permitted for Publisher or Admin)", () => {
  // Allowed
  assert.strictEqual(
    canTransitionContentStatus({
      currentStatus: "APPROVED",
      targetStatus: "PUBLISHED",
      actorRole: "PUBLISHER",
      isAuthor: false,
    }).allowed,
    true
  );
  assert.strictEqual(
    canTransitionContentStatus({
      currentStatus: "APPROVED",
      targetStatus: "PUBLISHED",
      actorRole: "CMS_ADMIN",
      isAuthor: false,
    }).allowed,
    true
  );

  // Blocked for reviewer, editor, and contributor
  assert.strictEqual(
    canTransitionContentStatus({
      currentStatus: "APPROVED",
      targetStatus: "PUBLISHED",
      actorRole: "CONTENT_REVIEWER",
      isAuthor: false,
    }).allowed,
    false
  );
  assert.strictEqual(
    canTransitionContentStatus({
      currentStatus: "APPROVED",
      targetStatus: "PUBLISHED",
      actorRole: "CONTENT_EDITOR",
      isAuthor: false,
    }).allowed,
    false
  );
});

runAudit("2.6: Unpublish & Archive lifecycle transitions", () => {
  // PUBLISHED -> UNPUBLISHED
  assert.strictEqual(
    canTransitionContentStatus({
      currentStatus: "PUBLISHED",
      targetStatus: "UNPUBLISHED",
      actorRole: "PUBLISHER",
      isAuthor: false,
    }).allowed,
    true
  );
  // PUBLISHED -> ARCHIVED
  assert.strictEqual(
    canTransitionContentStatus({
      currentStatus: "PUBLISHED",
      targetStatus: "ARCHIVED",
      actorRole: "CMS_ADMIN",
      isAuthor: false,
    }).allowed,
    true
  );
  // ARCHIVED -> DRAFT (Re-opening content)
  assert.strictEqual(
    canTransitionContentStatus({
      currentStatus: "ARCHIVED",
      targetStatus: "DRAFT",
      actorRole: "CONTENT_EDITOR",
      isAuthor: false,
    }).allowed,
    true
  );
});

// ==============================================================================
// 3. EDITORIAL OWNERSHIP & LOCKOUT INTEGRITY
// ==============================================================================

runAudit("3.1: Content modification restrictions during IN_REVIEW (Locked from author)", () => {
  // Author cannot edit while in review
  assert.strictEqual(
    canEditContent({ actorRole: "CONTRIBUTOR", isAuthor: true, status: "IN_REVIEW" }),
    false
  );
  // CMS Admin can edit
  assert.strictEqual(
    canEditContent({ actorRole: "CMS_ADMIN", isAuthor: false, status: "IN_REVIEW" }),
    true
  );
});

runAudit("3.2: Contributor cannot edit another user's draft", () => {
  assert.strictEqual(
    canEditContent({ actorRole: "CONTRIBUTOR", isAuthor: false, status: "DRAFT" }),
    false
  );
  assert.strictEqual(
    canEditContent({ actorRole: "CONTRIBUTOR", isAuthor: true, status: "DRAFT" }),
    true
  );
  // Editor can edit any draft
  assert.strictEqual(
    canEditContent({ actorRole: "CONTENT_EDITOR", isAuthor: false, status: "DRAFT" }),
    true
  );
});

// ==============================================================================
// 4. DATA SCHEMAS & INPUT VALIDATION
// ==============================================================================

runAudit("4.1: URL slug format enforcement (lowercase alphanumeric + hyphens)", () => {
  const validSlugs = ["cse-notice-2026", "convocation-rsvp", "faq-admission-policy", "welcome-to-ulab"];
  for (const slug of validSlugs) {
    const res = createCmsContentSchema.safeParse({
      title: "Valid Title Test",
      slug,
      contentType: "NEWS",
    });
    assert.strictEqual(res.success, true, `Slug ${slug} should be valid`);
  }

  const invalidSlugs = ["Uppercase-Slug", "spaces in slug", "invalid_underscores", "special!@#chars", "-leading-hyphen", "trailing-hyphen-"];
  for (const slug of invalidSlugs) {
    const res = createCmsContentSchema.safeParse({
      title: "Valid Title Test",
      slug,
      contentType: "NEWS",
    });
    assert.strictEqual(res.success, false, `Slug "${slug}" should be rejected`);
  }
});

runAudit("4.2: Content Type whitelist validation across all 8 types", () => {
  for (const type of CMS_CONTENT_TYPES) {
    const res = createCmsContentSchema.safeParse({
      title: "Sample Title",
      slug: `sample-slug-${type.toLowerCase().replace(/_/g, "-")}`,
      contentType: type,
    });
    assert.strictEqual(res.success, true, `Content type ${type} should be accepted`);
  }

  // Reject unsupported type
  const badRes = createCmsContentSchema.safeParse({
    title: "Bad Type",
    slug: "bad-slug",
    contentType: "UNSUPPORTED_TYPE",
  });
  assert.strictEqual(badRes.success, false);
});

runAudit("4.3: CMS Role assignment validation schema", () => {
  const valid = assignCmsRoleSchema.safeParse({
    targetUserId: "usr_12345",
    role: "CONTENT_EDITOR",
    notes: "Editor for CSE department",
  });
  assert.strictEqual(valid.success, true);

  const invalidRole = assignCmsRoleSchema.safeParse({
    targetUserId: "usr_12345",
    role: "NON_EXISTENT_ROLE",
  });
  assert.strictEqual(invalidRole.success, false);
});

// ==============================================================================
// 5. ADMIN PERMISSIONS & SUPER_ADMIN INTEGRATION
// ==============================================================================

runAudit("5.1: Admin RBAC includes cms:view and cms:permissions:manage for SUPER_ADMIN", () => {
  const superAdminPerms = ROLE_PERMISSIONS.SUPER_ADMIN;
  assert.ok(superAdminPerms.includes("cms:view"), "SUPER_ADMIN must have cms:view");
  assert.ok(superAdminPerms.includes("cms:permissions:manage"), "SUPER_ADMIN must have cms:permissions:manage");
});

runAudit("5.2: Existing user admin / job moderator boundaries preserved without CMS leaks", () => {
  const userAdminPerms = ROLE_PERMISSIONS.USER_ADMIN;
  const jobModPerms = ROLE_PERMISSIONS.JOB_MODERATOR;
  assert.strictEqual(userAdminPerms.includes("cms:permissions:manage"), false);
  assert.strictEqual(jobModPerms.includes("cms:permissions:manage"), false);
});

console.log("\n================================================================================");
console.log(`   Final CMS Phase 1 Audit: ${passed}/${total} Checks Passed (${Math.round((passed / total) * 100)}%)`);
console.log("================================================================================\n");

if (passed !== total) {
  process.exit(1);
}
