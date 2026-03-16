import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../utils/supabaseClient'
import { isAdminEmail } from '../utils/admin'
import type { User } from '../types'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchUser(sessionData: Session) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.user.id)
      .single()

    if (error || !data) {
      setUser(null)
      return
    }

    const email = sessionData.user.email || ''
    const isAdmin = data.is_admin || isAdminEmail(email)

    setUser({ ...data, email, is_admin: isAdmin } as User)
  }

  async function refreshUser() {
    if (session) {
      await fetchUser(session)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s) fetchUser(s).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) fetchUser(s)
      else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, loading, refreshUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
