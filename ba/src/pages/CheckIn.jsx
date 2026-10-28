import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { Field, Rating, Spinner, ErrorBox, Empty, PageHeader, Confirm, Disclaimer } from '../components/ui'
import { checkInSchema } from '../schemas'
import { TRIGGERS, ACTIVITIES, MOODS } from '../lib/constants'
import { listCheckIns, saveCheckIn, deleteCheckIn, syncMilestones } from '../services/api'
import { todayISO, fmtDate, cx } from '../lib/utils'

const Toggle = ({ items, value, onChange }) => (
  <div className="flex flex-wrap gap-2">{items.map((t) => { const on = value.includes(t); return (
    <button type="button" key={t} aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== t) : [...value, t])} className={cx('rounded-full border px-3 py-1 text-xs font-medium', on ? 'border-forest-600 bg-forest-600 text-white' : 'border-neutral-300 bg-white')}>{t}</button>) })}</div>
)

export default function CheckIn() {
  const { user } = useAuth(); const toast = useToast()
  const history = useAsync(() => listCheckIns(user.id), [user.id])
  const [date, setDate] = useState(todayISO())
  const [ratings, setRatings] = useState({ mood: '', stress: '', craving: '', sleep: '' })
  const [triggers, setTriggers] = useState([]); const [activities, setActivities] = useState([]); const [setback, setSetback] = useState(false)
  const [existing, setExisting] = useState(null); const [confirm, setConfirm] = useState(null); const [busy, setBusy] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(checkInSchema), defaultValues: { check_in_date: date, notes: '', reflection: '' } })

  // Load the entry for the selected date (edit) or reset to blank
  useEffect(() => {
    const e = (history.data || []).find((c) => c.check_in_date === date) || null
    setExisting(e)
    setRatings({ mood: e?.mood ?? '', stress: e?.stress ?? '', craving: e?.craving ?? '', sleep: e?.sleep ?? '' })
    setTriggers(e?.triggers || []); setActivities(e?.activities || []); setSetback(!!e?.setback)
    reset({ check_in_date: date, notes: e?.notes || '', reflection: e?.reflection || '' })
  }, [date, history.data, reset])

  const submit = async (v) => {
    try {
      await saveCheckIn(user.id, { ...v, ...ratings, check_in_date: date, triggers, activities, setback })
      toast.success(existing ? 'Check-in updated' : 'Check-in saved')
      await syncMilestones(user.id); history.reload()
    } catch (e) { toast.error(e.message) }
  }
  const remove = async () => {
    setBusy(true)
    try { await deleteCheckIn(confirm.id); toast.success('Check-in deleted'); setConfirm(null); history.reload() } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <div className="grid w-full gap-6 xl:grid-cols-5">
      <div className="xl:col-span-3">
        <PageHeader title="Daily check-in" subtitle="Every field is optional. One entry per day; saving again on the same day edits it." />
        <form onSubmit={handleSubmit(submit)} className="card space-y-5" noValidate>
          <Field label="Date"><input type="date" className="input sm:w-56" max={todayISO()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
          {existing && <p className="rounded-lg bg-forest-50 p-2 text-sm text-forest-800">You already checked in on {fmtDate(date)}. Saving will update that entry.</p>}
          <Field label="Mood"><Rating value={ratings.mood} onChange={(v) => setRatings({ ...ratings, mood: v })} labels={MOODS.map((m) => m.e)} /></Field>
          <Field label="Stress (1 calm to 5 very stressed)"><Rating value={ratings.stress} onChange={(v) => setRatings({ ...ratings, stress: v })} /></Field>
          <Field label="Craving intensity (0 none to 10 intense)"><Rating min={0} max={10} value={ratings.craving} onChange={(v) => setRatings({ ...ratings, craving: v })} /></Field>
          <Field label="Sleep quality (1 poor to 5 great)"><Rating value={ratings.sleep} onChange={(v) => setRatings({ ...ratings, sleep: v })} /></Field>
          <div><p className="mb-1 text-sm font-medium">Triggers today</p><Toggle items={TRIGGERS} value={triggers} onChange={setTriggers} /></div>
          <div><p className="mb-1 text-sm font-medium">Things you did for yourself</p><Toggle items={ACTIVITIES} value={activities} onChange={setActivities} /></div>
          <Field label="Notes" error={errors.notes?.message}><textarea rows={2} className="input" {...register('notes')} /></Field>
          <Field label="Reflection" hint="What helped, or what would you try differently?" error={errors.reflection?.message}><textarea rows={2} className="input" {...register('reflection')} /></Field>
          <label className="flex items-start gap-2 rounded-lg bg-sand p-3 text-sm"><input type="checkbox" className="mt-1" checked={setback} onChange={(e) => setSetback(e.target.checked)} />
            <span>I had a setback today. Setbacks happen and are part of many people's journeys. Recording one restarts your progress-day count from today; it does not erase your check-ins, goals or milestones.</span></label>
          <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : existing ? 'Update check-in' : 'Save check-in'}</button>
          <Disclaimer />
        </form>
      </div>
      <div className="xl:col-span-2">
        <h2 className="mb-3 text-xl font-bold">History</h2>
        {history.loading ? <Spinner /> : history.error ? <ErrorBox message={history.error} onRetry={history.reload} /> : !history.data.length ? <Empty title="No check-ins yet">Your saved check-ins will appear here.</Empty> : (
          <ul className="space-y-2">{history.data.slice(0, 30).map((c) => (
            <li key={c.id} className="card flex items-center gap-3 !p-3">
              <div className="flex-1 text-sm"><p className="font-semibold">{fmtDate(c.check_in_date)}{c.setback && <span className="chip ml-2">setback noted</span>}</p>
                <p className="text-neutral-600">{[c.mood && `Mood ${MOODS[c.mood - 1].e}`, c.stress && `Stress ${c.stress}/5`, c.craving != null && `Craving ${c.craving}/10`, c.sleep && `Sleep ${c.sleep}/5`].filter(Boolean).join(' · ') || 'No ratings recorded'}</p></div>
              <button className="rounded p-2 hover:bg-sand" aria-label={`Edit ${c.check_in_date}`} onClick={() => { setDate(c.check_in_date); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><Pencil size={16} /></button>
              <button className="rounded p-2 hover:bg-red-50" aria-label={`Delete ${c.check_in_date}`} onClick={() => setConfirm(c)}><Trash2 size={16} className="text-red-700" /></button>
            </li>))}</ul>)}
      </div>
      {confirm && <Confirm title="Delete this check-in?" message={`The entry for ${fmtDate(confirm.check_in_date)} will be permanently removed.`} busy={busy} onConfirm={remove} onCancel={() => setConfirm(null)} />}
    </div>
  )
}
