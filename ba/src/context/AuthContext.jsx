import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const user = session?.user ?? null

  const loadProfile = useCallback(async (uid) => {
    if (!uid) { setProfile(null); setIsAdmin(false); return }
    const [{ data: p }, { data: admin }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.rpc('is_admin'),
    ])
    setProfile(p ?? null)
    setIsAdmin(admin === true)
  }, [])

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      if (alive) setLoading(false)
    }).catch(() => alive && setLoading(false))
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      // defer Supabase calls out of the callback to avoid auth deadlocks
      setTimeout(() => { if (event !== 'TOKEN_REFRESHED') loadProfile(s?.user?.id) }, 0)
    })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [loadProfile])

  const value = {
    session, user, profile, isAdmin, loading,
    refreshProfile: () => loadProfile(user?.id),
    signOut: () => supabase.auth.signOut(),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
