import { useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { Spinner, ErrorBox, Empty, PageHeader, Stat, Progress } from '../components/ui'
import TrendChart, { SERIES } from '../components/TrendChart'
import { listCheckIns, listGoals, listHabitLogs, listMilestones } from '../services/api'
import { MILESTONES } from '../lib/constants'
import { todayISO, addDays, range, avg, fmtDate, daysBetween } from '../lib/utils'

export default function Analytics() {
  const { user } = useAuth(); const [days, setDays] = useState(30)
  const from = addDays(todayISO(), -(days - 1))
  const { data, loading, error, reload } = useAsync(async () => {
    const [c, g, l, m] = await Promise.all([listCheckIns(user.id, from), listGoals(user.id), listHabitLogs(user.id, from), listMilestones(user.id)])
    return { c, g, l, m }
  }, [user.id, days])
  const v = useMemo(() => {
    if (!data) return null
    const by = Object.fromEntries(data.c.map((x) => [x.check_in_date, x]))
    const rows = range(from, todayISO()).map((d) => ({ date: d, mood: by[d]?.mood ?? null, stress: by[d]?.stress ?? null, craving: by[d]?.craving ?? null, sleep: by[d]?.sleep ?? null }))
    // weekly buckets of check-in counts (7-day blocks ending today)
    const weeks = []; for (let end = todayISO(); daysBetween(from, end) >= 0 && weeks.length < 13; end = addDays(end, -7)) { const start = addDays(end, -6); weeks.unshift({ week: `${start.slice(5)}`, checkIns: data.c.filter((x) => x.check_in_date >= start && x.check_in_date <= end).length, habitDays: data.l.filter((x) => x.log_date >= start && x.log_date <= end).length }) }
    const trig = {}; data.c.forEach((x) => x.triggers.forEach((t) => { trig[t] = (trig[t] || 0) + 1 }))
    const acts = {}; data.c.forEach((x) => x.activities.forEach((t) => { acts[t] = (acts[t] || 0) + 1 }))
    const goals = data.g.filter((g) => g.status !== 'archived').map((g) => { const n = data.l.filter((x) => x.goal_id === g.id).length; const expected = Math.min(days, Math.max(1, daysBetween(g.start_date > from ? g.start_date : from, todayISO()) + 1)); return { g, n, rate: Math.round((n / expected) * 100) } })
    return { rows, weeks, trig: Object.entries(trig).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })), acts: Object.entries(acts).sort((a, b) => b[1] - a[1]).slice(0, 8), goals, n: data.c.length, setbacks: data.c.filter((x) => x.setback) }
  }, [data, days]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="w-full">
      <PageHeader title="Analytics" subtitle="Descriptive summaries of what you recorded. They show patterns in your entries, not causes, and are not medical conclusions." actions={<select className="input" value={days} onChange={(e) => setDays(+e.target.value)} aria-label="Date range"><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select>} />
      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} /> : v.n === 0 ? <Empty title="No data in this range">Complete a few daily check-ins and your charts will appear here. Nothing is estimated or filled in for you.</Empty> : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Check-ins" value={v.n} sub={`in the last ${days} days`} /><Stat label="Average mood" value={avg(data.c.map((c) => c.mood))} sub="out of 5" /><Stat label="Average craving" value={avg(data.c.map((c) => c.craving))} sub="out of 10" /><Stat label="Setbacks noted" value={v.setbacks.length} sub="self-recorded" /></div>
          <section className="card"><h2 className="mb-1 text-lg font-bold">Daily ratings</h2>
            {v.n < 3 ? <p className="text-sm text-neutral-600">At least 3 check-ins are needed before a trend line is meaningful. You have {v.n}.</p> : <TrendChart rows={v.rows} series={SERIES} height={300} />}
            <p className="mt-2 text-xs text-neutral-500">Days without a check-in are left blank, not estimated.</p></section>
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="card"><h2 className="mb-3 text-lg font-bold">Weekly activity</h2><div className="h-64"><ResponsiveContainer><BarChart data={v.weeks}><CartesianGrid strokeDasharray="3 3" stroke="#d5e9df" /><XAxis dataKey="week" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="checkIns" name="Check-ins" fill="#14968b" radius={3} /><Bar dataKey="habitDays" name="Habit days logged" fill="#184c3d" radius={3} /></BarChart></ResponsiveContainer></div><p className="mt-1 text-xs text-neutral-500">Each bar is a 7-day block; the label is its first day (MM-DD).</p></section>
            <section className="card"><h2 className="mb-3 text-lg font-bold">Trigger frequency</h2>{v.trig.length === 0 ? <p className="text-sm text-neutral-600">No triggers recorded in this range.</p> : <div style={{ height: Math.max(200, v.trig.length * 34) }}><ResponsiveContainer><BarChart data={v.trig} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#d5e9df" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="count" name="Days noted" fill="#c8692f" radius={3} /></BarChart></ResponsiveContainer></div>}</section>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="card"><h2 className="mb-3 text-lg font-bold">Habit completion</h2>{v.goals.length === 0 ? <p className="text-sm text-neutral-600">No goals yet.</p> : <ul className="space-y-4">{v.goals.map(({ g, n, rate }) => <li key={g.id}><div className="mb-1 flex justify-between text-sm"><span className="font-medium">{g.title}</span><span>{n} days logged · {rate}% of days in range</span></div><Progress value={rate} /></li>)}</ul>}</section>
            <section className="card"><h2 className="mb-3 text-lg font-bold">Activity history and milestones</h2>
              {v.acts.length ? <div className="mb-4 flex flex-wrap gap-2">{v.acts.map(([a, n]) => <span key={a} className="chip">{a} × {n}</span>)}</div> : <p className="mb-4 text-sm text-neutral-600">No activities recorded in this range.</p>}
              {data.m.length ? <ul className="space-y-1 text-sm">{data.m.map((m) => <li key={m.id}>🏅 <strong>{MILESTONES[m.key]?.title || m.key}</strong> <span className="text-neutral-500">· {fmtDate(m.achieved_at)}</span></li>)}</ul> : <p className="text-sm text-neutral-600">No milestones earned yet.</p>}</section>
          </div>
        </div>)}
    </div>
  )
}
