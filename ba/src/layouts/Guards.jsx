import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui'
import AppLayout from './AppLayout'
import PublicLayout from './PublicLayout'

export function Protected() {
  const { user, profile, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <Spinner label="Checking your session" />
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (profile && !profile.onboarded && loc.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  return <Outlet />
}
export function AdminOnly() {
  const { isAdmin, loading } = useAuth()
  if (loading) return <Spinner />
  return isAdmin ? <Outlet /> : <Navigate to="/app" replace />
}
/** Pages that work signed in (inside the app shell) or signed out (public shell). */
export function ShellSwitch() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? <AppLayout /> : <PublicLayout />
}
export function GuestOnly() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? <Navigate to="/app" replace /> : <Outlet />
}
