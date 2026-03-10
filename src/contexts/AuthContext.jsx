import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(!supabase)
  const [authDebug, setAuthDebug] = useState(null) // debug info for troubleshooting

  const isAdmin = profile?.role === 'admin'

  // Fetch profile + subscription + plan for a given user (with retry)
  async function fetchUserData(userId, attempt = 1) {
    if (!supabase) {
      console.error('[auth] Supabase client not configured')
      setAuthDebug('Supabase nao configurado')
      return
    }

    console.log(`[auth] fetchUserData attempt=${attempt} userId=${userId}`)

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('[auth] Profile fetch error:', profileError)

        // Retry once after a short delay (session token might need refresh)
        if (attempt === 1) {
          console.log('[auth] Retrying profile fetch in 1.5s...')
          // Force session refresh before retry
          try {
            const { data: refreshData } = await supabase.auth.refreshSession()
            console.log('[auth] Session refreshed:', refreshData?.session ? 'OK' : 'no session')
          } catch (refreshErr) {
            console.error('[auth] Session refresh failed:', refreshErr)
          }
          await new Promise(r => setTimeout(r, 1500))
          return fetchUserData(userId, 2)
        }

        setProfile(null)
        setSubscription(null)
        setPlan(null)
        setAuthDebug(`Erro perfil: ${profileError.message} (code: ${profileError.code})`)
        return
      }

      console.log('[auth] Profile loaded:', profileData?.email, 'role:', profileData?.role)
      setProfile(profileData)
      setAuthDebug(null) // clear any previous debug messages

      // Fetch subscription with plan
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() // Use maybeSingle instead of single — won't error on 0 rows

      if (subError) {
        console.error('[auth] Subscription fetch error:', subError)
        setSubscription(null)
        setPlan(null)
        // Don't return — profile is already loaded, subscription is optional
      } else {
        console.log('[auth] Subscription loaded:', subData?.status, 'plan:', subData?.plans?.name)
        setSubscription(subData)
        setPlan(subData?.plans || null)
      }
    } catch (err) {
      console.error('[auth] fetchUserData exception:', err)

      // Retry once on exception too
      if (attempt === 1) {
        console.log('[auth] Retrying after exception...')
        await new Promise(r => setTimeout(r, 1500))
        return fetchUserData(userId, 2)
      }

      setAuthDebug(`Erro: ${err.message}`)
    }
  }

  // Auth state listener
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Safety timeout: if auth takes more than 8s, stop loading and show login
    const safetyTimer = setTimeout(() => {
      console.warn('[auth] Safety timeout — forcing loading=false after 8s')
      setLoading(false)
    }, 8000)

    let initialFetchDone = false

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      console.log('[auth] getSession:', currentUser ? currentUser.email : 'no user')
      setUser(currentUser)
      if (currentUser) {
        initialFetchDone = true
        fetchUserData(currentUser.id).finally(() => { clearTimeout(safetyTimer); setLoading(false) })
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
          if (event === 'INITIAL_SESSION' && initialFetchDone) {
            console.log('[auth] Skipping duplicate INITIAL_SESSION fetch')
            return
          }
          await fetchUserData(currentUser.id)
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
    if (user) await fetchUserData(user.id)
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
