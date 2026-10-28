-- Beyond Addiction: schema. Run migrations in filename order.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Roles (admin assignment is done only via SQL by the project owner; no client write policy exists)
create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin');
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 40),
  recovery_goal text check (char_length(recovery_goal) <= 200),
  habit_category text check (habit_category in ('smoking','alcohol','substances','behavioral','other')),
  interests text[] not null default '{}',
  recovery_start_date date,
  target_date date,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_upd before update on public.profiles for each row execute function public.set_updated_at();

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reminders_enabled boolean not null default true,
  milestone_alerts boolean not null default true,
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, nullif(left(coalesce(new.raw_user_meta_data->>'display_name',''), 40), ''));
  insert into public.notification_preferences (user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.recovery_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 500),
  category text not null default 'other' check (category in ('smoking','alcohol','substances','behavioral','other')),
  target_days int not null default 30 check (target_days between 1 and 3650),
  start_date date not null default current_date,
  target_date date,
  status text not null default 'active' check (status in ('active','paused','archived','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.recovery_goals (user_id, status);
create trigger trg_goals_upd before update on public.recovery_goals for each row execute function public.set_updated_at();

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.recovery_goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (goal_id, log_date)
);
create index on public.habit_logs (user_id, log_date);

create table public.daily_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in_date date not null default current_date,
  mood int check (mood between 1 and 5),
  stress int check (stress between 1 and 5),
  craving int check (craving between 0 and 10),
  sleep int check (sleep between 1 and 5),
  triggers text[] not null default '{}',
  activities text[] not null default '{}',
  setback boolean not null default false,
  notes text check (char_length(notes) <= 1000),
  reflection text check (char_length(reflection) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, check_in_date)
);
create index on public.daily_check_ins (user_id, check_in_date desc);
create trigger trg_checkins_upd before update on public.daily_check_ins for each row execute function public.set_updated_at();

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 10000),
  mood int check (mood between 1 and 5),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.journal_entries (user_id, created_at desc);
create trigger trg_journal_upd before update on public.journal_entries for each row execute function public.set_updated_at();

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  publisher text not null,
  description text not null,
  url text not null check (url ~ '^https://'),
  kind text not null default 'video' check (kind in ('video','article')),
  thumbnail_url text,
  duration text,
  language text,
  tags text[] not null default '{}',
  audience text,
  featured boolean not null default false,
  published boolean not null default true,
  verified_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index on public.resources (url);
create index on public.resources (category);
create trigger trg_resources_upd before update on public.resources for each row execute function public.set_updated_at();

create table public.saved_resources (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'Member',
  category text not null default 'general',
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 1 and 3000),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.community_posts (created_at desc);
create index on public.community_posts (category);

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'Member',
  body text not null check (char_length(body) between 1 and 1500),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.community_comments (post_id, created_at);

create table public.community_reactions (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  achieved_at timestamptz not null default now(),
  unique (user_id, key)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  target text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Server-side author name + immutability guards for community content
create or replace function public.community_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.author_name := coalesce((select display_name from public.profiles where id = auth.uid()), 'Member');
    new.hidden := false;
  elsif not public.is_admin() then
    new.user_id := old.user_id; new.author_name := old.author_name; new.hidden := old.hidden; new.created_at := old.created_at;
  end if;
  return new;
end $$;
create trigger trg_posts_w before insert or update on public.community_posts for each row execute function public.community_before_write();
create trigger trg_comments_w before insert or update on public.community_comments for each row execute function public.community_before_write();
create or replace function public.touch_post() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger trg_posts_upd before update on public.community_posts for each row execute function public.touch_post();

-- Self-service account deletion (cascades to all user rows)
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
-- Row Level Security. Every table has RLS enabled.
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.recovery_goals enable row level security;
alter table public.habit_logs enable row level security;
alter table public.daily_check_ins enable row level security;
alter table public.journal_entries enable row level security;
alter table public.resources enable row level security;
alter table public.saved_resources enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_reports enable row level security;
alter table public.milestones enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- user_roles: users may only read their own role. NO insert/update/delete policies => nobody can self-promote.
create policy roles_read_own on public.user_roles for select to authenticated using (user_id = auth.uid());

-- Private per-user tables
create policy profiles_own on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy prefs_own on public.notification_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy goals_own on public.recovery_goals for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy logs_own on public.habit_logs for all to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.recovery_goals g where g.id = goal_id and g.user_id = auth.uid()));
create policy checkins_own on public.daily_check_ins for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy journal_own on public.journal_entries for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy saved_own on public.saved_resources for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy milestones_own_read on public.milestones for select to authenticated using (user_id = auth.uid());
create policy milestones_own_ins on public.milestones for insert to authenticated with check (user_id = auth.uid());
create policy notif_own_read on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notif_own_ins on public.notifications for insert to authenticated with check (user_id = auth.uid());
create policy notif_own_upd on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_own_del on public.notifications for delete to authenticated using (user_id = auth.uid());

-- Resources: public read of published items; admin full control
create policy resources_public_read on public.resources for select to anon, authenticated using (published or public.is_admin());
create policy resources_admin_ins on public.resources for insert to authenticated with check (public.is_admin());
create policy resources_admin_upd on public.resources for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy resources_admin_del on public.resources for delete to authenticated using (public.is_admin());

-- Community: signed-in users read visible content; write own; admins moderate
create policy posts_read on public.community_posts for select to authenticated using (hidden = false or public.is_admin());
create policy posts_ins on public.community_posts for insert to authenticated with check (user_id = auth.uid());
create policy posts_upd on public.community_posts for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy posts_del on public.community_posts for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy comments_read on public.community_comments for select to authenticated using (hidden = false or public.is_admin());
create policy comments_ins on public.community_comments for insert to authenticated with check (user_id = auth.uid());
create policy comments_upd on public.community_comments for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy comments_del on public.community_comments for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy reactions_read on public.community_reactions for select to authenticated using (true);
create policy reactions_ins on public.community_reactions for insert to authenticated with check (user_id = auth.uid());
create policy reactions_del on public.community_reactions for delete to authenticated using (user_id = auth.uid());

create policy reports_ins on public.community_reports for insert to authenticated with check (reporter_id = auth.uid() and status = 'open' and resolved_by is null);
create policy reports_read on public.community_reports for select to authenticated using (reporter_id = auth.uid() or public.is_admin());
create policy reports_admin_upd on public.community_reports for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Audit logs: admin only
create policy audit_admin_read on public.audit_logs for select to authenticated using (public.is_admin());
create policy audit_admin_ins on public.audit_logs for insert to authenticated with check (public.is_admin() and admin_id = auth.uid());

-- ===== seed =====
-- Seed: public educational resources only (no user data).
-- Each URL was located in a published source (CDC/HHS media syndication, UCSF resource list, NIAAA, provider pages).
-- Re-check playback before your demo; admins can unpublish any item from /admin.
insert into public.resources (title, category, publisher, description, url, kind, thumbnail_url, language, tags, audience, featured, verified_note) values
('Tips From Former Smokers: Shawn''s Story', 'Smoking and nicotine cessation', 'CDC (Tips From Former Smokers)',
 'A former smoker describes his struggle with cigarette addiction and what finally led him to quit. Contains frank discussion of smoking-related illness.',
 'https://www.youtube.com/watch?v=m_j21l7Uxv8', 'video', 'https://i.ytimg.com/vi/m_j21l7Uxv8/hqdefault.jpg', 'English', '{smoking,motivation,stories,quit smoking}', 'People thinking about quitting smoking', true,
 'Video ID taken from the CDC syndication record on digitalmedia.hhs.gov'),
('Smoking Cessation Part 1: Preparing to Quit', 'Smoking and nicotine cessation', 'University of North Carolina',
 'A short walkthrough of how to prepare for a quit attempt: setting a date, spotting triggers and lining up support.',
 'https://www.youtube.com/watch?v=8abFd0ORgTU', 'video', 'https://i.ytimg.com/vi/8abFd0ORgTU/hqdefault.jpg', 'English', '{smoking,planning,triggers,quit date}', 'Adults preparing to quit smoking', true,
 'Listed on the UCSF 5As resource page (5as.ucsf.edu)'),
('Smoking Cessation Part 2: The Medications', 'Smoking and nicotine cessation', 'University of North Carolina',
 'Overview of medications that can help with quitting smoking. Educational only; talk to a clinician about what suits you.',
 'https://www.youtube.com/watch?v=9UhkPMmKyHg', 'video', 'https://i.ytimg.com/vi/9UhkPMmKyHg/hqdefault.jpg', 'English', '{smoking,medication,nicotine}', 'Adults preparing to quit smoking', false,
 'Listed on the UCSF 5As resource page (5as.ucsf.edu)'),
('Short Takes: What Is Alcohol Use Disorder?', 'Alcohol recovery', 'NIAAA (US National Institute on Alcohol Abuse and Alcoholism)',
 'A brief official explainer of what alcohol use disorder is and how it is described clinically.',
 'https://www.niaaa.nih.gov/short-takes-niaaa-what-alcohol-use-disorder-aud', 'video', null, 'English', '{alcohol,education,AUD}', 'Anyone curious about alcohol use', true,
 'Official NIAAA video page, listed in NIAAA Short Takes series'),
('Short Takes: Treatment Options for Alcohol Use Disorder', 'Professional help and treatment education', 'NIAAA (US National Institute on Alcohol Abuse and Alcoholism)',
 'A short overview of treatment approaches for alcohol use disorder, including behavioral therapies and medications.',
 'https://www.niaaa.nih.gov/short-takes-niaaa-what-are-treatment-options-alcohol-use-disorder', 'video', null, 'English', '{alcohol,treatment,professional help}', 'People weighing treatment options', false,
 'Official NIAAA video page, listed in NIAAA Short Takes series'),
('Short Takes: What Is Alcohol Overdose?', 'Alcohol recovery', 'NIAAA (US National Institute on Alcohol Abuse and Alcoholism)',
 'Explains what alcohol overdose is and why it is a medical emergency.',
 'https://www.niaaa.nih.gov/short-takes-niaaa-what-alcohol-overdose', 'video', null, 'English', '{alcohol,safety,emergency}', 'Anyone who drinks or supports someone who does', false,
 'Official NIAAA video page, listed in NIAAA Short Takes series'),
('Urge Surfing Guided Meditation', 'Mindfulness and meditation', 'Pathlight Mood & Anxiety Centers / Eating Recovery Center',
 'A guided practice for riding out urges without acting on them. The goal is to learn that not every urge has to be followed.',
 'https://www.pathlightbh.com/video/urge-surfing-guided-meditation', 'video', null, 'English', '{urge surfing,cravings,mindfulness,meditation}', 'Anyone managing urges or cravings', true,
 'Provider video page found via search'),
('Urge Surfing in Alcohol and Drug Work', 'Craving management', 'Queensland Health (Insight)',
 'A demonstration of urge surfing used by a worker supporting someone who is having cravings. Aimed at practitioners, but useful for peers and family to see how the technique is taught.',
 'https://www.qscriptlearn.health.qld.gov.au/training/urge-surfing-in-alcohol-and-drug-work/detail', 'video', null, 'English', '{urge surfing,cravings,support workers}', 'Support workers, family and peers', false,
 'Queensland Health training page found via search; may require a free QScript login to play'),
('A Simple Way to Break a Bad Habit (Judson Brewer)', 'Healthy habits', 'TED',
 'A psychiatrist and addiction researcher explains how curiosity and mindful awareness can loosen habit loops such as smoking and overeating.',
 'https://www.ted.com/talks/judson_brewer_a_simple_way_to_break_a_bad_habit', 'video', null, 'English', '{habits,mindfulness,craving,smoking}', 'Anyone working on a habit', true,
 'Talk title confirmed in a secondary source; URL follows TED slug convention, so confirm it before your demo')
on conflict (url) do nothing;
