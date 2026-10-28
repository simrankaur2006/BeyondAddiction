import { useEffect, useState } from 'react'
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, HeartPulse, CalendarCheck, Target, BookText, BarChart3, Users, Library, Bookmark, Settings, LifeBuoy, LogOut, Menu, X, Bell, Leaf, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { unreadCount } from '../services/api'
import { cx } from '../lib/utils'

const NAV = [
  ['/app', 'Dashboard', LayoutDashboard, true], ['/app/recovery', 'My Recovery', HeartPulse], ['/app/check-in', 'Daily Check-in', CalendarCheck],
  ['/app/goals', 'Goals and Habits', Target], ['/app/journal', 'Journal', BookText], ['/app/analytics', 'Analytics', BarChart3],
  ['/app/community', 'Community', Users], ['/resources', 'Resources', Library], ['/app/saved', 'Saved Resources', Bookmark],
  ['/app/settings', 'Profile and Settings', Settings], ['/help', 'Help and Support', LifeBuoy],
]
export const Brand = ({ light }) => (
  <Link to="/" className="flex items-center gap-2" aria-label="Beyond Addiction home">
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-forest-600 text-paper"><Leaf size={18} /></span>
    <span className={cx('font-display text-lg font-bold', light ? 'text-white' : 'text-forest-900')}>Beyond Addiction</span>
  </Link>
)
const TITLES = { '/app': 'Dashboard', '/app/recovery': 'My Recovery', '/app/check-in': 'Daily Check-in', '/app/goals': 'Goals and Habits', '/app/journal': 'Journal', '/app/analytics': 'Analytics', '/app/community': 'Community', '/resources': 'Resources', '/app/saved': 'Saved Resources', '/app/settings': 'Profile and Settings', '/help': 'Help and Support', '/app/notifications': 'Notifications', '/app/admin': 'Administration' }

export default function AppLayout() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const loc = useLocation()
  const nav = useNavigate()
  const title = TITLES[loc.pathname] || (loc.pathname.startsWith('/resources') ? 'Resources' : 'Beyond Addiction')
  const name = profile?.display_name || user?.email?.split('@')[0] || 'You'

  useEffect(() => { setOpen(false) }, [loc.pathname])
  useEffect(() => { let on = true; unreadCount(user.id).then((n) => on && setUnread(n)).catch(() => {}); return () => { on = false } }, [user.id, loc.pathname])

  const links = [...NAV, ...(isAdmin ? [['/app/admin', 'Administration', ShieldCheck]] : [])]
  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Main">
      <div className="mb-5 px-2"><Brand light /></div>
      <div className="flex-1 space-y-0.5 overflow-y-auto">
        {links.map(([to, label, Icon, end]) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-white/15 text-white' : 'text-forest-100 hover:bg-white/10')}>
            <Icon size={18} aria-hidden="true" />{label}
          </NavLink>
        ))}
      </div>
      <button onClick={async () => { await signOut(); nav('/') }} className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-forest-100 hover:bg-white/10"><LogOut size={18} />Sign out</button>
    </nav>
  )
  return (
    <div className="flex min-h-dvh w-full">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 bg-forest-800 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden"><div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-forest-800">{sidebar}</aside></div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-forest-100 bg-paper/95 px-4 py-3 backdrop-blur sm:px-6">
          <button className="rounded p-1 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
          <h2 className="mr-auto text-lg font-bold">{title}</h2>
          <Link to="/app/check-in" className="btn-primary hidden sm:inline-flex"><CalendarCheck size={16} />Check in</Link>
          <Link to="/app/notifications" className="relative rounded-lg p-2 hover:bg-sand" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
            <Bell size={20} />{unread > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[10px] font-bold text-white">{unread}</span>}
          </Link>
          <Link to="/app/settings" className="grid h-9 w-9 place-items-center rounded-full bg-forest-600 text-sm font-bold text-white" aria-label={`Profile: ${name}`}>{name[0]?.toUpperCase()}</Link>
        </header>
        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8"><Outlet /></main>
      </div>
    </div>
  )
}
