import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { Spinner, ErrorBox, Empty, PageHeader } from '../components/ui'
import { listNotifications, markRead, markAllRead, clearNotifications } from '../services/api'
import { fmtTime, cx } from '../lib/utils'

export default function Notifications() {
  const { user } = useAuth(); const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => listNotifications(user.id), [user.id])
  const run = async (fn, msg) => { try { await fn(); if (msg) toast.success(msg); reload() } catch (e) { toast.error(e.message) } }
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Notifications" subtitle="In-app notifications such as milestones. Email and push are not enabled." actions={data?.length > 0 && <><button className="btn-ghost" onClick={() => run(() => markAllRead(user.id), 'All marked as read')}><CheckCheck size={16} />Mark all read</button><button className="btn-ghost" onClick={() => run(() => clearNotifications(user.id), 'History cleared')}><Trash2 size={16} />Clear</button></>} />
      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} /> : data.length === 0 ? <Empty icon={Bell} title="Nothing here yet">You will see milestone notifications here.</Empty> : (
        <ul className="space-y-2">{data.map((n) => (<li key={n.id} className={cx('card flex items-start gap-3 !p-4', !n.read && 'border-teal2-400 bg-teal2-400/5')}>
          <div className="flex-1"><p className="font-semibold">{n.title}</p>{n.body && <p className="text-sm text-neutral-700">{n.body}</p>}<p className="mt-1 text-xs text-neutral-500">{fmtTime(n.created_at)}</p></div>
          {!n.read && <button className="btn-ghost !py-1" onClick={() => run(() => markRead(n.id))}>Mark read</button>}</li>))}</ul>)}
    </div>
  )
}
