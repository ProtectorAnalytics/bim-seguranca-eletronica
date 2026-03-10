import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Helper: wrap a Supabase query in a timeout (AbortController)
function withTimeout(queryBuilder, ms = 6000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return queryBuilder
    .abortSignal(controller.signal)
    .then(result => { clearTimeout(timer); return result })
    .catch(err => {
      clearTimeout(timer)
      // AbortError means timeout
      if (err.name === 'AbortError') {
        return { data: null, error: { message: `Timeout (${ms}ms)`, code: 'TIMEOUT' } }
      }
      return { data: null, error: { message: err.message, code: 'EXCEPTION' } }
    })
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(!supabase)
  const [authDebug, setAuthDebug] = useState(null)

  const isAdmin = profile?.role === 'admin'

  // Build a fallback profile from user_metadata (always available from auth token)
  function buildFallbackProfile(authUser) {
    if (!authUser) return null
    return {
      id: authUser.id,
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name || authUser.email,
      role: 'user', // fallback — no admin access without confirmed profile
      _fallback: true, // marker so we know this is synthetic
    }
  }

  // Fetch profile + subscription + plan for a given user (with retry + timeout)
  async function fetchUserData(authUser, attempt = 1) {
    if (!supabase || !authUser) {
      console.error('[auth] Supabase client not configured or no user')
      setAuthDebug('Supabase nao configurado')
      return
    }

    const userId = authUser.id
    console.log(`[auth] fetchUserData attempt=${attempt} userId=${userId}`)

    try {
      // ── Fetch profile (with 6s timeout) ──
      console.log('[auth] Starting profile query...')
      const { data: profileData, error: profileError } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', userId).single(),
        6000
      )

      if (profileError) {
        console.error('[auth] Profile fetch error:', profileError.message, profileError.code)

        // Retry once: refresh session first, then retry
        if (attempt === 1) {
          console.log('[auth] Retrying profile fetch...')
          try {
            const { data: refreshData } = await supabase.auth.refreshSession()
            console.log('[auth] Session refreshed:', refreshData?.session ? 'OK' : 'no session')
          } catch (refreshErr) {
            console.error('[auth] Session refresh failed:', refreshErr)
          }
          await new Promise(r => setTimeout(r, 1000))
          return fetchUserData(authUser, 2)
        }

        // All retries exhausted — use fallback profile from auth token
        console.warn('[auth] Using fallback profile from user_metadata')
        const fallback = buildFallbackProfile(authUser)
        setProfile(fallback)
        setSubscription(null)
        setPlan(null)
        setAuthDebug(`Perfil via fallback (${profileError.code}): ${profileError.message}`)
        return
      }

      console.log('[auth] Profile loaded:', profileData?.email, 'role:', profileData?.role)
      setProfile(profileData)
      setAuthDebug(null)

      // ── Fetch subscription with plan (with 6s timeout) ──
      console.log('[auth] Starting subscription query...')
      const { data: subData, error: subError } = await withTimeout(
        supabase.from('subscriptions').select('*, plans(*)').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        6000
      )

      if (subError) {
        console.error('[auth] Subscription fetch error:', subError.message)
        setSubscription(null)
        setPlan(null)
      } else {
        console.log('[auth] Subscription loaded:', subData?.status, 'plan:', subData?.plans?.name)
        setSubscription(subData)
        setPlan(subData?.plans || null)
      }
    } catch (err) {
      console.error('[auth] fetchUserData exception:', err)

      if (attempt === 1) {
        console.log('[auth] Retrying after exception...')
        await new Promise(r => setTimeout(r, 1000))
        return fetchUserData(authUser, 2)
      }

      // Last resort fallback
      const fallback = buildFallbackProfile(authUser)
      setProfile(fallback)
      setAuthDebug(`Erro: ${err.message} (fallback ativo)`)
    }
  }

  // Auth state listener
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Safety timeout: if auth takes more than 15s, stop loading
    const safetyTimer = setTimeout(() => {
      console.warn('[auth] Safety timeout — forcing loading=false after 15s')
      setLoading(false)
    }, 15000)

    let initialFetchDone = false

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      console.log('[auth] getSession:', currentUser ? currentUser.email : 'no user')
      setUser(currentUser)
      if (currentUser) {
        initialFetchDone = true
        fetchUserData(currentUser).finally(() => { clearTimeout(safetyTimer); setLoading(false) })
      } else {
        clearTimeout(safetyTimer)
        setLoading(false)
      }
    }).catch(err => {
      console.error('[auth] getSession error:', err)
      clearTimeout(safetyTimer)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[auth] onAuthStateChange:', event, session?.user?.email)
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          // Skip if initial fetch already handled this
          if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && initialFetchDone) {
            console.log(`[auth] Skipping duplicate ${event} fetch (initialFetchDone=true)`)
            return
          }
          await fetchUserData(currentUser)
        } else {
          setProfile(null)
          setSubscription(null)
          setPlan(null)
        }
        setLoading(false)
      }
    )

    return () => authSub?.unsubscribe()
  }, [])

  // Sign in with email/password
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  // Sign up with email/password + full name
  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    if (error) throw error
    return data
  }

  // Sign out
  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
    setSubscription(null)
    setPlan(null)
    setAuthDebug(null)
  }

  // Refresh user data (useful after admin changes)
  async function refreshUserData() {
    if (user) await fetchUserData(user)
  }

  const value = {
    user,
    profile,
    subscription,
    plan,
    loading,
    isAdmin,
    configError,
    authDebug,
    signIn,
    signUp,
    signOut,
    refreshUserData,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
