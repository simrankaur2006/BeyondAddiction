import { useMemo, useState } from 'react'
import { Search, Bookmark } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { Spinner, ErrorBox, Empty, PageHeader } from '../components/ui'
import ResourceCard from '../components/ResourceCard'
import { listSaved, toggleSave } from '../services/api'
import { RESOURCE_CATEGORIES } from '../lib/constants'

export default function Saved() {
  const { user } = useAuth(); const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => listSaved(user.id), [user.id])
  const [q, setQ] = useState(''); const [cat, setCat] = useState('all')
  const items = useMemo(() => (data || []).map((d) => d.resources).filter(Boolean).filter((r) => (cat === 'all' || r.category === cat) && (!q || [r.title, r.publisher, ...(r.tags || [])].join(' ').toLowerCase().includes(q.toLowerCase()))), [data, q, cat])
  const remove = async (r) => { try { await toggleSave(user.id, r.id, true); toast.success('Removed from saved'); reload() } catch (e) { toast.error(e.message) } }
  return (
    <div className="w-full">
      <PageHeader title="Saved resources" subtitle="Your bookmarks. Only you can see them." />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-neutral-400" /><input className="input !pl-9" placeholder="Search saved" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search saved resources" /></div>
        <select className="input sm:w-72" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="all">All categories</option>{RESOURCE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} /> : items.length === 0
        ? <Empty icon={Bookmark} title={data?.length ? 'Nothing matches' : 'No saved resources yet'} action={<Link className="btn-primary" to="/resources">Browse resources</Link>}>{data?.length ? 'Try another search or category.' : 'Tap the bookmark on any resource to keep it here.'}</Empty>
        : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{items.map((r) => <ResourceCard key={r.id} r={r} canSave saved onToggle={remove} />)}</div>}
    </div>
  )
}
