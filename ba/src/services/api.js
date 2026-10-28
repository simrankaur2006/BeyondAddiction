import { supabase } from '../lib/supabase'
import { MILESTONES } from '../lib/constants'
import { checkInStreak, todayISO } from '../lib/utils'

const must = ({ data, error }) => { if (error) throw new Error(error.message); return data }
const csv = (s) => (s || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10)
const clean = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === '' ? null : v]))

// ---------- profile ----------
export const saveProfile = async (uid, values) => must(await supabase.from('profiles').update(clean(values)).eq('id', uid).select().single())
export const getPrefs = async (uid) => must(await supabase.from('notification_preferences').select('*').eq('user_id', uid).maybeSingle())
export const savePrefs = async (uid, v) => must(await supabase.from('notification_preferences').upsert({ user_id: uid, ...v, updated_at: new Date().toISOString() }).select().single())
export const deleteAccount = async () => must(await supabase.rpc('delete_my_account'))
export async function exportAllData(uid) {
  const tables = ['profiles', 'recovery_goals', 'habit_logs', 'daily_check_ins', 'journal_entries', 'saved_resources', 'milestones', 'notifications', 'notification_preferences', 'community_posts', 'community_comments']
  const out = { exported_at: new Date().toISOString() }
  for (const t of tables) {
    const col = t === 'profiles' ? 'id' : 'user_id'
    out[t] = must(await supabase.from(t).select('*').eq(col, uid))
  }
  return out
}

// ---------- check-ins ----------
export const listCheckIns = async (uid, from) => {
  let q = supabase.from('daily_check_ins').select('*').eq('user_id', uid).order('check_in_date', { ascending: false })
  if (from) q = q.gte('check_in_date', from)
  return must(await q.limit(400))
}
export const getCheckIn = async (uid, date) => must(await supabase.from('daily_check_ins').select('*').eq('user_id', uid).eq('check_in_date', date).maybeSingle())
export const saveCheckIn = async (uid, v) => {
  const row = { ...clean(v), user_id: uid, triggers: v.triggers || [], activities: v.activities || [], setback: !!v.setback }
  // unique(user_id, check_in_date) => one entry per day; saving again edits it
  return must(await supabase.from('daily_check_ins').upsert(row, { onConflict: 'user_id,check_in_date' }).select().single())
}
export const deleteCheckIn = async (id) => must(await supabase.from('daily_check_ins').delete().eq('id', id))

// ---------- goals & habits ----------
export const listGoals = async (uid) => must(await supabase.from('recovery_goals').select('*').eq('user_id', uid).order('created_at', { ascending: false }))
export const saveGoal = async (uid, v, id) => {
  const row = clean(v)
  return id ? must(await supabase.from('recovery_goals').update(row).eq('id', id).select().single())
    : must(await supabase.from('recovery_goals').insert({ ...row, user_id: uid }).select().single())
}
export const setGoalStatus = async (id, status) => must(await supabase.from('recovery_goals').update({ status }).eq('id', id))
export const deleteGoal = async (id) => must(await supabase.from('recovery_goals').delete().eq('id', id))
export const listHabitLogs = async (uid, from) => {
  let q = supabase.from('habit_logs').select('goal_id,log_date').eq('user_id', uid)
  if (from) q = q.gte('log_date', from)
  return must(await q.limit(5000))
}
export const toggleHabit = async (uid, goalId, date, done) => done
  ? must(await supabase.from('habit_logs').delete().eq('goal_id', goalId).eq('log_date', date))
  : must(await supabase.from('habit_logs').insert({ goal_id: goalId, user_id: uid, log_date: date }))

// ---------- journal ----------
export const listJournal = async (uid) => must(await supabase.from('journal_entries').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(500))
export const saveJournal = async (uid, v, id) => {
  const row = { title: v.title, body: v.body, mood: v.mood || null, tags: csv(v.tags) }
  return id ? must(await supabase.from('journal_entries').update(row).eq('id', id).select().single())
    : must(await supabase.from('journal_entries').insert({ ...row, user_id: uid }).select().single())
}
export const deleteJournal = async (id) => must(await supabase.from('journal_entries').delete().eq('id', id))

// ---------- resources ----------
export const listResources = async () => must(await supabase.from('resources').select('*').eq('published', true).order('featured', { ascending: false }).order('title'))
export const listAllResources = async () => must(await supabase.from('resources').select('*').order('created_at', { ascending: false }))
export const listSaved = async (uid) => must(await supabase.from('saved_resources').select('resource_id,created_at,resources(*)').eq('user_id', uid).order('created_at', { ascending: false }))
export const savedIds = async (uid) => new Set(must(await supabase.from('saved_resources').select('resource_id').eq('user_id', uid)).map((r) => r.resource_id))
export const toggleSave = async (uid, rid, saved) => saved
  ? must(await supabase.from('saved_resources').delete().eq('user_id', uid).eq('resource_id', rid))
  : must(await supabase.from('saved_resources').insert({ user_id: uid, resource_id: rid }))
export async function saveResource(adminId, v, id) {
  const row = { ...clean(v), tags: csv(v.tags) }
  const res = id ? must(await supabase.from('resources').update(row).eq('id', id).select().single()) : must(await supabase.from('resources').insert(row).select().single())
  await audit(adminId, id ? 'resource.update' : 'resource.create', res.id, { title: res.title })
  return res
}
export async function setPublished(adminId, r, published) {
  must(await supabase.from('resources').update({ published }).eq('id', r.id))
  await audit(adminId, published ? 'resource.publish' : 'resource.unpublish', r.id, { title: r.title })
}
export const audit = async (adminId, action, target, details) => must(await supabase.from('audit_logs').insert({ admin_id: adminId, action, target, details }))

// ---------- community ----------
const PAGE = 10
export async function listPosts({ category, page = 0 }) {
  let q = supabase.from('community_posts').select('*').eq('hidden', false).order('created_at', { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1)
  if (category && category !== 'all') q = q.eq('category', category)
  const posts = must(await q)
  const ids = posts.map((p) => p.id)
  let reactions = [], comments = []
  if (ids.length) {
    reactions = must(await supabase.from('community_reactions').select('post_id,user_id').in('post_id', ids))
    comments = must(await supabase.from('community_comments').select('post_id').eq('hidden', false).in('post_id', ids))
  }
  return {
    hasMore: posts.length === PAGE,
    posts: posts.map((p) => ({ ...p, reactions: reactions.filter((r) => r.post_id === p.id), commentCount: comments.filter((c) => c.post_id === p.id).length })),
  }
}
export const createPost = async (v) => must(await supabase.from('community_posts').insert({ title: v.title, body: v.body, category: v.category }).select().single())
export const updatePost = async (id, v) => must(await supabase.from('community_posts').update({ title: v.title, body: v.body, category: v.category }).eq('id', id).select().single())
export const deletePost = async (id) => must(await supabase.from('community_posts').delete().eq('id', id))
export const toggleReaction = async (uid, postId, on) => on
  ? must(await supabase.from('community_reactions').delete().eq('post_id', postId).eq('user_id', uid))
  : must(await supabase.from('community_reactions').insert({ post_id: postId, user_id: uid }))
export const listComments = async (postId) => must(await supabase.from('community_comments').select('*').eq('post_id', postId).eq('hidden', false).order('created_at'))
export const addComment = async (postId, body) => must(await supabase.from('community_comments').insert({ post_id: postId, body }).select().single())
export const deleteComment = async (id) => must(await supabase.from('community_comments').delete().eq('id', id))
export const reportPost = async (uid, postId, reason) => {
  const { error } = await supabase.from('community_reports').insert({ post_id: postId, reporter_id: uid, reason })
  if (error?.code === '23505') throw new Error('You have already reported this post.')
  if (error) throw new Error(error.message)
}
export const listReports = async () => must(await supabase.from('community_reports').select('*, community_posts(id,title,body,author_name,hidden)').order('created_at', { ascending: false }).limit(100))
export async function resolveReport(adminId, report, status, hidePost) {
  must(await supabase.from('community_reports').update({ status, resolved_by: adminId }).eq('id', report.id))
  if (hidePost) must(await supabase.from('community_posts').update({ hidden: true }).eq('id', report.post_id))
  await audit(adminId, `report.${status}${hidePost ? '.hide_post' : ''}`, report.id, { post_id: report.post_id })
}

// ---------- notifications & milestones ----------
export const listNotifications = async (uid) => must(await supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(100))
export const unreadCount = async (uid) => { const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('read', false); if (error) throw new Error(error.message); return count || 0 }
export const markRead = async (id) => must(await supabase.from('notifications').update({ read: true }).eq('id', id))
export const markAllRead = async (uid) => must(await supabase.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false))
export const clearNotifications = async (uid) => must(await supabase.from('notifications').delete().eq('user_id', uid))
export const listMilestones = async (uid) => must(await supabase.from('milestones').select('*').eq('user_id', uid).order('achieved_at', { ascending: false }))

/** Evaluates transparent rules against stored records and records newly earned milestones (unique per user+key). */
export async function syncMilestones(uid, { alerts = true } = {}) {
  const [checkIns, goals, journal, have] = await Promise.all([
    must(await supabase.from('daily_check_ins').select('check_in_date').eq('user_id', uid)),
    must(await supabase.from('recovery_goals').select('id,status').eq('user_id', uid)),
    must(await supabase.from('journal_entries').select('id', { count: 'exact', head: false }).eq('user_id', uid)),
    listMilestones(uid),
  ])
  const dates = checkIns.map((c) => c.check_in_date)
  const earned = {
    first_checkin: dates.length >= 1, first_goal: goals.length >= 1, seven_checkins: dates.length >= 7,
    seven_day_streak: checkInStreak(dates) >= 7, goal_completed: goals.some((g) => g.status === 'completed'),
    five_journal: journal.length >= 5, thirty_checkins: dates.length >= 30,
  }
  const owned = new Set(have.map((m) => m.key))
  const fresh = Object.keys(earned).filter((k) => earned[k] && !owned.has(k))
  for (const key of fresh) {
    const { error } = await supabase.from('milestones').insert({ user_id: uid, key })
    if (error && error.code !== '23505') throw new Error(error.message)
    if (!error && alerts) await supabase.from('notifications').insert({ user_id: uid, title: `Milestone: ${MILESTONES[key].title}`, body: MILESTONES[key].desc })
  }
  return fresh
}
export { todayISO }
export const getResource = async (id) => must(await supabase.from('resources').select('*').eq('id', id).maybeSingle())
