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

## 6. User Manual (How to Use Setu — Step-by-Step Guide)

This section provides a complete, role-by-role operational guide for using the ULAB Setu platform. 

### 🎬 Interactive Video Demonstration & Walkthrough
A complete, 60 FPS live video walkthrough is available locally and deployed on the platform:
- **Primary Video Walkthrough:** [`/how_to_use.webm`](file:///c:/Users/mdpav/Downloads/joy/joy/setu/public/how_to_use.webm) *(High-definition full walkthrough covering Student, Alumni, Teacher, and Admin sections)*
- **Admin Control Center Deep Dive:** [`/how-to-use/how_to_use_admin_panel.webm`](file:///c:/Users/mdpav/Downloads/joy/joy/setu/public/how-to-use/how_to_use_admin_panel.webm) *(Walkthrough of approvals, user role management, job moderation, broadcasts, and analytics)*
- **All Sections Complete Tour:** [`/how-to-use/how_to_use_all_sections.webm`](file:///c:/Users/mdpav/Downloads/joy/joy/setu/public/how-to-use/how_to_use_all_sections.webm)

---

### 6.1. Student User Manual (`/student`)

1. **Account Registration & Login:**
   - Navigate to `/signup` or click **"Join the Network"** on the landing page.
   - Select the **Student** role.
   - Enter your official university email ending with `@ulab.edu.bd` (e.g., `student@ulab.edu.bd`).
   - Enter your full name, student ID, department, graduation batch, and a strong password.
   - Registration for students is instant—no manual approval required. Log in immediately at `/login`.
2. **Navigating the Student Dashboard:**
   - View live campus statistics (total alumni connected, active job circulars, pending applications).
   - Check out recommended alumni from your own academic department.
3. **Finding & Applying for Jobs (`/student/jobs`):**
   - **Internal Opportunities (Campus Network):** View job and internship circulars posted directly by ULAB alumni and faculty. Look out for the green badge **"Employee Referral Available"**—these alumni can refer your resume internally at their company.
   - **Bangladesh Jobs (Careerjet):** Filter live job listings across Bangladesh from leading job portals.
   - **Global Remote Jobs (Himalayas):** Access verified international remote engineering, design, and business jobs.
   - **Applying to a Position:** Click **"Apply Now"** on any internal job card. Add an optional introduction note highlighting your skills, and submit.
   - **Tracking Applications:** Switch to the **"My Applications"** tab to monitor application statuses (*Applied*, *Shortlisted*, or *Rejected*).
4. **Mentorship & Alumni Directory (`/student/network`):**
   - Search the directory by alumni name, company (e.g., Google, bKash, BAT, Brain Station 23), department, graduation year, or technical skills (e.g., Python, React, SEO).
   - Click on an alumnus's profile to view their professional journey, bio, and public social links.
   - Click **"Connect"** or **"Send Message"** to initiate a direct 1-on-1 chat for career guidance, CV feedback, or interview preparation.
5. **Campus Notice Board & Opportunities (`/student/board`):**
   - Read categorized university notices: *Notices*, *Events*, *Scholarships*, *Research Calls*, and *Competitions*.
   - Filter by category or search by keywords to stay ahead of upcoming deadlines.
6. **Profile Customization & Contact Privacy (`/student/profile`):**
   - Update your bio, skills tags, portfolio link, and LinkedIn profile.
   - **Granular Privacy Controls:** Choose whether your phone number, WhatsApp, and Facebook profile are visible to other members using the privacy toggle switches (*Public* / *Private*).

---

### 6.2. Alumni User Manual (`/alumni`)

1. **Registration & Alumni Verification:**
   - Register at `/signup` and select the **Alumni** role.
   - Provide your graduation year, department, current company, designation, and LinkedIn profile.
   - For campus safety and verified credentials, alumni accounts are placed in *Pending* status until verified by the ULAB Alumni Relations Office. Once approved, you gain full access to the Alumni portal.
2. **Posting Jobs & Internships (`/alumni/jobs`):**
   - Click **"Post a Job"** to open the job submission modal.
   - Enter Job Title, Company Name, Location, Employment Type (Full-time, Part-time, Internship), Salary details, Description, and Deadline.
   - **Referral Toggle:** Tick the checkbox **"I can provide an internal employee referral"** if you are willing to refer qualified students within your organization.
   - Click **"Publish Job"** to instantly broadcast it to all students.
3. **Reviewing & Shortlisting Applicants (`/alumni/applicants`):**
   - Open your posted circulars to view all candidate submissions.
   - Read candidate cover notes, check their student profiles, portfolios, and skills.
   - Update status to **Shortlisted** or **Rejected** so students receive immediate feedback.
4. **Notice Board Contributions (`/alumni/board`):**
   - Post industry events, hiring hackathons, skill-building webinars, or general career advice directly to the campus notice board.
5. **Mentoring Juniors via Direct Chat (`/alumni/messages`):**
   - Receive inquiries and connection requests from ambitious juniors.
   - Share real-world industry perspectives, review resumes, and recommend relevant career paths.

---

### 6.3. Teacher / Faculty User Manual (`/teacher`)

1. **Registration & Departmental Verification:**
   - Register at `/signup` with your academic designation and university email.
   - Faculty accounts are verified by university administrators.
2. **Posting Academic Openings (`/teacher/jobs`):**
   - Post campus opportunities such as **Teaching Assistant (TA)**, **Research Assistant (RA)**, or Lab Proctor roles.
   - Specify academic prerequisites (e.g., minimum CGPA, specific course completed, Python/SPSS skills).
   - Review student applicants directly from your dashboard and select top performers.
3. **Publishing Research Calls & Academic Notices (`/teacher/board`):**
   - Broadcast research lab openings, international paper submission deadlines, funded projects, and departmental seminar schedules.
4. **Connecting with Alumni for Industry Collabs:**
   - Search the alumni directory to invite industry-leading graduates as guest speakers or advisory committee members.

---

### 6.4. Admin (Alumni Relations Office) User Manual (`/admin`)

1. **Accessing the Admin Control Center:**
   - Log in with institutional admin credentials (e.g., `admin@ulab.edu.bd`).
   - Admins are automatically directed to the 5-tab unified control center.
2. **Verifying New Registrations (`/admin`):**
   - Review pending registrations for Alumni and Teachers.
   - Verify Student IDs, graduation records, and departmental affiliations.
   - Click **"Approve"** to activate an account or **"Reject"** to deny unverified submissions.
3. **Users Directory & Access Controls (`/admin/users`):**
   - **Live Search & Filter:** Filter users by name, email, student ID, department, batch, or company.
   - **Role Assignment:** Change roles between Student, Alumni, Teacher, or Admin instantly.
   - **Account Actions:** Approve, suspend, or delete accounts (with self-deletion protection).
   - **Export CSV:** Click **"Export Users CSV"** to generate a complete spreadsheet of all registered members.
4. **Job & Internship Moderation (`/admin/jobs`):**
   - Inspect all internal circulars, their posters, categories, and applicant tallies.
   - Toggle postings between **Active** and **Closed**.
   - Delete inappropriate or expired listings with full database safety.
   - Click **"Export Jobs CSV"** to export placement and vacancy statistics.
5. **Notices & University Broadcasts (`/admin/notices`):**
   - Click **"Create Notice"** to open the broadcast modal.
   - Choose category (*Notice*, *Event*, *Scholarship*, *Research*, *Opportunity*), add title, body, optional link, and date.
   - Click **"Publish Broadcast"** to display it across all student and alumni dashboards.
   - Moderate or delete inappropriate community notices.
6. **Platform Analytics & Login Audit (`/admin/analytics`):**
   - Track key metrics: Total Users, Role Breakdown, Pending Verifications.
   - Monitor engagement: Jobs Posted, Student Applications, Connections, Broadcasts.
   - Analyze 7-Day Login Trends visual chart and Department Breakdown percentages.
   - Review the Real-Time Authentication Audit Log (user email, role, login timestamp).
   - Click **"Export Audit CSV"** for institutional governance records.

---

## 7. Database Schema & Data Models

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

## 8. Directory & File Structure

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
├── public/                       # Static branding, logos, sw.js, offline.html, how_to_use.webm
├── e2e/                          # Playwright automated test suite
└── package.json                  # Dependencies & scripts
```

---

## 9. Deployment & CI/CD Workflow

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

## 10. Conclusion & Project Value

**ULAB Setu** delivers an end-to-end institutional solution combining high performance, strict institutional security, dynamic modern aesthetics, and administrative governance. By bridging alumni career insights directly to students while providing faculty and administrators with comprehensive oversight, Setu establishes an enduring digital foundation for the entire university community.

