import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { APP_VERSION } from '@/data/constants'
import { PASSWORD_RULES, validatePassword } from '@/lib/passwordValidation'

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

export default function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [tab, setTab] = useState('login') // login | register | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await signIn(email, password)
      } else if (tab === 'register') {
        if (!fullName.trim()) { setError('Informe seu nome completo'); setLoading(false); return }
        if (!validatePassword(password)) {
          setError('A senha não atende aos requisitos mínimos de segurança')
          setLoading(false)
          return
        }
        await signUp(email, password, fullName.trim())
        setSuccessMsg('Conta criada! Verifique seu email para confirmar o cadastro.')
      } else if (tab === 'forgot') {
        if (!email.trim()) { setError('Informe seu email'); setLoading(false); return }
        await resetPassword(email.trim())
        setSuccessMsg('Email de recuperação enviado! Verifique sua caixa de entrada (e spam).')
      }
    } catch (err) {
      const msg = err?.message || 'Erro desconhecido'
      if (msg.includes('Invalid login')) setError('Email ou senha incorretos')
      else if (msg.includes('already registered')) setError('Este email já está cadastrado')
      else if (msg.includes('valid email')) setError('Informe um email válido')
      else if (msg.includes('rate limit')) setError('Aguarde alguns minutos antes de tentar novamente')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const boxStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#F0F5FA',
    color: '#1e293b', fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  }
  const cardStyle = {
    background: '#ffffff', borderRadius: 12, padding: '32px 28px', width: 400, maxWidth: '90vw',
    boxShadow: '0 20px 60px rgba(0,0,0,.25), 0 8px 24px rgba(0,0,0,.15)',
    animation: 'scaleIn .3s ease-out', border: '1px solid #E2E8F0'
  }
  const inputStyle = {
    width: '100%', padding: '12px 14px', background: '#F0F5FA', border: '1px solid #E2E8F0',
    borderRadius: 8, color: '#1e293b', fontSize: 14, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color .15s, box-shadow .15s', fontFamily: 'inherit'
  }
  const btnStyle = {
    width: '100%', padding: '12px 16px', background: '#046BD2', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8,
    transition: 'background .2s', boxShadow: '0 2px 8px rgba(4,107,210,.3)'
  }
  const tabBtnStyle = (active) => ({
    flex: 1, padding: '10px 0', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 600,
    background: active ? '#046BD2' : 'transparent', color: active ? '#fff' : '#64748b',
    border: 'none', borderRadius: 6, transition: 'all .2s'
  })
  const linkStyle = {
    background: 'none', border: 'none', color: '#046BD2', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, padding: 0, textDecoration: 'underline',
  }
  const focusHandler = (e) => { e.target.style.borderColor = '#046BD2'; e.target.style.boxShadow = '0 0 0 3px rgba(4,107,210,.1)' }
  const blurHandler = (e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }

  return (
    <div style={boxStyle}>
      <div style={{ marginBottom: 28, textAlign: 'center', animation: 'fadeIn .4s ease-out' }}>
        <img src="/logo-proti.png" alt="Protector Sistemas" style={{
          height: 56, marginBottom: 12, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.3))'
        }} />
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{APP_VERSION.label}</div>
      </div>

      <div style={cardStyle}>
        {tab !== 'forgot' ? (
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#F0F5FA', borderRadius: 8, padding: 3 }}>
            <button style={tabBtnStyle(tab === 'login')} onClick={() => { setTab('login'); setError(''); setSuccessMsg('') }}>Entrar</button>
            <button style={tabBtnStyle(tab === 'register')} onClick={() => { setTab('register'); setError(''); setSuccessMsg('') }}>Criar Conta</button>
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <button onClick={() => { setTab('login'); setError(''); setSuccessMsg('') }} style={{
              ...linkStyle, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12, textDecoration: 'none'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Voltar ao login
            </button>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Recuperar Senha</h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
              Informe seu email e enviaremos um link para redefinir sua senha.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#64748b', marginBottom: 6, display: 'block', fontWeight: 600 }}>Nome completo</label>
              <input style={inputStyle} type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome"
                onFocus={focusHandler} onBlur={blurHandler} />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: '#64748b', marginBottom: 6, display: 'block', fontWeight: 600 }}>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
              onFocus={focusHandler} onBlur={blurHandler} />
          </div>

          {tab !== 'forgot' && (
            <div style={{ marginBottom: tab === 'register' ? 4 : 18 }}>
              <label style={{ fontSize: 12, color: '#64748b', marginBottom: 6, display: 'block', fontWeight: 600 }}>Senha</label>
              <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8}
                onFocus={focusHandler} onBlur={blurHandler} />
            </div>
          )}

          {tab === 'register' && <PasswordStrength password={password} />}

          {tab === 'login' && (
            <div style={{ textAlign: 'right', marginBottom: 8, marginTop: -10 }}>
              <button type="button" onClick={() => { setTab('forgot'); setError(''); setSuccessMsg('') }} style={linkStyle}>
                Esqueci minha senha
              </button>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,.08)', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12, marginTop: 8, border: '1px solid rgba(239,68,68,.2)', fontWeight: 500 }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{ background: 'rgba(34,197,94,.08)', color: '#16a34a', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12, marginTop: 8, border: '1px solid rgba(34,197,94,.2)', fontWeight: 500 }}>
              {successMsg}
            </div>
          )}

          <button type="submit" style={{ ...btnStyle, opacity: loading ? 0.6 : 1, marginTop: tab === 'register' ? 16 : 8 }} disabled={loading}>
            {loading ? '...' : tab === 'login' ? 'Entrar' : tab === 'register' ? 'Criar Conta' : 'Enviar Link de Recuperação'}
          </button>
        </form>
      </div>
    </div>
  )
}
