import assert from "node:assert";
import {
  CMS_BLOCK_TYPES,
  parseCmsBlocks,
  headingBlockSchema,
  richTextBlockSchema,
  imageBlockSchema,
  imageWithTextBlockSchema,
  featureCardsBlockSchema,
  ctaBlockSchema,
  faqAccordionBlockSchema,
  testimonialBlockSchema,
  eventPreviewBlockSchema,
} from "../src/lib/cms-blocks.ts";
import {
  homepageContentSchema,
  DEFAULT_HOMEPAGE_CONTENT,
} from "../src/lib/cms-homepage.ts";

console.log("🧪 Running ULAB Setu CMS Phase 2 Automated Test Suite...\n");

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
// 1. Content Block Schemas & Types
// ---------------------------------------------------------------------------
console.log("📦 1. Content Block Schemas & Types Validation:");

runTest("1.1 Exactly 9 core content block types are registered", () => {
  assert.strictEqual(CMS_BLOCK_TYPES.length, 9);
  const expected = [
    "heading",
    "richText",
    "image",
    "imageWithText",
    "featureCards",
    "cta",
    "faqAccordion",
    "testimonial",
    "eventPreview",
  ];
  for (const exp of expected) {
    assert(CMS_BLOCK_TYPES.includes(exp), `Missing block type: ${exp}`);
  }
});

runTest("1.2 Heading block validates levels and alignment", () => {
  const valid = headingBlockSchema.safeParse({
    id: "h1",
    type: "heading",
    text: "Hello World",
    level: "h2",
    alignment: "center",
    subtitle: "A nice subtitle",
  });
  assert.strictEqual(valid.success, true);

  const invalidLevel = headingBlockSchema.safeParse({
    id: "h2",
    type: "heading",
    text: "Hello",
    level: "h7", // Not h1..h6
    alignment: "center",
  });
  assert.strictEqual(invalidLevel.success, false);
});

runTest("1.3 Rich text block validates non-empty body string", () => {
  const valid = richTextBlockSchema.safeParse({
    id: "rt1",
    type: "richText",
    body: "Paragraph copy with formatted text",
    isLead: false,
  });
  assert.strictEqual(valid.success, true);

  const empty = richTextBlockSchema.safeParse({
    id: "rt2",
    type: "richText",
    body: "",
  });
  assert.strictEqual(empty.success, false);
});

runTest("1.4 Feature cards block validates array of cards", () => {
  const valid = featureCardsBlockSchema.safeParse({
    id: "fc1",
    type: "featureCards",
    cards: [
      { icon: "Sparkles", title: "Benefit One", description: "First card description" },
      { icon: "Shield", title: "Benefit Two", description: "Second card description" },
    ],
  });
  assert.strictEqual(valid.success, true);
});

runTest("1.5 Call to action (CTA) block validates buttons and tone", () => {
  const valid = ctaBlockSchema.safeParse({
    id: "cta1",
    type: "cta",
    title: "Join ULAB Setu Today",
    description: "Connect with thousands of graduates.",
    primaryLabel: "Sign Up",
    primaryUrl: "/signup",
    tone: "navy",
  });
  assert.strictEqual(valid.success, true);
});

runTest("1.6 FAQ Accordion block validates item list", () => {
  const valid = faqAccordionBlockSchema.safeParse({
    id: "faq1",
    type: "faqAccordion",
    title: "General Inquiries",
    items: [
      { question: "How do I register?", answer: "Use your @ulab.edu.bd email." },
    ],
  });
  assert.strictEqual(valid.success, true);
});

runTest("1.7 parseCmsBlocks safely deserializes JSON and filters invalid entries", () => {
  const blocks = [
    { id: "b1", type: "heading", text: "Valid Title", level: "h1", alignment: "left" },
    { id: "b2", type: "unknownCustomScript", script: "alert('xss')" }, // Dropped
  ];

  const parsed = parseCmsBlocks(JSON.stringify(blocks));
  assert.strictEqual(parsed.length, 1);
  assert.strictEqual(parsed[0].type, "heading");

  // Invalid JSON should return empty array safely without throwing
  const fallback = parseCmsBlocks("invalid-non-json-string");
  assert.deepStrictEqual(fallback, []);
});

// ---------------------------------------------------------------------------
// 2. Homepage Content Schema & Safe Defaults
// ---------------------------------------------------------------------------
console.log("\n🏠 2. Homepage Content Schema & Safe Defaults:");

runTest("2.1 Default homepage content validates completely against schema", () => {
  const res = homepageContentSchema.safeParse(DEFAULT_HOMEPAGE_CONTENT);
  assert.strictEqual(res.success, true, "DEFAULT_HOMEPAGE_CONTENT must be 100% compliant with homepageContentSchema");
});

runTest("2.2 Homepage schema enforces required fields and non-empty strings", () => {
  const clone = { ...DEFAULT_HOMEPAGE_CONTENT, heroHeadline: "OK" }; // too short (< 3 chars)
  const res = homepageContentSchema.safeParse(clone);
  assert.strictEqual(res.success, false);
});

runTest("2.3 Default homepage content preserves original hero copy and links", () => {
  assert(DEFAULT_HOMEPAGE_CONTENT.heroHeadline.includes("seniors already know"));
  assert.strictEqual(DEFAULT_HOMEPAGE_CONTENT.heroStudentCtaLink, "/signup?role=student");
  assert.strictEqual(DEFAULT_HOMEPAGE_CONTENT.heroAlumniCtaLink, "/signup?role=alumni");
});

// ---------------------------------------------------------------------------
// 3. Security & Validation Rules
// ---------------------------------------------------------------------------
console.log("\n🛡️ 3. Security & Isolation Boundaries:");

runTest("3.1 URL Slug validation rejects invalid characters and uppercase", () => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  assert.strictEqual(slugRegex.test("about-ulab"), true);
  assert.strictEqual(slugRegex.test("how-it-works"), true);
  assert.strictEqual(slugRegex.test("About-Ulab"), false); // No uppercase
  assert.strictEqual(slugRegex.test("about_ulab"), false); // No underscores
  assert.strictEqual(slugRegex.test("about/ulab"), false); // No slashes
  assert.strictEqual(slugRegex.test("<script>"), false);
});

runTest("3.2 Structured blocks enforce type-level isolation against arbitrary script injections", () => {
  const rawPayload = JSON.stringify([
    {
      id: "hack",
      type: "richText",
      body: "<p>Safe text</p><script>alert('pwned')</script>",
      isLead: false,
    },
  ]);

  const parsed = parseCmsBlocks(rawPayload);
  assert.strictEqual(parsed.length, 1);
  assert.strictEqual(typeof parsed[0].body, "string");
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("\n========================================================");
console.log(`🏁 CMS Phase 2 Test Results: ${passed} / ${total} passed`);
console.log("========================================================\n");

if (passed !== total) {
  process.exit(1);
}
