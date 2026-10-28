import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Search, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { Spinner, ErrorBox, Empty, PageHeader, ExternalLink, Disclaimer } from '../components/ui'
import ResourceCard from '../components/ResourceCard'
import { listResources, savedIds, toggleSave, getResource } from '../services/api'
import { RESOURCE_CATEGORIES } from '../lib/constants'
import { youtubeId } from '../lib/utils'

export function useSaved() {
  const { user } = useAuth(); const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => (user ? savedIds(user.id) : Promise.resolve(new Set())), [user?.id])
  const [local, setLocal] = useState(null)
  const set = local ?? data ?? new Set()
  const toggle = async (r) => {
    const was = set.has(r.id); const next = new Set(set); was ? next.delete(r.id) : next.add(r.id); setLocal(next)
    try { await toggleSave(user.id, r.id, was); toast.success(was ? 'Removed from saved' : 'Saved') }
    catch (e) { setLocal(set); toast.error(e.message) }
  }
  return { set, toggle, loading, error, reload, canSave: !!user }
}

export function ResourcesPage() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync(listResources, [])
  const saved = useSaved()
  const [q, setQ] = useState(''); const [cat, setCat] = useState('all')
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (data || []).filter((r) => (cat === 'all' || r.category === cat) && (!s || [r.title, r.publisher, r.description, ...(r.tags || [])].join(' ').toLowerCase().includes(s)))
  }, [data, q, cat])
  const featured = !q && cat === 'all' ? list.filter((r) => r.featured) : []
  const rest = featured.length ? list.filter((r) => !r.featured) : list
  const grid = (items) => <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{items.map((r) => <ResourceCard key={r.id} r={r} canSave={saved.canSave} saved={saved.set.has(r.id)} onToggle={saved.toggle} />)}</div>
  return (
    <div className="w-full">
      <PageHeader title="Resource library" subtitle="Direct links to specific videos and pages from health agencies and educators. Educational only, not medical advice." />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-neutral-400" /><input className="input !pl-9" placeholder="Search titles, publishers and tags" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search resources" /></div>
        <select className="input sm:w-72" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="all">All categories</option>{RESOURCE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      {!user && <p className="mb-4 text-sm text-neutral-600"><Link className="link" to="/signup">Create a free account</Link> to save resources and get suggestions.</p>}
      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} /> : list.length === 0
        ? <Empty title="No resources match">{data?.length ? 'Try a different search or category.' : 'No resources have been published yet. Run supabase/seed.sql or ask an administrator to add some.'}</Empty>
        : <div className="space-y-8">
          {featured.length > 0 && <section><h2 className="mb-3 text-xl font-bold">Featured</h2>{grid(featured)}</section>}
          {rest.length > 0 && <section>{featured.length > 0 && <h2 className="mb-3 text-xl font-bold">All resources</h2>}{grid(rest)}</section>}
        </div>}
      <div className="mt-8"><Disclaimer /></div>
    </div>
  )
}

export function ResourceDetail() {
  const { id } = useParams(); const saved = useSaved()
  const { data: r, loading, error, reload } = useAsync(() => getResource(id), [id])
  const [embed, setEmbed] = useState(false)
  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} onRetry={reload} />
  if (!r) return <Empty title="Resource not found"><Link className="link" to="/resources">Back to the library</Link></Empty>
  const yt = youtubeId(r.url); const isSaved = saved.set.has(r.id)
  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link to="/resources" className="mb-4 inline-flex items-center gap-1 text-sm link"><ArrowLeft size={14} />All resources</Link>
      <div className="card">
        <span className="chip">{r.category}</span>
        <h1 className="mt-2 text-3xl font-bold">{r.title}</h1>
        <p className="mt-1 text-sm text-neutral-500">{r.publisher}{r.language ? ` · ${r.language}` : ''}{r.duration ? ` · ${r.duration}` : ''}</p>
        {yt && embed && <div className="mt-4 aspect-video overflow-hidden rounded-lg"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}`} title={r.title} allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>}
        <p className="mt-4 text-neutral-800">{r.description}</p>
        {r.audience && <p className="mt-3 text-sm"><strong>Intended for:</strong> {r.audience}</p>}
        {r.tags?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{r.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>}
        <div className="mt-5 flex flex-wrap gap-2">
          <ExternalLink href={r.url} className="btn-primary">{r.kind === 'video' ? 'Watch video' : 'Open resource'}</ExternalLink>
          {yt && !embed && <button className="btn-ghost" onClick={() => setEmbed(true)}>Play here</button>}
          {saved.canSave ? <button className="btn-ghost" onClick={() => saved.toggle(r)}>{isSaved ? 'Remove bookmark' : 'Save resource'}</button> : <Link className="btn-ghost" to="/login">Sign in to save</Link>}
        </div>
        <p className="mt-5 text-xs text-neutral-500">This opens a third-party site you do not control. Content is educational and is not medical advice.</p>
      </div>
    </div>
  )
}
