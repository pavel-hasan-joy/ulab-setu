// End-to-end smoke test. Run against a server: BASE=http://localhost:3456 node e2e/smoke.mjs
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS ?? "e2e/shots";
const results = [];
const errors = [];
const stamp = Date.now();

async function step(name, fn) {
  try { await fn(); results.push(`PASS  ${name}`); }
  catch (e) { results.push(`FAIL  ${name}: ${e.message.split("\n")[0]}`); }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

const browser = await chromium.launch({ channel: "chrome", headless: true });
async function newPage(viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
  return page;
}
async function login(page, email) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "password123");
  await page.click('button:has-text("Log in")');
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}
const shot = (page, name, fullPage = false) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });

// Landing
await step("landing page renders with stats and jobs", async () => {
  const p = await newPage();
  await p.goto(BASE);
  await p.waitForTimeout(3200);
  await shot(p, "01-landing");
  await p.screenshot({ path: `${SHOTS}/01-landing-full.png`, fullPage: true });
  expect(await p.locator("text=Posted by alumni this week").count() === 1, "jobs section missing");
  // Stats sit below the full-screen hero and count up once scrolled into view.
  const stats = p.locator('section[aria-label="Setu in numbers"]');
  await stats.scrollIntoViewIfNeeded();
  await p.waitForTimeout(2200);
  const stat = await stats.locator(".font-display").first().textContent();
  expect(Number(stat) > 0, `alumni stat is ${stat}`);
});
await step("landing on mobile", async () => {
  const p = await newPage({ width: 390, height: 844 });
  await p.goto(BASE);
  await p.waitForTimeout(3000);
  await shot(p, "02-landing-mobile");
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(!overflow, "horizontal overflow on mobile");
});

await step("theme toggle switches and persists", async () => {
  const p = await newPage();
  await p.goto(BASE);
  const before = await p.evaluate(() => document.documentElement.dataset.theme);
  await p.click('header button[aria-label^="Switch to"]');
  const after = await p.evaluate(() => document.documentElement.dataset.theme);
  expect(before !== after, "theme did not change");
  await p.reload();
  expect((await p.evaluate(() => document.documentElement.dataset.theme)) === after, "theme not remembered");
  await shot(p, "01b-theme-toggled");
});
await step("3D particle section renders and morphs on scroll", async () => {
  const p = await newPage();
  await p.goto(BASE);
  await p.evaluate(() => (document.documentElement.style.scrollBehavior = "auto"));
  const sec = '[aria-label="From student to first job"]';
  const { top, h } = await p.evaluate((s) => { const el = document.querySelector(s); return { top: el.offsetTop, h: el.offsetHeight - innerHeight }; }, sec);
  for (const [f, name] of [[0.05, "globe"], [0.38, "cap"], [0.66, "bridge"], [0.95, "briefcase"]]) {
    await p.evaluate((y) => window.scrollTo(0, y), top + h * f);
    await p.waitForTimeout(2600);
    await shot(p, `01c-morph-${name}`);
  }
  expect(await p.locator(`${sec} canvas`).count() === 1, "no WebGL canvas");
});
await step("arriving on a home page plays the page pull, other pages don't", async () => {
  const p = await newPage();
  await p.goto(`${BASE}/login`);
  await p.fill('input[name="email"]', "student@ulab.edu.bd");
  await p.fill('input[name="password"]', "password123");
  await p.click('button:has-text("Log in")');
  await p.waitForSelector("[data-page-pull]", { timeout: 5000 });
  await shot(p, "01d-page-pull");
  await p.waitForSelector("[data-page-pull]", { state: "detached", timeout: 3000 });
  await p.click('aside a:has-text("Jobs")');
  await p.waitForURL(/\/student\/jobs/);
  expect(await p.locator("[data-page-pull]").count() === 0, "pull played on a non-home page");
  expect(await p.locator("text=Loading your page").count() === 0, "old curtain still present");
});
await step("clicking a corner ball throws it across", async () => {
  const p = await newPage();
  await p.goto(BASE);
  await p.waitForTimeout(1500);
  const ball = p.locator("div.cursor-pointer.rounded-full").first();
  const before = await ball.boundingBox();
  await p.mouse.click(before.x + before.width / 2, before.y + before.height / 2);
  await p.mouse.move(700, 100);
  await p.waitForTimeout(3500);
  const after = await ball.boundingBox();
  expect(after.x > 1440 * 0.5, `ball only reached x=${Math.round(after.x)}`); // it may bounce off the balls on the far side
});
await step("scroll story shows one step at a time", async () => {
  const p = await newPage();
  await p.goto(BASE);
  await p.evaluate(() => (document.documentElement.style.scrollBehavior = "auto"));
  const sec = '[aria-label="How a senior can guide you"]';
  const { top, h } = await p.evaluate((s) => { const el = document.querySelector(s); return { top: el.offsetTop, h: el.offsetHeight - innerHeight }; }, sec);
  for (const [f, want] of [[0.1, 0], [0.5, 1], [0.92, 2]]) {
    await p.evaluate((y) => window.scrollTo(0, y), top + h * f);
    await p.waitForTimeout(1200);
    const ops = await p.evaluate((s) => [...document.querySelectorAll(s + " .absolute.inset-0")].map((e) => +getComputedStyle(e).opacity), sec);
    expect(ops.findIndex((o) => o > 0.9) === want && ops.filter((o) => o > 0.1).length === 1, `at ${f}: ${ops}`);
  }
});

// Student signup
const studentEmail = `test${stamp}@ulab.edu.bd`;
const s = await newPage();
await step("student signup rejects non-ULAB email", async () => {
  await s.goto(`${BASE}/signup`);
  await s.fill('input[name="name"]', "Test Student");
  await s.fill('input[name="email"]', `x${stamp}@gmail.com`);
  await s.selectOption('select[name="department"]', "Computer Science and Engineering");
  await s.fill('input[name="studentId"]', "221014099");
  await s.fill('input[name="batch"]', "2022");
  await s.fill('input[name="password"]', "password123");
  await s.click('button:has-text("Create account")');
  await s.waitForSelector('p[role="alert"]');
  expect((await s.textContent('p[role="alert"]')).includes("ulab.edu.bd"), "wrong error");
  await shot(s, "03-signup-error");
});
await step("student signup succeeds and lands on dashboard", async () => {
  await s.fill('input[name="email"]', studentEmail);
  await s.fill('input[name="password"]', "password123");
  await s.click('button:has-text("Create account")');
  await s.waitForURL(`${BASE}/student`);
  await s.waitForTimeout(1500);
  await shot(s, "04-student-home");
});
await step("corner balls never cover the log-out button", async () => {
  await s.waitForTimeout(1500);
  const btn = s.locator('aside button[aria-label="Log out"]');
  const box = await btn.boundingBox();
  const hit = await s.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("button")?.getAttribute("aria-label"), [box.x + box.width / 2, box.y + box.height / 2]);
  expect(hit === "Log out", `something covers the log-out button (${hit})`);
});
await step("student cannot open alumni area", async () => {
  await s.goto(`${BASE}/alumni`);
  expect(new URL(s.url()).pathname === "/student", `ended on ${s.url()}`);
});
await step("jobs: alumni tab", async () => {
  await s.goto(`${BASE}/student/jobs`);
  await s.waitForTimeout(1500);
  expect(await s.locator('a[href^="/student/jobs/"]').count() >= 5, "few alumni jobs");
  await shot(s, "05-jobs-alumni");
});
await step("jobs: search filters alumni jobs", async () => {
  await s.fill('input[name="q"]', "marketing");
  await s.click('button:has-text("Search")');
  await s.waitForURL(/q=marketing/);
  await s.waitForTimeout(1000);
  const n = await s.locator('a[href^="/student/jobs/"]').count();
  expect(n === 1, `expected 1 marketing job, got ${n}`);
});
await step("jobs: Bangladesh tab (sample mode)", async () => {
  await s.goto(`${BASE}/student/jobs?tab=bd`);
  await s.waitForTimeout(1500);
  expect(await s.locator('a[href*="bdjobs.com"]').count() >= 5, "no bd jobs");
  await shot(s, "06-jobs-bd");
});
await step("jobs: Remote tab loads live Himalayas jobs", async () => {
  await s.goto(`${BASE}/student/jobs?tab=remote`);
  await s.waitForTimeout(2000);
  const n = await s.locator('a[href*="himalayas.app"]').count();
  expect(n >= 3, `only ${n} remote job links`);
  await shot(s, "07-jobs-remote");
});
let jobUrl;
await step("jobs page links to Bdjobs and other job sites", async () => {
  await s.goto(`${BASE}/student/jobs`);
  const bd = s.locator('section[aria-label="Other job sites"] a[href="https://bdjobs.com"]');
  expect(await bd.count() === 1, "Bdjobs link missing");
  expect((await bd.getAttribute("target")) === "_blank", "Bdjobs link should open a new tab");
  expect(await s.locator('a[href="https://alljobs.teletalk.com.bd"]').count() === 1, "Teletalk link missing");
});
await step("apply blocked until profile complete", async () => {
  await s.goto(`${BASE}/student/jobs`);
  // Tanvir (alumni1) posted this one; the alumni steps below review it.
  jobUrl = await s.locator('a[href^="/student/jobs/"]', { hasText: "Frontend Engineer Intern" }).first().getAttribute("href");
  await s.goto(BASE + jobUrl);
  await s.fill('textarea[name="note"]', "I'd love to join.");
  await s.click('button:has-text("Send application")');
  await s.waitForSelector('p[role="alert"]');
  expect((await s.textContent('p[role="alert"]')).includes("profile"), "no profile error");
});
await step("profile save shows toast", async () => {
  await s.goto(`${BASE}/student/profile`);
  await s.fill('textarea[name="bio"]', "Third year CSE student who likes building web apps.");
  await s.fill('input[name="skills"]', "React,  TypeScript , SQL");
  await s.click('button:has-text("Save profile")');
  await s.waitForSelector("text=Profile saved");
  await shot(s, "08-profile");
  const dept = await s.inputValue('select[name="department"]');
  expect(dept === "Computer Science and Engineering", `department reset to "${dept}"`);
});
await step("apply succeeds after profile", async () => {
  await s.goto(BASE + jobUrl);
  await s.fill('textarea[name="note"]', "I'd love to join.");
  await s.click('button:has-text("Send application")');
  await s.waitForSelector("text=View my applications");
  await s.waitForTimeout(800);
  await shot(s, "09-applied");
  await s.goto(`${BASE}/student/applications`);
  expect(await s.locator("text=Sent").count() >= 1, "application not listed");
});
await step("student messages an alumnus directly from People", async () => {
  await s.goto(`${BASE}/student/people?q=Arif`);
  await s.click('button:has-text("Message")');
  await s.waitForURL(/\/student\/messages\?c=/);
  await s.fill('input[aria-label="Message"]', "Hello bhaiya, could I ask about power sector jobs?");
  await s.click('button[aria-label="Send"]');
  await s.waitForSelector("text=power sector jobs");
  await shot(s, "10-student-message");
});
await step("mobile student dashboard", async () => {
  const m = await newPage({ width: 390, height: 844 });
  await login(m, studentEmail);
  await m.goto(`${BASE}/student/jobs`);
  await m.waitForTimeout(1500);
  await shot(m, "11-mobile-jobs");
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(!overflow, "horizontal overflow");
});

// Alumni: review applicants, accept request, chat
const a = await newPage();
await step("alumni sees applicant and shortlists", async () => {
  await login(a, "alumni1@example.com");
  expect(new URL(a.url()).pathname === "/alumni", "not on alumni home");
  await a.waitForTimeout(1200);
  await shot(a, "12-alumni-home");
  await a.goto(`${BASE}/alumni/jobs`);
  await a.locator("div.rounded-2xl", { hasText: "Frontend Engineer Intern" }).last().locator('a:has-text("applicant")').click();
  await a.waitForSelector("text=Test Student");
  const card = a.locator("div.rounded-2xl", { hasText: "Test Student" }).last();
  await card.locator('button:has-text("Shortlist")').click();
  await a.waitForSelector("text=Shortlisted");
  await shot(a, "13-applicants");
});
await step("student sees shortlisted status", async () => {
  await s.goto(`${BASE}/student/applications`);
  expect(await s.locator("text=Shortlisted").count() >= 1, "status not updated");
});
await step("alumnus replies without accepting anything", async () => {
  const b = await newPage();
  await login(b, "alumni3@example.com");
  await b.goto(`${BASE}/alumni/messages`);
  await b.click("text=Test Student");
  await b.waitForSelector("text=power sector jobs");
  await b.fill('input[aria-label="Message"]', "Hi! Happy to help. What would you like to know?");
  await b.click('button[aria-label="Send"]');
  await b.waitForSelector("text=Happy to help");
  await shot(b, "14-alumni-chat");
  await s.goto(`${BASE}/student/messages`);
  await s.click("text=Arif Rahman");
  await s.waitForSelector("text=Happy to help", { timeout: 8000 });
  await shot(s, "15-student-chat");
});
await step("alumnus can message a student from People", async () => {
  await a.goto(`${BASE}/alumni/people?tab=students`);
  await a.waitForSelector("text=Test Student");
  await shot(a, "15b-alumni-people");
  await a.locator("div.rounded-2xl", { hasText: "Test Student" }).last().locator('button:has-text("Message")').click();
  await a.waitForURL(/\/alumni\/messages\?c=/);
  await a.waitForSelector('input[aria-label="Message"]');
});
await step("new job form posts a job", async () => {
  await a.goto(`${BASE}/alumni/jobs/new`);
  await a.fill('input[name="title"]', `QA Intern ${stamp}`);
  await a.fill('input[name="location"]', "Dhaka");
  await a.fill('textarea[name="description"]', "Help us test our web and mobile apps, write test cases, and report bugs clearly.");
  await a.check('input[name="referral"]');
  await shot(a, "16-post-job");
  await a.click('button:has-text("Post job")');
  await a.waitForURL(/posted=1/);
  expect(await a.locator(`text=QA Intern ${stamp}`).count() === 1, "job not listed");
});

// Teachers, notice board, contact details
await step("teacher posts a notice and a job", async () => {
  const t = await newPage();
  await login(t, "teacher@ulab.edu.bd");
  expect(new URL(t.url()).pathname === "/teacher", `teacher landed on ${t.url()}`);
  await t.goto(`${BASE}/teacher/board`);
  await t.click("text=Share a notice");
  await t.selectOption('select[name="kind"]', "Event");
  await t.fill('input[name="title"]', `Robotics club meetup ${stamp}`);
  await t.fill('textarea[name="body"]', "Bring your ideas for the national robotics contest.");
  await t.click('button:has-text("Post to board")');
  await t.waitForSelector(`text=Robotics club meetup ${stamp}`);
  await shot(t, "20-teacher-board");
  await t.goto(`${BASE}/teacher/jobs/new`);
  await t.fill('input[name="title"]', `Teaching Assistant ${stamp}`);
  await t.fill('input[name="company"]', "ULAB CSE Department");
  await t.fill('input[name="location"]', "ULAB campus");
  await t.fill('textarea[name="description"]', "Help run lab sessions for the programming fundamentals course twice a week.");
  await t.click('button:has-text("Post job")');
  await t.waitForURL(/\/teacher\/jobs\?posted=1/);
  expect(await t.locator(`text=Teaching Assistant ${stamp}`).count() === 1, "teacher job not listed");
});
await step("students see teacher notices and jobs", async () => {
  await s.goto(`${BASE}/student/board?kind=Event`);
  await s.waitForSelector(`text=Robotics club meetup ${stamp}`);
  await s.goto(`${BASE}/student/jobs?q=${stamp}`);
  await s.waitForSelector(`text=Teaching Assistant ${stamp}`);
  expect(await s.locator("text=Associate Professor, ULAB").count() >= 1, "teacher attribution missing");
});
await step("People page has a Teachers tab", async () => {
  await s.goto(`${BASE}/student/people?tab=teachers`);
  await s.waitForSelector("text=Dr. Kamrul Karim");
  await shot(s, "21-people-teachers");
});
await step("public contact shows, private stays hidden", async () => {
  await s.goto(`${BASE}/student/people?q=Tanvir`);
  await s.waitForSelector("text=01700000001");
  const html = await s.content();
  expect(!html.includes("tanvir.demo"), "private Facebook leaked into the page");
  expect(await s.locator('a[href^="https://wa.me/8801700000001"]').count() === 1, "WhatsApp link missing");
});
await step("student sets own contact visibility", async () => {
  await s.goto(`${BASE}/student/profile`);
  await s.fill('input[name="phone"]', "01811111111");
  await s.locator('[aria-label="Who can see your Phone"] button:has-text("Public")').click();
  await s.fill('input[name="facebook"]', "test.student.fb");
  await s.click('button:has-text("Save profile")');
  await s.waitForSelector("text=Profile saved");
  await shot(s, "22-contact-settings");
  const t = await newPage();
  await login(t, "teacher@ulab.edu.bd");
  await t.goto(`${BASE}/teacher/people?tab=students&q=Test`);
  await t.waitForSelector("text=01811111111");
  expect(!(await t.content()).includes("test.student.fb"), "private facebook visible");
});
await step("teacher signup waits for approval", async () => {
  const n = await newPage();
  await n.goto(`${BASE}/signup?role=teacher`);
  await n.fill('input[name="name"]', "New Teacher");
  await n.fill('input[name="email"]', `teach${stamp}@ulab.edu.bd`);
  await n.selectOption('select[name="department"]', "English and Humanities");
  await n.selectOption('select[name="designation"]', "Lecturer");
  await n.fill('input[name="password"]', "password123");
  await n.click('button:has-text("Create account")');
  await n.waitForURL(`${BASE}/teacher`);
  expect(await n.locator("text=being verified").count() === 1, "no pending banner");
});

// Alumni signup + admin approval
await step("alumni signup is pending, admin approves", async () => {
  const n = await newPage();
  await n.goto(`${BASE}/signup?role=alumni`);
  await n.fill('input[name="name"]', "New Alumnus");
  await n.fill('input[name="email"]', `alum${stamp}@gmail.com`);
  await n.selectOption('select[name="department"]', "Business Administration");
  await n.fill('input[name="studentId"]', "151021001");
  await n.fill('input[name="graduationYear"]', "2019");
  await n.fill('input[name="company"]', "Test Co");
  await n.fill('input[name="designation"]', "Analyst");
  await n.fill('input[name="password"]', "password123");
  await shot(n, "17-signup-alumni");
  await n.click('button:has-text("Create account")');
  await n.waitForURL(`${BASE}/alumni`);
  expect(await n.locator("text=being verified").count() === 1, "no pending banner");
  await n.goto(`${BASE}/alumni/jobs/new`);
  expect(new URL(n.url()).pathname === "/alumni", "pending alumni reached job form");

  const ad = await newPage();
  await login(ad, "admin@ulab.edu.bd");
  await ad.waitForSelector("text=New Alumnus");
  await shot(ad, "18-admin");
  await ad.locator("div.rounded-2xl", { hasText: "New Alumnus" }).last().locator('button:has-text("Approve")').click();
  await ad.waitForSelector("text=New Alumnus", { state: "detached" });
  await n.goto(`${BASE}/alumni/jobs/new`);
  expect(new URL(n.url()).pathname === "/alumni/jobs/new", "approved alumni can't post");
});

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} passed`);
if (errors.length) console.log("\nBrowser errors:\n" + [...new Set(errors)].join("\n"));
