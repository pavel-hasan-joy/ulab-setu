# ULAB Setu (সেতু) — Comprehensive Project Summary & Architecture Blueprint

> **Project Name:** ULAB Setu  
> **Tagline:** *Where ULAB students meet the alumni who came before them.*  
> **Target Institution:** University of Liberal Arts Bangladesh (ULAB) *(Brand-configurable for any institution via `src/lib/site.ts`)*  
> **Technology Stack:** Next.js 16 (Turbopack, App Router), React 19, TypeScript 5, Tailwind CSS v4, Prisma ORM 6, PostgreSQL, Three.js, Playwright  
> **Live Production:** [https://ulab-setu.vercel.app](https://ulab-setu.vercel.app)  
> **Documentation Version:** 2.0 (Updated September 2026)  

---

## 1. Executive Summary & Purpose

**ULAB Setu** ("Setu" meaning *Bridge* in Bengali) is an institutional web platform and Progressive Web App (PWA) designed to bridge the gap between undergraduate students, graduated alumni, and university faculty members.

In traditional university setups, students often struggle to enter the competitive job market due to a lack of direct industry mentorship, practical guidance, and inside job referrals. At the same time, alumni working in top tech companies, corporate sectors, and NGOs want to give back to their alma mater by offering job circulars, referrals, and advice, but lack a dedicated, centralized institutional hub.

### Core Problems Solved by Setu:
1. **Verified Campus Networking:** Strict role-based verification ensuring only genuine university members can connect. Students are restricted to official university emails (`@ulab.edu.bd`), while alumni and faculty are verified by the Alumni Office before they can publish posts or circulars.
2. **Three-Tier Job Aggregation:**
   - **Internal Opportunities:** Direct job and internship postings from verified alumni (featuring an *"Employee Referral Available"* tag) and faculty (Teaching Assistant and Research Assistant roles).
   - **Nationwide Bangladesh Jobs:** Integrated live job aggregator via the **Careerjet API** (`locale_code=en_BD`), bringing listings from Bdjobs and major Bangladeshi recruitment portals.
   - **Global Remote Opportunities:** Integrated international remote jobs feed via the **Himalayas API**.
3. **Frictionless Mentorship & Direct Messaging:** Instant 1-on-1 direct messaging connecting students with alumni without cumbersome handshake barriers.
4. **Campus Notice Board & Opportunities:** Official alerts, hackathons, academic research calls, and foreign scholarship announcements categorized and easily searchable.
5. **Comprehensive Admin & Analytics Center:** Complete oversight covering account verifications, user role management, job moderation, university-wide broadcasts, live login activity tracking, and one-click CSV export for university administration.
6. **State-of-the-Art Visual Experience:** 3D Three.js particle morphing, physics-based interactive elements, dark/light theme switching, and standalone PWA mobile installation.

---

## 2. System Architecture & Tech Stack

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                            Client Layer (Browser & PWA)                       │
│  - React 19 & TypeScript 5                  - Three.js 3D WebGL Particle      │
│  - Tailwind CSS v4 Design Tokens            - Service Worker (Offline Cache)  │
│  - Framer Motion Smooth Transitions         - Standalone PWA (iOS & Android)  │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │ HTTPS (Server-Side Rendering & Server Actions)
┌───────────────────────────────────────▼───────────────────────────────────────┐
│                      Next.js 16 Full-Stack Application Server                 │
│  - App Router Structure (/student, /alumni, /teacher, /admin)                 │
│  - Edge Route Middleware & Role Guard (src/proxy.ts)                          │
│  - Secure Server Actions (auth, admin, jobs, posts, network, profile)         │
│  - Jose JWT Stateless Session Management (HTTP-only, Secure Cookies)          │
└───────────────────────┬───────────────────────────────────────┬───────────────┘
                        │ Prisma ORM 6                          │ External REST API
┌───────────────────────▼───────────────┐       ┌───────────────▼───────────────┐
│           Database Layer              │       │         External APIs         │
│ - PostgreSQL (Production Cloud DB)    │       │ - Careerjet API (BD Jobs)     │
│ - SQLite (Local Sandbox Testing)      │       │ - Himalayas API (Remote Jobs) │
└───────────────────────────────────────┘       └───────────────────────────────┘
```

### Detailed Technology Specifications:
- **Framework:** Next.js 16 with Turbopack, App Router, React Server Components (RSC), and Server Actions.
- **Frontend Engine:** React 19 and TypeScript 5.
- **Styling & Design System:** Tailwind CSS v4 using modern `@theme` custom tokens (ULAB blue `#003366`, gold `#cda434`, lilac, sage, and dark mode palette).
- **3D Graphics & Physics Engine:** Three.js for interactive particle morphing (globe → graduation cap → bridge → briefcase) and spring physics interactions.
- **Database & Object-Relational Mapping (ORM):** Prisma ORM 6 connecting to cloud PostgreSQL (Neon / Supabase) in production and SQLite for local development.
- **Authentication & Security:**
  - Password encryption using `bcryptjs` with 10 salt rounds.
  - Stateless cryptographic session tokens using `jose` (JWT stored in secure HTTP-only cookies).
  - Role-based route guard in `src/proxy.ts` preventing unauthorized cross-role access.
  - Runtime request validation using `zod`.
- **Progressive Web App (PWA):**
  - Web App Manifest (`manifest.ts`) providing native standalone application experience.
  - Custom Service Worker (`public/sw.js`) with offline caching and network fallback (`public/offline.html`).
- **End-to-End Testing:** Automated smoke and flow tests with `playwright-core` driving headless Google Chrome.

---

## 3. User Roles & Permission Matrix

The platform implements four distinct user roles with clear permission boundaries:

| Feature / Capability | Student | Alumni (Approved) | Teacher (Approved) | Admin (Alumni Office) |
|---|:---:|:---:|:---:|:---:|
| **Registration / Sign Up** | Instant (`@ulab.edu.bd`) | Requires Admin Approval | Requires Admin Approval | Pre-seeded / Promoted |
| **Browse Internal Jobs** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Apply to Jobs** | ✅ (Profile Required) | ❌ | ❌ | ❌ |
| **Post Job Circulars** | ❌ | ✅ (With Referral Tag) | ✅ (TA/RA Openings) | ❌ |
| **Manage Applicants & Status** | ❌ | ✅ (Own Postings) | ✅ (Own Postings) | ❌ |
| **1-on-1 Direct Messaging** | ✅ Any User | ✅ Any User | ✅ Any User | ✅ Any User |
| **Post to Notice Board** | ❌ | ✅ | ✅ | ✅ Official Broadcast |
| **Browse People Directory** | ✅ | ✅ | ✅ | ✅ |
| **Verify / Approve New Signups** | ❌ | ❌ | ❌ | ✅ |
| **Users Directory & Role Controls**| ❌ | ❌ | ❌ | ✅ (Promote/Suspend/Delete) |
| **Job Moderation & Status Toggle** | ❌ | ❌ | ❌ | ✅ (All Jobs) |
| **Platform Analytics & CSV Export**| ❌ | ❌ | ❌ | ✅ |

---

## 4. Key Functional Modules

### 4.1. Three-Tier Job & Internship Portal
1. **Campus Network Jobs:** Verified alumni and teachers post job opportunities directly. Alumni can highlight whether employee referral is offered, significantly assisting graduating seniors. Teachers post campus TA and RA positions.
2. **Bangladesh Job Aggregator:** Direct integration with the **Careerjet API** (`locale_code=en_BD`) displaying nationwide listings from major Bangladesh job sites.
3. **Global Remote Careers:** Integrated feed from **Himalayas API** for worldwide software, engineering, product, and content roles.
4. **Curated Job Portals Directory:** Quick external links to Bdjobs, Teletalk All Jobs (government circulars), LinkedIn Bangladesh, Skill.jobs, Chakri, and others.

### 4.2. Direct Mentorship & Real-Time Messaging
- Students can search for alumni and faculty across departments, graduating years, current employers, and specific technical skills (e.g., Python, Brand Strategy, GIS, Machine Learning).
- Instant messaging opens 1-on-1 communication directly, eliminating artificial connection barriers and fostering responsive mentorship.

### 4.3. Campus Notice Board & Broadcasts
Categorized announcements allow students to filter precisely what they need:
- 📢 **Notice:** General university administrative and departmental announcements.
- 📅 **Event:** Seminars, tech fests, alumni reunions, and career fairs.
- 🎓 **Scholarship:** Higher study funding and graduate scholarship opportunities abroad.
- 🔬 **Research:** Academic calls for papers, research assistant openings, and lab projects.
- 💡 **Opportunity:** Competitions, workshops, and student development programs.

### 4.4. Student Profiles & Granular Privacy Protection
- Students maintain profiles showcasing their bio, batch, department, skills, and resume notes.
- Users have full control over their contact information with independent toggles for:
  - Phone Number (`phonePublic: true/false`)
  - WhatsApp Link (`whatsappPublic: true/false`)
  - Facebook Profile (`facebookPublic: true/false`)
- Private details are strictly filtered on the server before transmission to protect privacy.

---

## 5. Comprehensive Admin Control Center (`/admin`)

The Admin suite provides the university administration and Alumni Relations Office with complete institutional management:

### 5.1. Approvals & Account Verification (`/admin`)
- Lists all pending alumni and teacher registrations.
- Admins verify student IDs and departmental credentials against university records before approving or rejecting access.

### 5.2. Users Directory & Access Control (`/admin/users`)
- **Live Search & Multidimensional Filtering:** Search across name, email, student ID, department, batch, and employer.
- **Role Assignment:** Instantly promote or reassign user roles (Student, Alumni, Teacher, Admin).
- **Account Actions:** Approve, suspend/reject, or permanently delete accounts with safety checks preventing accidental self-deletion.
- **One-Click CSV Export:** Export complete or filtered university user records directly into spreadsheet format.

### 5.3. Job & Internship Moderation (`/admin/jobs`)
- View all internal job postings with poster details, categories, deadlines, and applicant tallies.
- Toggle postings between **Active** and **Closed** status.
- Delete inappropriate or expired listings with full cascade safety.
- **Export Jobs CSV:** Export job lists, employers, and application statistics.

### 5.4. Notices & Broadcast Management (`/admin/notices`)
- **Official Broadcast Form:** Publish university-wide announcements, scholarship notices, and campus events.
- **Community Moderation:** Review and moderate community posts published by alumni and faculty.

### 5.5. Platform Analytics & Activity Tracking (`/admin/analytics`)
- **Network Distribution KPIs:** Total Users, Students, Alumni, Faculty, Admins, and Pending verifications.
- **Engagement Strip:** Live counts of Jobs Posted, Student Applications, Network Connections, and Broadcasts.
- **7-Day Authentication Trend Chart:** Daily visual bar chart showing active logins over the past week.
- **Top Departments Distribution:** Percentage breakdown of registered students and alumni by academic department.
- **Real-Time Authentication Audit Table:** Detailed login log with user timestamps and roles.
- **One-Click Audit CSV Export:** Instant download of login and user audit trails.

---

## 6. Database Schema & Data Models

Managed via **Prisma ORM** (`prisma/schema.prisma`):

```
┌──────────────┐          1:N           ┌──────────────┐
│     User     ├───────────────────────►│     Job      │
└──────┬───────┘                        └──────┬───────┘
       │                                       │
       │ 1:N (student)                         │ 1:N (job)
       ▼                                       ▼
┌──────────────┐                        ┌──────────────┐
│ Application  │◄───────────────────────┤ Application  │
└──────────────┘                        └──────────────┘
       │
       ├─────────────────────────────────────────┐
       │ 1:N (sent/received)                     │ 1:N (author)
       ▼                                         ▼
┌──────────────┐                        ┌──────────────┐
│  Connection  │                        │     Post     │
└──────┬───────┘                        │(Notice Board)│
       │ 1:N                            └──────────────┘
       ▼                                       
┌──────────────┐                        ┌──────────────┐
│   Message    │                        │   LoginLog   │
└──────────────┘                        │ (Audit Logs) │
                                        └──────────────┘
```

### Models & Field Reference:
1. **User:** `id`, `name`, `email`, `passwordHash`, `role` (STUDENT | ALUMNI | TEACHER | ADMIN), `status` (PENDING | APPROVED | REJECTED), `department`, `studentId`, `batch`, `graduationYear`, `company`, `designation`, `location`, `bio`, `skills`, `linkedin`, `phone`, `phonePublic`, `whatsapp`, `whatsappPublic`, `facebook`, `facebookPublic`, `createdAt`, `lastLoginAt`.
2. **Job:** `id`, `title`, `company`, `location`, `type` (Full-time | Part-time | Internship | Contract), `category`, `description`, `requirements`, `salary`, `deadline`, `referral` (boolean), `active` (boolean), `createdAt`, `postedById`.
3. **Application:** `id`, `note`, `status` (APPLIED | SHORTLISTED | REJECTED), `createdAt`, `jobId`, `studentId`. Unique on `[jobId, studentId]`.
4. **Connection:** `id`, `note`, `status` (PENDING | ACCEPTED | DECLINED), `createdAt`, `fromId`, `toId`.
5. **Message:** `id`, `body`, `createdAt`, `connectionId`, `senderId`.
6. **Post:** `id`, `kind` (Notice | Event | Scholarship | Research | Opportunity), `title`, `body`, `link`, `eventDate`, `createdAt`, `authorId`.
7. **LoginLog:** `id`, `userId`, `email`, `name`, `role`, `createdAt`.

---

## 7. Directory & File Structure

```
setu/
├── src/
│   ├── app/                      # Next.js App Router (RSC & Pages)
│   │   ├── (auth)/               # Login & Signup flows with validation
│   │   ├── actions/              # Server Actions
│   │   │   ├── admin.ts          # User management, job moderation & notices actions
│   │   │   ├── auth.ts           # Authentication, session creation & login logging
│   │   │   ├── jobs.ts           # Job creation, applications & status updates
│   │   │   ├── network.ts        # Connections & direct messaging actions
│   │   │   ├── posts.ts          # Community posts & announcements actions
│   │   │   └── profile.ts        # Profile editing & contact privacy updates
│   │   ├── admin/                # Admin Panel
│   │   │   ├── analytics/        # Platform analytics & authentication logs
│   │   │   ├── jobs/             # Job & internship moderation page
│   │   │   ├── notices/          # Notices & community broadcast management
│   │   │   ├── users/            # Users directory, role editing & CSV export
│   │   │   ├── layout.tsx        # Admin navigation shell (5 unified tabs)
│   │   │   └── page.tsx          # Account approvals & verification page
│   │   ├── alumni/               # Alumni portal (jobs, applicants, directory)
│   │   ├── student/              # Student portal (jobs, applications, board, chats)
│   │   ├── teacher/              # Teacher portal (department posts, TA jobs)
│   │   ├── globals.css           # Tailwind v4 theme definitions
│   │   ├── layout.tsx            # Root layout with ThemeProvider & PWA integration
│   │   ├── manifest.ts           # PWA Manifest definition
│   │   └── page.tsx              # Cinematic 3D landing page
│   ├── components/               # UI Component Library
│   │   ├── admin-analytics-view.tsx # Analytics charts, KPI cards & CSV export
│   │   ├── admin-jobs-view.tsx      # Job moderation view & controls
│   │   ├── admin-notices-view.tsx   # Broadcast modal & notice management
│   │   ├── admin-users-view.tsx     # User search, filter, role changer & CSV export
│   │   ├── app-shell.tsx         # Unified desktop sidebar & mobile bottom navigation
│   │   ├── effects/              # Three.js particle morphing, physics canvas
│   │   ├── landing/              # Hero, stats, stories & features
│   │   ├── chat-window.tsx       # Real-time messaging UI
│   │   ├── job-cards.tsx         # Multi-tab job listing cards
│   │   ├── pwa.tsx               # Service worker hooks & install prompt
│   │   └── ui.tsx                # Design system primitives (Button, Card, Badge, Avatar)
│   ├── lib/                      # Core Utilities
│   │   ├── auth.ts               # Session verification & role guards
│   │   ├── db.ts                 # Prisma Client singleton
│   │   ├── external-jobs.ts      # Careerjet & Himalayas API connectors
│   │   ├── session.ts            # Jose JWT encryption & token management
│   │   └── site.ts               # Centralized institutional branding configuration
│   └── proxy.ts                  # Edge route protection & role redirection
├── prisma/
│   ├── schema.prisma             # Relational database schema
│   └── seed.ts                   # Realistic demo dataset
├── public/                       # Static branding, logos, sw.js, offline.html
├── e2e/                          # Playwright automated test suite
└── package.json                  # Dependencies & scripts
```

---

## 8. Deployment & CI/CD Workflow

### Production Build Script
In `package.json`:
```json
"scripts": {
  "dev": "next dev",
  "build": "prisma generate && next build",
  "start": "next start"
}
```
*Running `prisma generate` prior to `next build` ensures that Vercel and CI environments always compile against the latest Prisma Client types, preventing type-check build failures.*

### Pre-Configured Demo Credentials:
| Account Role | Email Address | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@ulab.edu.bd` | `password123` | Full Admin Center (`/admin`) |
| **Student** | `student@ulab.edu.bd` | `password123` | Student Workspace (`/student`) |
| **Alumni** | `alumni1@example.com` | `password123` | Approved Alumni Workspace (`/alumni`) |
| **Teacher** | `teacher@ulab.edu.bd` | `password123` | Faculty Workspace (`/teacher`) |

---

## 9. Conclusion & Project Value

**ULAB Setu** delivers an end-to-end institutional solution combining high performance, strict institutional security, dynamic modern aesthetics, and administrative governance. By bridging alumni career insights directly to students while providing faculty and administrators with comprehensive oversight, Setu establishes an enduring digital foundation for the entire university community.
