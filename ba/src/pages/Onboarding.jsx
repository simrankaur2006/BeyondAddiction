import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Field, ErrorBox } from '../components/ui'
import { Brand } from '../layouts/AppLayout'
import { profileSchema } from '../schemas'
import { HABIT_CATEGORIES, RESOURCE_CATEGORIES } from '../lib/constants'
import { saveProfile, savePrefs } from '../services/api'

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth()
  const nav = useNavigate(); const toast = useToast()
  const [interests, setInterests] = useState([]); const [reminders, setReminders] = useState(true); const [err, setErr] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { display_name: profile?.display_name || '' } })
  const finish = async (values) => {
    setErr('')
    try {
      await saveProfile(user.id, { ...values, interests, onboarded: true })
      await savePrefs(user.id, { reminders_enabled: reminders })
      await refreshProfile(); toast.success('You are all set'); nav('/app', { replace: true })
    } catch (e) { setErr(e.message) }
  }
  const skip = async () => {
    try { await saveProfile(user.id, { onboarded: true }); await refreshProfile(); nav('/app', { replace: true }) } catch (e) { setErr(e.message) }
  }
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Brand />
      <h1 className="mt-6 text-3xl font-bold">A few optional questions</h1>
      <p className="mt-1 text-sm text-neutral-600">These tailor your suggestions. Everything is optional and editable later in Settings.</p>
      <form onSubmit={handleSubmit(finish)} className="card mt-5 space-y-4" noValidate>
        {err && <ErrorBox message={err} />}
        <Field label="What should we call you?" error={errors.display_name?.message}><input className="input" maxLength={40} {...register('display_name')} /></Field>
        <Field label="Habit you are focusing on"><select className="input" {...register('habit_category')}><option value="">Prefer not to say</option>{HABIT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></Field>
        <Field label="Your goal, in your words" error={errors.recovery_goal?.message}><input className="input" maxLength={200} placeholder="e.g. Go a month without smoking" {...register('recovery_goal')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date (optional)" hint="Used to count days of progress"><input type="date" className="input" {...register('recovery_start_date')} /></Field>
          <Field label="Target date (optional)"><input type="date" className="input" {...register('target_date')} /></Field>
        </div>
        <fieldset><legend className="mb-1 text-sm font-medium">Resource topics you care about</legend>
          <div className="flex flex-wrap gap-2">{RESOURCE_CATEGORIES.map((c) => { const on = interests.includes(c); return (
            <button type="button" key={c} aria-pressed={on} onClick={() => setInterests(on ? interests.filter((x) => x !== c) : [...interests, c])} className={`rounded-full border px-3 py-1 text-xs font-medium ${on ? 'border-forest-600 bg-forest-600 text-white' : 'border-neutral-300 bg-white'}`}>{c}</button>) })}</div></fieldset>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={reminders} onChange={(e) => setReminders(e.target.checked)} />Show an in-app reminder when I have not checked in today</label>
        <div className="flex flex-wrap justify-between gap-2 pt-2"><button type="button" className="btn-ghost" onClick={skip}>Skip for now</button><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save and continue'}</button></div>
      </form>
    </div>
  )
}
