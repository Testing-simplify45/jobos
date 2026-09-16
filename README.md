# CareerOS (JobOS)

Personal AI job-search operating system: multi-source job aggregation,
evidence-locked AI matching, tailored resumes/cover letters, and an
application tracker.

## Setup — fully cloud, no local terminal required

1. **Get the code onto GitHub** without installing anything: on github.com,
   create a new repo, then use "Add file → Upload files" and drag in this
   folder (skip `node_modules`, there isn't one yet anyway). If you'd rather
   have a real terminal without using your own machine, GitHub Codespaces
   (free 60 hrs/month) gives you one in the browser — but plain upload works
   too.
2. **Create the database**: sign up at neon.tech (free), create a project,
   copy the connection string it gives you.
3. **Connect to Vercel**: import the GitHub repo in Vercel, and under
   Project Settings → Environment Variables add `DATABASE_URL` (from Neon)
   and `OPENAI_API_KEY`.
4. **Deploy**: Vercel runs `npm run build` automatically on every push. That
   build script now runs `prisma migrate deploy` first — so your Neon
   database gets its tables created automatically on the very first deploy,
   with no manual migration step anywhere.

That's the whole loop from here on: edit files (in chat, in Codespaces, or
via GitHub's web editor), push/commit, Vercel builds and deploys, done.

## Before the Dashboard shows real data

1. **Auth**: `lib/auth.ts` is a placeholder — set `DEV_USER_ID` in Vercel's
   env vars to a seeded user's id to unblock testing before wiring up real
   auth (Auth.js, Clerk, or Supabase Auth all work fine).
2. **Seed a job or two** via the Greenhouse/Lever collectors in `collectors/`,
   or `collectors/manual-intake.ts` for a pasted-in job, then run the AI
   matcher (`lib/matching.ts`) against your profile so `JobMatch` rows exist
   for the dashboard to read. These need to run somewhere with outbound
   internet — a Vercel API route you hit once, or a scheduled Vercel Cron
   job, both work without any local execution.

## Deploying

- **Vercel**: connect the GitHub repo, set the same env vars in Project
  Settings, deploy. Works out of the box for the app itself.
- **Collector jobs**: Vercel Cron can trigger `syncGreenhouseCompany` /
  `syncLeverCompany` for a small number of companies per run. For a larger
  company list, run the collector loop on a small always-on worker
  (Railway/Render) writing to the same Postgres DB, so you're not fighting
  serverless execution time limits.

## What's built so far

- `prisma/schema.prisma` — full data model
- `collectors/` — Greenhouse + Lever public API collectors, manual/LinkedIn-
  by-URL intake (no scraping)
- `lib/matching.ts` — AI job parser + evidence-constrained matcher + cover
  letter adapter
- `app/dashboard` — first UI screen, wired to `/api/dashboard`

## Next screens to build

Find Jobs, Job Details (AI Match Analysis), Saved Jobs, Applications
(kanban), Master Profile, Resume Studio, AI Application Hub — same design
system (see `tailwind.config.ts`), same pattern (real API route, no
hardcoded data).
