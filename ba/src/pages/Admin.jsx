import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { Field, Spinner, ErrorBox, Empty, PageHeader, Modal } from '../components/ui'
import { resourceSchema } from '../schemas'
import { RESOURCE_CATEGORIES } from '../lib/constants'
import { listAllResources, saveResource, setPublished, listReports, resolveReport } from '../services/api'
import { fmtTime, cx } from '../lib/utils'

function ResourceForm({ r, onDone }) {
  const { user } = useAuth(); const toast = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(resourceSchema), defaultValues: r ? { ...r, tags: (r.tags || []).join(', '), language: r.language || '', audience: r.audience || '' } : { kind: 'video', category: RESOURCE_CATEGORIES[0], tags: '', language: 'English', audience: '' } })
  const submit = async (v) => { try { await saveResource(user.id, { title: v.title, category: v.category, publisher: v.publisher, description: v.description, url: v.url, kind: v.kind, tags: v.tags, language: v.language, audience: v.audience }, r?.id); toast.success('Resource saved'); onDone(true) } catch (e) { toast.error(e.message) } }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-3" noValidate>
      <Field label="Title" error={errors.title?.message}><input className="input" {...register('title')} /></Field>
      <Field label="Direct URL" hint="Must be the specific video/page, e.g. https://www.youtube.com/watch?v=… Never a search page." error={errors.url?.message}><input className="input" {...register('url')} /></Field>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Category"><select className="input" {...register('category')}>{RESOURCE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field><Field label="Type"><select className="input" {...register('kind')}><option value="video">Video</option><option value="article">Article</option></select></Field></div>
      <Field label="Publisher / creator" error={errors.publisher?.message}><input className="input" {...register('publisher')} /></Field>
      <Field label="Description" error={errors.description?.message}><textarea rows={3} className="input" {...register('description')} /></Field>
      <div className="grid gap-3 sm:grid-cols-3"><Field label="Tags (comma-separated)"><input className="input" {...register('tags')} /></Field><Field label="Language"><input className="input" {...register('language')} /></Field><Field label="Audience"><input className="input" {...register('audience')} /></Field></div>
      <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => onDone(false)}>Cancel</button><button className="btn-primary" disabled={isSubmitting}>Save</button></div>
    </form>
  )
}
export default function Admin() {
  const { user } = useAuth(); const toast = useToast(); const [tab, setTab] = useState('reports'); const [edit, setEdit] = useState(null)
  const reports = useAsync(listReports, []); const res = useAsync(listAllResources, [])
  const act = async (fn, msg, reload) => { try { await fn(); toast.success(msg); reload() } catch (e) { toast.error(e.message) } }
  return (
    <div className="w-full">
      <PageHeader title="Administration" subtitle="Access is enforced by database role and row-level security, not by the interface." actions={tab === 'resources' && <button className="btn-primary" onClick={() => setEdit({})}>Add resource</button>} />
      <div className="mb-4 flex gap-2">{[['reports', 'Reported posts'], ['resources', 'Resources']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cx('rounded-lg px-4 py-2 text-sm font-semibold', tab === k ? 'bg-forest-700 text-white' : 'border border-forest-100 bg-white')}>{l}</button>)}</div>
      {tab === 'reports' ? (reports.loading ? <Spinner /> : reports.error ? <ErrorBox message={reports.error} onRetry={reports.reload} /> : reports.data.length === 0 ? <Empty title="No reports">Reported posts appear here for review.</Empty> : (
        <ul className="space-y-3">{reports.data.map((r) => (<li key={r.id} className="card"><div className="flex flex-wrap justify-between gap-2"><p className="text-xs text-neutral-500">{fmtTime(r.created_at)} · <span className="chip capitalize">{r.status}</span> {r.community_posts?.hidden && <span className="chip">post hidden</span>}</p></div>
          <p className="mt-2 font-semibold">{r.community_posts?.title || '(post deleted)'} <span className="text-xs font-normal text-neutral-500">by {r.community_posts?.author_name}</span></p><p className="mt-1 line-clamp-3 text-sm text-neutral-700">{r.community_posts?.body}</p><p className="mt-2 text-sm"><strong>Reason:</strong> {r.reason}</p>
          {r.status === 'open' && <div className="mt-3 flex flex-wrap gap-2"><button className="btn-danger" onClick={() => act(() => resolveReport(user.id, r, 'resolved', true), 'Post hidden, report resolved', reports.reload)}>Hide post and resolve</button><button className="btn-ghost" onClick={() => act(() => resolveReport(user.id, r, 'dismissed', false), 'Report dismissed', reports.reload)}>Dismiss</button></div>}</li>))}</ul>))
        : (res.loading ? <Spinner /> : res.error ? <ErrorBox message={res.error} onRetry={res.reload} /> : (
          <div className="overflow-x-auto rounded-xl border border-forest-100 bg-white"><table className="w-full text-left text-sm"><thead className="bg-forest-50 text-xs"><tr><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
            <tbody>{res.data.map((r) => (<tr key={r.id} className="border-t border-forest-100"><td className="p-3 font-medium">{r.title}<span className="block text-xs text-neutral-500">{r.publisher}</span></td><td className="p-3">{r.category}</td><td className="p-3">{r.published ? 'Published' : 'Unpublished'}</td>
              <td className="p-3 text-right"><button className="btn-ghost !py-1" onClick={() => setEdit(r)}>Edit</button> <button className="btn-ghost !py-1" onClick={() => act(() => setPublished(user.id, r, !r.published), r.published ? 'Unpublished' : 'Published', res.reload)}>{r.published ? 'Unpublish' : 'Publish'}</button></td></tr>))}</tbody></table></div>))}
      {edit && <Modal wide title={edit.id ? 'Edit resource' : 'Add resource'} onClose={() => setEdit(null)}><ResourceForm r={edit.id ? edit : null} onDone={(ch) => { setEdit(null); if (ch) res.reload() }} /></Modal>}
    </div>
  )
}
