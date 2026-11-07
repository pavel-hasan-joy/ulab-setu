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

[Live Website](https://ulab-setu.vercel.app) • [GitHub Repository](https://github.com/pavel-hasan-joy/ulab-setu) • [Features by Role](#-features-by-user-role) • [Shared Features](#-shared-platform-features) • [Tech Stack](#-tech-stack) • [System Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [Deployment](#-production-deployment)

</div>

---

## 📖 Project Introduction & Purpose

**ULAB Setu** (*Setu* — Bridge) is an institutional networking, career development, and mentorship platform purpose-built for the **University of Liberal Arts Bangladesh (ULAB)** community.

The platform bridges the traditional gap between university academia and professional industry by empowering students to:
- Connect directly with verified alumni working across top multinational and domestic enterprises.
- Receive one-on-one professional career consultation, resume reviews, and interview coaching from alumni and faculty mentors.
- Discover and apply for campus-exclusive job vacancies, internships, research assistantships, and tuition opportunities.
- Collaborate across departments via real-time direct and group messaging with rich multimedia and document attachments.
- Access an authenticated, institution-governed space where the Alumni Office actively maintains authenticity through official directory reconciliation and zero-trust verification.

---

## 🌐 Official Platform Links

- **Live Website:** [https://ulab-setu.vercel.app](https://ulab-setu.vercel.app)
- **GitHub Repository:** [https://github.com/pavel-hasan-joy/ulab-setu](https://github.com/pavel-hasan-joy/ulab-setu)

---

## 🛠️ Verified Technology Stack

| Layer | Technologies & Libraries | Verified Role in Codebase |
|---|---|---|
| **Frontend Framework** | **Next.js 16** (App Router, Server Actions, Server Components) | High-performance full-stack React framework with Turbopack compilation |
| **UI & Styling** | **React 19**, **Tailwind CSS v4**, **Lucide Icons** | Component primitives, utility-first styling, and accessible icon sets |
| **Animation & Visuals** | **Three.js**, **Motion** (Framer Motion v13) | Interactive 3D particle background Canvas and smooth UI transitions |
| **Language & Typing** | **TypeScript 5**, **Zod** | End-to-end strict static typing and schema input validation |
| **Database & ORM** | **Prisma ORM 6**, SQLite (Local) / PostgreSQL (Production) | Declarative schema modeling, migrations, and parameterized query execution |
| **Session Security** | **Jose** (JWT), **bcryptjs**, HTTP-Only Cookies | Stateless HS256 cryptographic session cookies and salted password hashing |
| **Email & Verification** | **Nodemailer** (SMTP), **Resend API** | Cryptographic 6-digit OTP delivery for signup and password recovery |
| **Data Ingestion** | **XLSX (SheetJS)** | Server-side parsing of institutional alumni/faculty directories (`.xlsx`, `.xls`, `.csv`) |
| **External Job APIs** | **Careerjet API**, **Himalayas API** | Aggregation of domestic Bangladesh jobs and global remote developer roles |
| **Testing & CI** | **Playwright**, **Node Test Runner**, **GitHub Actions** | Automated end-to-end browser flows, unit regression audits, and CI build verification |
| **PWA & Offline** | **Web App Manifest**, **Service Worker (`sw.js`)** | Standalone mobile/desktop app installation and offline fallback caching |
| **Package Manager** | **pnpm v11** | Fast, deterministic dependency management |

---

## ✨ Features by User Role

### 🌐 1. Public Website (Unauthenticated Visitors)

The public-facing surface of ULAB Setu introduces prospective users to the platform's mission and provides seamless, secure entry points into the ecosystem:

- **Interactive 3D Hero Section:** Features an animated Three.js particle canvas symbolizing the network bridge connecting students and alumni.
- **Platform Telemetry Counters:** Displays live counts of registered students, verified alumni, active faculty mentors, and available career openings.
- **Pillars of Setu Showcase:** Visual breakdown of platform offerings: 1-on-1 Alumni Mentorship, Curated University Jobs, Real-time Networking, and Official Campus Notices.
- **Curated Job Stream Teaser:** Live preview of recent career listings and campus-exclusive internships.
- **Alumni Spotlight & Testimonials:** Highlights stories of ULAB graduates thriving in industry.
- **Responsive Top Navigation Bar:** Quick navigation links, dark/light theme toggle, and direct calls to action for Login and Sign Up.
- **Footer with University Identity:** Comprehensive institutional links, departmental directories, privacy guidelines, and community contact channels.
- **User Authentication Gateway:** Accessible login and registration routes with institution-exclusive email validation (`@ulab.edu.bd`).

---

### 🎓 2. Student Portal

The Student Portal empowers enrolled ULAB students to accelerate their career trajectories, find guidance, and participate in campus life:

- **Student Dashboard (`/student`):**
  - High-level overview displaying active mentorship status, pending application alerts, and recent notice broadcasts.
  - Quick-action shortcuts to browse jobs, discover mentors, or connect with peers.
- **Smart Job Portal & External Ingestion (`/student/jobs`):**
  - **Internal University Listings:** Browse positions posted directly by verified alumni and faculty recruiters.
  - **Live Bangladesh Job Portal (Careerjet API):** Real-time aggregation of domestic professional listings filtered for ULAB graduates.
  - **Global Remote Opportunities (Himalayas API):** Real-time international remote positions across engineering, design, and marketing.
  - **Multi-parameter Search & Filters:** Search by title, company, skills, employment type (Full-time, Part-time, Internship), and location.
  - **Real-Time Applied Status Badges:** Job cards visibly indicate if an application has already been submitted with authoritative status badges (*Application Submitted*, *Under Review*, *Shortlisted*, *Interview Scheduled*, *Selected*, *Rejected*).
- **Job Details & Application Suite (`/student/jobs/[id]`):**
  - Comprehensive view of job specifications, responsibilities, salary ranges, and application deadlines.
  - **Hiring Capacity Visual Indicator:** Displays progress toward recruitment goals (e.g., `Selected: 1 / 3` or `Fully Filled`).
  - **1-Click Saved CV Reuse:** Instant application submission using pre-uploaded profile resumes without re-uploading files.
  - **Custom Pitch Note:** Optional personalized cover letter or pitch to the recruiter.
  - **Optional Multiple Project & Portfolio Links:** Dynamic interface allowing applicants to attach unlimited portfolio links (e.g., GitHub repositories, live demo sites, Behance portfolios) with project titles and safe HTTP/HTTPS validation.
  - **Duplicate Application Prevention:** Prevents double submissions at both the UI and database levels.
- **My Applications ATS Tracker (`/student/applications`):**
  - Real-time Applicant Tracking System (ATS) interface for students to monitor all submitted applications.
  - **Authoritative Status Progression:** Tracks status through 7 standardized stages: *Application Submitted*, *Under Review*, *Shortlisted*, *Interview Scheduled*, *Selected*, *Rejected*, and *Withdrawn*.
  - **Interview Details Viewer:** Displays scheduled interview date, time in Asia/Dhaka timezone, physical location or Google Meet/online link, and custom recruiter guidance notes.
  - **Self-Service Application Withdrawal:** Allows students to safely withdraw active applications during early stages.
- **Find a Mentor Directory (`/student/mentors`, `/student/mentorship`):**
  - Discover verified alumni and faculty mentors filtered by department, expertise topics, availability, and search keywords.
  - **Dynamic Action States:** Mentor cards display real-time relationship states: *"Request Mentor"*, *"Request Sent"* (pending with clock indicator), *"Mentorship Active"* (with direct link to active relationship), or *"Request Again"* (for concluded or re-requestable mentorships).
  - **Unlimited Mentor Requests:** Students can send requests to multiple distinct mentors without arbitrary limits, while duplicate pending requests to the same mentor are strictly prevented.
- **Mentor Public Profile & Booking Form (`/student/mentors/[id]`):**
  - In-depth profile displaying the mentor's current company, designation, bio, topics of expertise, preferred days, and available hours window.
  - Dedicated request form allowing students to specify topics (preset or custom), introductory message, career objectives, and session format (Online or In-Person).
- **My Mentors Relationship Center (`/student/my-mentors`):**
  - Dedicated workspace managing all active and historical mentorship connections.
  - Displays session timing, scheduled meetings, and quick links to open private mentorship chats.
  - **Safe Relationship Removal ("Remove from My Mentors"):** Modal allowing students to conclude an active mentorship, freeing up the mentor's mentee slot for other students while safely archiving historical records and chat messages.
  - **Re-Request Functionality:** Concluded or cancelled relationships can be re-initiated via the *"Request Again"* action.
- **Mentorship Feedback & Completion:** Submit reviews and ratings upon session completion.
- **Private Mentorship Messaging (`/student/mentorship-messages`):**
  - Dedicated 1-on-1 communication channel between student and mentor with session progress banners (e.g., *"1 Session Completed!"*).
- **Unified Messaging System (`/student/messages`):**
  - **1-on-1 Direct Chats:** Private end-to-end messaging with any student, alumni, or faculty member.
  - **Multi-Role Group Chats:** Create and join collaborative groups (e.g., study groups, capstone project teams, club channels).
  - **File & Media Attachments:** Share photos, PDF documents, lecture notes, and archives with inline photo previews and document download cards.
  - **Conversations Sidebar:** Tabs for All, Direct, and Groups with unread counters and relative timestamps.
- **Campus Networking & People Directory (`/student/people`, `/student/alumni`):**
  - Comprehensive directory of students and alumni with department, batch, and company filters.
  - **LinkedIn-Style Connection Lifecycle:** Send connection requests, view pending invitations, accept/decline incoming requests, and disconnect existing connections with confirmation safeguards.
- **Community Notice Board (`/student/board`):**
  - Real-time campus bulletin for institutional notices, career seminars, club events, and academic deadlines.
  - Read announcements, view author profile cards, access external registration links, and participate in discussion comments.
- **Student Profile & Privacy Management (`/student/profile`):**
  - Manage avatar, personal bio, academic details (Student ID, batch, graduation year), skills tags, and portfolio links.
  - **Saved CV Management:** Upload, preview, update, or remove default PDF resume for 1-click job applications.
  - **Granular Privacy Controls:** Toggle public/private visibility for phone number, WhatsApp, and Facebook profiles.
  - **Self-Service Account Deletion:** Permanent account removal with complete data purging upon user confirmation.
- **Tuitions & Tutoring Board (`/student/tuitions`):**
  - Browse available private tutoring and peer teaching opportunities across academic subjects.
- **Support Ticket Helpdesk (`/student/support`):**
  - Submit technical or account inquiries to platform administrators and track ticket resolution statuses.
- **In-App Notification Center (`/student/notifications`):**
  - Real-time notifications for application status updates, interview schedules, mentorship acceptances, new connection requests, and system announcements with direct link routing.

---

### 💼 3. Alumni Portal

The Alumni Portal enables ULAB graduates to hire campus talent, give back through mentorship, and stay connected with the university:

- **Alumni Dashboard (`/alumni`):**
  - Executive summary showing active job postings, candidate applications, active mentee counts, and recent community notices.
- **Job Posting & Recruitment Management (`/alumni/jobs`):**
  - View all posted vacancies with applicant counters, hiring status badges, and quick controls to edit or toggle postings.
- **Create & Edit Vacancies (`/alumni/jobs/new`, `/alumni/jobs/[id]/edit`):**
  - Post full-time jobs, internships, or contractual roles with rich descriptions, requirements, location, salary, and deadlines.
  - **Configurable Hiring Capacity ("Number of People to Hire"):** Specify the exact target number of candidates to hire for a role.
  - **Automatic Job Closure & Reopening:** Jobs automatically transition to *Fully Filled* and are hidden from open listings once the hiring target is reached, and automatically reopen if selected applicants change.
- **Job Poster Applicant Review Center (`/alumni/jobs/[id]`):**
  - Comprehensive candidate dossiers displaying applicant name, avatar, department, batch, student ID, and skills.
  - **CV Inspection:** One-click preview and download of applicant resume PDFs.
  - **Portfolio & Project Links Review:** Inspect candidate portfolio links with clickable, sanitized URLs.
  - **Status Management Pipeline:** Transition applicants through *Under Review*, *Shortlisted*, *Interview Scheduled*, *Selected*, and *Rejected*.
  - **Interview Scheduling System:**
    - Schedule interviews with mandatory date and time in **Asia/Dhaka timezone** (preventing past date selection).
    - Specify interview format (Physical or Online), venue location, or Google Meet / Zoom meeting link.
    - Provide custom preparation notes to the applicant.
    - Full support to reschedule or cancel scheduled interviews with automated candidate notification.
  - **Applicant Rejection Suite:**
    - Reject candidates with optional respectful feedback.
    - **Private Internal Hiring Notes:** Record confidential recruiter-only evaluation notes completely isolated from the student's payload.
  - **Candidate Selection & Capacity Sync:** Mark candidates as *Selected*, automatically incrementing the job's hired count and managing capacity limits.
- **Career Mentorship Center (`/alumni/mentorship`):**
  - **Availability Toggle:** Switch mentor status between `AVAILABLE` and `TEMPORARILY_UNAVAILABLE`.
  - **Mentee Capacity Limit:** Configure maximum concurrent mentees (e.g., 1 to 10 students).
  - **Offered Topics & Custom Skills:** Select preset mentorship domains or type custom specialization tags.
  - **Availability Scheduling:** Select preferred days of the week, preset time slots (Morning, Afternoon, Evening, Night), and custom availability windows (e.g., *"Fridays 4:00 PM - 6:00 PM BST"*).
  - **Mentorship Requests Pipeline:** Filter requests by status (*Pending*, *Active*, *Completed*, *Declined*, *Ended/Removed*), review student goals, and accept or decline requests.
  - **End Mentorship Relationship:** Conclude relationships with students to free up mentee slots while preserving historical records.
- **Mentorship Messaging (`/alumni/mentorship-messages`):** Dedicated chat channel for active career guidance.
- **Unified Messaging (`/alumni/messages`):** Full 1-on-1 direct messaging and group collaboration with attachment support.
- **Notice Board Publishing (`/alumni/board`):** Publish career seminars, industry insights, and hiring drives to the campus feed.
- **Networking Directory (`/alumni/people`):** Connect with fellow alumni, faculty members, and current students.
- **Alumni Profile & Verification (`/alumni/profile`):**
  - Manage professional credentials: degree, graduation year, current employer, job designation, industry, and portfolio links.
  - Display official Alumni Verified badge (upon automatic whitelist or administrator approval).
  - Privacy toggles for contact disclosure and self-service account deletion.
- **Tuition & Mentoring Posts (`/alumni/tuitions`):** Post tutoring opportunities or seek specialized assistance.
- **Support Desk & Notifications (`/alumni/support`, `/alumni/notifications`):** Platform assistance and real-time activity alerts.

---

### 👨‍🏫 4. Faculty / Teacher Portal

The Faculty Portal provides professors, lecturers, and departmental coordinators with tools for academic mentorship, research assistant recruitment, and campus communication:

- **Faculty Dashboard (`/teacher`):**
  - Overview of departmental notices, active TA/RA applicants, academic mentorship requests, and campus messages.
- **Research & Teaching Assistantship Recruiting (`/teacher/jobs`):**
  - Post openings for Teaching Assistants (TA), Research Assistants (RA), lab proctors, and student project contributors.
  - Configure hiring capacity limits, review student dossiers and CVs, schedule interviews, and select qualified candidates.
- **Academic Mentorship Management (`/teacher/mentorship`):**
  - Configure office hours, consultation availability, and preferred academic advising topics (e.g., Higher Studies, Research Methodology, Career Paths).
  - Accept, schedule, or decline student guidance appointments.
- **Mentorship Communication (`/teacher/mentorship-messages`):** Dedicated private channel for student academic consultations.
- **Unified Messaging System (`/teacher/messages`):**
  - Create course-wide or project-specific group chats with students and fellow researchers.
  - Share lecture slides, reading lists, research papers, and assignments as PDF/image attachments.
- **Official Campus Notice Board (`/teacher/board`):**
  - Publish authoritative departmental announcements, seminar schedules, guest lectures, and exam guidelines with attachment links.
- **Academic Networking (`/teacher/people`):** Connect with current students and track graduated alumni in industry.
- **Faculty Profile Management (`/teacher/profile`):**
  - Configure department, academic rank/designation, research interests, office hours, and privacy preferences.
- **Support Desk & Notifications (`/teacher/support`, `/teacher/notifications`):** In-app notification center and administrative support ticketing.

---

### 🛡️ 5. Admin Portal (Alumni Office & System Administration)

The Admin Portal provides institutional administrators with an enterprise-grade command center for platform governance, verification, and moderation:

- **Executive Analytics Dashboard (`/admin`):**
  - High-level KPIs: total registered users, verified alumni, active faculty, published jobs, total applications, active mentorship connections, and open support tickets.
  - Quick-action shortcuts to pending verification queues and urgent support tickets.
- **User Management & Moderation CRM (`/admin/users`):**
  - Search, filter, and inspect all registered accounts across all roles (`STUDENT`, `ALUMNI`, `TEACHER`, `ADMIN`).
  - **Account Verification:** Review, approve, or reject unverified alumni and faculty registrations.
  - **Disciplinary Moderation:** Issue formal warnings, suspend malicious users, remove offending content, or restore accounts with automated audit logging.
  - **Role Reassignment:** Safely change user roles when appropriate.
- **Admin Team & Super-Admin Management (`/admin/admins`):**
  - Manage administrative privileges, appoint new administrators, and review admin activity.
- **Alumni Directory Governance (`/admin/alumni`):**
  - Comprehensive database of all alumni profiles with verification toggles, graduation year filtering, and export capabilities.
- **Visual Analytics & Reporting (`/admin/analytics`):**
  - Interactive charts detailing user registration trajectories, departmental distributions, job placement statistics, and mentorship engagement rates.
- **Centralized ATS Applications Manager (`/admin/applications`):**
  - Cross-platform visibility into all job and internship applications across the university with status inspection.
- **Centralized Job Moderation (`/admin/jobs`):**
  - Review, edit, approve, or archive job postings across the entire platform.
- **Mentorship CRM & Moderation (`/admin/mentorship`):**
  - Monitor all university mentorship pairings, track session completion rates, review mentee feedback and ratings, and moderate reported reviews.
  - Toggle individual mentor availability across the platform.
- **Campus Notice Board Management (`/admin/notices`):**
  - Publish official university-wide broadcasts, pin priority alerts to the top of the feed, and moderate community posts.
- **Broadcast Notifications Engine (`/admin/notifications`):**
  - Dispatch real-time in-app announcements to targeted roles (e.g., all students, all alumni, or entire university).
- **User Report Resolution Center (`/admin/reports`):**
  - Review user-submitted reports regarding inappropriate messages, spam job postings, or abusive behavior with direct dismissal or sanction tools.
- **Support Ticket Helpdesk CRM (`/admin/tickets`):**
  - Manage support tickets submitted by any user.
  - Update ticket status (*Open*, *In Progress*, *Resolved*, *Closed*), assign priority levels, and record **Private Internal Staff Notes** isolated from the user's view.
- **Granular Platform Settings (`/admin/settings`):**
  - Configure 25+ system parameters across 7 distinct categories:
    1. **Registration & Onboarding:** Enable/disable new signups, toggle instant alumni verification, enforce email domains.
    2. **Mentorship Engine:** Toggle mentorship platform-wide, set default mentee limits, configure feedback requirements.
    3. **Career & Job Portal:** Moderate job postings before publication, toggle external job aggregations (Careerjet, Himalayas).
    4. **Security & Access Control:** Adjust session expiration durations, configure brute-force rate-limiting thresholds.
    5. **Notifications & Alerts:** Set global broadcast preferences and email delivery channels.
    6. **UI, Branding & Theme:** Customize institutional tagline, primary accent color, and theme defaults.
    7. **Email & SMTP Deliverability:** Configure SMTP server parameters and test email dispatches.
- **Security & Operational Audit Log Viewer (`/admin/audit-logs`):**
  - Immutable chronological log recording all administrative actions: user verifications, status changes, disciplinary sanctions, and system configuration modifications.
- **Bulk Directory Ingestion (Excel & CSV) via Whitelist Engine:**
  - Upload institutional graduation registers and faculty rosters (`.xlsx`, `.xls`, `.csv`).
  - Automatically reconciles existing pending registrations and enables instant zero-latency verification for future signups.

---

## 🔒 Shared Platform Features

The following capabilities are shared across all user roles, providing consistent security, usability, and design:

- **Institutional Authentication & Email Verification:**
  - Strict validation enforcing official ULAB institutional emails (`@ulab.edu.bd`).
  - Cryptographically generated 6-digit one-time password (OTP) delivery for both account registration and password recovery with 10-minute validity.
  - Passwords hashed using industry-standard `bcryptjs` with high-cost salt rounds.
  - Ephemeral JWT session tokens stored in secure, `HTTP-only`, `SameSite=Lax` cookies, shielding against XSS and token interception.
- **Role-Based Access Control (RBAC):**
  - Strict server-side route guards, layout interception, and server action ownership assertions preventing horizontal or vertical privilege escalation.
- **Unified Real-Time Messaging & Group Collaboration:**
  - Cross-role direct 1-on-1 chats and multi-member group conversations open to Students, Alumni, and Faculty.
  - Rich attachment engine supporting photo previews and document/PDF file download cards.
  - Member management: view roster, assign group admins, add or remove members, or leave groups.
- **Campus Networking & Connection System:**
  - Professional LinkedIn-style connection workflow: Send request, review pending invitations, accept, decline, and disconnect with safe confirmation modals.
- **Universal Interactive Profile Modals:**
  - Clicking any user's avatar or name across job applications, notices, or directories opens a comprehensive profile modal displaying academic credentials, current company, skills, and portfolio links.
- **Granular Privacy Controls:**
  - Every user controls the public visibility of their personal contact details (Phone, WhatsApp, Facebook) via independent database flags.
- **Notice Board Discussion & Announcements:**
  - Dynamic campus bulletin supporting rich announcement posts, author attribution cards, external attachment links, and nested comment threads.
- **Real-Time In-App Notification System:**
  - Instant notifications for application updates, interview bookings, mentorship approvals, connection requests, and system alerts with automatic unread tracking.
- **Dark / Light Theme System:**
  - Harmonious, high-contrast dark and light color palettes engineered for accessibility (WCAG AA/AAA) with zero-flicker inline theme initialization.
- **Progressive Web App (PWA) & Offline Resilience:**
  - Installable across iOS, Android, and desktop operating systems via Web App Manifest.
  - Service worker caching for static application assets and an elegant offline fallback page (`offline.html`) when connectivity is lost.

---

## 🏛️ System Architecture

### Multi-Tier Defense-in-Depth Security Model

```
┌────────────────────────────────────────────────────────┐
│               Client Presentation Layer                │
│    (Next.js 16 App Router · React 19 · PWA Shell)      │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP-only Signed Cookie (JWT)
                           ▼
┌────────────────────────────────────────────────────────┐
│              Edge & Middleware Route Guard             │
│        Verifies JWT integrity & Role claims            │
└──────────────────────────┬─────────────────────────────┘
                           │ Authenticated Request Context
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Server Actions Layer                   │
│   • Input sanitization via Zod                         │
│   • Session subject verification                       │
│   • Entity ownership checks (Job poster / Applicant)   │
│   • Approval state assertion (APPROVED status)         │
└──────────────────────────┬─────────────────────────────┘
                           │ Parameterized Object Queries
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Prisma ORM Layer                     │
│    Type-safe DB interactions with SQL injection defense │
└──────────────────────────┬─────────────────────────────┘
                           │ PostgreSQL Connection Pool
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Production Database                  │
│       Hosted PostgreSQL (Supabase / Neon Cloud)        │
└────────────────────────────────────────────────────────┘
```

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

### 3. Environment Variables Setup
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Generate an authentication secret:
```bash
openssl rand -hex 32
```
Configure `.env`:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your_generated_32_byte_secret"
CAREERJET_API_KEY="" # Optional: Required for live Careerjet BD listings
```

### 4. Database Initialization & Seeding
Initialize the database schema and populate demonstration accounts:
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

## 🧪 Testing & Verification

The project includes multi-layered verification suites ensuring security, type safety, and end-to-end functionality:

```bash
# 1. Run Production Readiness & Security Audit Suite (32 automated checks)
pnpm test

# 2. Run ATS Application Management Tests
node scripts/test-applications-ats.mjs

# 3. TypeScript Strict Type Checking
pnpm exec tsc --noEmit

# 4. Production Build Verification
pnpm build

# 5. Playwright End-to-End Suite
pnpm test:e2e
```

---

## 📦 Production Deployment

### 1. Database Configuration
For production, update the datasource provider in `prisma/schema.prisma` to PostgreSQL:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
Synchronize the production database schema:
```bash
pnpm db:push
```

### 2. Vercel Deployment
1. Import the repository `pavel-hasan-joy/ulab-setu` into Vercel.
2. Configure Environment Variables in the Vercel Dashboard:
   - `DATABASE_URL`: Hosted PostgreSQL connection string.
   - `AUTH_SECRET`: Strong random cryptographic key.
   - `CAREERJET_API_KEY`: API key for Bangladeshi job aggregation (optional).
3. Deploy! Vercel automatically builds and hosts the serverless application.

---

## 📄 License & Authorship

Developed with ❤️ by **[Pavel Hasan Joy](https://github.com/pavel-hasan-joy)** for the **University of Liberal Arts Bangladesh (ULAB — "University of the future")** community.
