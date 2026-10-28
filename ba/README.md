# Beyond Addiction

An educational habit and recovery-support web app (B.Tech IT minor project). React + Vite + Tailwind on the front end; Supabase (Auth, PostgreSQL, Row Level Security) as the only backend. It does not diagnose or treat any condition and is not a substitute for professional care.

## Features
Landing page · email/password auth with verification and password reset · optional onboarding · dashboard · daily check-in (one per day, editable) · goals and habit logging with progress charts · private journal (search, tags, date filter) · analytics with date ranges · My Recovery (progress-day and streak rules, milestones) · community directory (external links) and a moderated in-app feed (posts, replies, support reactions, reports) · curated resource library with direct video links, search, filters, detail page, optional embed, bookmarks · rule-based suggestions · in-app notifications · settings (profile, preferences, password, JSON export, account deletion) · admin console (resources, report moderation, audit log).

## Setup
1. Install Node.js 18+.
2. Unzip, open a terminal in the folder, run `npm install`.
3. Create a project at https://supabase.com.
4. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL` = Project Settings > API > Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = the publishable key (`sb_publishable_...`). On older projects paste the legacy `anon` key here instead (`VITE_SUPABASE_ANON_KEY` is also read as a fallback). **Never use the secret/service-role key.**
5. Create the database: open Supabase > SQL Editor, paste the whole of `supabase/setup_all.sql` (schema + RLS + seed resources) and run it once.
   Alternative: run `supabase/migrations/*.sql` in filename order, then `supabase/seed.sql` (or use the Supabase CLI: `supabase link` then `supabase db push`, then run the seed).
6. Authentication > URL Configuration: set Site URL to `http://localhost:5173` and add `http://localhost:5173/**` to Redirect URLs (add your deployed URL later). Authentication > Providers > Email: keep "Confirm email" on for verification, or turn it off for quick demos.
7. `npm run dev` then open http://localhost:5173
8. `npm run build` for a production build, `npm run lint` to lint.

### Making an administrator
Admin rights live in the `user_roles` table, which has no client write policy. After signing up, run in the SQL Editor:
```sql
insert into public.user_roles (user_id, role) select id, 'admin' from auth.users where email = 'you@example.com';
```
Sign out and in again; an Administration link appears. Even if the link were forced, RLS rejects non-admin writes.

## Data model and security
Tables: profiles, user_roles, notification_preferences, recovery_goals, habit_logs, daily_check_ins, journal_entries, resources, saved_resources, community_posts/comments/reactions/reports, milestones, notifications, audit_logs. All have RLS.
- Private tables (profiles, goals, logs, check-ins, journal, bookmarks, milestones, notifications) are limited to `auth.uid()`.
- Resources are publicly readable only when `published`; only admins write.
- Community content is readable by signed-in users unless `hidden`; authors edit/delete their own; a trigger fixes `user_id`, `author_name` and `hidden` server-side so clients cannot spoof them. One reaction and one report per user per post (primary key / unique constraint).
- `delete_my_account()` is a `security definer` function that deletes the caller's auth user; all rows cascade.
- Only the publishable key is used in the browser.

## How progress is counted
- **Check-in streak**: consecutive days with a check-in, ending today or yesterday. Missing a day resets only this number.
- **Days of progress**: days since the later of your start date or your latest self-recorded setback.
- **Goal progress**: logged days / target days. **Milestones** are rules in `src/lib/constants.js` + `syncMilestones` in `src/services/api.js`.
- **Suggestions** (`src/lib/recommend.js`): points for matching habit, chosen topics, goals, saved items and recent high stress/craving averages. No AI service is used.

## Resources: what has and has not been verified
`supabase/seed.sql` holds 9 resources. Their URLs were found in published sources (CDC/HHS syndication record, a UCSF resource list, NIAAA pages, provider pages) during development, but **the build environment had no network access, so none were opened or played.** Check each before a demo; the TED link in particular follows the site's URL pattern and should be confirmed, and the Queensland Health page may need a free login. Unpublish or fix any item at `/app/admin`. Several categories (sleep, family, stress, recovery stories) have no seeded items yet: add verified direct links through the admin console rather than guessing IDs. The Reddit and organisation links in `src/lib/directory.js` should be opened once as well.

## Known limitations
- No `package-lock.json` (generated on your first `npm install`), and the project was not compiled or linted in the build environment.
- Live Supabase auth and database behaviour has not been exercised; test the signup → check-in → resource → bookmark flow after setup.
- Notifications are in-app only. No email/push/scheduled reminders. No avatar upload. No dark mode.
- Emergency numbers on the Help page should be re-verified.
