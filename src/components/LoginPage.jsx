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
      else if (msg.includes('already registered')) setError('Este email já está cadastrado')
      else if (msg.includes('valid email')) setError('Informe um email válido')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const boxStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif'
  }
  const cardStyle = {
    background: '#1e293b', borderRadius: 12, padding: '32px 28px', width: 380, maxWidth: '90vw',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  }
  const inputStyle = {
    width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155',
    borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box'
  }
  const btnStyle = {
    width: '100%', padding: '12px 16px', background: '#3b82f6', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8
  }
  const tabBtnStyle = (active) => ({
    flex: 1, padding: '10px 0', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 600,
    background: active ? '#334155' : 'transparent', color: active ? '#e2e8f0' : '#94a3b8',
    border: 'none', borderRadius: 8, transition: 'all .2s'
  })

  return (
    <div style={boxStyle}>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>PROTECTOR SISTEMAS</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0' }}>BIM Segurança Eletrônica</p>
        <div style={{ fontSize: 11, color: '#64748b' }}>{APP_VERSION.label}</div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#0f172a', borderRadius: 8, padding: 3 }}>
          <button style={tabBtnStyle(tab === 'login')} onClick={() => { setTab('login'); setError(''); setSuccessMsg('') }}>Entrar</button>
          <button style={tabBtnStyle(tab === 'register')} onClick={() => { setTab('register'); setError(''); setSuccessMsg('') }}>Criar Conta</button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>Nome completo</label>
              <input style={inputStyle} type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome" />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' }}>Senha</label>
            <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>

          {error && (
            <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#14532d', color: '#86efac', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
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
