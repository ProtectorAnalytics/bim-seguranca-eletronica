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

  const isAdmin = profile?.role === 'admin'

  // Fetch profile + subscription + plan for a given user
  async function fetchUserData(userId) {
    if (!supabase) return
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        setProfile(null)
        setSubscription(null)
        setPlan(null)
        return
      }
      setProfile(profileData)

      // Fetch subscription with plan
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subError) {
        console.error('Error fetching subscription:', subError)
        setSubscription(null)
        setPlan(null)
        return
      }

      setSubscription(subData)
      setPlan(subData?.plans || null)
    } catch (err) {
      console.error('fetchUserData error:', err)
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

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
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
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
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
