# CLOSER — Connecting Real Data (Supabase)

This guide takes you from dummy data → a real, persistent database in about 10 minutes.
No CLI or Docker needed — everything runs in the Supabase web dashboard.

---

## 1. Create a Supabase project (free)

1. Go to **https://supabase.com** → *Start your project* → sign in (GitHub works).
2. **New project** → pick an organization.
3. Fill in:
   - **Name:** `closer`
   - **Database password:** generate one and save it somewhere safe.
   - **Region:** pick the closest to you (e.g. *Southeast Asia (Singapore)*).
4. Click **Create new project** and wait ~1–2 minutes for provisioning.

---

## 2. Run the schema

1. In the left sidebar, open **SQL Editor** → *New query*.
2. Open the file [`supabase/schema.sql`](./supabase/schema.sql) in this repo, copy **all** of it.
3. Paste into the SQL editor and click **Run**.
4. You should see *"Success. No rows returned"*. That creates 4 tables:
   `deals`, `deal_documents`, `deal_notes`, `tasks` — with Row Level Security
   already configured for single-user (anon key) access.

> ✅ The schema is idempotent — you can re-run it safely; it won't wipe existing rows.

---

## 3. Get your API keys

1. Left sidebar → **Project Settings** (gear) → **API**.
2. Copy two values:
   - **Project URL** → e.g. `https://abcd1234.supabase.co`
   - **anon public** key → the long `eyJhbGciOi...` string

---

## 4. Configure the app

Create a file named `.env.local` in the project root (Next.js loads it automatically):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...paste-full-key-here...

# Optional — enables live Telegram reminders.
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Then restart the dev server:

```bash
npm run dev
```

---

## 5. Verify it's using real data

- Open http://localhost:3000 — you'll briefly see *"Menarik data dari Supabase…"* then an **empty pipeline** (you chose "begin empty").
- Click **Deal Baru**, fill the form, and save.
- Reload the page — the deal persists. Confirm in Supabase: **Table Editor → deals** shows your row.

If instead you still see the 10 dummy deals, the env vars aren't loaded — check the filename is exactly `.env.local` and that you restarted `npm run dev`.

---

## How it works (for later reference)

| Concern | Where |
| --- | --- |
| DB client + config detection | `src/lib/supabase.ts` |
| Row ↔ type mapping & CRUD | `src/lib/queries.ts` (`db.*`) |
| Load on mount + write-through | `src/state/CloserContext.tsx` |
| Schema / RLS policies | `supabase/schema.sql` |

The UI stays **optimistic**: actions apply instantly, then sync to Supabase in the background. If no Supabase is configured, it transparently falls back to dummy data so development never blocks.

---

## Security note

The current RLS policy lets **anyone with your anon key** read/write these tables — fine for a personal tool, but before deploying publicly either:
- add **Supabase Auth** and scope rows by `owner`/`user_id`, or
- restrict policies to authenticated users only.
