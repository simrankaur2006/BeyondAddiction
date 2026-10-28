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
