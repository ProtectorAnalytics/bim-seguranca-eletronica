import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { APP_VERSION } from '@/data/constants'

/* ── Password strength rules (same as LoginPage) ── */
const PASSWORD_RULES = [
  { id: 'len', label: 'Mínimo 8 caracteres', test: p => p.length >= 8 },
  { id: 'upper', label: 'Uma letra maiúscula', test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Uma letra minúscula', test: p => /[a-z]/.test(p) },
  { id: 'num', label: 'Um número', test: p => /[0-9]/.test(p) },
  { id: 'special', label: 'Um caractere especial (!@#$%)', test: p => /[^A-Za-z0-9]/.test(p) },
]
function validatePassword(p) { return PASSWORD_RULES.every(r => r.test(p)) }

function PasswordStrength({ password }) {
  if (!password) return null
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length
  const pct = Math.round((passed / PASSWORD_RULES.length) * 100)
  const color = pct < 40 ? '#ef4444' : pct < 80 ? '#f59e0b' : '#22c55e'
  const label = pct < 40 ? 'Fraca' : pct < 80 ? 'Média' : 'Forte'
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#64748b' }}>Força da senha</span>
        <span style={{ fontSize: 11, fontWeight: 600, color }}>{label}</span>
      </div>
      <div style={{ height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'all .3s' }} />
      </div>
      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {PASSWORD_RULES.map(r => (
          <div key={r.id} style={{ fontSize: 11, color: r.test(password) ? '#22c55e' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{r.test(password) ? '✓' : '○'}</span> {r.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InviteRegisterPage({ token, onDone }) {
  const [invite, setInvite] = useState(null)
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [inviteError, setInviteError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Load invite data
  useEffect(() => {
    async function loadInvite() {
      if (!supabase || !token) { setInviteError('Link inválido'); setLoadingInvite(false); return }
      const { data, error: err } = await supabase
        .from('invite_links')
        .select('*, plans(name, slug, max_projects)')
        .eq('token', token)
        .eq('status', 'active')
        .maybeSingle()
      if (err || !data) {
        setInviteError('Link de convite inválido, expirado ou já utilizado.')
        setLoadingInvite(false)
        return
      }
      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setInviteError('Este link de convite expirou.')
        // Mark as expired
        await supabase.from('invite_links').update({ status: 'expired' }).eq('id', data.id)
        setLoadingInvite(false)
        return
      }
      // Check max uses
      if (data.used_count >= data.max_uses) {
        setInviteError('Este link já atingiu o limite de utilizações.')
        await supabase.from('invite_links').update({ status: 'used' }).eq('id', data.id)
        setLoadingInvite(false)
        return
      }
      setInvite(data)
      if (data.email) setEmail(data.email)
      setLoadingInvite(false)
    }
    loadInvite()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (!fullName.trim()) throw new Error('Informe seu nome completo')
      if (!email.trim()) throw new Error('Informe seu email')
      if (!validatePassword(password)) throw new Error('A senha não atende aos requisitos mínimos')

      // Pre-register type: email must match
      if (invite.type === 'pre_register' && invite.email && email.toLowerCase() !== invite.email.toLowerCase()) {
        throw new Error(`Este convite é exclusivo para ${invite.email}`)
      }

      // Create account
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } }
      })
      if (authErr) throw authErr

      const userId = authData?.user?.id
      if (!userId) throw new Error('Erro ao criar conta')

      // Wait for profile trigger
      await new Promise(r => setTimeout(r, 1500))

      // Update profile with company
      if (company.trim()) {
        await supabase.from('profiles').update({ company_name: company.trim() }).eq('id', userId)
      }

      // Create subscription with the invite's plan
      await supabase.from('subscriptions').insert([{
        user_id: userId,
        plan_id: invite.plan_id,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
      }])

      // Mark invite as used
      const newCount = (invite.used_count || 0) + 1
      const updateData = {
        used_count: newCount,
        used_by: userId,
        used_at: new Date().toISOString(),
      }
      if (newCount >= invite.max_uses) updateData.status = 'used'
      await supabase.from('invite_links').update(updateData).eq('id', invite.id)

      setSuccess(`Conta criada com sucesso! Plano "${invite.plans?.name}" ativado. Verifique seu email para confirmar o cadastro, depois faça login.`)
    } catch (err) {
      const msg = err?.message || 'Erro desconhecido'
      if (msg.includes('already registered')) setError('Este email já possui uma conta. Faça login normalmente.')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const boxStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#F0F5FA', padding: 20,
    color: '#1e293b', fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  }
  const cardStyle = {
    background: '#ffffff', borderRadius: 12, padding: '32px 28px', width: 440, maxWidth: '95vw',
    boxShadow: '0 20px 60px rgba(0,0,0,.15)', border: '1px solid #E2E8F0'
  }
  const inputStyle = {
    width: '100%', padding: '12px 14px', background: '#F0F5FA', border: '1px solid #E2E8F0',
    borderRadius: 8, color: '#1e293b', fontSize: 14, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color .15s', fontFamily: 'inherit'
  }
  const btnStyle = {
    width: '100%', padding: '12px 16px', background: '#046BD2', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 16,
    boxShadow: '0 2px 8px rgba(4,107,210,.3)'
  }
  const focusH = (e) => { e.target.style.borderColor = '#046BD2' }
  const blurH = (e) => { e.target.style.borderColor = '#E2E8F0' }

  if (loadingInvite) return (
    <div style={boxStyle}><div style={{ color: '#94a3b8' }}>Verificando convite...</div></div>
  )

  if (inviteError) return (
    <div style={boxStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Convite Inválido</h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>{inviteError}</p>
          <button onClick={() => { window.history.replaceState({}, '', '/'); onDone?.() }} style={{
            ...btnStyle, width: 'auto', padding: '10px 28px', marginTop: 20,
          }}>Ir para Login</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={boxStyle}>
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <img src="/logo-proti.png" alt="Protector Sistemas" style={{ height: 48, marginBottom: 8, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.2))' }} />
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{APP_VERSION.label}</div>
      </div>

      <div style={cardStyle}>
        {/* Invite badge */}
        <div style={{
          background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)',
          borderRadius: 8, padding: '12px 14px', marginBottom: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
            🎫 Convite para o Plano "{invite.plans?.name}"
          </div>
          {invite.type === 'pre_register' && invite.email && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Convite exclusivo para {invite.email}</div>
          )}
        </div>

        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Criar sua Conta</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
          Preencha seus dados para ativar sua conta com o plano {invite.plans?.name}.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block', fontWeight: 600 }}>Nome completo *</label>
            <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome completo" onFocus={focusH} onBlur={blurH} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block', fontWeight: 600 }}>Email *</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" required
              disabled={invite.type === 'pre_register' && !!invite.email}
              onFocus={focusH} onBlur={blurH} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block', fontWeight: 600 }}>Empresa</label>
            <input style={inputStyle} value={company} onChange={e => setCompany(e.target.value)} placeholder="Nome da empresa (opcional)" onFocus={focusH} onBlur={blurH} />
          </div>
          <div style={{ marginBottom: 4 }}>
            <label style={{ fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block', fontWeight: 600 }}>Senha *</label>
            <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Crie uma senha segura" required onFocus={focusH} onBlur={blurH} />
          </div>
          <PasswordStrength password={password} />

          {error && (
            <div style={{ background: 'rgba(239,68,68,.08)', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 12, border: '1px solid rgba(239,68,68,.2)' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: 'rgba(34,197,94,.08)', color: '#16a34a', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 12, border: '1px solid rgba(34,197,94,.2)' }}>
              {success}
              <button onClick={() => { window.history.replaceState({}, '', '/'); onDone?.() }} style={{
                display: 'block', marginTop: 10, background: '#046BD2', color: '#fff', border: 'none',
                borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Ir para Login</button>
            </div>
          )}

          {!success && (
            <button type="submit" style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }} disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar Conta e Ativar Plano'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
