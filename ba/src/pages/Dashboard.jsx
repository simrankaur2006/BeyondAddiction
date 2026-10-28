import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, Target, BookText, Library, Flame, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { Spinner, ErrorBox, Empty, Stat, Progress, Disclaimer } from '../components/ui'
import TrendChart, { SERIES } from '../components/TrendChart'
import ResourceCard from '../components/ResourceCard'
import { useSaved } from './Resources'
import { listCheckIns, listGoals, listHabitLogs, listResources, listMilestones, getPrefs, syncMilestones } from '../services/api'
import { recommend } from '../lib/recommend'
import { MILESTONES, MOODS } from '../lib/constants'
import { todayISO, addDays, checkInStreak, progressDays, avg, range, fmtDate } from '../lib/utils'

export default function Dashboard() {
  const { user, profile } = useAuth(); const saved = useSaved()
  const today = todayISO(); const from = addDays(today, -13)
  const { data, loading, error, reload } = useAsync(async () => {
    const [checkIns, goals, logs, resources, milestones, prefs] = await Promise.all([listCheckIns(user.id, addDays(today, -120)), listGoals(user.id), listHabitLogs(user.id, addDays(today, -6)), listResources(), listMilestones(user.id), getPrefs(user.id)])
    return { checkIns, goals, logs, resources, milestones, prefs }
  }, [user.id])
  useEffect(() => { syncMilestones(user.id).then((f) => f.length && reload()).catch(() => {}) }, [user.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const v = useMemo(() => {
    if (!data) return null
    const dates = data.checkIns.map((c) => c.check_in_date); const byDate = Object.fromEntries(data.checkIns.map((c) => [c.check_in_date, c]))
    const active = data.goals.filter((g) => g.status === 'active')
    const week = range(addDays(today, -6), today)
    const logCount = {}; data.logs.forEach((l) => { logCount[l.goal_id] = (logCount[l.goal_id] || 0) + 1 })
    return {
      byDate, dates, active, streak: checkInStreak(dates), todayEntry: byDate[today],
      weekCheckIns: week.filter((d) => byDate[d]).length, weekHabit: data.logs.length,
      days: progressDays(profile?.recovery_start_date, data.checkIns.filter((c) => c.setback).map((c) => c.check_in_date)),
      rows: range(from, today).map((d) => ({ date: d, mood: byDate[d]?.mood ?? null, craving: byDate[d]?.craving ?? null })),
      recentActs: [...new Set(data.checkIns.slice(0, 7).flatMap((c) => c.activities))].slice(0, 8),
      next: Object.keys(MILESTONES).filter((k) => !data.milestones.some((m) => m.key === k)).slice(0, 3),
      recs: recommend(data.resources, { profile, goals: data.goals, saved: saved.set, checkIns: data.checkIns }),
      savedRes: data.resources.filter((r) => saved.set.has(r.id)).slice(0, 3),
      goalPct: active.map((g) => ({ g, p: Math.min(100, ((data.goals && (logCount[g.id] || 0)) / Math.min(g.target_days, 7)) * 100) })),
    }
  }, [data, profile, saved.set]) // eslint-disable-line react-hooks/exhaustive-deps
  if (loading) return <Spinner label="Loading your dashboard" />
  if (error) return <ErrorBox message={error} onRetry={reload} />
  const name = profile?.display_name || 'there'
  const remind = data.prefs?.reminders_enabled && !v.todayEntry
  const withData = v.rows.filter((r) => r.mood != null || r.craving != null).length
  return (
    <div className="w-full space-y-6">
      <div><h1 className="text-3xl font-bold">Hello, {name}</h1><p className="text-sm text-neutral-600">{profile?.recovery_goal ? `Your goal: ${profile.recovery_goal}` : 'Here is where things stand today.'}</p></div>
      {remind && <div className="flex items-center gap-3 rounded-xl border border-clay/30 bg-clay/10 p-4 text-sm" role="status"><Bell size={18} className="text-clay" /><span className="flex-1">You have not checked in today. It takes about a minute.</span><Link to="/app/check-in" className="btn-primary !py-1.5">Check in</Link></div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card"><p className="text-xs font-medium text-neutral-500">Today</p>{v.todayEntry ? <><p className="mt-1 font-display text-2xl text-forest-800">Checked in {v.todayEntry.mood ? MOODS[v.todayEntry.mood - 1].e : '✓'}</p><Link className="link text-sm" to="/app/check-in">Edit today's check-in</Link></> : <><p className="mt-1 font-display text-2xl text-forest-800">Not yet</p><Link className="link text-sm" to="/app/check-in">Start check-in</Link></>}</div>
        <Stat label="Check-in streak" value={<span className="inline-flex items-center gap-1"><Flame size={22} className="text-clay" />{v.streak}</span>} sub="Consecutive days with a check-in. A missed day only resets this count, nothing else." />
        <Stat label="Days of progress" value={v.days ?? '–'} sub={v.days == null ? 'Add a start date in Settings to count days.' : 'Since your start date or last recorded setback.'} />
        <Stat label="This week" value={`${v.weekCheckIns}/7`} sub={`check-ins · ${v.weekHabit} habit days logged`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card xl:col-span-2"><h2 className="mb-3 text-lg font-bold">Mood and cravings, last 14 days</h2>
          {withData < 2 ? <Empty title="Not enough data yet">Trends appear after at least two check-ins with a mood or craving rating.</Empty> : <TrendChart rows={v.rows} series={SERIES.filter((s) => ['mood', 'craving'].includes(s.key))} />}</section>
        <section className="card"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Goals this week</h2><Link className="link text-sm" to="/app/goals">Manage</Link></div>
          {v.active.length === 0 ? <Empty icon={Target} title="No active goals" action={<Link className="btn-primary" to="/app/goals">Create a goal</Link>} /> : <ul className="space-y-4">{v.goalPct.map(({ g, p }) => <li key={g.id}><div className="mb-1 flex justify-between text-sm"><span className="font-medium">{g.title}</span><span>{Math.round(p)}%</span></div><Progress value={p} /></li>)}</ul>}
          {v.active.length > 0 && <p className="mt-3 text-xs text-neutral-500">Weekly view: days logged in the last 7 (up to 7). Overall progress is on the Goals page.</p>}</section>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card"><h2 className="mb-3 text-lg font-bold">Recent check-ins</h2>
          {data.checkIns.length === 0 ? <p className="text-sm text-neutral-600">No check-ins yet.</p> : <ul className="space-y-2 text-sm">{data.checkIns.slice(0, 5).map((c) => <li key={c.id} className="flex justify-between"><span>{fmtDate(c.check_in_date)}</span><span className="text-neutral-600">{[c.mood && MOODS[c.mood - 1].e, c.craving != null && `craving ${c.craving}`].filter(Boolean).join(' · ') || 'saved'}</span></li>)}</ul>}
          {v.recentActs.length > 0 && <><p className="mb-1 mt-4 text-xs font-medium text-neutral-500">Recently completed activities</p><div className="flex flex-wrap gap-1.5">{v.recentActs.map((a) => <span key={a} className="chip">{a}</span>)}</div></>}</section>
        <section className="card"><h2 className="mb-3 text-lg font-bold">Upcoming milestones</h2>
          {v.next.length === 0 ? <p className="text-sm text-neutral-600">You have earned every milestone. Nice work.</p> : <ul className="space-y-2 text-sm">{v.next.map((k) => <li key={k}><p className="font-semibold">{MILESTONES[k].title}</p><p className="text-neutral-600">{MILESTONES[k].desc}</p></li>)}</ul>}
          <p className="mt-3 text-xs text-neutral-500">Earned: {data.milestones.length} of {Object.keys(MILESTONES).length}. <Link className="link" to="/app/recovery">See all</Link></p></section>
        <section className="card"><h2 className="mb-3 text-lg font-bold">Quick actions</h2>
          <div className="grid gap-2"><Link to="/app/check-in" className="btn-primary justify-start"><CalendarCheck size={16} />Daily check-in</Link><Link to="/app/journal" className="btn-ghost justify-start"><BookText size={16} />Write in journal</Link><Link to="/app/goals" className="btn-ghost justify-start"><Target size={16} />Update goals</Link><Link to="/resources" className="btn-ghost justify-start"><Library size={16} />Browse resources</Link></div></section>
      </div>
      <section><div className="mb-3 flex items-end justify-between"><h2 className="text-xl font-bold">Suggested for you</h2><Link to="/resources" className="link text-sm">All resources</Link></div>
        {v.recs.length === 0 ? <Empty icon={Library} title="No suggestions yet" action={<Link className="btn-primary" to="/app/settings">Choose topics</Link>}>Pick a habit and topics in Settings, or create a goal, and matching resources will appear here.</Empty>
          : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{v.recs.map((r) => <ResourceCard key={r.id} r={r} reasons={r.reasons} canSave saved={saved.set.has(r.id)} onToggle={saved.toggle} />)}</div>}
        <p className="mt-2 text-xs text-neutral-500">Suggestions use simple rules (your habit, topics, goals, saved items and recent ratings). They are educational, not medical advice.</p></section>
      {v.savedRes.length > 0 && <section><h2 className="mb-3 text-xl font-bold">Saved resources</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{v.savedRes.map((r) => <ResourceCard key={r.id} r={r} canSave saved onToggle={saved.toggle} />)}</div></section>}
      <Disclaimer />
    </div>
  )
}
