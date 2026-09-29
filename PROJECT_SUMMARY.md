# ULAB Setu (সেতু) — Project Executive Summary & Architecture Report

> **Project Name:** ULAB Setu  
> **Tagline:** *Where ULAB students meet the alumni who came before them.*  
> **Target Institution:** University of Liberal Arts Bangladesh (ULAB) *(Brand-configurable for any institution)*  
> **Technology Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Prisma ORM, Three.js, Playwright  
> **Report Date:** September 2026  

---

## 1. Executive Summary & Purpose

**ULAB Setu** ("Setu" meaning *Bridge* in Bengali) is a comprehensive, institutional web application and Progressive Web App (PWA) designed to bridge the gap between university students, graduated alumni, and faculty members. 

In traditional university environments, students often face hurdles when transitioning into the job market, lacking direct mentorship and insider referrals. Meanwhile, alumni and teachers possess valuable career guidance, job circulars, and research opportunities with no centralized institutional channel to share them.

**Setu solves this by providing:**
1. **Verified Campus Networking:** Strict role-based verification (students restricted to official `@ulab.edu.bd` emails, alumni and teachers verified by the Alumni Office).
2. **Three-Tier Job Aggregation:** 
   - Internal alumni/faculty job postings (with internal employee referral flags).
   - Nationwide Bangladesh job listings (via Careerjet API / Bdjobs aggregation).
   - Global remote opportunities (via Himalayas API).
3. **Frictionless Mentorship & Direct Messaging:** Real-time 1-on-1 direct messaging without cumbersome connection approvals.
4. **Interactive Notice Board:** Centralized announcements for academic seminars, events, research calls, and scholarship opportunities.
5. **State-of-the-Art Visual Experience:** 3D Three.js particle morphing, interactive physics elements, dark/light theme switching, and seamless PWA mobile installation.

---

## 2. System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client / Browser / PWA                        │
│  - React 19 + TypeScript 5              - Three.js 3D WebGL Particle     │
│  - Tailwind CSS v4 + Dark/Light Theme    - Service Worker (Offline Cache)│
│  - Motion / Framer Motion Animations    - Responsive iOS/Android Install│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / HTTPS (SSR & Server Actions)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Next.js 16 Application Server                        │
│  - App Router Architecture (/student, /alumni, /teacher, /admin)        │
│  - Route Middleware / Guard (src/proxy.ts)                              │
│  - Server Actions (Auth, Jobs, Posts, Profile, Network)                 │
│  - Jose JWT Session Management (HTTP-only, Secure Cookies)             │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │ Prisma ORM                      │ REST Fetch
┌───────────────────▼──────────────┐   ┌──────────────▼───────────────────┐
│     Database Layer (Prisma)      │   │          External APIs           │
│ - SQLite (Local Dev / Tests)     │   │ - Careerjet API (Bangladesh Jobs)│
│ - PostgreSQL (Production Ready)  │   │ - Himalayas API (Remote Jobs)    │
└──────────────────────────────────┘   └──────────────────────────────────┘
```

### Detailed Technology Specifications:
- **Core Framework:** Next.js 16 (App Router, Server Actions, Server Components).
- **Frontend Engine:** React 19, TypeScript 5.
- **Styling & Design System:** Tailwind CSS v4 with custom design tokens (`@theme`), responsive layout, and dark/light mode toggle.
- **3D Graphics & Physics:** Three.js for interactive particle morphing (globe → graduation cap → bridge → briefcase) and spring physics interactions.
- **Database & Modeling:** Prisma ORM 6. SQLite for fast local development; production configured for cloud PostgreSQL (Supabase / Neon).
- **Authentication & Security:**
  - Password hashing with `bcryptjs`.
  - Stateless cryptographic token management with `jose` (JWT).
  - Role-based route guard in `src/proxy.ts` (restricts unauthorized cross-role access).
  - Data validation via `zod`.
- **Progressive Web App (PWA):**
  - Web App Manifest (`manifest.ts`) with standalone display mode and maskable icons.
  - Custom Service Worker (`public/sw.js`) caching core assets and serving an offline fallback (`public/offline.html`).
  - Native iOS "Add to Home Screen" and Android install prompts.
- **Testing & Quality Assurance:**
  - End-to-end automated testing suite with `playwright-core` driving headless Google Chrome.

---

## 3. User Roles & Access Control Matrix

The platform enforces four distinct user roles, each with specialized workflows and permissions:

| Feature / Permission | Student | Alumni (Approved) | Teacher (Approved) | Alumni Office (Admin) |
|---|:---:|:---:|:---:|:---:|
| **Account Registration** | Instant (`@ulab.edu.bd`) | Requires Admin Approval | Requires Admin Approval | Seeded / Superuser |
| **Browse Alumni Jobs** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Apply to Jobs** | ✅ (Profile Required) | ❌ | ❌ | ❌ |
| **Post Job Openings** | ❌ | ✅ (With Referral Tag) | ✅ (TA/RA/Dept Jobs) | ❌ |
| **Review & Shortlist Applicants** | ❌ | ✅ (Own Jobs) | ✅ (Own Jobs) | ❌ |
| **Direct Messaging** | ✅ Any User | ✅ Any User | ✅ Any User | ✅ Any User |
| **Post to Notice Board** | ❌ | ✅ | ✅ | ✅ |
| **Browse People Directory** | ✅ | ✅ | ✅ | ✅ |
| **Verify / Approve Accounts** | ❌ | ❌ | ❌ | ✅ Full Admin |

---

## 4. Key Functional Modules

### 4.1. Three-Tier Job Portal
1. **Alumni & Teacher Jobs:** Posted directly on Setu. Alumni can flag opportunities as *"Includes employee referral"*, boosting student response rates. Teachers can post department openings (Teaching Assistants, Research Assistants).
2. **Bangladesh Job Aggregation:** Integrated with the **Careerjet API** (`locale_code=en_BD`), pulling live job listings aggregated from Bdjobs and major national recruitment portals.
3. **Global Remote Jobs:** Integrated with the **Himalayas API**, allowing students to explore international remote entry-level software, design, and business roles.
4. **Direct External Portals:** Quick links to Bdjobs, Teletalk All Jobs (government circulars), LinkedIn Bangladesh, Skill.jobs, Chakri, BD Tech Jobs, etc.

### 4.2. Direct Networking & Messaging
- Anyone can search and discover alumni and faculty filtered by **Department**, **Company**, **Batch**, or **Skills**.
- Instant 1-on-1 messaging directly opens conversations with mentors without waiting for tedious handshake requests.

### 4.3. Notice Board & Campus Announcements
- Faculty and approved alumni can publish notices across 5 distinct categories:
  - 📢 **Notice:** General departmental updates and university alerts.
  - 📅 **Event:** Hackathons, seminars, alumni reunions, and networking meetups.
  - 🎓 **Scholarship:** Higher study opportunities and funding announcements.
  - 🔬 **Research:** Calls for research assistants and academic paper collaborations.
  - 💡 **Opportunity:** Competitions, workshops, and extracurricular programs.

### 4.4. Granular Contact & Privacy Controls
- Each user maintains granular control over their personal contact details:
  - **Phone Number** (Public / Private toggle)
  - **WhatsApp Link** (Public / Private toggle)
  - **Facebook Profile** (Public / Private toggle)
- Private details are strictly stripped from server responses, preventing data scraping while allowing public contact when desired.

### 4.5. High-Impact Visuals & Animations
- **Particle Morphing Story:** Three.js WebGL canvas displaying thousands of glowing particles that smoothly morph into a globe, graduation cap, bridge, and briefcase as the user scrolls.
- **Cinematic Anime Hero:** Atmospheric animated sky layers and subtle cloud depth.
- **Interactive Corner Balls:** Physics-based decorative spheres that bounce across the viewport on click.
- **Page-Pull Transition:** Fluid page entry animation on dashboard navigation.

---

## 5. Database Schema & Data Models

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
┌──────────────┐
│   Message    │
└──────────────┘
```

- **User:** Stores profile information, role (`STUDENT`, `ALUMNI`, `TEACHER`, `ADMIN`), approval status (`PENDING`, `APPROVED`), department, graduation year, current company, designation, bio, skills, and privacy flags.
- **Job:** Stores job title, company, location, employment type, category, description, salary, deadline, and referral status.
- **Application:** Unique combination of `jobId` and `studentId` tracking application status (`APPLIED`, `SHORTLISTED`, `REJECTED`) and student cover note.
- **Connection & Message:** Peer-to-peer connection records holding threaded chat history.
- **Post:** Announcements, events, scholarships, and research posts with title, body, links, and event dates.

---

## 6. Directory Structure Overview

```
setu/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login & Signup flows with role selection
│   │   ├── actions/            # Server Actions (auth, jobs, posts, network, profile)
│   │   ├── admin/              # Alumni office approval dashboard
│   │   ├── alumni/             # Alumni portal (job posting, applicant review, messages)
│   │   ├── student/            # Student portal (jobs, applications, board, people)
│   │   ├── teacher/            # Teacher portal (academic notices, TA jobs)
│   │   ├── globals.css         # Tailwind v4 theme tokens & styling
│   │   ├── layout.tsx          # Root layout with fonts, theme provider & PWA hooks
│   │   ├── manifest.ts         # PWA Web Manifest definition
│   │   └── page.tsx            # High-conversion Landing Page
│   ├── components/             # Reusable UI & Layout Components
│   │   ├── effects/            # 3D canvas, particle morphing, corner balls, page pull
│   │   ├── landing/            # Landing page sections, hero, stories, stats
│   │   ├── app-shell.tsx       # Standard sidebar/navigation wrapper
│   │   ├── chat-window.tsx     # Direct chat messaging UI
│   │   ├── job-cards.tsx       # Multi-tab job listing cards
│   │   ├── pwa.tsx             # Service worker registration & install prompts
│   │   └── ui.tsx              # Card, Button, Input, Modal, Badge primitives
│   ├── lib/                    # Core utilities & API clients
│   │   ├── auth.ts             # Password hashing & verification
│   │   ├── db.ts               # Prisma database client instance
│   │   ├── external-jobs.ts    # Careerjet & Himalayas API fetchers
│   │   ├── session.ts          # Jose JWT cookie encryption/decryption
│   │   └── site.ts             # Single source of truth for university branding
│   └── proxy.ts                # Route protection & role-based middleware
├── prisma/
│   ├── schema.prisma           # Prisma database schema definition
│   └── seed.ts                 # Realistic demo data seeder
├── public/                     # Static assets, logos, icons, sw.js, offline.html
├── e2e/                        # Playwright automated end-to-end smoke test suite
└── package.json                # Project dependencies and script definitions
```

---

## 7. How to Run Locally & Production Deployment

### Local Development Setup:
```bash
# 1. Install dependencies
pnpm install

# 2. Environment configuration
cp .env.example .env
# Set AUTH_SECRET (e.g. openssl rand -hex 32)
# Set CAREERJET_API_KEY (optional, displays mock data if empty)

# 3. Initialize & seed SQLite database
pnpm db:push
pnpm db:seed

# 4. Start local development server
pnpm dev
# Opens at http://localhost:3000
```

### Pre-configured Demo Accounts:
| Role | Email | Password | Status |
|---|---|---|---|
| **Student** | `student@ulab.edu.bd` | `password123` | Active |
| **Alumni** | `alumni1@example.com` ... `alumni6@example.com` | `password123` | Approved |
| **Alumni (Pending)** | `pending.alumni@example.com` | `password123` | Pending Admin Approval |
| **Teacher** | `teacher@ulab.edu.bd` | `password123` | Approved |
| **Admin** | `admin@ulab.edu.bd` | `password123` | Alumni Office Superuser |

### Production Deployment:
1. **Database:** Switch provider in `prisma/schema.prisma` from `sqlite` to `postgresql`. Point `DATABASE_URL` to Supabase, Neon, or Railway PostgreSQL.
2. **Push Schema:** Run `pnpm db:push` to apply tables to the live PostgreSQL instance.
3. **Hosting:** Deploy seamlessly to **Vercel** with environment variables: `DATABASE_URL`, `AUTH_SECRET`, and `CAREERJET_API_KEY`.
4. **HTTPS / PWA:** Deploying on HTTPS automatically activates full PWA installability on Android & iOS mobile devices.

---

## 8. Summary Conclusion

**ULAB Setu** is an exceptionally well-crafted, full-stack Next.js 16 application. It blends robust enterprise-level software engineering (strict role guards, server actions, relational database design, E2E testing) with a modern, high-engagement user experience (Three.js WebGL graphics, Framer Motion animations, dark mode, and PWA capabilities). It provides an all-in-one ecosystem for student employment, alumni mentorship, and university community building.
