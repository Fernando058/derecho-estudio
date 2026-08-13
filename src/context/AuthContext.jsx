import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'
import { AuthContext } from './authContext'

function getAppRedirectUrl() {
  return new URL(
    import.meta.env.BASE_URL,
    window.location.origin,
  ).href
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) return null

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        avatar_url,
        is_active,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    return data
  }, [])

  const hydrateSession = useCallback(
    async (nextSession) => {
      setSession(nextSession)

      if (!nextSession?.user) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        const nextProfile = await loadProfile(nextSession.user.id)
        setProfile(nextProfile)
      } catch (error) {
        console.error('Error cargando perfil:', error)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    },
    [loadProfile],
  )

  useEffect(() => {
    const pendingTimers = new Set()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setLoading(true)

      const timerId = window.setTimeout(() => {
        pendingTimers.delete(timerId)
        void hydrateSession(nextSession)
      }, 0)

      pendingTimers.add(timerId)
    })

    return () => {
      subscription.unsubscribe()
      pendingTimers.forEach((timerId) => window.clearTimeout(timerId))
    }
  }, [hydrateSession])

  const signUp = useCallback(async ({ fullName, email, password }) => {
    return supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        emailRedirectTo: getAppRedirectUrl(),
      },
    })
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    return supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
  }, [])

  const signOut = useCallback(async () => {
    return supabase.auth.signOut()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null)
      return null
    }

    const nextProfile = await loadProfile(session.user.id)
    setProfile(nextProfile)
    return nextProfile
  }, [loadProfile, session?.user?.id])

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isAuthenticated: Boolean(session),
    isAdmin: profile?.role === 'admin' || profile?.role === 'superadmin',
    isSuperAdmin: profile?.role === 'superadmin',
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
