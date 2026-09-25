# ULAB Setu

A place where ULAB students connect with alumni, apply to jobs alumni post, and browse live job listings from Bangladesh and remote teams.

## Run locally

```bash
pnpm install
cp .env.example .env        # then set AUTH_SECRET (openssl rand -hex 32)
pnpm db:push                # create the SQLite database
pnpm db:seed                # demo data (password for every account: password123)
pnpm dev
```

Demo accounts:

| Role | Email |
|---|---|
| Student | student@ulab.edu.bd |
| Alumni | alumni1@example.com … alumni6@example.com |
| Alumni (awaiting approval) | pending.alumni@example.com |
| Teacher | teacher@ulab.edu.bd, teacher2@ulab.edu.bd |
| Teacher (awaiting approval) | pending.teacher@ulab.edu.bd |
| Alumni office (admin) | admin@ulab.edu.bd |

Roles: students apply and message; alumni and teachers (once the alumni office approves them) also post jobs and notice-board posts. Anyone can message anyone. Each person chooses whether their phone, WhatsApp and Facebook are public or private.

## Job sources

- **Alumni jobs**: posted on this site by verified alumni.
- **Bangladesh**: [Careerjet API](https://www.careerjet.com.bd/partners/api) (`locale_code=en_BD`), which aggregates Bdjobs and other Bangladeshi sites. Set `CAREERJET_API_KEY`; without it the tab shows sample listings.
- **Remote**: [Himalayas API](https://himalayas.app/api), free with no key. Their terms require linking back and naming Himalayas as the source.

## Rebranding

University name, logo, email domain and departments live in `src/lib/site.ts`. Colors are tokens at the top of `src/app/globals.css`.

## Tests

Tests reset their own database, so run them against a separate server, never your real data:

```bash
pnpm test:db                                   # create/seed prisma/test.db
DATABASE_URL=file:./test.db pnpm start -p 3457 # in another terminal (after pnpm build)
BASE=http://localhost:3457 pnpm test:e2e
```

The suite drives your installed Chrome via playwright-core; screenshots go to `e2e/shots/`.

## Deploying

SQLite is for local use. For production, switch `provider` in `prisma/schema.prisma` to `postgresql`, point `DATABASE_URL` at a hosted Postgres (Supabase or Neon free tier), run `pnpm db:push`, and deploy to Vercel with `AUTH_SECRET`, `DATABASE_URL` and `CAREERJET_API_KEY` set.

## Installable app (PWA)

`src/app/manifest.ts`, the icons in `public/icons/` and `src/app/icon.png` / `apple-icon.png`, and `public/sw.js` make Setu installable from a phone browser (Android: the in-page "Install app" button; iPhone: Share → Add to Home Screen). The service worker only caches built assets and icons and shows `public/offline.html` when there is no connection; pages and data always come from the network. Installing requires the site to be served over HTTPS, so it works once deployed.
