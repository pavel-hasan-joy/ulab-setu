<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# ULAB Setu — Permanent Engineering & Architectural Standards

> **Scope:** This document is the single source of truth for all engineering, architectural, security, and UI/UX decisions on the **ULAB Setu** codebase. All autonomous agents, developers, and AI assistants must strictly follow these rules across every coding session.

---

## 1. Technology & Architecture
- **Preserve the Stack:** Strictly maintain the existing technology stack:
  - **Framework:** Next.js 16 (App Router, Turbopack, React Server Components, Server Actions).
  - **Frontend:** React 19, TypeScript 5 (Strict Mode), Motion (Framer Motion v13), Three.js.
  - **Styling:** Tailwind CSS v4 using CSS token definitions in `globals.css` (`@theme`).
  - **Database & ORM:** PostgreSQL with Prisma ORM 6.
  - **Auth & Sessions:** Stateless JWT via `jose` stored in secure HTTP-only cookies (`ulab_session`), `bcryptjs` (10 rounds).
- **Framework Migrations Prohibited:** Do not replace or migrate core frameworks or libraries without an explicit, compelling technical justification approved by the Engineering Manager.
- **Strict Separation of Concerns:**
  - **Presentation Layer (`src/components/`, `src/app/`):** React Server Components (RSC) for data fetching and Client Components (`"use client"`) strictly for interactivity.
  - **Business & Action Layer (`src/app/actions/`):** Encapsulated Server Actions (`"use server"`) with explicit Zod schema parsing and identity checks.
  - **Data Access Layer (`src/lib/db.ts`, `prisma/`):** Centralized Prisma database access. Never embed raw unvalidated queries inside UI components.
  - **Shared Libraries (`src/lib/`):** Reusable utilities (session, auth, email, external APIs, contact cleaners).
- **Component Reusability:** Favor composable, reusable UI components (`src/components/ui.tsx`, `app-shell.tsx`, `modal.tsx`) over duplicating ad-hoc markup.
- **Dependency Hygiene:** Avoid adding heavy or redundant external npm dependencies when existing utilities or modern web standards can accomplish the task.

---

## 2. UI, Design System & Accessibility
- **Preserve ULAB Setu Brand Identity:**
  - **Primary Palette:** ULAB Blue (`#003366`, `bg-ulab`, `text-ulab`), Campus Gold (`#cda434`, `bg-gold`, `text-gold-ink`), Lilac (`#a99ce8`, `bg-lilac-wash`), Sage (`bg-sage-wash`), and neutral Paper/Surface tokens.
  - **Dark Mode:** Maintain full dark theme compatibility using Tailwind tokens and `next-themes` persistence.
- **Professional University Aesthetic:** Design must read as a modern, premium, clean academic networking platform — never playful, generic, or cluttered.
- **Responsive Layout Standards:** Every screen, modal, drawer, and table must be fully responsive across mobile (>= 360px), tablet, and desktop viewports.
- **Interactive Component Reliability:** Every interactive element (buttons, tabs, dropdowns, forms) must have concrete functionality. Never leave non-functional buttons or dead-end visual placeholders.
- **State Completeness:** Every interactive view and async action must provide:
  - Accessible **Loading** states (skeletons or disabled button states).
  - Purpose-built **Empty** states (`<EmptyState />` with icon, title, and clear action button).
  - Explicit **Success** feedback (toasts, optimistic updates, or confirmation banners).
  - Human-friendly, non-technical **Error** alerts.
- **Animation Restraint:** Use smooth, subtle micro-interactions (Motion spring transitions: 150–250ms). Eliminate unnecessary animations, layout shifting, or heavy canvas interactions that impede mobile performance.

---

## 3. User Roles & Permission Hierarchy
The platform strictly recognizes **four user roles**:
1. **`STUDENT`:** Browse directory, view/apply for internal and external jobs, post/apply for community tuitions, participate in 1-on-1 and group chats, submit connection requests.
2. **`ALUMNI`:** Post internal jobs with employee referral tags, post/apply for tuitions, mentor students, publish campus notice board announcements, participate in direct and group messaging.
3. **`TEACHER` (Faculty):** Post TA/RA openings and institutional jobs, publish campus broadcasts and research calls, mentor students, participate in group and direct messaging.
4. **`ADMIN`:** Super-administrator oversight for university administration (Alumni Affairs Office / Career Services):
   - User directory audit, role adjustments, member account deactivations.
   - Excel/CSV directory bulk import.
   - Job, tuition, and community post moderation.
   - Login analytics and institutional accreditation reporting.
- **Public Admin Registration Forbidden:** The `ADMIN` role must **never** be selectable on public signup or OTP forms. Admin privileges can only be provisioned through internal database synchronization or granted by an existing authenticated Super Admin.

---

## 4. Alumni Auto-Verification Architecture
- **Strict Domain Gate:** Only the exact institutional email domain `@ulab.edu.bd` is accepted for Alumni registration and login.
- **Mandatory OTP Confirmation:** Alumni must verify ownership of their `@ulab.edu.bd` inbox via a 6-digit email OTP prior to account activation.
- **Immediate Auto-Activation:**
  - Upon successful email OTP verification, the Alumni account is automatically activated and granted full platform privileges (`status: "APPROVED"`).
  - **Zero Manual Admin Approval:** Do not require manual Admin or Alumni Office review queues.
  - **Zero Document Approval:** Do not require upload or manual inspection of degree certificates or provisional papers.
  - **No Mandatory Student ID Match:** Student ID is stored for profile records, but mismatches against legacy databases must never block access.
- **Audit Tracking:** Mark verification method internally as `ulab_email` while keeping general account active status cleanly distinguished from role verification history.

---

## 5. Security & Data Protection
- **Server-Side Authorization Invariant:** Never trust client-supplied role parameters, hidden form fields, or browser state. Every Server Action must independently extract and verify identity and permissions via `requireUser()` or `requirePoster()`.
- **Role-Based Access Control (RBAC):** Restrict areas at the edge route proxy (`src/proxy.ts`) and validate role privileges on all backend mutation endpoints.
- **Data Privacy & Contact Protection:**
  - Contact details (phone, WhatsApp, Facebook) must remain hidden unless the account owner explicitly sets them to public (`phonePublic`, `whatsappPublic`, `facebookPublic`).
  - Private accounts (`isPrivate: true`) must mask direct profile details from unconnected viewers.
- **Secure File & Binary Handling:**
  - Enforce strict MIME-type and size validation (max 2MB for profile pictures, max 6MB for chat attachments).
  - Sanitize all file names and storage paths. Never expose local server paths or arbitrary file execution vectors.
- **Credential & Secret Protection:**
  - API keys, database credentials, SMTP passwords, and JWT secrets must strictly reside in environment variables (`process.env`).
  - Never commit credentials to version control and never expose service-role secrets in client bundles.

---

## 6. Engineering Standards, Migrations & CI/CD Protocol
- **Production Data Preservation:** Never run destructive schema operations against live databases. Do not execute `prisma db push --accept-data-loss` in production pipelines.
- **Safe Database Migrations:** All schema evolutions must use versioned, backward-compatible Prisma migrations (`prisma migrate dev` locally, `prisma migrate deploy` in production).
- **Deep Reverse Engineering Before Modification:**
  - Thoroughly inspect existing component contracts, schema relations, and server actions before refactoring or writing new code.
  - Prevent regressions on existing core features: Connection lifecycle, 1-on-1 and Group chats, Internal/External Jobs, Community Tuitions, and Admin Analytics.
- **Mandatory Static Analysis:** Always verify code locally before committing:
  - Run TypeScript compiler check: `pnpm exec tsc --noEmit`.
  - Verify linting and build stability: `pnpm lint` and `pnpm next build`.
- **Git Push & CI/CD Verification Protocol:**
  - Every completed task must be committed with clean conventional commit messages (e.g. `feat:`, `fix:`, `refactor:`, `docs:`) and pushed to `origin main`.
  - Explicitly verify that the GitHub Actions CI pipeline passes with 100% success (`conclusion: success`).
  - Confirm live production health on Vercel (`https://ulab-setu.vercel.app`) returning HTTP 200 OK.

---

## 7. User Experience & Mobile-First Principles
- **Hassle-Free & Frictionless:** Keep workflows intuitive. Avoid unnecessary verification hurdles, multi-step hurdles, or redundant advisory dialogs.
- **Mobile-First Responsiveness:** Optimize touch targets (>= 44x44px), thumb-friendly navigation, sticky bottom-bars on mobile, and zero horizontal scrolling bugs.
- **Concise & Direct Forms:** Keep forms focused, pre-fill known user profile data wherever possible, and provide clear field-level validation feedback.
- **Consistent Navigation Shell:** All authenticated areas must render through `<AppShell />` with unified sidebar/drawer navigation, role badges, and invitation counters.
