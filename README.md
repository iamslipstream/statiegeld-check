# Bottle Return Check ♻️

A tiny, crowdsourced web app for the **bottle & can return (statiegeld) machines**
at the local supermarkets — currently **Jumbo** and **Vomar**. Before you haul a
bag of bottles and cans down, check whether the machine is actually working — and
after you've been, tap a button so your neighbours know.

Built for the residents of an Amsterdam student/young-professional building who
were tired of trekking down with a full bag only to find the machine broken.

## What it does

- **Multiple supermarkets** — switch between Jumbo and Vomar; each tab shows a
  coloured dot for its current status at a glance.
- **One big status card** per supermarket showing the latest report and how long
  ago it was made.
- **One-tap, anonymous reporting** — no login, no name. Four statuses:
  - ✅ Working
  - ❌ Not working
  - 🗑️ Bin full
  - ⏳ Long queue
- **"Might be outdated" warning** when the last report is more than 2 hours old.
- **Recent reports** list so you can see the trend.
- **Live-ish updates** — the page polls every 30s and refreshes when you reopen the tab.
- **Mobile-first** — designed to be used standing at the machine.

## Adding a supermarket

Add one entry to `LOCATIONS` in [`lib/types.ts`](lib/types.ts) — the switcher,
status card, reporting and history all pick it up automatically. Each location's
reports are stored under its own Redis key (`reports:<id>`).

## Tech

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Upstash Redis](https://upstash.com) for storage (free tier)
- Deployed on [Vercel](https://vercel.com)

The data model is one capped Redis list of reports per supermarket (newest
first), keyed `reports:<locationId>`.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Without Upstash credentials the app falls back to **in-memory storage** so it
runs with zero setup — but reports reset whenever the dev server restarts. A
small amber note in the footer reminds you when you're in this mode.

### Connecting Upstash (for persistence)

Create a Redis database (via the [Upstash console](https://console.upstash.com)
or the Vercel Marketplace) and set these in `.env.local`:

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

The app also accepts Vercel's `KV_REST_API_URL` / `KV_REST_API_TOKEN` naming
automatically, so the Vercel Marketplace integration works out of the box.

## Deploying

Push to GitHub and import the repo in Vercel, then add the Upstash environment
variables (or attach the Upstash integration from the Vercel Marketplace, which
injects them for you). Every push to `main` redeploys.

## Ideas for later

- A "confidence" score that decays over time
- Push notifications when the machine comes back online
- A short note field ("only accepts bottles, not cans")
- Charts of busiest/quietest times
