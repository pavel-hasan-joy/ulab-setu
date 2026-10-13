# 🌉 ULAB Setu — University & Alumni Ecosystem Platform

<div align="center">

[![CI Status](https://github.com/pavel-hasan-joy/ulab-setu/actions/workflows/ci.yml/badge.svg)](https://github.com/pavel-hasan-joy/ulab-setu/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Website-0070F3?style=flat-square&logo=vercel&logoColor=white)](https://ulab-setu.vercel.app)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=flat-square&logo=playwright&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-orange?style=flat-square&logo=pwa&logoColor=white)

<br/>

**A unified academic and career platform connecting the ULAB ("University of the future") community: students, verified alumni, faculty members, and the alumni administration office.**

<br/>

<!-- App Preview / Screenshot -->
<img src="public/images/student.png" alt="ULAB Setu Preview" width="850" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.3); max-width: 100%;" />

<p><em>🌉 ULAB Setu Interface — Bridging students with alumni, mentorship, and career opportunities</em></p>

[Live Website](https://ulab-setu.vercel.app) • [Features](#-key-features) • [Tech Stack](#-tech-stack) • [Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [Deployment](#-deployment)

</div>

---

## 📖 Overview

**ULAB Setu** (সেতু — *Bridge*) is a modern full-stack web application and Progressive Web App (PWA) designed to bridge the gap between academia and the professional world. 

The platform enables students to connect with alumni mentors, apply for curated jobs and internships, communicate directly through private messaging, and access real-time job listings from both Bangladeshi job portals and global remote companies. An automated verification workflow managed by the Alumni Office ensures safety, authenticity, and verified community networking.

---

## 🚀 Recent Platform Upgrades (v2.0)

ULAB Setu has been significantly upgraded with enterprise-grade collaborative and networking features:

- 🏫 **Google Classroom + WhatsApp Group Chat System:**
  - **Faculty & Student Portals:** A dedicated Classroom space accessible only to Students and Teachers.
  - **1-Click Class Codes:** Course instructors generate unique 6-character alphanumeric codes (e.g., `ULAB31`) with a copy button for instant student enrollment.
  - **WhatsApp-Style Group Discussion:** Real-time group messaging with role distinction (Faculty badge vs. Student ID), auto-scrolling, and fast message dispatch.
  - **Pinned Course Announcements:** Teachers can post exam schedules, syllabi, and assignment updates with a **Pin to Top** toggle.
  - **Roster & Member Controls:** Detailed member lists with instructor and student categorization.
- 🤝 **Interactive Networking & Disconnect Controls:**
  - LinkedIn-style Connection Requests (Send, Pending with withdrawal, Accept, Decline).
  - **Disconnect / Remove Connection:** Once connected, users can remove connections with a safe confirmation modal preventing accidental removal.
  - **Dynamic Invitation Badges:** Real-time notification counters on sidebar tabs across Student, Teacher, and Alumni spaces.
- 📄 **Rich Job Candidate Dossiers & Profile Modal:**
  - Interactive applicant cards displaying full profile information, skills badges, student ID, batch, and CV preview.
  - Global **Profile Modal** allowing one-click profile inspection from any directory card or job applicant listing.
- 🔐 **Pre-configured Testing & Demonstration Accounts:**
  - Seeded ready-to-use accounts for Faculty, Student, and Alumni with sample classroom `ULAB31`.

---

## ✨ Key Features by User Role

### 🎓 1. Student Portal
- **Smart Job Search & Filters:** Browse direct alumni job postings, Bangladeshi jobs via Careerjet API, and global remote opportunities via Himalayas API.
- **Application Tracking:** Apply directly to alumni/teacher postings and track application statuses.
- **Google Classroom & Group Chat:** Join classrooms using teacher-provided codes, participate in WhatsApp-style discussions, and read pinned announcements.
- **Alumni Mentorship Directory:** Discover alumni filtered by department, batch, company, and location with Connect/Disconnect options.
- **Community Notice Board:** Stay updated with official announcements, career seminars, and campus events.
- **1-on-1 Direct Messaging:** Private messaging with alumni mentors and faculty members.
- **Privacy First:** Control visibility of personal contact info (Phone, WhatsApp, Facebook).

### 💼 2. Alumni Portal
- **Job & Internship Posting:** Post job openings directly with custom application requirements, deadlines, and salary details.
- **Applicant Review & Candidate Dossier:** View comprehensive applicant details (Avatar, Student ID, batch, department, skills, and CV preview) with full profile modals.
- **Talent Discovery & Networking:** Connect with students and peer alumni with connect and disconnect options.
- **Community Engagement:** Publish career advice, opportunities, and discussions on the notice board.
- **Approval Workflow:** Verified status granted by the Alumni Office ensures authentic alumni representation.

### 👨‍🏫 3. Faculty / Teacher Portal
- **Classroom Management:** Create and manage course classrooms with unique join codes.
- **WhatsApp-Style Course Group Chat:** Chat with enrolled students in real time with distinctive Faculty badges.
- **Course Announcements:** Publish important notices and pin key updates (exams, deadlines, syllabus).
- **Research & TA Opportunities:** Post openings for Teaching Assistants (TA), Research Assistants (RA), and lab projects.
- **Direct Mentorship & Networking:** Connect with current students and alumni with full connection management.

### 🛡️ 4. Alumni Office (Admin Portal)
- **User Verification Queue:** Review, approve, or reject pending alumni and faculty registration requests.
- **Bulk Directory Import (Excel & CSV):** Upload official institutional faculty and alumni lists (`.xlsx`, `.xls`, `.csv`) with auto-column detection. Members in the directory are auto-approved instantly on signup, and existing pending accounts are reconciled immediately.
- **Email OTP Verification Engine:** Ensures email ownership at signup and during password recovery with 6-digit one-time passwords.
- **Forgot Password & Password Reset:** Self-service password recovery flow sending 6-digit verification codes to the user's registered institutional or personal email.
- **Account Deletion & Data Privacy:** Self-service account deletion allowing any student, alumni, or teacher to permanently delete their account, messages, and profile data at any time.
- **Platform Analytics & Telemetry:** Real-time metrics on user growth, role distribution, active jobs, and engagement.
- **Job & Notice Moderation:** Manage and moderate posted listings across the platform.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | **Next.js 16** (App Router, Server Components & Server Actions) |
| **UI Library** | **React 19**, **Tailwind CSS v4**, **Lucide Icons** |
| **Animation & 3D** | **Three.js**, **Motion** (Framer Motion v13) for interactive particle & canvas effects |
| **Language & Validation** | **TypeScript 5**, **Zod** (runtime validation) |
| **Database & ORM** | **Prisma ORM**, SQLite (Local development) / PostgreSQL (Production) |
| **File & Data Ingestion** | **XLSX (SheetJS)** for Excel (.xlsx, .xls) & CSV parsing and template generation |
| **Email Delivery** | **Nodemailer** (SMTP) & **Resend API** integration with resilient demo fallback |
| **Authentication & Security** | **Jose** (JWT session tokens), **bcryptjs** (salted password hashing), HTTP-only cookies, 6-digit OTP verification |
| **Testing** | **Playwright** (End-to-end / smoke tests) |
| **CI / CD** | **GitHub Actions** (Automated Linting, Next.js Build & Playwright E2E testing) |
| **Mobile & Offline** | **Progressive Web App (PWA)** with Service Worker (`sw.js`) and offline fallback |
| **Package Manager** | **pnpm v11** |

---

## 🏛️ System Architecture & Data Model

The database is built on **Prisma ORM** with relational integrity:

```
┌──────────────┐          1:N           ┌──────────────┐
│     User     │───────────────────────<│     Job      │
│ (RBAC Roles) │                        └──────┬───────┘
└──────┬───────┘                               │ 1:N
       │ 1:N                                   ▼
       ├───────────────────────────────<┌──────────────┐
       │                                │ Application  │
       │ 1:N                            └──────────────┘
       ├───────────────────────────────<┌──────────────┐
       │                                │   Message    │
       │ 1:N                            └──────────────┘
       └───────────────────────────────<┌──────────────┐
                                        │  Post/Notice │
                                        └──────────────┘
```

- **User Model:** Stores credentials, university details (`department`, `studentId`, `batch`, `graduationYear`), career info (`company`, `designation`), role (`STUDENT`, `ALUMNI`, `TEACHER`, `ADMIN`), and approval status (`PENDING`, `APPROVED`, `REJECTED`).
- **PreApprovedMember Model:** Stores whitelisted institutional records (email, student ID, faculty designation) uploaded by the Alumni Office via Excel/CSV for automated zero-latency verification.
- **VerificationCode Model:** Manages ephemeral, cryptographically random 6-digit one-time passwords (OTP) tied to applicant emails with a 10-minute validity window.
- **Granular Privacy:** Dedicated booleans (`phonePublic`, `whatsappPublic`, `facebookPublic`) so users control contact disclosure.
- **Job & Application Model:** Tracks employer metadata, requirements, deadlines, application counts, and candidate statuses.
- **Communication & Social:** Direct peer-to-peer messages and community notice-board feeds.

---
## 🧠 Architectural Decisions & Engineering Rationale

Technical decisions across Setu were guided by industry best practices, defense-in-depth security, and scalable systems architecture:

### 1. Why Prisma ORM over Raw SQL or Query Builders?
- **End-to-End Type Safety & Schema Integrity:** Prisma generates typed client bindings directly from `schema.prisma`. Schema mutations trigger immediate compile-time errors across application server actions and UI components, eliminating runtime impedance mismatches.
- **Multi-Environment Portability (SQLite ⇋ PostgreSQL):** Prisma abstracts SQL dialect divergence, allowing zero-friction local development and isolated, ephemeral CI test runners using SQLite, while seamlessly targeting distributed production PostgreSQL instances (Supabase, Neon) without query refactoring.
- **Defensive Query Construction:** All database queries are automatically parameterized and sanitized internally, providing robust out-of-the-box mitigation against SQL injection vectors.

### 2. How and Where is Role-Based Authorization & Approval Enforced?
Setu implements a **multi-tiered, defense-in-depth authorization model**:
- **Layer 1 — Cryptographic Session Verification (`src/lib/session.ts`):** Client sessions are minted as cryptographically signed JSON Web Tokens (JWT) using `jose`, stored in secure, `HTTP-only`, `SameSite=Lax` cookies. This architecture prevents token leakage via Cross-Site Scripting (XSS).
- **Layer 2 — Route-Level Edge Interception:** Server-side layout and route handlers verify the decoded JWT `role` claim (`STUDENT`, `ALUMNI`, `TEACHER`, `ADMIN`) prior to evaluating or rendering role-protected portal routes (`/admin/*`, `/alumni/*`, `/teacher/*`, `/student/*`).
- **Layer 3 — Mutation & Approval State Assertion (`status === 'APPROVED'`):** For sensitive mutative actions (e.g., posting job vacancies or publishing notice-board broadcasts), server actions assert two strict preconditions:
  1. The authenticated subject holds the requisite role.
  2. The account verification state explicitly evaluates to `APPROVED`.
  *Unverified alumni or faculty accounts remain quarantined in a read-only state until university credentials are authenticated by the Alumni Administration office via `/admin/users`.*
- **Layer 4 — Selective Data Projection (Granular Privacy):** Database queries apply selective field projection based on privacy flags (`phonePublic`, `whatsappPublic`, `facebookPublic`), stripping private contact vectors before payloads reach the presentation layer.

### 3. Why Next.js 16 App Router & Server Actions over a Decoupled REST Backend?
- **Elimination of Network Waterfalls:** React Server Components (RSC) fetch and process records directly at the data layer, avoiding redundant client-to-server HTTP round trips and dramatically slimming the client-side JavaScript payload delivered to mobile devices.
- **Type-Safe Remote Procedure Calls (RPC):** Server Actions co-locate backend mutation logic with client forms, removing the overhead of managing separate REST endpoint boilerplate, JSON serialization DTOs, and client-side fetching hooks.

### 4. Why Playwright for End-to-End Testing?
- **Deterministic Cross-Role Validation:** Playwright drives headless Chromium with full browser isolation, enabling automated verification of complex multi-actor workflows (e.g., student submitting an application, alumni reviewing candidate profiles, and admin approving user accounts).
- **Automated Regression Artifacts:** CI test suites capture visual DOM snapshots into `e2e/shots/`, allowing verification of responsive layouts and Canvas graphics across viewport sizes.

### 5. Why Progressive Web App (PWA) Architecture?
- Rather than requiring students and alumni to navigate mobile app store approvals, Setu leverages Web App Manifests (`manifest.ts`) and Service Workers (`sw.js`). This provides zero-install friction, instant desktop/mobile installation, and reliable offline fallback capabilities via cached static application shells.

### 6. Why Pre-Approved Whitelist Ingestion (Excel & CSV) for Verification?
- Real-world institutional integration requires bridging legacy university spreadsheets (faculty directories, graduation records) with a modern web portal. By supporting client-side template downloads and server-side XLSX/CSV parsing, administrators can ingest thousands of records in seconds. Signups matching institutional emails or student IDs are granted immediate `APPROVED` status, while unrecognized registrations gracefully route to manual review.

### 7. Why Email OTP Verification over Static Link Tokens?
- Static email links require deep linking or context-switching between mail clients and mobile browsers, which frequently fails inside embedded webviews (e.g., Messenger or LinkedIn in-app browsers). 6-digit numeric OTPs provide high deliverability, a clean interactive signup form, and strict 10-minute cryptographic expiration against replay attacks.

---

## 🌐 External Job Integrations

Setu aggregates three distinct streams of employment opportunities:
1. **Alumni & Faculty Postings:** Curated, verified campus-exclusive jobs directly posted within the platform.
2. **Bangladesh Job Market (Careerjet API):** Pulls live listings from Bdjobs and major Bangladeshi recruitment sites (`locale_code=en_BD`).
3. **Global Remote Careers (Himalayas API):** Real-time remote opportunities from international technology companies.

---

## 📱 Progressive Web App (PWA)

Setu functions as a native-feeling application across Android, iOS, and Desktop:
- **Mobile Installation:** Supports "Add to Home Screen" on iOS Safari and Web App Install prompts on Android Chrome.
- **Service Worker (`public/sw.js`):** Caches static assets, app icons, and critical scripts.
- **Offline Resilience:** Renders an elegant fallback page (`public/offline.html`) when the device loses network connectivity.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v20+ recommended)
- **pnpm** (v9+ or `npm install -g pnpm`)

### 1. Clone the Repository
```bash
git clone https://github.com/pavel-hasan-joy/ulab-setu.git
cd ulab-setu
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Variables
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Generate an authentication secret:
```bash
openssl rand -hex 32
```
Add the values to `.env`:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your_generated_32_byte_secret"
CAREERJET_API_KEY="" # Optional: Required for live Careerjet BD listings
```

### 4. Database Setup & Seeding
Initialize the SQLite database schema and load demonstration seed accounts:
```bash
pnpm db:push
pnpm db:seed
```

### 5. Start the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Seed & Demo Accounts

For local and staging testing, ready-to-use profiles across all roles are provisioned:

| Role | Name | Email | Password | Status |
|---|---|---|---|---|
| **Student** | Farhana Akter | `student@ulab.edu.bd` | `password123` | Approved |
| **Teacher** | Dr. Kamrul Karim | `teacher@ulab.edu.bd` | `password123` | Approved |
| **Alumni** | Tanvir Hasan | `alumni@ulab.edu.bd` | `password123` | Approved |
| **Admin** | Alumni Office | `admin@ulab.edu.bd` | `password123` | Administrator |

#### 🏫 Demonstration Classroom:
- **Course Name:** `CSE 311: Database Management Systems`
- **Class Code:** `ULAB31`
- **Features:** WhatsApp group discussion feed, pinned syllabus notice, and dual-enrolled teacher/student.

> 🔒 **Security Notice:** Default seed passwords are strictly meant for local evaluation and feature verification. For production deployments, always create unique credentials with strong passwords.

---

## 🧪 Testing & CI

The repository includes end-to-end tests driven by **Playwright** and automated via **GitHub Actions**:

```bash
# 1. Initialize isolated test database
pnpm test:db

# 2. Build and start test server (in terminal 1)
pnpm build
DATABASE_URL=file:./test.db pnpm start -p 3457

# 3. Execute Playwright smoke tests (in terminal 2)
BASE=http://localhost:3457 pnpm test:e2e
```
*Screenshots from automated test runs are saved to `e2e/shots/`.*

---

## 📦 Production Deployment

### 1. Database
For production environments, switch from local SQLite to a hosted PostgreSQL instance (e.g., **Supabase** or **Neon**):
1. In `prisma/schema.prisma`, update the provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Run database push:
   ```bash
   pnpm db:push
   ```

### 2. Vercel Deployment
Deploy seamlessly with Vercel:
1. Import the repository in your Vercel Dashboard.
2. Configure Environment Variables:
   - `DATABASE_URL`: Hosted PostgreSQL connection URL.
   - `AUTH_SECRET`: Strong random secret.
   - `CAREERJET_API_KEY`: Your Careerjet API key (optional).
3. Deploy!

---

## 🎨 Rebranding & Customization

The project is structured for easy white-labeling and adaptation to other universities:
- **University Identity:** Name, logo, domain, and departments are configured in `src/lib/site.ts`.
- **Theme & Colors:** Design system tokens and brand palettes are defined in `src/app/globals.css`.

---

## 📄 License & Credits

Developed with ❤️ by **[Pavel Hasan Joy](https://github.com/pavel-hasan-joy)** for the **University of Liberal Arts Bangladesh (ULAB — "University of the future")** community.
