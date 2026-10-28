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
