import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { APP_VERSION } from '@/data/constants'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [tab, setTab] = useState('login') // login | register
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
      } else {
        if (!fullName.trim()) { setError('Informe seu nome completo'); setLoading(false); return }
        if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres'); setLoading(false); return }
        await signUp(email, password, fullName.trim())
        setSuccessMsg('Conta criada! Verifique seu email para confirmar o cadastro.')
      }
    } catch (err) {
      const msg = err?.message || 'Erro desconhecido'
      if (msg.includes('Invalid login')) setError('Email ou senha incorretos')
      else if (msg.includes('already registered')) setError('Este email ja esta cadastrado')
      else if (msg.includes('valid email')) setError('Informe um email valido')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const boxStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: 'linear-gradient(160deg, #046BD2 0%, #045cb4 50%, #033d7a 100%)',
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

  return (
    <div style={boxStyle}>
      <div style={{ marginBottom: 28, textAlign: 'center', animation: 'fadeIn .4s ease-out' }}>
        <img src="/logo-proti.png" alt="Protector Sistemas" style={{
          height: 56, marginBottom: 12, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.3))'
        }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '0.5px', color: '#fff' }}>PROTECTOR SISTEMAS</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', margin: '4px 0' }}>BIM Seguranca Eletronica</p>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{APP_VERSION.label}</div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#F0F5FA', borderRadius: 8, padding: 3 }}>
          <button style={tabBtnStyle(tab === 'login')} onClick={() => { setTab('login'); setError(''); setSuccessMsg('') }}>Entrar</button>
          <button style={tabBtnStyle(tab === 'register')} onClick={() => { setTab('register'); setError(''); setSuccessMsg('') }}>Criar Conta</button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#64748b', marginBottom: 6, display: 'block', fontWeight: 600 }}>Nome completo</label>
              <input style={inputStyle} type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome"
                onFocus={e => { e.target.style.borderColor = '#046BD2'; e.target.style.boxShadow = '0 0 0 3px rgba(4,107,210,.1)' }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }} />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: '#64748b', marginBottom: 6, display: 'block', fontWeight: 600 }}>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
              onFocus={e => { e.target.style.borderColor = '#046BD2'; e.target.style.boxShadow = '0 0 0 3px rgba(4,107,210,.1)' }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, color: '#64748b', marginBottom: 6, display: 'block', fontWeight: 600 }}>Senha</label>
            <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
              onFocus={e => { e.target.style.borderColor = '#046BD2'; e.target.style.boxShadow = '0 0 0 3px rgba(4,107,210,.1)' }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }} />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,.08)', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12, border: '1px solid rgba(239,68,68,.2)', fontWeight: 500 }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{ background: 'rgba(34,197,94,.08)', color: '#16a34a', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12, border: '1px solid rgba(34,197,94,.2)', fontWeight: 500 }}>
              {successMsg}
            </div>
          )}

          <button type="submit" style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {loading ? '...' : tab === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
