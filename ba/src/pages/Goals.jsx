import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pause, Play, Archive, Trash2, Pencil, Check, Trophy } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { Field, Spinner, ErrorBox, Empty, PageHeader, Modal, Confirm, Progress } from '../components/ui'
import { goalSchema } from '../schemas'
import { HABIT_CATEGORIES } from '../lib/constants'
import { listGoals, listHabitLogs, saveGoal, setGoalStatus, deleteGoal, toggleHabit, syncMilestones } from '../services/api'
import { todayISO, addDays, fmtDate, cx } from '../lib/utils'

function GoalForm({ goal, onDone }) {
  const { user } = useAuth(); const toast = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(goalSchema), defaultValues: goal ? { title: goal.title, description: goal.description || '', category: goal.category, target_days: goal.target_days, target_date: goal.target_date || '' } : { category: 'other', target_days: 30, title: '', description: '', target_date: '' } })
  const submit = async (v) => { try { await saveGoal(user.id, v, goal?.id); toast.success(goal ? 'Goal updated' : 'Goal created'); await syncMilestones(user.id); onDone(true) } catch (e) { toast.error(e.message) } }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <Field label="Goal" error={errors.title?.message}><input className="input" placeholder="e.g. Smoke-free days" {...register('title')} /></Field>
      <Field label="Details (optional)" error={errors.description?.message}><textarea rows={2} className="input" {...register('description')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Habit category"><select className="input" {...register('category')}>{HABIT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></Field>
        <Field label="Target: days completed" hint="Progress = logged days ÷ this number" error={errors.target_days?.message}><input type="number" min={1} className="input" {...register('target_days')} /></Field>
      </div>
      <Field label="Target date (optional)"><input type="date" className="input" {...register('target_date')} /></Field>
      <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => onDone(false)}>Cancel</button><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save goal'}</button></div>
    </form>
  )
}

export default function Goals() {
  const { user } = useAuth(); const toast = useToast()
  const { data, loading, error, reload } = useAsync(async () => { const [g, l] = await Promise.all([listGoals(user.id), listHabitLogs(user.id)]); return { g, l } }, [user.id])
  const [edit, setEdit] = useState(null); const [del, setDel] = useState(null); const [show, setShow] = useState('active'); const today = todayISO()
  const logsBy = useMemo(() => { const m = {}; (data?.l || []).forEach((x) => { (m[x.goal_id] ||= new Set()).add(x.log_date) }); return m }, [data])
  const act = async (fn, msg) => { try { await fn(); toast.success(msg); await syncMilestones(user.id); reload() } catch (e) { toast.error(e.message) } }
  const pct = (g) => Math.min(100, ((logsBy[g.id]?.size || 0) / g.target_days) * 100)
  const goals = (data?.g || []).filter((g) => (show === 'all' ? true : show === 'active' ? ['active', 'paused'].includes(g.status) : g.status === show))
  const chart = (data?.g || []).filter((g) => g.status !== 'archived').map((g) => ({ name: g.title.length > 18 ? g.title.slice(0, 17) + '…' : g.title, progress: Math.round(pct(g)) }))
  return (
    <div className="w-full">
      <PageHeader title="Goals and habits" subtitle="Tick off each day you follow through. Progress is calculated from your logged days." actions={<button className="btn-primary" onClick={() => setEdit({})}><Plus size={16} />New goal</button>} />
      <div className="mb-4 flex flex-wrap gap-2">{['active', 'completed', 'archived', 'all'].map((s) => <button key={s} onClick={() => setShow(s)} className={cx('rounded-full border px-3 py-1 text-sm capitalize', show === s ? 'border-forest-600 bg-forest-600 text-white' : 'border-neutral-300 bg-white')}>{s}</button>)}</div>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="grid gap-6 2xl:grid-cols-3">
          <div className="space-y-4 2xl:col-span-2">
            {goals.length === 0 ? <Empty title="No goals here yet" action={<button className="btn-primary" onClick={() => setEdit({})}>Create a goal</button>}>Set something measurable, like 30 smoke-free days or 20 walks.</Empty> : goals.map((g) => {
              const logs = logsBy[g.id] || new Set(); const p = pct(g); const done = logs.has(today)
              return (
                <div key={g.id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><h3 className="text-lg font-bold">{g.title} {g.status !== 'active' && <span className="chip ml-1 capitalize">{g.status}</span>}</h3>
                      <p className="text-xs text-neutral-500">{logs.size} of {g.target_days} days{g.target_date && ` · target ${fmtDate(g.target_date)}`}</p></div>
                    <div className="flex gap-1">
                      <button className="rounded p-2 hover:bg-sand" aria-label="Edit goal" onClick={() => setEdit(g)}><Pencil size={16} /></button>
                      {g.status === 'active' && <button className="rounded p-2 hover:bg-sand" aria-label="Pause goal" onClick={() => act(() => setGoalStatus(g.id, 'paused'), 'Goal paused')}><Pause size={16} /></button>}
                      {g.status === 'paused' && <button className="rounded p-2 hover:bg-sand" aria-label="Resume goal" onClick={() => act(() => setGoalStatus(g.id, 'active'), 'Goal resumed')}><Play size={16} /></button>}
                      {g.status !== 'archived' && <button className="rounded p-2 hover:bg-sand" aria-label="Archive goal" onClick={() => act(() => setGoalStatus(g.id, 'archived'), 'Goal archived')}><Archive size={16} /></button>}
                      <button className="rounded p-2 hover:bg-red-50" aria-label="Delete goal" onClick={() => setDel(g)}><Trash2 size={16} className="text-red-700" /></button>
                    </div></div>
                  {g.description && <p className="mt-2 text-sm text-neutral-700">{g.description}</p>}
                  <div className="mt-3 flex items-center gap-3"><div className="flex-1"><Progress value={p} /></div><span className="text-sm font-semibold">{Math.round(p)}%</span></div>
                  <div className="mt-2 flex gap-3 text-xs text-neutral-500">{[25, 50, 75, 100].map((m) => <span key={m} className={cx(p >= m && 'font-semibold text-teal2-600')}>{p >= m ? '✓ ' : ''}{m}%</span>)}</div>
                  <div className="mt-3 flex items-center gap-1" aria-label="Last 14 days">{Array.from({ length: 14 }, (_, i) => addDays(today, i - 13)).map((d) => <span key={d} title={d} className={cx('h-4 w-4 rounded-sm', logs.has(d) ? 'bg-teal2-500' : 'bg-forest-100')} />)}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {g.status === 'active' && <button className={done ? 'btn-ghost' : 'btn-primary'} onClick={() => act(() => toggleHabit(user.id, g.id, today, done), done ? 'Unmarked for today' : 'Marked done for today')}><Check size={16} />{done ? 'Done today (undo)' : 'Mark done today'}</button>}
                    {g.status !== 'completed' && p >= 100 && <button className="btn-ghost" onClick={() => act(() => setGoalStatus(g.id, 'completed'), 'Goal completed. Well done.')}><Trophy size={16} />Mark goal completed</button>}
                  </div>
                </div>)
            })}
          </div>
          <div className="card h-fit"><h2 className="mb-3 text-lg font-bold">Progress by goal</h2>
            {chart.length === 0 ? <p className="text-sm text-neutral-600">Create a goal to see progress here.</p> : (
              <div className="h-64"><ResponsiveContainer><BarChart data={chart} layout="vertical" margin={{ left: 10 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" domain={[0, 100]} unit="%" /><YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="progress" name="Progress (%)" fill="#14968b" radius={4} /></BarChart></ResponsiveContainer></div>)}</div>
        </div>)}
      {edit && <Modal title={edit.id ? 'Edit goal' : 'New goal'} onClose={() => setEdit(null)}><GoalForm goal={edit.id ? edit : null} onDone={(ch) => { setEdit(null); if (ch) reload() }} /></Modal>}
      {del && <Confirm title="Delete this goal?" message="The goal and all its daily logs will be permanently removed. To keep the history, archive it instead." onCancel={() => setDel(null)} onConfirm={async () => { await act(() => deleteGoal(del.id), 'Goal deleted'); setDel(null) }} />}
    </div>
  )
}
