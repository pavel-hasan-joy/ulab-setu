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

---

## 4. Current Git, Build & Deployment Status

- **Git Branch:** `main`
- **Latest Commit on Remote:** `fc6ad4b`
- **Working Tree:** Clean (all Prompt 01–07 code committed and pushed).
- **TypeScript Static Check:** `pnpm exec tsc --noEmit` — **0 errors (PASS)**.
- **Production Build:** `pnpm next build` — **45 static/dynamic routes successfully compiled via Turbopack (PASS)**.
- **Production URL:** `https://ulab-setu.vercel.app/` — **HTTP 200 OK (LIVE & READY)**.

---

## 5. Upcoming Implementation: PROMPT 08

### Next Immediate Stage: PROMPT 08 — Job Management CRM
- **Objective:** Production-grade Job Management system allowing Alumni and Faculty to post opportunities (with referral badges, deadlines, and requirements), and Admin moderation/CRM controls.
- **Ready to proceed:** All prerequisite tables (`Job`, `Application`, `User`, `RolePermission`, `AdminAuditLog`), database relations, authentication boundaries, and UI shells are in place.

