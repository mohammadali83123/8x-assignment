# Amazon Clone

A working clone of amazon.com, built for the 8x assignment: browse, search, product pages with reviews, a guest cart that survives sign-up, checkout, orders, and Amazon's email-first sign-in.

**Live site:** https://8x-assignment-amazon-clone.vercel.app

This is a clone, not a scalable architecture. It is one Next.js app and one Supabase project, chosen so the whole thing can be set up in about 15 minutes.

---

## Contents

1. [What's in it](#whats-in-it)
2. [Tech stack and how it fits together](#tech-stack-and-how-it-fits-together)
3. [Setup from zero](#setup-from-zero)
4. [Deploy to Vercel](#deploy-to-vercel)
5. [Try it out (test checklist)](#try-it-out-test-checklist)
6. [Project structure](#project-structure)
7. [Troubleshooting](#troubleshooting)
8. [Known limitations](#known-limitations)
9. [How it was built (AI workflow)](#how-it-was-built-ai-workflow)

---

## What's in it

| Area | What you get |
|---|---|
| **Home** | Auto-advancing hero carousel, 4-up category and deal tiles, horizontal rows: Today's deals, Top rated, Best in <category> |
| **Header / footer** | Amazon-style header with category search, account menu, live cart count, working language menu, department drawer, full footer |
| **Search** | `/s` with keyword (full-text, with a title-match fallback), department, price, star-rating and Prime filters, 5 sort orders, pagination, filter chips |
| **Product page** | Image gallery, price with list price and % off, stock status, delivery date, buy box (quantity, Add to Cart, Buy Now), rating histogram, reviews, write-a-review form, related products |
| **Cart** | Server-built cart: change quantity, delete, save for later, subtotal, free-shipping progress |
| **Guest cart** | Shopping works before you sign in (an anonymous Supabase session). The cart is merged into your account when you sign up or sign in |
| **Checkout** | Saved addresses or a new one, mock card form, order summary, server-side price and stock re-validation |
| **Orders** | Order history, order details, "Buy it again" |
| **Auth** | Amazon's email-first flow: email, then create account or password. Email confirmation, forgot-password, and a verify-email screen that continues on its own once you confirm on any device |
| **Account** | Account hub, login and security (name), address book |
| **Languages** | English, Español, Deutsch, Français for the shared chrome, home and cart (product data stays English) |

---

## Tech stack and how it fits together

| Concern | Choice |
|---|---|
| App | Next.js 16 (App Router, Server Components, Server Actions), TypeScript |
| Styling | Tailwind CSS v4 |
| Database, auth, security | Supabase: Postgres, Auth, Row Level Security |
| Hosting | Vercel (auto-deploys every push to `main`) |
| Catalog data | DummyJSON, imported once by `npm run seed` |

Design decisions worth knowing:

- **The cart lives on the server.** It is the `cart_items` table in Postgres. Every change goes through a Server Action, `/cart` is a Server Component, and checkout re-reads the cart and recomputes prices on the server. Nothing is kept in `localStorage` or client state. The few client components (quantity select, Add to Cart button, checkout form) only call server actions.
- **Guests are real users.** The first time someone adds to the cart, `getOrCreateUser()` (in `src/lib/supabase/server.ts`) starts an *anonymous* Supabase session. That gives the visitor a real `auth.uid()`, so the cart and RLS work before sign-up. Nothing is created just for browsing, so crawlers don't mint users.
- **Row Level Security does the authorization.** Catalog tables and reviews are public to read. Cart, addresses and orders are owner-only. Only non-anonymous users can write reviews. The service-role key is used only by the seed script, the cart merge, and the email lookup, always on the server.
- **Guest cart merge.** `src/lib/cart-merge.ts` moves the guest's cart into the real account at sign-up (if no confirmation is required), when the confirmation link is opened, or at sign-in.
- **Next.js 16 specifics.** Middleware is now `src/proxy.ts` (it only refreshes the Supabase session cookie). `params` and `searchParams` are Promises.

---

## Setup from zero

You need: **Node.js 20.9+**, npm, a free **Supabase** account, a free **Vercel** account (for deploying), and a GitHub account.

### 1. Get the code

```bash
git clone https://github.com/mohammadali83123/8x-assignment.git
cd 8x-assignment
npm install
```

### 2. Create the Supabase project

1. At [supabase.com](https://supabase.com) create a new project. Keep **Enable Data API** on. Pick a region close to where you'll deploy (Vercel's default function region is Washington D.C. / `iad1`, so *East US (N. Virginia)* pairs with it).
2. **Apply the schema.** Open **SQL Editor → New query**, paste the entire contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and run it. This creates the tables, the full-text search index, the rating trigger and all RLS policies.
3. **Authentication → Sign In / Providers** (a.k.a. Providers):
   - Turn **Allow anonymous sign-ins** ON. The guest cart depends on it.
   - Under **Email**, choose your confirmation mode:
     - **Confirm email OFF**: sign-up logs the user in immediately. Simplest for local development.
     - **Confirm email ON**: matches the real flow (the app shows "Verify email address" and continues once the link is opened). Needs working email, see step 4.
4. **If Confirm email is ON, set up email sending.** Supabase's built-in sender is for testing only: it allows a few emails per hour and may only deliver to your own team members, so real users will hit `email rate limit exceeded`. Set up **Authentication → SMTP Settings → Custom SMTP**. A Gmail account works without owning a domain:
   - Turn on 2-Step Verification, then create an **App Password** (Google Account → Security → App passwords).
   - Host `smtp.gmail.com`, port `587`, username your Gmail address, password the 16-character app password, sender email the same Gmail address.
5. **Authentication → URL Configuration:**
   - **Site URL**: your deployed URL, with no wildcard and no trailing path, e.g. `https://8x-assignment-amazon-clone.vercel.app` (use `http://localhost:3000` if you only run locally).
   - **Redirect URLs**: add `http://localhost:3000/**` and your production URL followed by `/**`, e.g. `https://8x-assignment-amazon-clone.vercel.app/**`.
   - The `/**` wildcard belongs in the Redirect URLs list only. Putting it in Site URL makes confirmation links 404.
6. **Copy your keys** (Project Settings):
   - **Project URL**: Settings → Data API.
   - **Publishable key** (`sb_publishable_…`) and **Secret key** (`sb_secret_…`): Settings → API Keys. (The legacy `anon` and `service_role` keys also work.)

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Safe for the browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key (`sb_publishable_…`) | Safe for the browser because RLS protects every table. The name says "anon" for compatibility with `@supabase/ssr`; the legacy anon key also works |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key (`sb_secret_…`) | **Server only.** Bypasses RLS. Never commit it or expose it to the browser |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, your Vercel URL in production | |
| `STRIPE_SECRET_KEY` | leave empty | Reserved. Payment is currently a mock flow and this is not read anywhere |

`.env.local` is git-ignored.

### 4. Load the catalog

```bash
npm run seed
```

This imports ~194 products in 12 departments from DummyJSON and generates ~388 reviews from 8 seed reviewer accounts (`seed-reviewer-1…8@example.com`). It is **idempotent**: safe to run again to restore the data.

> **Heads-up:** reviews belong to their author's account. If you delete the seed reviewer users in Supabase Auth, their reviews are deleted with them (database cascade). Run `npm run seed` to bring them back.

### 5. Run it

```bash
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run lint`.

---

## Deploy to Vercel

1. Push the repo to GitHub (it is already at `mohammadali83123/8x-assignment`).
2. In Vercel: **Add New → Project → Import** the repository. Framework preset **Next.js**, root directory `./`. Ignore the optional "Supabase" integration card, the project already exists.
3. Open **Environment Variables** and add the same variables as `.env.local` (use your production URL for `NEXT_PUBLIC_SITE_URL`). You can paste the whole `.env.local` into the first key field. Click **Create Project**.
4. After the first deploy, set **Settings → Functions → Function Region** to match your Supabase region.
5. In Supabase, make sure **Site URL** and **Redirect URLs** use your Vercel URL (setup step 2.5).
6. If you change an environment variable later, **redeploy**. Variables are read at build time.

From then on, every push to `main` deploys automatically. If a push ever doesn't, deploy directly:

```bash
npm i -g vercel
vercel login
vercel link --project <your-project>
vercel --prod
```

---

## Try it out (test checklist)

1. **Browse:** home, then search "laptop", filter by price, sort, open a product.
2. **Guest cart:** click **Add to Cart**. The header count updates. Open `/cart`, change the quantity, save an item for later.
3. **Sign up:** click **Proceed to checkout**. Enter an email, then **Proceed to create an account**, fill in your name and password, and **Continue**.
   - With *Confirm email ON*: open the emailed link (on any device). The original tab continues to checkout by itself, with the cart intact.
   - With *Confirm email OFF*: you land on checkout immediately.
4. **Checkout:** add an address, enter any card number (e.g. `4242 4242 4242 4242`, any future expiry, any CVC; nothing is stored), and **Place your order**.
5. **Orders:** see the order under **Returns & Orders**. The cart is now empty.
6. **Sign out and back in:** use the account menu, then sign in with your email and password. Try **Forgot password?** too.
7. **Language:** hover **EN** in the header and switch to Deutsch.
8. **Reviews:** on a product page, write a review while signed in. Guests see "Sign in to write a review".

---

## Project structure

```
supabase/migrations/0001_init.sql   Schema, indexes, triggers, RLS policies
scripts/seed.ts                     Catalog + review seeding (npm run seed)
src/
  proxy.ts                          Refreshes the Supabase session cookie
  app/
    page.tsx                        Home
    s/                              Search and listing
    dp/[id]/                        Product page + add-to-cart / review actions
    cart/                           Cart page + actions
    checkout/                       Checkout + placeOrder action
    orders/                         Order history and details
    account/                        Account hub, login and security, addresses
    (auth)/                         /signin (email-first flow) and /signup (redirects)
    auth/                           callback, confirmed, reset (email links land here)
  components/                       layout, home, product, search, pdp, cart,
                                    checkout, orders, auth
  lib/
    supabase/                       server / client / admin Supabase clients
    cart-merge.ts                   Guest cart -> account merge
    i18n.ts, i18n-dict.ts           Language cookie + dictionaries
    format.ts                       Prices, shipping and tax constants
```

Shipping is free over $35 (otherwise $5.99) and tax is a flat 8%. Both are constants in `src/lib/format.ts`.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `email rate limit exceeded` on sign-up | Supabase's built-in email sender is limited. Set up Custom SMTP (setup step 2.4) or turn **Confirm email** off |
| Confirmation link goes to a 404 on `…/**` | The **Site URL** in Supabase contains `/**`. Remove it; keep the wildcard only in **Redirect URLs** |
| "Please confirm your email address first" | Open the link in the email, or use **Resend confirmation email** (Supabase allows one email per minute) |
| Opened the confirm link on another device and landed signed out | Expected: the link can only start a session in the browser that signed up. The page shows "Email confirmed"; the original tab continues by itself, or just sign in |
| Page looks unstyled right after a deploy | An open tab still points at the previous build's CSS file. Hard-refresh (Cmd+Shift+R); if it persists, clear the site's data or disable Brave Shields for the site |
| Products load but there are no reviews | The seed reviewer accounts were deleted. Run `npm run seed` |
| Guest cart or sign-up fails with an anonymous-auth error | **Allow anonymous sign-ins** is off in Supabase |
| Env changes don't show on Vercel | Variables are read at build time; redeploy |

---

## Known limitations

- **Payment is a mock.** The card form is validated in the browser and never stored; no real charge happens. (`STRIPE_SECRET_KEY` is reserved for a future real payment step.)
- **Languages are partial.** The shared chrome, home and cart are translated. Product titles and descriptions, search, product page, checkout, orders, account and sign-in pages stay in English.
- **Display-only elements:** footer links, the Amazon services strip, "Need help?" and "Create a free business account" don't go anywhere. There is no mobile-number sign-in, 2-step verification, wish lists, or seller side.
- **Email lookup on sign-in** reveals whether an email has an account. Amazon's own flow does the same; it is a deliberate match, not an oversight.
- **Password-reset links** only work in the browser that requested them.
- **Single currency (USD)** and a flat tax/shipping model.

---

## How it was built (AI workflow)

Planned with **Claude Opus 5.5**, then built by **Claude Sonnet 5.5** in eight parallel tracks (seed data, header/footer, home, search, product page, cart, checkout/orders, auth/account), each in its own git worktree and merged into `main` as it finished.

The assignment requires a raw record of the prompts and final responses. Claude Code hooks (`.claude/settings.json`) run `.claude/hooks/capture.mjs` on every prompt and at the end of every turn, writing one file per session to [`.agent-logs/`](.agent-logs). See [`CAPTURE-TEST.md`](CAPTURE-TEST.md) for how the capture was set up and verified across two sessions.
