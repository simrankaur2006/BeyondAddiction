import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ExternalLink as ExtIcon, X, Inbox, AlertTriangle } from 'lucide-react'
import { cx } from '../lib/utils'

export const Spinner = ({ label = 'Loading' }) => (
  <div className="flex items-center justify-center gap-2 p-10 text-forest-600" role="status"><Loader2 className="animate-spin" size={20} /><span className="text-sm">{label}…</span></div>
)
export const ErrorBox = ({ message, onRetry }) => (
  <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
    <div className="flex-1">{message}</div>
    {onRetry && <button className="btn-ghost !py-1" onClick={onRetry}>Try again</button>}
  </div>
)
export const Empty = ({ title, children, action, icon: Icon = Inbox }) => (
  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-forest-200 bg-white/60 p-8 text-center">
    <Icon className="text-forest-400" size={28} />
    <p className="font-display text-lg text-forest-800">{title}</p>
    {children && <p className="max-w-md text-sm text-neutral-600">{children}</p>}
    {action}
  </div>
)
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>{subtitle && <p className="mt-1 max-w-2xl text-sm text-neutral-600">{subtitle}</p>}</div>
    <div className="flex flex-wrap gap-2">{actions}</div>
  </div>
)
export const Field = ({ label, error, hint, children, className }) => (
  <label className={cx('block', className)}>
    <span className="mb-1 block text-sm font-medium text-forest-900">{label}</span>
    {children}
    {hint && !error && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    {error && <span className="mt-1 block text-xs text-red-700" role="alert">{error}</span>}
  </label>
)
export const Stat = ({ label, value, sub }) => (
  <div className="card"><p className="text-xs font-medium text-neutral-500">{label}</p><p className="mt-1 font-display text-3xl text-forest-800">{value ?? '–'}</p>{sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}</div>
)
export const ExternalLink = ({ href, children, className = 'btn-ghost' }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}<ExtIcon size={14} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
)
export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest-900/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cx('max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-paper p-5 sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-sand"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  )
}
export const Confirm = ({ title, message, confirmLabel = 'Delete', busy, disabled, onConfirm, onCancel }) => (
  <Modal title={title} onClose={onCancel}>
    <p className="text-sm text-neutral-700">{message}</p>
    <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={onCancel}>Cancel</button><button className="btn-danger" disabled={busy || disabled} onClick={onConfirm}>{busy ? 'Working…' : confirmLabel}</button></div>
  </Modal>
)
export const Rating = ({ value, onChange, min = 1, max = 5, labels }) => (
  <div className="flex gap-1.5" role="radiogroup">
    {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => (
      <button type="button" key={n} role="radio" aria-checked={value === n} aria-label={labels?.[n - min] ? `${n} ${labels[n - min]}` : String(n)}
        onClick={() => onChange(value === n ? '' : n)}
        className={cx('h-9 min-w-9 rounded-lg border px-2 text-sm font-semibold', value === n ? 'border-forest-600 bg-forest-600 text-white' : 'border-neutral-300 bg-white hover:bg-forest-50')}>{labels?.[n - min] || n}</button>
    ))}
  </div>
)
export const Progress = ({ value }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-forest-100" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
    <div className="h-full rounded-full bg-teal2-500" style={{ width: `${Math.min(100, value)}%` }} />
  </div>
)
export const Disclaimer = () => (
  <p className="rounded-lg bg-sand p-3 text-xs text-neutral-700">Beyond Addiction offers education and peer-support tools. It does not diagnose or treat any condition and is not a substitute for professional medical care. If you are in crisis, see <Link className="link" to="/help">urgent help</Link>.</p>
)
