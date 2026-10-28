import { Link } from 'react-router-dom'
import { Award, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { Spinner, ErrorBox, PageHeader, Stat, Empty, Disclaimer } from '../components/ui'
import { listCheckIns, listMilestones, syncMilestones } from '../services/api'
import { MILESTONES } from '../lib/constants'
import { checkInStreak, progressDays, fmtDate } from '../lib/utils'

export default function Recovery() {
  const { user, profile } = useAuth()
  const { data, loading, error, reload } = useAsync(async () => { await syncMilestones(user.id); const [c, m] = await Promise.all([listCheckIns(user.id), listMilestones(user.id)]); return { c, m } }, [user.id])
  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} onRetry={reload} />
  const setbacks = data.c.filter((c) => c.setback)
  const days = progressDays(profile?.recovery_start_date, setbacks.map((s) => s.check_in_date))
  const have = Object.fromEntries(data.m.map((m) => [m.key, m]))
  return (
    <div className="w-full">
      <PageHeader title="My recovery" subtitle={profile?.recovery_goal || 'Your progress, how it is counted, and the milestones you have reached.'} actions={<Link to="/app/settings" className="btn-ghost">Edit preferences</Link>} />
      <div className="grid gap-4 sm:grid-cols-3"><Stat label="Days of progress" value={days ?? '–'} sub={profile?.recovery_start_date ? `Counting from ${fmtDate(setbacks[0]?.check_in_date > profile.recovery_start_date ? setbacks[0].check_in_date : profile.recovery_start_date)} or later` : 'Set a start date in Settings'} /><Stat label="Check-in streak" value={checkInStreak(data.c.map((c) => c.check_in_date))} sub="consecutive days" /><Stat label="Total check-ins" value={data.c.length} /></div>
      <section className="card mt-6"><h2 className="text-lg font-bold">How progress is counted</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700"><li><strong>Days of progress</strong> = days since your start date, or since the last setback you recorded, whichever is later.</li><li><strong>Check-in streak</strong> = consecutive days with a check-in. Missing a day resets the streak only; it is never treated as a setback.</li><li>A setback restarts the day count. Your check-ins, goals, journal and milestones are kept.</li></ul></section>
      <section className="mt-6"><h2 className="mb-3 text-xl font-bold">Milestones</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(MILESTONES).map(([k, m]) => (
          <div key={k} className={`card ${have[k] ? '' : 'opacity-60'}`}>{have[k] ? <Award className="text-clay" /> : <Lock className="text-neutral-400" />}<p className="mt-2 font-bold">{m.title}</p><p className="text-sm text-neutral-600">{m.desc}</p><p className="mt-1 text-xs text-teal2-600">{have[k] ? `Earned ${fmtDate(have[k].achieved_at)}` : 'Not yet'}</p></div>))}</div>
        <p className="mt-2 text-xs text-neutral-500">Milestones are calculated from your own records using the rules above. They do not claim anything about recovery outcomes.</p></section>
      <section className="mt-6"><h2 className="mb-3 text-xl font-bold">Recorded setbacks</h2>
        {setbacks.length === 0 ? <Empty title="None recorded">If you have a setback, you can note it in a daily check-in. It is information, not failure.</Empty> : <ul className="card space-y-1 text-sm">{setbacks.map((s) => <li key={s.id}>{fmtDate(s.check_in_date)}</li>)}</ul>}</section>
      <div className="mt-6"><Disclaimer /></div>
    </div>
  )
}
