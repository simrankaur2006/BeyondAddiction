import { Link, Outlet } from 'react-router-dom'
import { Brand } from './AppLayout'
import { useAuth } from '../context/AuthContext'

export function Footer() {
  return (
    <footer className="w-full bg-forest-900 px-6 py-10 text-sm text-forest-100">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-4">
        <div className="sm:col-span-2"><Brand light /><p className="mt-3 max-w-sm text-forest-200">Educational and peer-support tools for people changing a habit. Not a medical service and not a substitute for professional care.</p></div>
        <div><p className="mb-2 font-semibold text-white">Explore</p><ul className="space-y-1"><li><Link to="/resources" className="hover:underline">Resources</Link></li><li><Link to="/signup" className="hover:underline">Create an account</Link></li><li><Link to="/login" className="hover:underline">Sign in</Link></li></ul></div>
        <div><p className="mb-2 font-semibold text-white">Support</p><ul className="space-y-1"><li><Link to="/help" className="hover:underline">Urgent help</Link></li><li><Link to="/privacy" className="hover:underline">Privacy and terms</Link></li></ul></div>
      </div>
      <p className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-4 text-xs text-forest-300">Beyond Addiction is a prototype. It makes no clinical claims.</p>
    </footer>
  )
}
export function PublicHeader() {
  const { user } = useAuth()
  return (
    <header className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-forest-100 bg-paper/95 px-4 py-3 backdrop-blur sm:px-8">
      <Brand />
      <nav className="flex items-center gap-2 text-sm font-medium" aria-label="Site">
        <Link to="/resources" className="hidden px-3 py-2 hover:text-teal2-600 sm:block">Resources</Link>
        <Link to="/help" className="hidden px-3 py-2 hover:text-teal2-600 sm:block">Urgent help</Link>
        {user ? <Link to="/app" className="btn-primary">Open app</Link> : <><Link to="/login" className="btn-ghost">Sign in</Link><Link to="/signup" className="btn-primary">Get started</Link></>}
      </nav>
    </header>
  )
}
export default function PublicLayout() {
  return (<div className="flex min-h-dvh w-full flex-col"><PublicHeader /><main className="w-full flex-1 px-4 py-8 sm:px-8"><Outlet /></main><Footer /></div>)
}
