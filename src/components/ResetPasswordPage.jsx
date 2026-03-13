import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const PASSWORD_RULES = [
  { id: 'len', label: 'Mínimo 8 caracteres', test: p => p.length >= 8 },
  { id: 'upper', label: 'Uma letra maiúscula', test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Uma letra minúscula', test: p => /[a-z]/.test(p) },
  { id: 'num', label: 'Um número', test: p => /[0-9]/.test(p) },
  { id: 'special', label: 'Um caractere especial (!@#$%)', test: p => /[^A-Za-z0-9]/.test(p) },
]
function validatePassword(p) { return PASSWORD_RULES.every(r => r.test(p)) }

export default function ResetPasswordPage({ onDone }) {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validatePassword(password)) { setError('A senha não atende aos requisitos mínimos'); return }
    if (password !== confirm) { setError('As senhas não coincidem'); return }
    setLoading(true)
    try {
      await updatePassword(password)
      setSuccess(true)
      // Clean URL and redirect after 2s
      window.history.replaceState({}, '', '/')
      setTimeout(() => onDone?.(), 2000)
    } catch (err) {
      setError(err?.message || 'Erro ao atualizar senha')
    } finally {
      setLoading(false)
    }
  }

  const boxStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#F0F5FA', color: '#1e293b',
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  }
  const cardStyle = {
    background: '#ffffff', borderRadius: 12, padding: '32px 28px', width: 400, maxWidth: '90vw',
    boxShadow: '0 20px 60px rgba(0,0,0,.15)', border: '1px solid #E2E8F0'
  }
  const inputStyle = {
    width: '100%', padding: '12px 14px', background: '#F0F5FA', border: '1px solid #E2E8F0',
    borderRadius: 8, color: '#1e293b', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
  }

  if (success) return (
    <div style={boxStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Senha Atualizada!</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>Redirecionando para o painel...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div style={boxStyle}>
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <img src="/logo-proti.png" alt="Protector Sistemas" style={{ height: 48, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.2))' }} />
      </div>
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Definir Nova Senha</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Crie uma senha segura para sua conta.</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block', fontWeight: 600 }}>Nova senha</label>
            <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nova senha" required />
          </div>
          <div style={{ marginBottom: 4 }}>
            <label style={{ fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block', fontWeight: 600 }}>Confirmar senha</label>
            <input style={inputStyle} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repita a senha" required />
          </div>

          {/* Rules */}
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {PASSWORD_RULES.map(r => (
              <div key={r.id} style={{ fontSize: 11, color: r.test(password) ? '#22c55e' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{r.test(password) ? '✓' : '○'}</span> {r.label}
              </div>
            ))}
            <div style={{ fontSize: 11, color: password && confirm && password === confirm ? '#22c55e' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{password && confirm && password === confirm ? '✓' : '○'}</span> Senhas coincidem
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,.08)', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 12, border: '1px solid rgba(239,68,68,.2)' }}>
              {error}
            </div>
          )}

          <button type="submit" style={{
            width: '100%', padding: '12px 16px', background: '#046BD2', color: '#fff', border: 'none',
            borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 16,
            opacity: loading ? 0.6 : 1,
          }} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
