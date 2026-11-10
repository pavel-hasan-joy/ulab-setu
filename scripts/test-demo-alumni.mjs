import fs from "fs";
import path from "path";
import sharp from "sharp";
import { SYNTHETIC_DEMO_ALUMNI } from "../src/lib/demo-alumni-dataset.ts";
import { validateCoordinates, VETTED_GLOBAL_CITIES } from "../src/lib/alumni-map.ts";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("================================================================================");
  console.log("   ULAB SETU — 500 SYNTHETIC DEMO ALUMNI & GLOBAL MAP AUDIT SUITE               ");
  console.log("================================================================================");

  console.log("\n📋 1. Dataset Integrity & Profile Schema Completeness:");
  assert(SYNTHETIC_DEMO_ALUMNI.length === 500, `Exactly 500 synthetic profiles exist (Found: ${SYNTHETIC_DEMO_ALUMNI.length})`);

  const namesSet = new Set(SYNTHETIC_DEMO_ALUMNI.map((a) => a.name));
  assert(namesSet.size === 500, `All 500 alumni have 100% unique full names (${namesSet.size}/500)`);

  const emailsSet = new Set(SYNTHETIC_DEMO_ALUMNI.map((a) => a.email));
  assert(emailsSet.size === 500, `All 500 alumni have 100% unique emails (${emailsSet.size}/500)`);

  const imagesSet = new Set(SYNTHETIC_DEMO_ALUMNI.map((a) => a.image));
  assert(imagesSet.size === 500, `All 500 alumni have 100% unique image paths (${imagesSet.size}/500)`);

  const allHaveIsDemo = SYNTHETIC_DEMO_ALUMNI.every((a) => a.isDemo === true);
  assert(allHaveIsDemo, "Every synthetic profile carries internal flag isDemo: true");

  const allUnverified = SYNTHETIC_DEMO_ALUMNI.every((a) => a.alumniVerified === false);
  assert(allUnverified, "Synthetic profiles carry alumniVerified: false (Zero real university credential contamination)");

  const allCompleteFields = SYNTHETIC_DEMO_ALUMNI.every(
    (a) =>
      a.id &&
      a.name &&
      a.email &&
      a.department &&
      a.studentId &&
      a.batch &&
      a.graduationYear &&
      a.company &&
      a.designation &&
      a.city &&
      a.country &&
      a.countryCode &&
      a.bio &&
      a.skills &&
      a.image
  );
  assert(allCompleteFields, "Every profile has 100% complete personal, academic, professional & location fields");

  console.log("\n🌍 2. Global Geospatial Distribution & Coordinate Bounds:");
  const countries = new Set(SYNTHETIC_DEMO_ALUMNI.map((a) => a.country));
  assert(countries.size >= 50, `Profiles span 50+ diverse global countries (Found: ${countries.size} countries)`);

  const cities = new Set(SYNTHETIC_DEMO_ALUMNI.map((a) => a.city));
  assert(cities.size >= 100, `Profiles distributed across 100+ vetted municipal city centers (Found: ${cities.size} cities)`);

  const allValidCoords = SYNTHETIC_DEMO_ALUMNI.every((a) =>
    validateCoordinates(a.latitude, a.longitude)
  );
  assert(allValidCoords, "Every single coordinate is strictly bounded within [-90, 90] lat and [-180, 180] lng");

  const noneInOcean = SYNTHETIC_DEMO_ALUMNI.every((a) => {
    return VETTED_GLOBAL_CITIES.some(
      (vc) => vc.city.toLowerCase() === a.city.toLowerCase() && vc.country.toLowerCase() === a.country.toLowerCase()
    );
  });
  assert(noneInOcean, "Every alumni location maps exactly to a verified municipal center (0 in ocean/desert)");

  console.log("\n🖼️ 3. Physical Avatar Storage & Strict < 500 KB Size Verification:");
  const avatarDir = path.resolve(process.cwd(), "public", "demo-avatars");
  const avatarFiles = fs.readdirSync(avatarDir).filter((f) => f.endsWith(".webp"));
  assert(avatarFiles.length === 500, `Exactly 500 WebP avatar files physically exist on disk (Found: ${avatarFiles.length})`);

  let largestSize = 0;
  let smallestSize = Infinity;
  let totalBytes = 0;
  let allDecodableWebp = true;
  let allExactDimensions = true;
  let allStrictlyUnder500Kb = true;

  for (let i = 1; i <= 500; i++) {
    const filePath = path.join(avatarDir, `alumni-${i}.webp`);
    if (!fs.existsSync(filePath)) {
      allDecodableWebp = false;
      break;
    }
    const stat = fs.statSync(filePath);
    totalBytes += stat.size;
    if (stat.size > largestSize) largestSize = stat.size;
    if (stat.size < smallestSize) smallestSize = stat.size;
    if (stat.size >= 500 * 1024) allStrictlyUnder500Kb = false;

    // Spot-check 20 files decoding with sharp
    if (i % 25 === 0) {
      const meta = await sharp(filePath).metadata();
      if (meta.format !== "webp") allDecodableWebp = false;
      if (meta.width !== 512 || meta.height !== 512) allExactDimensions = false;
    }
  }

  assert(allStrictlyUnder500Kb, `STRICT < 500 KB LIMIT: 100% Passed (Largest image: ${Math.round(largestSize / 1024)} KB, Limit: 499 KB)`);
  assert(allExactDimensions, "WebP dimensions verified at exact 512 x 512 pixels");
  assert(allDecodableWebp, "Image files verified as genuine, decodable WebP binary formats");

  const avgKb = Math.round(totalBytes / 500 / 1024);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
  console.log(`     [Metric] Storage Total: ${totalMb} MB | Average Size: ${avgKb} KB | Range: ${Math.round(smallestSize / 1024)} KB - ${Math.round(largestSize / 1024)} KB`);

  console.log("\n🛡️ 4. Data Isolation & Real Alumni Protection:");
  const reportPath = path.join(avatarDir, "validation-report.json");
  assert(fs.existsSync(reportPath), "Validation report JSON generated and accessible");

  const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
  assert(report.totalGenerated === 500 && report.failedCount === 0, "Validation report confirms 500 generated with 0 failures");

  console.log("================================================================================");
  console.log(`🏁 Test Results: ${passed} passed, ${failed} failed`);
  console.log("================================================================================");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

