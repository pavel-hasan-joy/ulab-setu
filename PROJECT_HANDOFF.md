# ULAB Setu — Comprehensive Project Recovery & Handover State (Prompt 01–07)

> **Document Purpose:** Single source of truth recording the complete reconstruction, development audit, and architectural state of ULAB Setu following the IDE crash. Confirms verified completion of Prompts 01 through 07 and full readiness to proceed with **PROMPT 08 (Job Management CRM)**.

---

## 1. Project Overview & References

- **Live Production URL:** [https://ulab-setu.vercel.app/](https://ulab-setu.vercel.app/) (Verified: HTTP 200 OK)
- **GitHub Repository:** [https://github.com/pavel-hasan-joy/ulab-setu](https://github.com/pavel-hasan-joy/ulab-setu)
- **Active Production Branch:** `main`
- **Latest Remote Commit:** `fc6ad4b` (*feat(directory): display batch information in alumni card footer*)
- **Platform Identity:** ULAB Setu — An interconnected academic and career networking bridge connecting Students, Alumni, Faculty, and Administrators across University of Liberal Arts Bangladesh (ULAB).

---

## 2. Technology Stack & System Architecture

| Tier | Technology | Specification / Details |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3.6 (App Router) | React Server Components (RSC), Turbopack, Server Actions |
| **Language** | TypeScript 5 | Strict mode enabled, zero `tsc` type errors |
| **Frontend UI** | React 19.2.8 | Motion (Framer Motion v13), Three.js anime/sky visual effects |
| **Design & CSS** | Tailwind CSS v4 (`@theme`) | CSS custom tokens, full light/dark theme support (`next-themes`) |
| **Database & ORM** | PostgreSQL + Prisma ORM 6.19.3 | Full relational schema (16 models, complete foreign keys & indexes) |
| **Auth & Sessions** | Jose + Bcryptjs + HttpOnly Cookies | Stateless HS256 JWT cookie (`ulab_session`), 10-round bcrypt |
| **Email & Delivery** | Nodemailer | Transactional OTP delivery & institutional template renderer |
| **Deployment & Hosting** | Vercel Edge + GitHub CI/CD | Automated CI workflow (`.github/workflows/ci.yml`) |

---

## 3. Detailed Audit & Completion Status of Prompts 01–07

### PROMPT 01 — Complete Project Audit
- **Status:** **COMPLETED**
- **Evidence:** `PROJECT_SUMMARY.md` exists with 31.8 KB of comprehensive reverse engineering, technology evaluations, dependency mapping, and a 14-stage development roadmap.
- **Verification:** System architecture, database drivers, security boundaries, and routes are fully mapped and understood.

### PROMPT 02 — Permanent Project Rules & Governance
- **Status:** **COMPLETED**
- **Evidence:** `AGENTS.md` (133 lines) updated with permanent standards:
  - Strict 4-role hierarchy: `STUDENT`, `ALUMNI`, `TEACHER`, `ADMIN`.
  - Zero-friction Alumni auto-verification via `@ulab.edu.bd` email domain OTP.
  - No manual approval queues, no document review blockers.
  - Server-side authorization invariants (`requireUser`, `requirePoster`).
  - Contact privacy boundaries (`phonePublic`, `whatsappPublic`, `facebookPublic`, `isPrivate`).
  - Strict 3-step CI/CD verification & live Vercel deployment protocol.
  - Mandatory Bengali communication policy for all assistant prose.

### PROMPT 03 — Database Architecture
- **Status:** **COMPLETED**
- **Evidence:** `prisma/schema.prisma` (436 lines) with 16 core relational models:
  - `User`, `Job`, `Application`, `Connection`, `Message`, `Post`, `LoginLog`, `PreApprovedMember`, `VerificationCode`, `Group`, `GroupMember`, `GroupMessage`, `Tuition`, `TuitionApplication`, `RolePermission`, `Notification`, `MentorshipRequest`, `SupportTicket`, `UserReport`, `AdminAuditLog`.
  - Database synchronization pipeline: `scripts/db-sync.mjs`.
  - Seeding dataset: `prisma/seed.ts` providing realistic demo users across all 4 roles.
  - Safe migrations directory: `prisma/migrations/`.

### PROMPT 04 — Authentication & Automatic Alumni Verification
- **Status:** **COMPLETED**
- **Evidence:**
  - `src/app/actions/auth.ts`, `src/lib/auth-validation.ts`, `src/lib/rate-limit.ts`.
  - Strict domain gate: Only `@ulab.edu.bd` email domain accepted.
  - 6-digit email OTP verification with automated expiration handling.
  - Automatic Alumni activation:
    - `role = "ALUMNI"`
    - `status = "APPROVED"`
    - `emailVerified = true`
    - `alumniVerified = true`
    - `verificationMethod = "ulab_email"`
  - Zero manual admin/office approval queue required for alumni.
  - Role isolation: `ADMIN` role is blocked on public signup; client-side tampering is rejected on server.
  - Automated test suite: `scripts/test-auth-suite.mjs` — **10/10 tests PASS**.

### PROMPT 05 — Professional Admin Dashboard
- **Status:** **COMPLETED**
- **Evidence:**
  - Routes in `src/app/admin/`:
    - Overview KPIs: `src/app/admin/page.tsx`
    - RBAC Navigation Layout: `src/app/admin/layout.tsx`
    - Dedicated Modules: `analytics`, `admins`, `audit-logs`, `jobs`, `applications`, `mentorship`, `notices`, `notifications`, `reports`, `settings`, `tickets`, `alumni`, `users`.
  - Dynamic RBAC engine in `src/lib/admin-permissions.ts`.
  - Automated test suite: `scripts/test-admin-rbac.mjs` — **6/6 tests PASS**.

### PROMPT 06 — Complete User Management CRM
- **Status:** **COMPLETED**
- **Evidence:**
  - Route: `src/app/admin/users/page.tsx` with `src/components/admin-users-view.tsx` (1,620+ lines).
  - Search across 7 dimensions (Name, Email, Student ID, Company, Department, Batch, Graduation Year).
  - Multi-tab filters (`All`, `Students`, `Alumni`, `Faculty`, `Admins`, `Suspended`).
  - Slide-over profile drawer with comprehensive metadata, contact privacy indicators, and activity logs.
  - Account suspension & reactivation (with alumni verification history preserved).
  - Bulk operations with acting admin self-lockout protection.
  - CSV export capability.
  - Server actions in `src/app/actions/admin.ts`.
  - Automated test suite: `scripts/test-admin-crm.mjs` — **10/10 tests PASS**.

### PROMPT 07 — Alumni and Student Profiles & Directory
- **Status:** **COMPLETED**
- **Evidence:**
  - Profile editing: `src/app/student/profile/page.tsx`, `src/app/alumni/profile/page.tsx`, `src/app/teacher/profile/page.tsx`, `src/components/profile-form-client.tsx`.
  - Added support for Batch, Graduation Year, Company, Designation, Bio, Skills, Portfolio Website, and granular contact privacy flags (`phonePublic`, `whatsappPublic`, `facebookPublic`, `isPrivate`).
  - Server actions: `src/app/actions/profile.ts` (enforcing identity checks and protecting internal role/status fields).
  - Directory & Search: `src/components/people-directory.tsx` & `src/components/people-directory-client.tsx`:
    - 7-dimensional search & filtering (Full Name, Department, Batch, Graduation Year, Company, Current Position, Skills).
    - Prominent `Verified via ULAB Email` badge on alumni cards.
    - Batch metadata displayed in alumni card footer.
    - Profile preview modal with masked contacts for private profiles.
  - Contact sanitation in `src/lib/contact.ts`.
  - Automated test suite: `scripts/test-profiles-directory.mjs` — **5/5 test suites PASS**.

### PROMPT 08 — Job Management CRM
- **Status:** **COMPLETED**
- **Evidence:**
  - Full Job Creation and Management Lifecycle:
    - Post a Job: `src/app/alumni/jobs/new/page.tsx` & `src/app/alumni/jobs/new/new-job-form.tsx` supporting title, company, location, type, category, skills, salary, experience level, deadline, external application URL, referral availability, contact info, and status (Draft/Published).
    - Edit Job: `src/app/alumni/jobs/[id]/edit/page.tsx` & `src/components/edit-job-form.tsx` (with strict authorization enforcing owner or super admin only).
    - Status state machine: `PUBLISHED`, `DRAFT`, `PAUSED`, `CLOSED`, `EXPIRED`, `REMOVED`.
    - Automatic deadline synchronization: `syncExpiredJobs()` transitions past-deadline jobs to `EXPIRED` status without deleting history.
    - 1-click referral toggle: `toggleJobReferral()`.
  - Job Application Pipeline & Candidate Overview:
    - `src/app/alumni/jobs/[id]/page.tsx` with metrics (total applicants, shortlisted, pending review), quick controls (`src/app/alumni/jobs/[id]/job-detail-controls.tsx`), and candidate CV/note review cards.
  - Student Job Details & Safety Reporting:
    - `src/app/student/jobs/[id]/page.tsx` displaying complete qualifications, skills tags, salary, company portal redirect links, and `src/components/report-job-modal.tsx` allowing students to flag spam/fraudulent jobs directly into `UserReport`.
  - Admin Job Moderation CRM:
    - `src/app/admin/jobs/page.tsx` & `src/components/admin-jobs-view.tsx` with search, company/type/status filtering, reported postings tab, inspect drawer, 1-click Pause/Resume/Remove, report investigation resolution, and CSV export.
  - Automated test suite: `scripts/test-jobs-crm.mjs` — **8/8 tests PASS**.

---

## 4. Current Git, Build & Deployment Status

- **Git Branch:** `main`
- **TypeScript Static Check:** `pnpm exec tsc --noEmit` — **0 errors (PASS)**.
- **Production Build:** `pnpm next build` — **47 static/dynamic routes successfully compiled via Turbopack (PASS)**.
- **Test Suites Passed:** 5 complete test suites (39/39 tests passed).
- **Production URL:** `https://ulab-setu.vercel.app/` — **HTTP 200 OK (LIVE & READY)**.

### PROMPT 09 — Complete Job Application Management & ATS
- **Status:** **COMPLETED**
- **Evidence:**
  - Student Application Lifecycle & Saved CV Reuse:
    - Application submission (`src/app/actions/jobs.ts`: `applyToJob`): Supports cover pitch, contact phone, portfolio/GitHub, and CV file or link.
    - Saved Profile CV: Added `savedCvUrl`, `savedCvName`, `savedCvDate` to `model User`. Students can reuse their saved profile CV in 1 click or save newly uploaded CVs for future applications without re-uploading.
    - Duplicate Prevention: Strict backend check blocks redundant applications for the same job.
    - Application Withdrawal: `withdrawApplication()` allows students to withdraw applications in `APPLIED` or `VIEWED` status.
    - Application Tracking Dashboard: `src/app/student/applications/page.tsx` & `src/components/student-applications-view.tsx` with KPI counters, 7-stage status timeline, CV preview link, and withdrawal action.
  - Complete 7-Stage ATS Pipeline:
    - `APPLIED`, `VIEWED`, `SHORTLISTED`, `INTERVIEW`, `SELECTED`, `REJECTED`, `WITHDRAWN`.
    - Auto-Viewed Detection: Opening candidate list automatically transitions `APPLIED` to `VIEWED` and timestamps `viewedAt`.
    - Real-time in-app Notifications: Automatically notifies student when status changes to Viewed, Shortlisted, Interview, or Selected.
  - Recruiter Management & Private Hiring Notes:
    - `src/app/alumni/jobs/[id]/page.tsx`, `applicant-card.tsx`, & `applicant-actions.tsx`: Full candidate overview, status progression controls, and private hiring notes (`hiringNotes`) strictly isolated from student views.
  - Admin Application Auditing & Analytics:
    - `src/app/admin/applications/page.tsx` & `src/components/admin-applications-view.tsx`: Search across candidates and jobs, 7 status filters, candidate inspector drawer, and CSV export.
  - Automated test suite: `scripts/test-applications-ats.mjs` — **6/6 tests PASS**.

---

### PROMPT 10 — Direct Messaging & Real-Time Notifications
- **Status:** **COMPLETED**
- **Evidence:**
  - **No Contact-Request Gate for Direct Messaging:**
    - `startConversation(otherId)` immediately creates or transitions connections to `ACCEPTED` status, allowing Students, Alumni, and Teachers to engage directly without waiting for invitation queues.
  - **Direct Messaging with Attachments & Real-Time Polling:**
    - Enhanced `src/app/actions/network.ts`: `sendMessage(connectionId, body, attachment?)` supports rich text, safe file attachments (images, PDFs, documents up to 6MB), rate limiting (5 msgs/10s), and block validation.
    - Extended `model Message` in `prisma/schema.prisma` with `readAt`, `attachmentUrl`, `attachmentName`, `attachmentSize`, `attachmentType`.
    - Double-check read receipts (`CheckCheck` in blue on read, gray on delivered) and formatted timestamps in `src/components/chat-window.tsx`.
  - **Safety, Moderation & Privacy:**
    - User Blocking: Added `model BlockedUser` in Prisma with server actions `blockUser` and `unblockUser`. Blocked users are restricted from sending messages or initiating conversations in both directions.
    - In-App Reporting: Users can flag messages or conversations with categorized reasons (`SPAM`, `HARASSMENT`, `INAPPROPRIATE`, `FRAUD`, `OTHER`) routed directly to `UserReport` for admin investigation.
  - **Notification Center & Channel Preferences:**
    - Dedicated notification routes: `/student/notifications`, `/alumni/notifications`, `/teacher/notifications`.
    - `src/components/notifications-client.tsx`: Comprehensive notification hub with category filters (All, Unread, Messages, Jobs/Applications, Campus/System), mark-all-read, single mark read, delete, and deep links.
    - User notification preferences: toggles for `notifyEmailMessages`, `notifyEmailApplications`, `notifyEmailMentorship`, `notifyEmailSystem`.
    - Integrated unread notification and message badges across desktop sidebars and mobile navigation in `AppShell`, `StudentLayout`, `AlumniLayout`, and `TeacherLayout`.
  - **Automated test suite:** `scripts/test-messaging-notifications.mjs` — **8/8 tests PASS**.

---

### PROMPT 11 — Complete Support Ticket & User Reporting System
- **Status:** **COMPLETED**
- **Evidence:**
  - **User Helpdesk & Support Ticketing:**
    - Dedicated portal routes: `/student/support`, `/alumni/support`, `/teacher/support`.
    - Ticket submission covering 8 key categories: `LOGIN`, `VERIFICATION`, `PROFILE`, `JOB_POSTING`, `JOB_APPLICATION`, `MESSAGING`, `TECHNICAL`, `OTHER`.
    - Sequential human-readable ticket numbers (`TICK-1001`, `TICK-1002`).
    - 5-stage status lifecycle: `OPEN`, `IN_PROGRESS`, `WAITING_FOR_USER`, `RESOLVED`, `CLOSED`.
    - Full ticket messaging thread via `model TicketMessage`: bidirectional conversation between users and support agents.
  - **Admin Support Dashboard (`/admin/tickets`):**
    - Multi-criteria real-time search across ticket number, subject, user, email, and description.
    - Status, category, and priority dropdown filters.
    - Staff agent assignment (`assignTicket`).
    - Public responses to users with automatic state transition to `WAITING_FOR_USER`.
    - Internal staff notes (`isInternal: true`) strictly isolated from regular users.
    - Official resolution remarks and audit logging.
  - **Community Safety & User Reporting System:**
    - In-app reporting for fake jobs, abusive members, inappropriate messages, suspicious accounts, and misleading profiles.
    - Admin Moderation Desk (`/admin/reports`): investigate reported content with target context without exposing private conversations.
    - Concrete enforcement actions: Warning (`WARNED`), Account Suspension (`SUSPENDED`), and Content Removal (`CONTENT_REMOVED`).
    - Resolution records & audit trail via `model AdminAuditLog`.
  - **Automated test suite:** `scripts/test-support-and-reporting.mjs` — **10/10 tests PASS**.

---

### PROMPT 12 — Complete Alumni Mentorship Management System
- **Status:** **COMPLETED**
- **Evidence:**
  - **Alumni Mentor Enrollment & Profile Configuration:**
    - Mentorship settings in `model User`: `isMentor`, `mentorAvailable`, `mentorTopics`, `mentorExpertise`, `mentorSessionFormat`, `mentorAvailabilityNote`, `mentorMaxMentees`.
    - Dedicated Alumni Mentorship Hub at `/alumni/mentorship` with dual tabs for Request Queue and Mentor Preferences.
    - One-click mentor availability toggle to pause or resume taking new mentees.
  - **Student Mentor Discovery & 1-on-1 Requests:**
    - Dedicated Student Mentorship Directory at `/student/mentorship`.
    - Multi-criteria search and filter by department, professional area, skills, and topics (`Career Guidance`, `Resume & CV Review`, `Technical Interview Preparation`, `Startup`, etc.).
    - Comprehensive request modal capturing specific career goals, introduction message, and preferred session format.
    - Duplicate active request prevention (`PENDING`, `ACCEPTED`, `SCHEDULED`).
    - Option for students to cancel pending/scheduled requests.
  - **Complete 6-Stage Mentorship Lifecycle:**
    - `PENDING` -> `ACCEPTED` -> `SCHEDULED` (with datetime & Google Meet / Zoom link) -> `COMPLETED` (with mentor feedback notes).
    - Status badges, scheduled session cards with meeting links, and feedback history.
    - Milestone notifications automatically dispatched at each step (`sendRequest`, `accept`, `decline`, `schedule`, `complete`, `cancel`).
  - **Admin Mentorship Monitoring Dashboard (`/admin/mentorship`):**
    - 5 Real-time KPI metrics: Registered Mentors, Pending Requests, Scheduled Sessions, Completed Sessions, Acceptance Rate.
    - Full search & filter across all institutional mentorship engagements.
  - **Automated test suite:** `scripts/test-mentorship-management.mjs` — **10/10 tests PASS**.

---

## 4. Current Git, Build & Deployment Status

- **Git Branch:** `main`
- **TypeScript Static Check:** `pnpm exec tsc --noEmit` — **0 errors (PASS)**.
- **Production Build:** `pnpm next build` — **52 static/dynamic routes successfully compiled via Turbopack (PASS)**.
- **Test Suites Passed:** 9 complete test suites (73/73 tests passed).
- **Production URL:** `https://ulab-setu.vercel.app/` — **HTTP 200 OK (LIVE & READY)**.

---

## 5. Upcoming Implementation: PROMPT 13

### Next Immediate Stage: PROMPT 13 — Notice Board & Campus Opportunity Feeds
- **Objective:** Institutional Notice Board & Campus Opportunity Feed for announcements, events, scholarships, and research calls from teachers, departments, and alumni with category filters and author verification.

