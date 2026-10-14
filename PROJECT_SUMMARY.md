# ULAB Setu (সেতু) — Comprehensive Project Summary & Architecture Blueprint

> **Project Name:** ULAB Setu  
> **Tagline:** *Where ULAB students meet the alumni who came before them.*  
> **Target Institution:** University of Liberal Arts Bangladesh (ULAB) — *"University of the future"* *(Brand-configurable for any institution via `src/lib/site.ts`)*  
> **Technology Stack:** Next.js 16 (Turbopack, App Router), React 19, TypeScript 5, Tailwind CSS v4, Prisma ORM 6, PostgreSQL, Three.js, Playwright  
> **Live Production:** [https://ulab-setu.vercel.app](https://ulab-setu.vercel.app)  
> **Documentation Version:** 2.5 (Updated October 2026)  

---

## 1. Executive Summary & Purpose

**ULAB Setu** ("Setu" meaning *Bridge* in Bengali) is an institutional web platform and Progressive Web App (PWA) designed to bridge the gap between undergraduate students, graduated alumni, and university faculty members.

In traditional university setups, students often struggle to enter the competitive job market due to a lack of direct industry mentorship, practical guidance, and inside job referrals. At the same time, alumni working in top tech companies, corporate sectors, and NGOs want to give back to their alma mater by offering job circulars, referrals, and advice, but lack a dedicated, centralized institutional hub.

### Core Problems Solved by Setu:
1. **Verified Campus Networking:** Strict role-based verification ensuring only genuine university members can connect. Students register with official university emails (`@ulab.edu.bd`), while alumni and faculty are verified by the Alumni Office before they can publish posts or circulars.
2. **Interactive LinkedIn-Style Connections & Disconnect Management:** 
   - 4-state connection lifecycle: Send Request, Pending (with cancel/withdraw capability), Accept, and Decline.
   - **Disconnect / Remove Connection:** Connected members can disconnect at any time via a safe confirmation modal.
   - Dynamic invitation counter badges on sidebar navigation (`People` tab).
3. **Messenger-Style Unified Group & Direct Messaging System:**
   - **Open to All Roles:** Anyone (Students, Faculty, and Alumni) can create collaborative group chats directly from the Messages section.
   - **Dynamic Group Creation:** Set group name, topic/description, and invite peers, teachers, or alumni mentors with live multi-select search.
   - **Rich File & Media Attachments:** Share photos, lecture slides, syllabus PDFs, Word documents, and archives via an in-chat paperclip button with inline previews and direct download cards.
   - **Role Distinction:** Messages feature distinctive role badges (Faculty, Student, Alumni, Admin) with real-time sync.
   - **Group Controls:** Dedicated Group Info drawer with member roster, roles (Owner, Admin, Member), add members, remove member, leave group, and delete group controls.
   - **Unified Sidebar:** Filter tabs for **All**, **Direct (1-on-1)**, and **Groups** with activity timestamps and snippet previews.
4. **Three-Tier Job Aggregation:**
   - **Internal Opportunities:** Direct job and internship postings from verified alumni (featuring an *"Employee Referral Available"* tag) and faculty (Teaching Assistant and Research Assistant roles).
   - **Nationwide Bangladesh Jobs:** Integrated live job aggregator via the **Careerjet API** (`locale_code=en_BD`), bringing listings from major Bangladeshi recruitment portals.
   - **Global Remote Opportunities:** Integrated international remote jobs feed via the **Himalayas API**.
5. **Rich Candidate Dossiers & Profile Inspection:**
   - Interactive candidate cards displaying full profile information, skills badges, student ID, batch, department, and CV preview.
   - Global **Profile Modal** allowing one-click profile inspection from any directory card or job applicant listing.
6. **Campus Notice Board & Broadcasts:** Official alerts, hackathons, academic research calls, and foreign scholarship announcements categorized and easily searchable.
7. **Comprehensive Admin & Analytics Center:** Complete oversight covering account verifications, user role management, job moderation, university-wide broadcasts, live login activity tracking, and one-click CSV export for university administration.
8. **Resilient Architecture & Zero-Downtime Auto-Sync:**
   - Automated database schema synchronization (`npx prisma db push --skip-generate --accept-data-loss`) during build.
   - Defensive null-guarding and structured Next.js error boundary (`src/app/error.tsx`) ensuring zero runtime crashes.
9. **State-of-the-Art Visual Experience:** 3D Three.js particle morphing, physics-based interactive elements, dark/light theme switching, and standalone PWA mobile installation.

---

## 2. System Architecture & Tech Stack

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                            Client Layer (Browser & PWA)                       │
│  - React 19 & TypeScript 5                  - Three.js 3D WebGL Particle      │
│  - Tailwind CSS v4 Design Tokens            - Service Worker (Offline Cache)  │
│  - Motion Transitions & Micro-Interactions  - Standalone PWA (iOS & Android)  │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │ HTTPS (Server-Side Rendering & Server Actions)
┌───────────────────────────────────────▼───────────────────────────────────────┐
│                      Next.js 16 Full-Stack Application Server                 │
│  - App Router Structure (/student, /alumni, /teacher, /admin)                 │
│  - Edge Route Middleware & Role Guard (src/proxy.ts)                          │
│  - Secure Server Actions (auth, admin, jobs, posts, network, group, profile)  │
│  - Jose JWT Stateless Session Management (HTTP-only, Secure Cookies)          │
│  - Global Error Boundary (src/app/error.tsx)                                  │
└───────────────────────┬───────────────────────────────────────┬───────────────┘
                        │ Prisma ORM 6                          │ External REST API
┌───────────────────────▼───────────────┐       ┌───────────────▼───────────────┐
│           Database Layer              │       │         External APIs         │
│ - PostgreSQL (Production Cloud DB)    │       │ - Careerjet API (BD Jobs)     │
│ - Zero-Downtime Auto Schema Sync      │       │ - Himalayas API (Remote Jobs) │
└───────────────────────────────────────┘       └───────────────────────────────┘
```

### Detailed Technology Specifications:
- **Framework:** Next.js 16 with Turbopack, App Router, React Server Components (RSC), and Server Actions.
- **Frontend Engine:** React 19 and TypeScript 5.
- **Styling & Design System:** Tailwind CSS v4 using modern `@theme` custom tokens (ULAB blue `#003366`, gold `#cda434`, lilac, sage, and dark mode palette).
- **3D Graphics & Physics Engine:** Three.js for interactive particle morphing (globe → graduation cap → bridge → briefcase) and spring physics interactions.
- **Database & Object-Relational Mapping (ORM):** Prisma ORM 6 connecting to cloud PostgreSQL (Neon / Supabase) in production.
- **Automated Database Synchronization:** `scripts/db-sync.mjs` executes automatic schema pushes (`--accept-data-loss`) and pre-seeds essential demo accounts and sample groups.
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
| **Apply to Jobs with Dossier** | ✅ (Profile Required) | ❌ | ❌ | ❌ |
| **Post Job Circulars** | ❌ | ✅ (With Referral Tag) | ✅ (TA/RA Openings) | ❌ |
| **Review Applicants & CVs** | ❌ | ✅ (Own Postings) | ✅ (Own Postings) | ❌ |
| **Post Tuition Requirements** | ✅ Open to All | ✅ Open to All | ✅ Open to All | ✅ Open to All |
| **Apply for Tuitions as Tutor**| ✅ Full Access | ✅ Full Access | ❌ | ❌ |
| **Manage Tuition Applicants**  | ✅ (Own Postings) | ✅ (Own Postings) | ✅ (Own Postings) | ✅ (All Postings) |
| **1-on-1 Direct Messaging** | ✅ Any User | ✅ Any User | ✅ Any User | ✅ Any User |
| **Create Messenger Groups** | ✅ Open to All | ✅ Open to All | ✅ Open to All | ✅ Open to All |
| **Attach Files/PDFs in Chat** | ✅ | ✅ | ✅ | ✅ |
| **Group Admin & Roster Mgmt** | ✅ (If Creator/Admin) | ✅ (If Creator/Admin) | ✅ (If Creator/Admin) | ✅ (If Creator/Admin) |
| **Send/Receive Connection Requests** | ✅ | ✅ | ✅ | ✅ |
| **Disconnect Connections** | ✅ | ✅ | ✅ | ✅ |
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
4. **Candidate Dossiers:** Employers inspect full applicant credentials (Student ID, Batch, Department, CGPA, verified skills tags, and embedded CV preview) with one-click status transitions (*Applied*, *Shortlisted*, *Rejected*).

### 4.2. Community Tuition Portal (`/tuitions`)
A dedicated home & online tutoring marketplace designed specifically for the ULAB community:
- **Universal Posting Rights:** Students, alumni, and faculty can all publish tuition requirements for their siblings, children, or neighborhood students.
- **Bangladesh Standard Tutoring Specifications:**
  - **Class & Grade:** Class 1-5, Class 6-8, Class 9-10 (SSC), Class 11-12 (HSC), O-Level, A-Level, University/Coding, Admission Prep, Spoken English/IELTS.
  - **Medium & Curriculum:** Bangla Medium, English Version (National Curriculum), English Medium (Cambridge/Edexcel), Madrasah.
  - **Tutoring Modes:** Home Tutoring (in-person), Online Tutoring (Google Meet/Zoom), Tutor's Place.
  - **Location & Schedule:** Precise area (e.g. Dhanmondi, Mohammadpur, Mirpur), days per week (2/3/4/5 days or weekend only), and monthly salary budget.
  - **Gender Preferences:** Student gender and preferred tutor gender (*Male Preferred*, *Female Preferred*, *Any*).
- **Application & Candidate Management:**
  - Students apply with their expected monthly remuneration, past tutoring experience, weekly availability, and a cover note.
  - Posters review applicants, inspect student profiles, initiate direct in-app messaging, and manage statuses (*Shortlisted*, *Selected / Hired*, *Rejected*).

### 4.3. Messenger-Style Unified Group & Direct Messaging System
- **Unified Sidebar Interface:** Filter tabs for **All**, **Direct (1-on-1)**, and **Groups** with real-time last message previews, member counters, and relative timestamps.
- **Group Creation:** Set group name, optional topic/description, and select members from students, alumni, and faculty with live search.
- **Real-Time Group Chat Feed:** WhatsApp/Messenger style bubbles with sender avatars, names, and distinctive role badges (*Faculty*, *Student*, *Alumni*, *Admin*).
- **Rich Media & Document Attachments:** In-chat paperclip button to upload photos, lecture slides, syllabus PDFs, and archive files (up to 8MB) with inline preview and one-click download cards.
- **Group Info & Roster Drawer:**
  - View group details, creation date, and creator.
  - Member list with roles (*Owner*, *Admin*, *Member*).
  - Add new members from approved university directory.
  - Admin controls to remove members or delete the group.
  - Member control to leave group at any time.

### 4.4. Interactive Networking & Disconnect Management
- Full connection request workflow (Send Request, Pending with withdraw button, Accept, Decline).
- Disconnect option with confirmation modal to manage professional boundaries.
- Live badge counters displaying pending connection invitations in the sidebar.

### 4.5. Campus Notice Board & Broadcasts
Categorized announcements allow students to filter precisely what they need:
- 📢 **Notice:** General university administrative and departmental announcements.
- 📅 **Event:** Seminars, tech fests, alumni reunions, and career fairs.
- 🎓 **Scholarship:** Higher study funding and graduate scholarship opportunities abroad.
- 🔬 **Research:** Academic calls for papers, research assistant openings, and lab projects.
- 💡 **Opportunity:** Competitions, workshops, and student development programs.

### 4.6. Student Profiles & Granular Privacy Protection
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

### 6.1. Student User Manual (`/student`)
1. **Registration & Login:**
   - Sign up with your official `@ulab.edu.bd` email address. Registration is instant.
2. **Finding & Applying for Jobs (`/student/jobs`):**
   - Browse campus jobs with referral badges, Bangladesh jobs via Careerjet, and global remote jobs via Himalayas.
   - Click "Apply Now", submit your portfolio and notes, and track statuses in "My Applications".
3. **Collaborative Messenger Group Chats (`/student/messages`):**
   - Click **"+ New Group"** at the top of the sidebar.
   - Enter group name (e.g. `CSE 311 Study Team`), description, and select peers, teachers, or alumni.
   - Use the paperclip icon in chat to share lecture notes, PDF study guides, screenshots, and assignments.
   - View members, invite more participants, or leave the group via the Info icon.
4. **Connecting & Networking (`/student/people`):**
   - Search peers and alumni by department, batch, or company.
   - Send connection requests, withdraw pending invitations, or disconnect if needed.

### 6.2. Alumni User Manual (`/alumni`)
1. **Posting Opportunities (`/alumni/jobs`):**
   - Post vacancies with job title, company, salary, deadline, and referral willingness.
2. **Reviewing Candidate Dossiers (`/alumni/jobs/[id]`):**
   - Inspect applicants' full credentials, student ID, CGPA, and preview submitted CVs.
   - Update candidate statuses directly to Shortlisted or Rejected.
3. **Forming Project & Mentorship Groups (`/alumni/messages`):**
   - Create interest or project groups connecting current students with fellow alumni.
   - Share industry interview questions, slides, and sample project repositories in group chats.

### 6.3. Teacher / Faculty User Manual (`/teacher`)
1. **Academic Hiring & TA Opportunities (`/teacher/jobs`):**
   - Post Teaching Assistant (TA) and Research Assistant (RA) circulars.
   - Review top student applicants and select candidates.
2. **Course & Research Group Chats (`/teacher/messages`):**
   - Create study or research project groups for any course section.
   - Share lecture slides, syllabus PDFs, and announcements directly inside the group feed.
   - Manage enrolled members, assign group admins, or remove participants.

### 6.4. Admin (Alumni Relations Office) User Manual (`/admin`)
1. **Verification Queue:** Review pending alumni and faculty accounts and approve or reject submissions.
2. **User Governance:** Filter user directories, edit user roles, suspend accounts, and export CSV reports.
3. **Job & Notice Oversight:** Moderate published job circulars and broadcast official alerts.
4. **Analytics & Login Audit:** Monitor active logins, department distributions, and export system audit logs.

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
│ (1-on-1 DM)  │                        │ (Audit Logs) │
└──────────────┘                        └──────────────┘
       │
       ├─────────────────────────────────────────┐
       │ 1:N (creator)                           │ 1:N (member)
       ▼                                         ▼
┌──────────────┐          1:N           ┌──────────────┐
│    Group     ├───────────────────────►│ GroupMember  │
└──────┬───────┘                        └──────────────┘
       │ 1:N
       ▼
┌──────────────┐
│ GroupMessage │ (With Attachment URL, Name, Size, Type)
└──────────────┘
```

### Models & Field Reference:
1. **User:** `id`, `name`, `email`, `passwordHash`, `role` (STUDENT | ALUMNI | TEACHER | ADMIN), `status` (PENDING | APPROVED | REJECTED), `department`, `studentId`, `batch`, `graduationYear`, `company`, `designation`, `location`, `bio`, `skills`, `linkedin`, `github`, `image`, `phone`, `phonePublic`, `whatsapp`, `whatsappPublic`, `facebook`, `facebookPublic`, `isPrivate`, `createdAt`, `lastLoginAt`.
2. **Job:** `id`, `title`, `company`, `location`, `type` (Full-time | Part-time | Internship | Contract), `category`, `description`, `requirements`, `salary`, `deadline`, `referral` (boolean), `active` (boolean), `createdAt`, `postedById`.
3. **Application:** `id`, `note`, `status` (APPLIED | SHORTLISTED | REJECTED), `createdAt`, `jobId`, `studentId`. Unique on `[jobId, studentId]`.
4. **Connection:** `id`, `note`, `status` (PENDING | ACCEPTED | DECLINED), `createdAt`, `fromId`, `toId`.
5. **Message:** `id`, `body`, `createdAt`, `connectionId`, `senderId`.
6. **Group:** `id`, `name`, `description`, `image`, `createdAt`, `createdById`.
7. **GroupMember:** `id`, `groupId`, `userId`, `role` (ADMIN | MEMBER), `joinedAt`. Unique on `[groupId, userId]`.
8. **GroupMessage:** `id`, `groupId`, `senderId`, `body`, `attachmentUrl`, `attachmentName`, `attachmentSize`, `attachmentType`, `createdAt`.
9. **Post:** `id`, `kind` (Notice | Event | Scholarship | Research | Opportunity), `title`, `body`, `link`, `eventDate`, `createdAt`, `authorId`.
10. **LoginLog:** `id`, `userId`, `email`, `name`, `role`, `createdAt`.

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
│   │   │   ├── group.ts          # Messenger group creation, messaging & member management
│   │   │   ├── jobs.ts           # Job creation, applications & status updates
│   │   │   ├── network.ts        # Connections, disconnect & direct messaging actions
│   │   │   ├── posts.ts          # Community posts & announcements actions
│   │   │   └── profile.ts        # Profile editing & contact privacy updates
│   │   ├── admin/                # Admin Panel
│   │   │   ├── analytics/        # Platform analytics & authentication logs
│   │   │   ├── jobs/             # Job & internship moderation page
│   │   │   ├── notices/          # Notices & community broadcast management
│   │   │   ├── users/            # Users directory, role editing & CSV export
│   │   │   ├── layout.tsx        # Admin navigation shell (5 unified tabs)
│   │   │   └── page.tsx          # Account approvals & verification page
│   │   ├── alumni/               # Alumni portal (jobs, applicants, messages, people)
│   │   ├── student/              # Student portal (jobs, applications, board, messages, people)
│   │   ├── teacher/              # Teacher portal (department posts, TA jobs, messages, people)
│   │   ├── error.tsx             # Global resilient error boundary
│   │   ├── globals.css           # Tailwind v4 theme definitions
│   │   ├── layout.tsx            # Root layout with ThemeProvider & PWA integration
│   │   ├── manifest.ts           # PWA Manifest definition
│   │   └── page.tsx              # Cinematic 3D landing page
│   ├── components/               # UI Component Library
│   │   ├── create-group-modal.tsx   # Messenger group creation modal
│   │   ├── group-chat-window.tsx    # Messenger-style group chat with attachments
│   │   ├── group-info-modal.tsx     # Group roster, roles & management drawer
│   │   ├── messages-client.tsx      # Unified sidebar & multi-tab chat client
│   │   ├── messages-view.tsx        # Server Component for connections & groups
│   │   ├── chat-window.tsx          # 1-on-1 direct messaging UI
│   │   ├── connect-button.tsx       # LinkedIn-style connect & disconnect button
│   │   ├── profile-modal.tsx        # Global applicant & member dossier preview
│   │   ├── app-shell.tsx            # Unified desktop sidebar & mobile bottom navigation
│   │   ├── effects/                 # Three.js particle morphing, physics canvas
│   │   ├── landing/                 # Hero, stats, stories & features
│   │   ├── pwa.tsx                  # Service worker hooks & install prompt
│   │   └── ui.tsx                   # Design system primitives (Button, Card, Badge, Avatar)
│   ├── lib/                      # Core Utilities
│   │   ├── auth.ts               # Session verification & role guards
│   │   ├── db.ts                 # Prisma Client singleton
│   │   ├── external-jobs.ts      # Careerjet & Himalayas API connectors
│   │   ├── session.ts            # Jose JWT encryption & token management
│   │   └── site.ts               # Centralized institutional branding configuration
│   └── proxy.ts                  # Edge route protection & role redirection
├── scripts/
│   └── db-sync.mjs               # Zero-downtime schema push (--accept-data-loss) & data seeder
├── prisma/
│   ├── schema.prisma             # Relational database schema
│   └── seed.ts                   # Realistic demo dataset
├── public/                       # Static branding, logos, sw.js, offline.html
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
  "build": "prisma generate && node scripts/db-sync.mjs && next build",
  "start": "next start"
}
```
*Running `node scripts/db-sync.mjs` executes `prisma db push --skip-generate --accept-data-loss` on live PostgreSQL databases (Vercel/Neon/Supabase) ensuring that schema changes, table drops, and new models (`Group`, `GroupMember`, `GroupMessage`) are synchronized with zero manual downtime.*

### Pre-Configured Demo Credentials:
| Account Role | Full Name | Email Address | Password | Access Level |
|---|---|---|---|---|
| **Student** | Farhana Akter | `student@ulab.edu.bd` | `password123` | Student Workspace (`/student`) |
| **Teacher** | Dr. Kamrul Karim | `teacher@ulab.edu.bd` | `password123` | Faculty Workspace (`/teacher`) |
| **Alumni** | Tanvir Hasan | `alumni@ulab.edu.bd` | `password123` | Approved Alumni Workspace (`/alumni`) |
| **Admin** | Alumni Office | `admin@ulab.edu.bd` | `password123` | Full Admin Center (`/admin`) |

#### Demonstration Messenger Group:
- **Group Name:** `ULAB CSE Tech & Project Hub`
- **Enrolled Members:** Dr. Kamrul Karim (Faculty Admin), Farhana Akter (Student Member), Tanvir Hasan (Alumni Member).
- **Features:** Real-time multi-role discussion feed, role badges, attachment sharing, and group roster controls.

---

## 10. Conclusion & Project Value

**ULAB Setu** delivers an end-to-end institutional solution combining high performance, strict institutional security, dynamic modern aesthetics, collaborative messenger group chats, and administrative governance. By bridging alumni career insights directly to students while providing faculty and administrators with comprehensive oversight, Setu establishes an enduring digital foundation for the entire university community.
