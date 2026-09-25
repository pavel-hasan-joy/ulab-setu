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
| Alumni office (admin) | admin@ulab.edu.bd |

## Job sources

- **Alumni jobs**: posted on this site by verified alumni.
- **Bangladesh**: [Careerjet API](https://www.careerjet.com.bd/partners/api) (`locale_code=en_BD`), which aggregates Bdjobs and other Bangladeshi sites. Set `CAREERJET_API_KEY`; without it the tab shows sample listings.
- **Remote**: [Himalayas API](https://himalayas.app/api), free with no key. Their terms require linking back and naming Himalayas as the source.

## Rebranding

University name, logo, email domain and departments live in `src/lib/site.ts`. Colors are tokens at the top of `src/app/globals.css`.

## Tests

With the app running: `BASE=http://localhost:3000 pnpm test:e2e` (drives your installed Chrome via playwright-core; screenshots go to `e2e/shots/`).

## Deploying

SQLite is for local use. For production, switch `provider` in `prisma/schema.prisma` to `postgresql`, point `DATABASE_URL` at a hosted Postgres (Supabase or Neon free tier), run `pnpm db:push`, and deploy to Vercel with `AUTH_SECRET`, `DATABASE_URL` and `CAREERJET_API_KEY` set.
