import assert from "node:assert";
import {
  MAX_MEDIA_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  validateFileBuffer,
} from "../src/lib/cms-media-security.ts";

console.log("🧪 Running ULAB Setu CMS Phase 4 Automated Test Suite...\n");

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
// 1. Storage Constraints & Binary Signature Validation
// ---------------------------------------------------------------------------
console.log("🔒 1. Storage Constraints & Binary Signature Validation:");

runTest("1.1 Max media file size bound is 5MB", () => {
  assert.strictEqual(MAX_MEDIA_FILE_SIZE, 5 * 1024 * 1024);
});

runTest("1.2 Validates genuine JPEG binary signature (FF D8 FF)", () => {
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const res = validateFileBuffer(jpegHeader, "image/jpeg");
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.detectedMime, "image/jpeg");
});

runTest("1.3 Validates genuine PNG binary signature (89 50 4E 47)", () => {
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
  const res = validateFileBuffer(pngHeader, "image/png");
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.detectedMime, "image/png");
});

runTest("1.4 Validates genuine PDF document signature (%PDF)", () => {
  const pdfHeader = Buffer.from("%PDF-1.7\n%sample binary data");
  const res = validateFileBuffer(pdfHeader, "application/pdf");
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.detectedMime, "application/pdf");
});

runTest("1.5 Strictly rejects malicious executable file masquerading as image", () => {
  // An .exe / ELF header spoofed as an image
  const fakeImageBuffer = Buffer.from("MZThisIsAnExecutableFileContent4D5A");
  const res = validateFileBuffer(fakeImageBuffer, "image/png");
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.detectedMime, null);
  assert(res.error.includes("File format could not be verified"));
});

runTest("1.6 Strictly rejects oversized files beyond 5MB", () => {
  const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
  const res = validateFileBuffer(oversizedBuffer, "image/jpeg");
  assert.strictEqual(res.valid, false);
  assert(res.error.includes("File size exceeds"));
});

runTest("1.7 Detects and rejects MIME type mismatch (declared jpeg but contents are png)", () => {
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
  const res = validateFileBuffer(pngHeader, "image/jpeg"); // Mismatch
  assert.strictEqual(res.valid, false);
  assert(res.error.includes("MIME type mismatch"));
});

// ---------------------------------------------------------------------------
// 2. Allowed Format Whitelist
// ---------------------------------------------------------------------------
console.log("\n📋 2. Approved Media MIME Whitelist:");

runTest("2.1 Includes safe web images and PDF documents", () => {
  assert(ALLOWED_MIME_TYPES.includes("image/jpeg"));
  assert(ALLOWED_MIME_TYPES.includes("image/png"));
  assert(ALLOWED_MIME_TYPES.includes("image/webp"));
  assert(ALLOWED_MIME_TYPES.includes("image/gif"));
  assert(ALLOWED_MIME_TYPES.includes("application/pdf"));
  assert(!ALLOWED_MIME_TYPES.includes("application/x-msdownload"));
  assert(!ALLOWED_MIME_TYPES.includes("text/html"));
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("\n========================================================");
console.log(`🏁 CMS Phase 4 Test Results: ${passed} / ${total} passed`);
console.log("========================================================\n");

if (passed !== total) {
  process.exit(1);
}
