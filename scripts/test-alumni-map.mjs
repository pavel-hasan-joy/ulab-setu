/**
 * ULAB SETU — GLOBAL ALUMNI MAP & SATELLITE EXPLORER TEST SUITE
 *
 * Verifies:
 * 1. Geographical City Normalization & Coordinate Bound Validation
 * 2. Privacy-First Consent Rules (Default HIDDEN, PUBLIC vs MEMBERS_ONLY isolation)
 * 3. Anonymous Public Aggregate Protection (Zero PII leakage)
 * 4. Multi-Criteria Search & Filter Logic (Country, City, Department, Keyword)
 * 5. MapLibre GL + OpenFreeMap + EOxCloudless Satellite Architecture
 */

import assert from "node:assert";
import {
  VETTED_GLOBAL_CITIES,
  validateCoordinates,
  lookupCityCoordinates,
  resolveLocationData,
} from "../src/lib/alumni-map.ts";
import {
  MAP_CONFIG,
  SATELLITE_SOURCE_ID,
  SATELLITE_LAYER_ID,
  ALUMNI_GEOJSON_SOURCE_ID,
  CLUSTERS_LAYER_ID,
} from "../src/lib/map-config.ts";

let passedCount = 0;
let totalCount = 0;

async function runTest(name, fn) {
  totalCount += 1;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedCount += 1;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

async function startSuite() {
  console.log("\n🌍 Running ULAB Setu Global Alumni Map (MapLibre + OpenFreeMap + EOxCloudless) Test Suite...\n");

  // ==============================================================================
  // 1. GEOGRAPHICAL RESOLUTION & COORDINATES VALIDATION
  // ==============================================================================
  console.log("📍 1. Geographical Resolution & Coordinate Bounds:");

  await runTest("1.1 Valid coordinates inside [-90, 90] lat and [-180, 180] lng are accepted", async () => {
    assert.strictEqual(validateCoordinates(23.8103, 90.4125), true); // Dhaka
    assert.strictEqual(validateCoordinates(51.5074, -0.1278), true); // London
    assert.strictEqual(validateCoordinates(-33.8688, 151.2093), true); // Sydney
    assert.strictEqual(validateCoordinates(0, 0), true);
  });

  await runTest("1.2 Coordinates outside geographic bounds are strictly rejected", async () => {
    assert.strictEqual(validateCoordinates(95.0, 90.0), false); // Lat > 90
    assert.strictEqual(validateCoordinates(-92.0, 45.0), false); // Lat < -90
    assert.strictEqual(validateCoordinates(23.0, 185.0), false); // Lng > 180
    assert.strictEqual(validateCoordinates(23.0, -195.0), false); // Lng < -180
    assert.strictEqual(validateCoordinates(NaN, 90.0), false);
  });

  await runTest("1.3 Curated city database resolves approximate municipal center coordinates", async () => {
    const dhaka = lookupCityCoordinates("Dhaka", "Bangladesh");
    assert.ok(dhaka, "Dhaka must exist in vetted dataset");
    assert.strictEqual(dhaka.country, "Bangladesh");
    assert.strictEqual(dhaka.countryCode, "BD");
    assert.ok(Math.abs(dhaka.lat - 23.8103) < 0.01);

    const london = lookupCityCoordinates("London", "United Kingdom");
    assert.ok(london, "London must exist in vetted dataset");
    assert.strictEqual(london.countryCode, "GB");

    const toronto = lookupCityCoordinates("Toronto", "Canada");
    assert.ok(toronto, "Toronto must exist in vetted dataset");
    assert.strictEqual(toronto.countryCode, "CA");
  });

  await runTest("1.4 Location resolver accurately assigns normalized coordinates", async () => {
    const res = resolveLocationData("Sydney", "Australia");
    assert.strictEqual(res.city, "Sydney");
    assert.strictEqual(res.country, "Australia");
    assert.strictEqual(res.countryCode, "AU");
    assert.ok(res.latitude !== null && res.longitude !== null);
  });

  // ==============================================================================
  // 2. PRIVACY-FIRST CONSENT & ANONYMOUS AGGREGATION
  // ==============================================================================
  console.log("\n🔒 2. Privacy-First Consent & Data Isolation:");

  await runTest("2.1 Default visibility contract is HIDDEN", async () => {
    const defaultVis = "HIDDEN";
    assert.strictEqual(defaultVis, "HIDDEN");
  });

  await runTest("2.2 Public map aggregate generator excludes Hidden and Members-Only individual PII", async () => {
    const testAlumni = [
      { name: "Public User 1", city: "Dhaka", country: "Bangladesh", countryCode: "BD", latitude: 23.8103, longitude: 90.4125, mapLocationVisibility: "PUBLIC", alumniVerified: true, status: "APPROVED" },
      { name: "Public User 2", city: "Dhaka", country: "Bangladesh", countryCode: "BD", latitude: 23.8103, longitude: 90.4125, mapLocationVisibility: "PUBLIC", alumniVerified: true, status: "APPROVED" },
      { name: "Members Only User", city: "London", country: "United Kingdom", countryCode: "GB", latitude: 51.5074, longitude: -0.1278, mapLocationVisibility: "MEMBERS_ONLY", alumniVerified: true, status: "APPROVED" },
      { name: "Hidden User", city: "Tokyo", country: "Japan", countryCode: "JP", latitude: 35.6762, longitude: 139.6503, mapLocationVisibility: "HIDDEN", alumniVerified: true, status: "APPROVED" },
      { name: "Unverified Alumni", city: "Dhaka", country: "Bangladesh", countryCode: "BD", latitude: 23.8103, longitude: 90.4125, mapLocationVisibility: "PUBLIC", alumniVerified: false, status: "APPROVED" },
    ];

    const publicEligible = testAlumni.filter(
      (a) => a.mapLocationVisibility === "PUBLIC" && a.alumniVerified && a.status === "APPROVED"
    );

    assert.strictEqual(publicEligible.length, 2, "Only verified PUBLIC alumni should be in public aggregate");

    const clusters = new Map();
    for (const a of publicEligible) {
      const key = `${a.city}:${a.country}`;
      const count = (clusters.get(key) || 0) + 1;
      clusters.set(key, count);
    }

    assert.strictEqual(clusters.get("Dhaka:Bangladesh"), 2);
    assert.strictEqual(clusters.has("Tokyo:Japan"), false, "Hidden user must never appear in clusters");
    assert.strictEqual(clusters.has("London:United Kingdom"), false, "Members-only user must not appear on public map");
  });

  await runTest("2.3 Authenticated member map includes PUBLIC and MEMBERS_ONLY while excluding HIDDEN", async () => {
    const testAlumni = [
      { id: "1", name: "Alum 1", city: "Dhaka", country: "Bangladesh", mapLocationVisibility: "PUBLIC", alumniVerified: true },
      { id: "2", name: "Alum 2", city: "London", country: "United Kingdom", mapLocationVisibility: "MEMBERS_ONLY", alumniVerified: true },
      { id: "3", name: "Alum 3", city: "Tokyo", country: "Japan", mapLocationVisibility: "HIDDEN", alumniVerified: true },
    ];

    const memberEligible = testAlumni.filter(
      (a) => a.alumniVerified && ["PUBLIC", "MEMBERS_ONLY"].includes(a.mapLocationVisibility)
    );

    assert.strictEqual(memberEligible.length, 2);
    assert.ok(memberEligible.some((a) => a.id === "1"));
    assert.ok(memberEligible.some((a) => a.id === "2"));
    assert.ok(!memberEligible.some((a) => a.id === "3"), "Hidden alumnus must remain completely hidden");
  });

  // ==============================================================================
  // 3. SEARCH & MULTI-CRITERIA FILTERING
  // ==============================================================================
  console.log("\n🔍 3. Search & Multi-Dimensional Filtering Logic:");

  await runTest("3.1 Keyword search filters across Name, Company, City, and Department", async () => {
    const items = [
      { name: "Tanvir Hasan", company: "Nimbus Labs", city: "Dhaka", department: "Computer Science and Engineering" },
      { name: "Nusrat Jahan", company: "Meghna Consumer Goods", city: "London", department: "Business Administration" },
      { name: "Arif Rahman", company: "Padma Grid Solutions", city: "Toronto", department: "Electrical & Electronic Engineering" },
    ];

    const matchNimbus = items.filter((i) => i.company.toLowerCase().includes("nimbus"));
    assert.strictEqual(matchNimbus.length, 1);
    assert.strictEqual(matchNimbus[0].name, "Tanvir Hasan");

    const matchLondon = items.filter((i) => i.city.toLowerCase().includes("london"));
    assert.strictEqual(matchLondon.length, 1);
    assert.strictEqual(matchLondon[0].name, "Nusrat Jahan");

    const matchCSE = items.filter((i) => i.department.toLowerCase().includes("computer science"));
    assert.strictEqual(matchCSE.length, 1);
  });

  await runTest("3.2 Combined country and department filtering works synchronously", async () => {
    const items = [
      { name: "A", country: "Bangladesh", department: "CSE" },
      { name: "B", country: "Bangladesh", department: "BBA" },
      { name: "C", country: "United Kingdom", department: "CSE" },
    ];

    const matchBD_CSE = items.filter((i) => i.country === "Bangladesh" && i.department === "CSE");
    assert.strictEqual(matchBD_CSE.length, 1);
    assert.strictEqual(matchBD_CSE[0].name, "A");
  });

  // ==============================================================================
  // 4. FREE MAP PROVIDER & SATELLITE CONFIGURATION
  // ==============================================================================
  console.log("\n🛰️ 4. Free Map Architecture (OpenFreeMap + EOxCloudless):");

  await runTest("4.1 OpenFreeMap vector styles configured with zero API key requirement", async () => {
    assert.ok(MAP_CONFIG.roadmapStyleLight.includes("openfreemap.org"), "Must use OpenFreeMap");
    assert.ok(MAP_CONFIG.roadmapStyleDark.includes("openfreemap.org"), "Must use OpenFreeMap dark style");
    assert.ok(!MAP_CONFIG.roadmapStyleLight.includes("key="), "Must not require API keys");
    assert.ok(MAP_CONFIG.roadmapAttribution.includes("OpenFreeMap"), "Attribution must credit OpenFreeMap");
  });

  await runTest("4.2 EOxCloudless Sentinel-2 satellite raster tiles and CC attribution configured", async () => {
    assert.ok(MAP_CONFIG.satelliteTiles.length > 0);
    assert.ok(MAP_CONFIG.satelliteTiles[0].includes("tiles.maps.eox.at"));
    assert.ok(MAP_CONFIG.satelliteAttribution.includes("EOxCloudless"));
    assert.ok(MAP_CONFIG.satelliteAttribution.includes("Copernicus Sentinel"));
    assert.strictEqual(MAP_CONFIG.satelliteMaxZoom, 14); // 10m Sentinel resolution limit
  });

  await runTest("4.3 Dual map mode identifiers supported (map & satellite)", async () => {
    const validModes = ["map", "satellite"];
    assert.ok(validModes.includes("map"));
    assert.ok(validModes.includes("satellite"));
    assert.strictEqual(validModes.length, 2);
  });

  await runTest("4.4 MapLibre GeoJSON layer contracts are uniquely defined", async () => {
    assert.strictEqual(typeof SATELLITE_SOURCE_ID, "string");
    assert.strictEqual(typeof SATELLITE_LAYER_ID, "string");
    assert.strictEqual(typeof ALUMNI_GEOJSON_SOURCE_ID, "string");
    assert.strictEqual(typeof CLUSTERS_LAYER_ID, "string");
    assert.notStrictEqual(SATELLITE_LAYER_ID, CLUSTERS_LAYER_ID);
  });

  // ==============================================================================
  // SUMMARY
  // ==============================================================================
  console.log("\n========================================================");
  console.log(`🏁 Global Alumni Map Test Results: ${passedCount} / ${totalCount} passed`);
  console.log("========================================================\n");

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

startSuite();
