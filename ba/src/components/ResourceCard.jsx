import { Link } from 'react-router-dom'
import { Bookmark, BookmarkCheck, PlayCircle, FileText } from 'lucide-react'
import { ExternalLink } from './ui'

export default function ResourceCard({ r, saved, onToggle, canSave, reasons }) {
  const Icon = r.kind === 'video' ? PlayCircle : FileText
  return (
    <article className="card flex flex-col overflow-hidden !p-0">
      <Link to={`/resources/${r.id}`} className="block aspect-video bg-forest-100" aria-label={`Details: ${r.title}`}>
        {r.thumbnail_url ? <img src={r.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-forest-400"><Icon size={40} /></div>}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5"><span className="chip">{r.category}</span>{r.featured && <span className="chip !bg-clay/15 !text-clay">Featured</span>}</div>
        <h3 className="text-base font-bold leading-snug"><Link to={`/resources/${r.id}`} className="hover:underline">{r.title}</Link></h3>
        <p className="text-xs text-neutral-500">{r.publisher}{r.language ? ` · ${r.language}` : ''}{r.duration ? ` · ${r.duration}` : ''}</p>
        <p className="line-clamp-3 text-sm text-neutral-700">{r.description}</p>
        {reasons?.length > 0 && <p className="text-xs text-teal2-600">Suggested because it {reasons.join(' and ')}.</p>}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <ExternalLink href={r.url} className="btn-primary !py-1.5">{r.kind === 'video' ? 'Watch video' : 'Open'}</ExternalLink>
          {canSave && <button onClick={() => onToggle(r)} className="btn-ghost !px-2.5 !py-1.5" aria-pressed={saved} aria-label={saved ? 'Remove bookmark' : 'Save resource'}>{saved ? <BookmarkCheck size={16} className="text-teal2-600" /> : <Bookmark size={16} />}</button>}
        </div>
      </div>
    </article>
  )
}
