<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# ULAB Setu — Development, CI & Live Deployment Rules

## 1. Institutional Domain & Verification Invariants
- **Strict `@ulab.edu.bd` Only:** Every role (Student, Alumni, Teacher, Admin) must strictly authenticate with an official `@ulab.edu.bd` email. Any non-ULAB email (e.g. `@gmail.com`) must be rejected on signup, OTP requests, and login.
- **Auto-Approval:** All university members with verified `@ulab.edu.bd` emails are auto-approved (`status: "APPROVED"`) upon signup and login without requiring manual admin intervention.

## 2. Reverse Engineering & Zero-Error Code Quality
- **Deep Impact Analysis:** Before modifying or adding code, reverse-engineer data models, server action contracts, and UI components to ensure seamless integration and zero regressions.
- **Pre-Flight Static Verification:** Always run `tsc --noEmit` and verify builds locally to ensure zero syntax errors, broken imports, or type contract violations.

## 3. Git Push, CI Pass & Live Deployment Guarantee
- **Commit & Push:** Every verified task must be committed with clean conventional commit messages and pushed directly to `origin main`.
- **CI Health Verification:** Actively track GitHub Actions CI runs until the entire pipeline (Prisma generation, lint, database schema, seeding, Next.js build, and E2E tests) completes with 100% success (`conclusion: success`).
- **Live Vercel Health:** Confirm that the production deployment on Vercel succeeds and returns HTTP 200 OK with fully functional pages.
