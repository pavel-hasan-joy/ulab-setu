// Logs in as every demo account and opens every page that account can reach, checking for
// failed responses, script errors, error screens, sideways scrolling and wrong redirects.
// Run against a server on the seeded test database:
//   BASE=http://localhost:3457 SHOTS=e2e/shots/walk node e2e/walkthrough.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS ?? "e2e/shots/walk";
mkdirSync(SHOTS, { recursive: true });

const accounts = [
  { email: "student@ulab.edu.bd", role: "student", home: "/student" },
  { email: "student2@ulab.edu.bd", role: "student", home: "/student" },
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ email: `alumni${n}@example.com`, role: "alumni", home: "/alumni" })),
  { email: "pending.alumni@example.com", role: "alumni", home: "/alumni", pending: true },
  { email: "teacher@ulab.edu.bd", role: "teacher", home: "/teacher" },
  { email: "teacher2@ulab.edu.bd", role: "teacher", home: "/teacher" },
  { email: "pending.teacher@ulab.edu.bd", role: "teacher", home: "/teacher", pending: true },
  { email: "admin@ulab.edu.bd", role: "admin", home: "/admin" },
];
const areas = ["/student", "/alumni", "/teacher", "/admin"];

const results = [];
const note = (ok, who, what, detail = "") => results.push({ ok, who, what, detail });

// HEADED=1 opens a visible Chrome window and slows each step down so you can watch.
const headed = process.env.HEADED === "1";
const browser = await chromium.launch({ channel: "chrome", headless: !headed, slowMo: headed ? 250 : 0, args: headed ? ["--window-position=40,40", "--window-size=1460,980"] : [] });

async function openContext(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  await ctx.addInitScript(() => {
    try { localStorage.setItem("setu-install-dismissed", "1"); } catch {}
  });
  return ctx;
}

/** Visit a URL and check it. Returns the final path. */
async function check(page, who, url, label, { shot } = {}) {
  const problems = [];
  const onError = (e) => problems.push(`script error: ${e.message}`);
  const onConsole = (m) => m.type() === "error" && problems.push(`console: ${m.text().slice(0, 140)}`);
  const onResponse = (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()} ${new URL(r.url()).pathname}`);
  page.on("pageerror", onError);
  page.on("console", onConsole);
  page.on("response", onResponse);
  try {
    // "load", not "networkidle": Next.js keeps prefetching linked pages, so the network is rarely idle
    const res = await page.goto(BASE + url, { waitUntil: "load" });
    if (!res || res.status() >= 400) problems.push(`page returned ${res?.status()}`);
    await page.waitForTimeout(900);
    const body = await page.locator("body").innerText();
    if (/Application error|Internal Server Error|This page doesn.t exist|Something went wrong/i.test(body)) problems.push("error screen shown");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) problems.push("page scrolls sideways");
    if ((await page.locator("h1").count()) === 0) problems.push("no page heading");
    if (shot) await page.screenshot({ path: `${SHOTS}/${shot}.jpg`, type: "jpeg", quality: 60 });
  } catch (e) {
    problems.push(`failed to load: ${e.message.split("\n")[0]}`);
  } finally {
    page.off("pageerror", onError);
    page.off("console", onConsole);
    page.off("response", onResponse);
  }
  note(problems.length === 0, who, label ?? url, problems.join("; "));
  return new URL(page.url()).pathname;
}

async function login(page, email) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "password123");
  await page.click('button:has-text("Log in")');
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 });
  await page.waitForTimeout(1200); // let the home-page pull finish
  return new URL(page.url()).pathname;
}

// Public pages first
{
  const ctx = await openContext();
  const page = await ctx.newPage();
  for (const [url, label] of [["/", "home page"], ["/login", "log in"], ["/signup", "sign up (student)"], ["/signup?role=alumni", "sign up (alumni)"], ["/signup?role=teacher", "sign up (teacher)"]]) {
    await check(page, "visitor", url, label);
  }
  for (const area of areas) {
    await page.goto(BASE + area);
    const path = new URL(page.url()).pathname;
    note(path === "/login", "visitor", `${area} needs log in`, path === "/login" ? "" : `ended on ${path}`);
  }
  const bad = await page.goto(`${BASE}/student/jobs/does-not-exist`);
  note(new URL(page.url()).pathname === "/login", "visitor", "unknown job link needs log in", bad ? "" : "");
  await ctx.close();
}

for (const acct of accounts) {
  const who = acct.email;
  const ctx = await openContext();
  const page = await ctx.newPage();
  let landed;
  try {
    landed = await login(page, acct.email);
  } catch (e) {
    note(false, who, "log in", e.message.split("\n")[0]);
    await ctx.close();
    continue;
  }
  note(landed === acct.home, who, "log in lands on home", landed === acct.home ? "" : `landed on ${landed}`);

  // Every page in the sidebar
  const links = await page.$$eval("aside nav a", (as) => as.map((a) => [a.getAttribute("href"), a.textContent.trim()]));
  const tag = acct.email.split("@")[0];
  for (const [href, text] of links) {
    await check(page, who, href, `${text} (${href})`, { shot: acct.email === accounts.find((a) => a.role === acct.role).email ? `${tag}-${text.replace(/\W+/g, "-").toLowerCase()}` : undefined });
  }

  // Deeper pages per role
  if (acct.role === "student") {
    for (const tab of ["bd", "remote"]) await check(page, who, `/student/jobs?tab=${tab}`, `jobs tab ${tab}`);
    await page.goto(`${BASE}/student/jobs`);
    const jobHrefs = await page.$$eval('a[href^="/student/jobs/"]', (as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
    for (const h of jobHrefs) await check(page, who, h, `job detail ${h.split("/").pop().slice(0, 6)}`);
    for (const tab of ["alumni", "teachers", "students"]) await check(page, who, `/student/people?tab=${tab}`, `people ${tab}`);
    for (const kind of ["Notice", "Event", "Scholarship", "Research", "Opportunity"]) await check(page, who, `/student/board?kind=${kind}`, `notices ${kind}`);
    await check(page, who, "/student/jobs?q=zzzz-nothing", "jobs search with no results");
  }
  if (acct.role === "alumni" || acct.role === "teacher") {
    const base = `/${acct.role}`;
    await page.goto(`${BASE}${base}/jobs`);
    const own = await page.$$eval(`a[href^="${base}/jobs/"]`, (as) => [...new Set(as.map((a) => a.getAttribute("href")).filter((h) => !h.endsWith("/new")))]);
    for (const h of own) await check(page, who, h, `applicants ${h.split("/").pop().slice(0, 6)}`);
    await page.goto(`${BASE}${base}/jobs/new`);
    const path = new URL(page.url()).pathname;
    if (acct.pending) note(path === base, who, "pending account cannot open Post job", path === base ? "" : `reached ${path}`);
    else note(path === `${base}/jobs/new`, who, "can open Post job", path === `${base}/jobs/new` ? "" : `redirected to ${path}`);
    await page.goto(`${BASE}${base}/board`);
    const composer = await page.locator("text=Share a notice").count();
    if (acct.pending) note(composer === 0, who, "pending account cannot post notices", composer ? "composer shown" : "");
    else note(composer === 1, who, "can post notices", composer ? "" : "composer missing");
    for (const tab of ["alumni", "teachers", "students"]) await check(page, who, `${base}/people?tab=${tab}`, `people ${tab}`);
  }
  if (acct.pending) {
    await page.goto(BASE + acct.home);
    note((await page.locator("text=being verified").count()) === 1, who, "shows 'being verified' banner");
  }

  // Other roles' areas send you back home
  for (const area of areas.filter((a) => a !== acct.home)) {
    await page.goto(BASE + area);
    const path = new URL(page.url()).pathname;
    note(path === acct.home, who, `blocked from ${area}`, path === acct.home ? "" : `reached ${path}`);
  }

  // Log out
  await page.goto(BASE + acct.home);
  await page.click('aside button[aria-label="Log out"]');
  await page.waitForURL(`${BASE}/`);
  await page.goto(BASE + acct.home);
  note(new URL(page.url()).pathname === "/login", who, "log out works");
  await ctx.close();
}

// Phone width and dark theme spot checks
for (const [email, home, label] of [["student@ulab.edu.bd", "/student", "phone"], ["teacher@ulab.edu.bd", "/teacher", "phone"]]) {
  const ctx = await openContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page, email);
  const links = await page.$$eval("[data-bottom-nav] a", (as) => as.map((a) => a.getAttribute("href")));
  note(links.length === 5, `${email} (${label})`, "bottom menu has 5 items", `${links.length} items`);
  for (const h of links) await check(page, `${email} (${label})`, h, `${label}: ${h}`, { shot: `${label}-${email.split("@")[0]}-${h.split("/").pop() || "home"}` });
  const prof = await page.locator('header a[aria-label="Your profile"]').count();
  note(prof === 1, `${email} (${label})`, "profile reachable from top bar", prof ? "" : "missing");
  await ctx.close();
}
{
  const ctx = await openContext({ colorScheme: "dark" });
  const page = await ctx.newPage();
  await login(page, "alumni1@example.com");
  for (const h of ["/alumni", "/alumni/board", "/alumni/jobs", "/alumni/people", "/alumni/messages", "/alumni/profile"]) {
    await check(page, "alumni1 (dark)", h, `dark: ${h}`, { shot: `dark-${h.split("/").pop()}` });
  }
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  note(theme === "dark", "alumni1 (dark)", "dark theme applied", theme);
  await ctx.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok);
const byWho = {};
for (const r of results) (byWho[r.who] ??= []).push(r);
for (const [who, rs] of Object.entries(byWho)) {
  const bad = rs.filter((r) => !r.ok);
  console.log(`${bad.length ? "✗" : "✓"} ${who}: ${rs.length - bad.length}/${rs.length} checks ok`);
  for (const r of bad) console.log(`    ✗ ${r.what}: ${r.detail}`);
}
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
