# ULAB Setu Custom Integrated CMS — Complete Architectural & Operational Guide

## 1. System Overview & Architecture

The ULAB Setu Content Management System (CMS) is an enterprise-grade, integrated content lifecycle solution built natively inside the existing Next.js 16 application. Unlike external decoupled headless CMS solutions (such as Strapi, WordPress, or Payload), ULAB Setu CMS operates directly on top of the university platform's existing database, session model, security perimeter, and UI design tokens.

### Key Architectural Tenets:
- **Zero Schema Conflicts:** Reuses Prisma ORM with strict referential integrity.
- **Serverless & Ephemeral-Safe:** Operates seamlessly on Vercel without local filesystem data loss.
- **Deny-by-Default Access Model:** CMS capabilities are isolated from standard application roles (Student, Alumni, Faculty, Admin).
- **Immutable Revision Ledger:** Restorations always spawn new forward revisions, preventing accidental or malicious overwrite of audit history.
- **Strict Content Isolation:** Public visitors and search indexers are cryptographically prevented from viewing drafts, scheduled, or archived content.

---

## 2. CMS Roles & Permission Matrix

The CMS implements five fine-grained editorial roles (`CmsRole`):

| CMS Role | Primary Responsibility | Permissions & Capabilities |
| :--- | :--- | :--- |
| **CMS Administrator (`CMS_ADMIN`)** | Executive governance & platform administration | Full CMS capabilities: Create, edit, delete, review, approve, publish, schedule, unpublish, archive, restore revisions, manage navigation, assign CMS user roles. |
| **Content Editor (`CONTENT_EDITOR`)** | Core institutional authoring | Create and edit content across all 8 polymorphic types; submit items to review queue; view version history; restore past revisions. |
| **Content Reviewer (`CONTENT_REVIEWER`)** | Editorial gatekeeper | Review submitted content; provide inline review feedback notes; request changes from author; approve content for publication. |
| **Publisher (`PUBLISHER`)** | Production release manager | Direct publication of approved items; automated scheduling calendar management; unpublishing live content; archiving retired content. |
| **Contributor (`CONTRIBUTOR`)** | Assigned draft author | Create assigned items; edit own drafts; submit own drafts for review. Locked from editing during review. |

---

## 3. The 8-Stage Content Lifecycle

Every CMS-managed entity strictly transitions through an eight-state state machine:

```
[DRAFT] ------------> [IN_REVIEW] <------------> [CHANGES_REQUESTED]
                          |
                          v
                      [APPROVED]
                      /        \
                     v          v
               [SCHEDULED]   [PUBLISHED]
                    |             |
                    v             v
               [PUBLISHED]   [UNPUBLISHED]
                                  |
                                  v
                              [ARCHIVED] ----> [DRAFT] (Restore)
```

1. **`DRAFT`**: Work-in-progress content visible only to the author and editors.
2. **`IN_REVIEW`**: Submitted for review. The author is locked from making further edits until feedback is returned.
3. **`CHANGES_REQUESTED`**: Returned to the author with reviewer feedback. The author can edit and resubmit.
4. **`APPROVED`**: Editorial review passed. The item is now eligible for immediate publication or future scheduling.
5. **`SCHEDULED`**: Queued for automated publication at a specified future timestamp (Asia/Dhaka UTC+6).
6. **`PUBLISHED`**: Live on the public website and included in dynamic sitemaps.
7. **`UNPUBLISHED`**: Taken down from live display. Excluded from public visitors and search indexers.
8. **`ARCHIVED`**: Retired historical record. Can be restored back to `DRAFT`.

---

## 4. Supported Polymorphic Content Types

The CMS supports eight native content types:

1. **`PAGE`**: Static institutional pages (e.g. `/p/about-ulab-setu`, `/p/how-it-works`).
2. **`HOMEPAGE_SECTION`**: Dynamic homepage content (hero, step cards, quote blocks, CTAs).
3. **`NEWS`**: University press releases, official notices, and campus coverage (`/news/[slug]`).
4. **`ANNOUNCEMENT`**: Urgent circulars, academic calendar alerts, and deadlines.
5. **`EVENT`**: Workshops, reunions, and hackathons with RSVP links and calendar dates (`/events/[slug]`).
6. **`FAQ`**: Category-based student, faculty, and alumni questions (`/faqs`).
7. **`ALUMNI_STORY`**: Graduate spotlights with mandatory alumni consent (`/stories`).
8. **`RESOURCE`**: Downloadable forms, guides, and syllabus attachments (`/resources`).

---

## 5. Centralized Media Library & Upload Security

- **Route:** `/admin/cms/media`
- **Binary Signature Validation:** Validates file magic bytes (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, PDF: `%PDF`). Blocks malicious executables (`.exe`, `.sh`, `.html`) masquerading as media.
- **Size Limitation:** 5MB per asset.
- **Reference Tracking:** Deletion is blocked if the asset is currently referenced in active content `featuredImage`, `body`, or `structuredData`.

---

## 6. Scheduled Publishing & Expiration Architecture

- **Route:** `/admin/cms/scheduled`
- **Timezone:** Displayed in Asia/Dhaka time (`UTC+6`); stored in UTC ISO-8601.
- **Automated Cron API:** `/api/cron/cms-publish`
  - Secured via `Authorization: Bearer ${process.env.CRON_SECRET}` or Vercel Cron header (`x-vercel-cron`).
  - Idempotent and concurrency-safe.
  - Automatically unpublishes expired items where `expiryDate <= now`.
  - Configured in `vercel.json` to run every 10 minutes in production.

---

## 7. Version History & Non-Destructive Rollback

- **Route:** `/admin/cms/history`
- **Revision Ledger (`CmsRevision`):** Every meaningful update or restoration creates an immutable revision record.
- **Non-Destructive Restoration:** Restoring a revision generates a new revision record (e.g. version $N+1$), ensuring zero history destruction or silent data loss.
- **Retention Strategy:** Retains the 30 most recent revisions per content item to prevent database bloat.

---

## 8. Dynamic Navigation & Footer Manager

- **Route:** `/admin/cms/navigation`
- **Protocol Security:** Strictly validates all URLs using `isSafeNavigationUrl()`. Rejects `javascript:`, `data:`, and `vbscript:`.
- **Customizable Components:** Header navbar links, footer columns, university contact details, and social media links.

---

## 9. Next.js Cache & Preview Integration

- **Draft Mode:** Next.js Draft Mode API enabled via `/api/cms/preview?slug=[slug]&secret=[secret]`.
- **Exit Preview:** `/api/cms/exit-preview`.
- **On-Demand Cache Revalidation:** Targeted revalidation using `revalidatePath` triggered upon publishing, scheduling, or editing content.
- **Dynamic Sitemap:** `/sitemap.xml` dynamically generated in `src/app/sitemap.ts`, indexing only `PUBLISHED` content.

---

## 10. Audit Logging Integration

All CMS operations log structured records to `AdminAuditLog`:
- Content creation, editing, review decisions, approvals, scheduling, publishing, unpublishing, archiving, revision restoration, media uploads, and navigation modifications.

---

## 11. Testing & Verification

Run the entire automated verification suite:

```bash
pnpm test
```

### Test Suites Executed:
1. `test-production-readiness.mjs`: 32 checks (Core platform, security, RBAC).
2. `test-cms-foundation.mjs`: 20 checks (CMS Roles, capabilities, permissions).
3. `test-cms-phase2.mjs`: 12 checks (Content blocks, homepage schemas).
4. `test-cms-phase3.mjs`: 9 checks (News, events, FAQs, stories, resources).
5. `test-cms-phase4.mjs`: 8 checks (Media security, magic bytes, usage protection).
6. `test-cms-phase5.mjs`: 17 checks (Editorial workflow, scheduling, revisions, navigation).

