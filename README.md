# Amazon Clone

A clone of amazon.com built for the 8x assignment.

**Live:** https://8x-assignment-amazon-clone.vercel.app

**Features:** home with hero and deal rows · search with filters, sort and pagination · product pages with reviews · guest cart (anonymous Supabase session) that carries over on sign-up · cart with save-for-later · checkout with address book and mock payment · order history · account and addresses.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS · Supabase (Postgres, Auth, RLS) · Vercel

## Run locally
```bash
cp .env.example .env.local   # fill in Supabase keys
npm install
npm run dev
```
Database schema lives in `supabase/migrations/`. Apply it in the Supabase SQL editor (or `supabase db push`), then run `npm run seed`.

## How it was built
Planned with Claude Opus 5.5, executed in parallel tracks with Claude Sonnet 5.5. Raw prompt/response logs are in `.agent-logs/` (see `CAPTURE-TEST.md`).
