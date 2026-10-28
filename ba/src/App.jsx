import { Routes, Route, Link } from 'react-router-dom'
import { isConfigured } from './lib/supabase'
import AppLayout from './layouts/AppLayout'
import PublicLayout from './layouts/PublicLayout'
import { Protected, AdminOnly, ShellSwitch, GuestOnly } from './layouts/Guards'
import Landing from './pages/Landing'
import { Login, Signup, Forgot, Reset } from './pages/AuthPages'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Recovery from './pages/Recovery'
import CheckIn from './pages/CheckIn'
import Goals from './pages/Goals'
import Journal from './pages/Journal'
import Analytics from './pages/Analytics'
import Community from './pages/Community'
import { ResourcesPage, ResourceDetail } from './pages/Resources'
import Saved from './pages/Saved'
import Settings from './pages/Settings'
import { Help, Privacy } from './pages/Info'
import Notifications from './pages/Notifications'
import Admin from './pages/Admin'

function SetupNotice() {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="card max-w-lg"><h1 className="text-2xl font-bold">Connect Supabase</h1>
        <p className="mt-2 text-sm">Copy <code>.env.example</code> to <code>.env</code>, fill in <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>, then restart <code>npm run dev</code>. See README for the SQL setup.</p></div>
    </div>
  )
}
const NotFound = () => (<div className="p-10 text-center"><h1 className="text-3xl font-bold">Page not found</h1><Link className="link mt-3 inline-block" to="/">Go home</Link></div>)

export default function App() {
  if (!isConfigured) return <SetupNotice />
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<GuestOnly />}>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} /><Route path="/forgot-password" element={<Forgot />} />
        </Route>
      </Route>
      <Route element={<PublicLayout />}><Route path="/reset-password" element={<Reset />} /><Route path="/privacy" element={<Privacy />} /></Route>
      <Route element={<ShellSwitch />}>
        <Route path="/resources" element={<ResourcesPage />} /><Route path="/resources/:id" element={<ResourceDetail />} /><Route path="/help" element={<Help />} />
      </Route>
      <Route element={<Protected />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} /><Route path="recovery" element={<Recovery />} /><Route path="check-in" element={<CheckIn />} />
          <Route path="goals" element={<Goals />} /><Route path="journal" element={<Journal />} /><Route path="analytics" element={<Analytics />} />
          <Route path="community" element={<Community />} /><Route path="saved" element={<Saved />} /><Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route element={<AdminOnly />}><Route path="admin" element={<Admin />} /></Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
