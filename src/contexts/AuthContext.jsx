import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// ── Direct REST fetch (bypasses Supabase client + service worker issues) ──
async function restQuery(table, query, accessToken, timeoutMs = 8000) {
  const url = `${supabaseUrl}/rest/v1/${table}?${query}`
  console.log(`[auth] REST fetch: ${table} ...`)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store', // bypass any cache layer
    })
    clearTimeout(timer)

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[auth] REST ${table} HTTP ${res.status}:`, body)
      return { data: null, error: { message: `HTTP ${res.status}: ${body}`, code: res.status } }
    }

    const data = await res.json()
    console.log(`[auth] REST ${table} OK:`, Array.isArray(data) ? `${data.length} rows` : 'object')
    return { data, error: null }
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      console.error(`[auth] REST ${table} TIMEOUT (${timeoutMs}ms)`)
      return { data: null, error: { message: `Timeout ${timeoutMs}ms`, code: 'TIMEOUT' } }
    }
    console.error(`[auth] REST ${table} exception:`, err.message)
    return { data: null, error: { message: err.message, code: 'FETCH_ERROR' } }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(!supabase)
  const [authDebug, setAuthDebug] = useState(null)
  const fetchInProgress = useRef(false) // prevent concurrent fetches

  const isAdmin = profile?.role === 'admin'

  // Build fallback profile from JWT user_metadata
  function buildFallbackProfile(authUser) {
    if (!authUser) return null
    return {
      id: authUser.id,
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name || authUser.email,
      role: 'user',
      _fallback: true,
    }
  }

  // ── Fetch profile + subscription using direct REST API ──
  async function fetchUserData(authUser, attempt = 1) {
    if (!supabase || !authUser) {
      console.error('[auth] No supabase or no user')
      setAuthDebug('Supabase nao configurado')
      return
    }

    // Prevent concurrent fetches
    if (fetchInProgress.current && attempt === 1) {
      console.log('[auth] Fetch already in progress, skipping')
      return
    }
    fetchInProgress.current = true

    const userId = authUser.id
    console.log(`[auth] fetchUserData attempt=${attempt} userId=${userId}`)

    try {
      // Get access token from current session
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) {
        console.error('[auth] No access token available')
        const fallback = buildFallbackProfile(authUser)
        setProfile(fallback)
        setAuthDebug('Sem access token — usando fallback')
        fetchInProgress.current = false
        return
      }
      console.log('[auth] Access token obtained, length:', accessToken.length)

      // ── Profile query via direct REST ──
      const profileResult = await restQuery(
        'profiles',
        `id=eq.${userId}&select=*`,
        accessToken,
        8000
      )

      if (profileResult.error) {
        console.error('[auth] Profile error:', profileResult.error.message)

        // Retry once with session refresh
        if (attempt === 1) {
          console.log('[auth] Refreshing session and retrying...')
          try {
            await supabase.auth.refreshSession()
            console.log('[auth] Session refreshed')
          } catch (e) {
            console.error('[auth] Refresh failed:', e.message)
          }
          await new Promise(r => setTimeout(r, 500))
          fetchInProgress.current = false
          return fetchUserData(authUser, 2)
        }

        // All retries failed — use fallback
        const fallback = buildFallbackProfile(authUser)
        setProfile(fallback)
        setAuthDebug(`Erro: ${profileResult.error.message} (fallback ativo)`)
        fetchInProgress.current = false
        return
      }

      // Profile loaded — it's an array, get first item
      const profileData = Array.isArray(profileResult.data)
        ? profileResult.data[0] || null
        : profileResult.data

      if (!profileData) {
        console.warn('[auth] Profile query returned empty')
        const fallback = buildFallbackProfile(authUser)
        setProfile(fallback)
        setAuthDebug('Perfil nao encontrado no banco (fallback ativo)')
        fetchInProgress.current = false
        return
      }

      console.log('[auth] Profile loaded:', profileData.email, 'role:', profileData.role)
      setProfile(profileData)
      setAuthDebug(null)

      // ── Subscription + plan via direct REST ──
      const subResult = await restQuery(
        'subscriptions',
        `user_id=eq.${userId}&select=*,plans(*)&order=created_at.desc&limit=1`,
        accessToken,
        8000
      )

      if (subResult.error) {
        console.warn('[auth] Subscription error:', subResult.error.message)
        setSubscription(null)
        setPlan(null)
      } else {
        const subData = Array.isArray(subResult.data)
          ? subResult.data[0] || null
          : subResult.data
        console.log('[auth] Subscription:', subData?.status, 'plan:', subData?.plans?.name)
        setSubscription(subData)
        setPlan(subData?.plans || null)
      }
    } catch (err) {
      console.error('[auth] Unhandled exception:', err)

      if (attempt === 1) {
        fetchInProgress.current = false
        await new Promise(r => setTimeout(r, 500))
        return fetchUserData(authUser, 2)
      }

      const fallback = buildFallbackProfile(authUser)
      setProfile(fallback)
      setAuthDebug(`Excecao: ${err.message}`)
    } finally {
      fetchInProgress.current = false
    }
  }

  // ── Auth state listener ──
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const safetyTimer = setTimeout(() => {
      console.warn('[auth] Safety timeout 15s')
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
        fetchUserData(currentUser).finally(() => {
          clearTimeout(safetyTimer)
          setLoading(false)
        })
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
          // Skip if initial fetch already handled this user
          if (initialFetchDone && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
            console.log(`[auth] Skip duplicate ${event}`)
            return
          }
          initialFetchDone = true
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

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
    setSubscription(null)
    setPlan(null)
    setAuthDebug(null)
  }

  async function refreshUserData() {
    if (user) await fetchUserData(user)
  }

  // ── Get fresh access token (for projectStorage and other REST calls) ──
  async function getAccessToken() {
    if (!supabase) return null
    try {
      const { data } = await supabase.auth.getSession()
      return data?.session?.access_token || null
    } catch {
      return null
    }
  }

  const value = {
    user, profile, subscription, plan, loading,
    isAdmin, configError, authDebug,
    signIn, signUp, signOut, refreshUserData, getAccessToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
