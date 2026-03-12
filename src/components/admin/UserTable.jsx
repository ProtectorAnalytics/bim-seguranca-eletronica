import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ErrorFallback } from '../AdminPage'

/* ─── SVG Icons ─── */
const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

export default function UserTable() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [confirmingRole, setConfirmingRole] = useState(null) // userId being confirmed

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!supabase) throw new Error('Supabase nao configurado')
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('*, subscriptions(*, plans(*))')
        .order('created_at', { ascending: false })
      if (fetchErr) throw new Error(fetchErr.message)
      setUsers(data || [])
    } catch (e) {
      console.error('UserTable fetch error:', e)
      setError(e.message || 'Erro ao carregar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    setActionError(null)
    setConfirmingRole(null)
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
      if (updateErr) throw new Error(updateErr.message)
      await fetchUsers()
    } catch (e) {
      console.error('Toggle role error:', e)
      setActionError(`Erro ao alterar role: ${e.message}`)
    }
  }

  const cellStyle = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #E2E8F0' }
  const thStyle = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #E2E8F0', fontWeight: 600, color: '#64748b', textAlign: 'left', background: '#F0F5FA' }

  if (loading) return <div style={{ color: '#94a3b8', padding: 20 }}>Carregando usuarios...</div>
  if (error) return <ErrorFallback error={error} onRetry={fetchUsers} />

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>{users.length} usuario(s)</span>
        <button onClick={fetchUsers} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#046BD2', color: '#fff', border: 'none', borderRadius: 6,
          padding: '6px 12px', fontSize: 11, cursor: 'pointer',
        }}>
          <RefreshIcon /> Atualizar
        </button>
      </div>

      {actionError && (
        <div style={{
          padding: '10px 14px', marginBottom: 12, borderRadius: 8, fontSize: 12,
          background: 'rgba(239,68,68,.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,.2)',
        }}>
          {actionError}
          <button onClick={() => setActionError(null)} style={{
            float: 'right', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 14,
          }}>x</button>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', borderRadius: 8 }}>
        <thead>
          <tr>
            <th style={thStyle}>Nome</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Empresa</th>
            <th style={thStyle}>Plano</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Cadastro</th>
            <th style={thStyle}>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const sub = u.subscriptions?.[0]
            const plan = sub?.plans
            const statusColor = {
              trialing: '#f59e0b', active: '#22c55e', expired: '#ef4444',
              cancelled: '#6b7280', suspended: '#ef4444'
            }[sub?.status] || '#6b7280'
            const isConfirming = confirmingRole === u.id
            return (
              <tr key={u.id}>
                <td style={cellStyle}>{u.full_name || '—'}</td>
                <td style={{ ...cellStyle, color: '#94a3b8' }}>{u.email}</td>
                <td style={cellStyle}>{u.company_name || '—'}</td>
                <td style={cellStyle}>{plan?.name || '—'}</td>
                <td style={cellStyle}>
                  <span style={{ color: statusColor, fontWeight: 600, fontSize: 11 }}>
                    {sub?.status || '—'}
                  </span>
                </td>
                <td style={cellStyle}>
                  <span style={{
                    background: u.role === 'admin' ? '#f59e0b' : '#E2E8F0',
                    color: u.role === 'admin' ? '#000' : '#1e293b',
                    padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600
                  }}>{u.role}</span>
                </td>
                <td style={{ ...cellStyle, color: '#94a3b8', fontSize: 11 }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td style={cellStyle}>
                  {isConfirming ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => toggleRole(u.id, u.role)} style={{
                        background: '#22c55e', color: '#000', border: 'none', borderRadius: 4,
                        padding: '3px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 600,
                      }}>Sim</button>
                      <button onClick={() => setConfirmingRole(null)} style={{
                        background: '#F0F5FA', color: '#64748b', border: 'none', borderRadius: 4,
                        padding: '3px 8px', fontSize: 10, cursor: 'pointer',
                      }}>Nao</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmingRole(u.id)} style={{
                      background: '#F0F5FA', color: '#64748b', border: 'none', borderRadius: 4,
                      padding: '3px 8px', fontSize: 10, cursor: 'pointer'
                    }}>
                      {u.role === 'admin' ? 'Rebaixar' : 'Promover'}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
          {users.length === 0 && (
            <tr><td colSpan={8} style={{ ...cellStyle, textAlign: 'center', color: '#64748b', padding: 20 }}>Nenhum usuario encontrado</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
