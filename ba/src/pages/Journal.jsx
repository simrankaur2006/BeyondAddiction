import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, Pencil, Trash2, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { Field, Spinner, ErrorBox, Empty, PageHeader, Modal, Confirm, Rating } from '../components/ui'
import { journalSchema } from '../schemas'
import { MOODS } from '../lib/constants'
import { listJournal, saveJournal, deleteJournal, syncMilestones } from '../services/api'
import { fmtDate, iso } from '../lib/utils'

function EntryForm({ entry, onDone }) {
  const { user } = useAuth(); const toast = useToast(); const [mood, setMood] = useState(entry?.mood ?? '')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(journalSchema), defaultValues: { title: entry?.title || '', body: entry?.body || '', tags: (entry?.tags || []).join(', ') } })
  const submit = async (v) => { try { await saveJournal(user.id, { ...v, mood }, entry?.id); toast.success(entry ? 'Entry updated' : 'Entry saved'); await syncMilestones(user.id); onDone(true) } catch (e) { toast.error(e.message) } }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <Field label="Title" error={errors.title?.message}><input className="input" {...register('title')} /></Field>
      <Field label="Mood (optional)"><Rating value={mood} onChange={setMood} labels={MOODS.map((m) => m.e)} /></Field>
      <Field label="Entry" error={errors.body?.message}><textarea rows={8} className="input" {...register('body')} /></Field>
      <Field label="Tags (comma-separated)" error={errors.tags?.message}><input className="input" placeholder="work, cravings, wins" {...register('tags')} /></Field>
      <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => onDone(false)}>Cancel</button><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save entry'}</button></div>
    </form>
  )
}
export default function Journal() {
  const { user } = useAuth(); const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => listJournal(user.id), [user.id])
  const [q, setQ] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [tag, setTag] = useState('')
  const [edit, setEdit] = useState(null); const [del, setDel] = useState(null); const [busy, setBusy] = useState(false)
  const tags = useMemo(() => [...new Set((data || []).flatMap((e) => e.tags))].sort(), [data])
  const list = useMemo(() => (data || []).filter((e) => {
    const d = iso(new Date(e.created_at))
    return (!q || (e.title + ' ' + e.body).toLowerCase().includes(q.toLowerCase())) && (!from || d >= from) && (!to || d <= to) && (!tag || e.tags.includes(tag))
  }), [data, q, from, to, tag])
  return (
    <div className="w-full">
      <PageHeader title="Journal" subtitle="Private to you. Never shown in the community or to other users." actions={<button className="btn-primary" onClick={() => setEdit({})}><Plus size={16} />New entry</button>} />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative"><Search size={16} className="absolute left-3 top-3 text-neutral-400" /><input className="input !pl-9" placeholder="Search entries" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search entries" /></div>
        <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
        <select className="input" value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Tag"><option value="">All tags</option>{tags.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} /> : list.length === 0
        ? <Empty icon={Lock} title={data.length ? 'No entries match' : 'Your journal is empty'} action={!data.length && <button className="btn-primary" onClick={() => setEdit({})}>Write your first entry</button>}>{data.length ? 'Adjust the search or date filters.' : 'Write about a craving, a win, or anything on your mind.'}</Empty>
        : <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{list.map((e) => (
          <article key={e.id} className="card">
            <div className="flex items-start justify-between gap-2"><div><h3 className="font-bold">{e.mood && MOODS[e.mood - 1].e} {e.title}</h3><p className="text-xs text-neutral-500">{fmtDate(e.created_at)}</p></div>
              <div className="flex"><button className="rounded p-2 hover:bg-sand" aria-label="Edit entry" onClick={() => setEdit(e)}><Pencil size={16} /></button><button className="rounded p-2 hover:bg-red-50" aria-label="Delete entry" onClick={() => setDel(e)}><Trash2 size={16} className="text-red-700" /></button></div></div>
            <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm text-neutral-800">{e.body}</p>
            {e.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{e.tags.map((t) => <button key={t} className="chip" onClick={() => setTag(t)}>#{t}</button>)}</div>}
          </article>))}</div>}
      {edit && <Modal wide title={edit.id ? 'Edit entry' : 'New entry'} onClose={() => setEdit(null)}><EntryForm entry={edit.id ? edit : null} onDone={(ch) => { setEdit(null); if (ch) reload() }} /></Modal>}
      {del && <Confirm title="Delete this entry?" message="This permanently removes the entry. It cannot be undone." busy={busy} onCancel={() => setDel(null)} onConfirm={async () => { setBusy(true); try { await deleteJournal(del.id); toast.success('Entry deleted'); setDel(null); reload() } catch (e) { toast.error(e.message) } finally { setBusy(false) } }} />}
    </div>
  )
}
