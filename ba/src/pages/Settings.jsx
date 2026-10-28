import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Download, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { Field, Spinner, PageHeader, Confirm } from '../components/ui'
import { profileSchema, resetSchema } from '../schemas'
import { HABIT_CATEGORIES, RESOURCE_CATEGORIES } from '../lib/constants'
import { saveProfile, getPrefs, savePrefs, exportAllData, deleteAccount } from '../services/api'
import { downloadJSON, cx } from '../lib/utils'

export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth(); const toast = useToast(); const nav = useNavigate()
  const prefs = useAsync(() => getPrefs(user.id), [user.id])
  const [interests, setInterests] = useState(profile?.interests || []); const [rem, setRem] = useState(true); const [mil, setMil] = useState(true)
  const [confirmDel, setConfirmDel] = useState(false); const [typed, setTyped] = useState(''); const [busy, setBusy] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { display_name: profile?.display_name || '', recovery_goal: profile?.recovery_goal || '', habit_category: profile?.habit_category || '', recovery_start_date: profile?.recovery_start_date || '', target_date: profile?.target_date || '' } })
  const pw = useForm({ resolver: zodResolver(resetSchema) })
  useEffect(() => { if (prefs.data) { setRem(prefs.data.reminders_enabled); setMil(prefs.data.milestone_alerts) } }, [prefs.data])

  const save = async (v) => { try { await saveProfile(user.id, { ...v, interests }); await refreshProfile(); toast.success('Profile saved') } catch (e) { toast.error(e.message) } }
  const savePref = async () => { try { await savePrefs(user.id, { reminders_enabled: rem, milestone_alerts: mil }); toast.success('Notification preferences saved') } catch (e) { toast.error(e.message) } }
  const changePw = async (v) => { const { error } = await supabase.auth.updateUser({ password: v.password }); if (error) return toast.error(error.message); pw.reset(); toast.success('Password updated') }
  const exportData = async () => { try { downloadJSON('beyond-addiction-export.json', await exportAllData(user.id)); toast.success('Export downloaded') } catch (e) { toast.error(e.message) } }
  const remove = async () => { setBusy(true); try { await deleteAccount(); await signOut(); nav('/') } catch (e) { toast.error(e.message); setBusy(false) } }
  return (
    <div className="grid w-full gap-6 xl:grid-cols-2">
      <div className="xl:col-span-2"><PageHeader title="Profile and settings" subtitle="Everything here is optional and editable. Only your display name can appear publicly, and only if you post in the community." /></div>
      <form onSubmit={handleSubmit(save)} className="card space-y-4" noValidate><h2 className="text-lg font-bold">Profile and recovery preferences</h2>
        <Field label="Email"><input className="input" value={user.email} disabled /></Field>
        <Field label="Display name" error={errors.display_name?.message}><input className="input" maxLength={40} {...register('display_name')} /></Field>
        <Field label="Habit focus"><select className="input" {...register('habit_category')}><option value="">Prefer not to say</option>{HABIT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></Field>
        <Field label="Goal in your words" error={errors.recovery_goal?.message}><input className="input" maxLength={200} {...register('recovery_goal')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Start date" hint="Counts your days of progress"><input type="date" className="input" {...register('recovery_start_date')} /></Field><Field label="Target date"><input type="date" className="input" {...register('target_date')} /></Field></div>
        <fieldset><legend className="mb-1 text-sm font-medium">Preferred resource categories</legend><div className="flex flex-wrap gap-2">{RESOURCE_CATEGORIES.map((c) => { const on = interests.includes(c); return <button type="button" key={c} aria-pressed={on} onClick={() => setInterests(on ? interests.filter((x) => x !== c) : [...interests, c])} className={cx('rounded-full border px-3 py-1 text-xs font-medium', on ? 'border-forest-600 bg-forest-600 text-white' : 'border-neutral-300 bg-white')}>{c}</button> })}</div></fieldset>
        <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save profile'}</button></form>
      <div className="space-y-6">
        <section className="card space-y-3"><h2 className="text-lg font-bold">Notifications</h2>{prefs.loading ? <Spinner /> : <>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rem} onChange={(e) => setRem(e.target.checked)} />Show an in-app reminder if I have not checked in today</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mil} onChange={(e) => setMil(e.target.checked)} />Add a notification when I earn a milestone</label>
          <p className="text-xs text-neutral-500">Notifications appear inside the app only. Email and push delivery are not configured.</p><button className="btn-primary" onClick={savePref}>Save preferences</button></>}</section>
        <form onSubmit={pw.handleSubmit(changePw)} className="card space-y-3" noValidate><h2 className="text-lg font-bold">Account security</h2>
          <Field label="New password" error={pw.formState.errors.password?.message}><input type="password" autoComplete="new-password" className="input" {...pw.register('password')} /></Field>
          <Field label="Confirm new password" error={pw.formState.errors.confirm?.message}><input type="password" autoComplete="new-password" className="input" {...pw.register('confirm')} /></Field>
          <button className="btn-primary" disabled={pw.formState.isSubmitting}>Update password</button></form>
        <section className="card space-y-3"><h2 className="text-lg font-bold">Your data</h2><p className="text-sm text-neutral-700">Check-ins, goals, journal and bookmarks are private to you. Community posts show only your display name.</p>
          <div className="flex flex-wrap gap-2"><button className="btn-ghost" onClick={exportData}><Download size={16} />Export my data (JSON)</button><button className="btn-ghost" onClick={signOut}>Sign out</button><button className="btn-danger" onClick={() => setConfirmDel(true)}><Trash2 size={16} />Delete account</button></div></section>
      </div>
      {confirmDel && <Confirm title="Delete your account?" confirmLabel="Delete everything" busy={busy} disabled={typed !== 'DELETE'} message={<>This permanently deletes your account and all your records. Export first if you want a copy. Type <strong>DELETE</strong> to confirm.<input className="input mt-3" value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Type DELETE" /></>} onConfirm={remove} onCancel={() => setConfirmDel(false)} />}
    </div>
  )
}
