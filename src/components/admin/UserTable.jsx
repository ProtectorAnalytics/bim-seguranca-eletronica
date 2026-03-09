import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function UserTable() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*, subscriptions(*, plans(*))')
      .order('created_at', { ascending: false })
    if (!error) setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    if (!confirm(`Alterar role para "${newRole}"?`)) return
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    fetchUsers()
  }

  const cellStyle = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #334155' }
  const thStyle = { ...cellStyle, fontWeight: 600, color: '#94a3b8', textAlign: 'left', background: '#0f172a' }

  if (loading) return <div style={{ color: '#94a3b8', padding: 20 }}>Carregando usuários...</div>

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>{users.length} usuário(s)</span>
        <button onClick={fetchUsers} style={{
          background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 6,
          padding: '6px 12px', fontSize: 11, cursor: 'pointer'
        }}>🔄 Atualizar</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e293b', borderRadius: 8 }}>
        <thead>
          <tr>
            <th style={thStyle}>Nome</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Empresa</th>
            <th style={thStyle}>Plano</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Cadastro</th>
            <th style={thStyle}>Ações</th>
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
                    background: u.role === 'admin' ? '#f59e0b' : '#334155',
                    color: u.role === 'admin' ? '#000' : '#e2e8f0',
                    padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600
                  }}>{u.role}</span>
                </td>
                <td style={{ ...cellStyle, color: '#94a3b8', fontSize: 11 }}>
                  {new Date(u.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td style={cellStyle}>
                  <button onClick={() => toggleRole(u.id, u.role)} style={{
                    background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 4,
                    padding: '3px 8px', fontSize: 10, cursor: 'pointer'
                  }}>
                    {u.role === 'admin' ? 'Rebaixar' : 'Promover'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
