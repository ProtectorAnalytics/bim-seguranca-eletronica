import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function SubscriptionManager() {
  const [subs, setSubs] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchData = async () => {
    setLoading(true)
    const [{ data: subsData }, { data: plansData }] = await Promise.all([
      supabase.from('subscriptions').select('*, profiles(full_name, email), plans(name, slug)').order('created_at', { ascending: false }),
      supabase.from('plans').select('*').order('price_brl')
    ])
    setSubs(subsData || [])
    setPlans(plansData || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const updateSub = async (subId, updates) => {
    await supabase.from('subscriptions').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', subId)
    fetchData()
  }

  const changeStatus = async (sub, newStatus) => {
    if (!confirm(`Alterar status para "${newStatus}"?`)) return
    const updates = { status: newStatus }
    if (newStatus === 'active') {
      updates.current_period_start = new Date().toISOString()
      updates.current_period_end = new Date(Date.now() + 30 * 86400000).toISOString()
    }
    await updateSub(sub.id, updates)
  }

  const changePlan = async (sub, newPlanId) => {
    await updateSub(sub.id, { plan_id: newPlanId })
  }

  const extendTrial = async (sub, days) => {
    const newEnd = new Date(sub.trial_ends_at || Date.now())
    newEnd.setDate(newEnd.getDate() + days)
    await updateSub(sub.id, { trial_ends_at: newEnd.toISOString(), status: 'trialing' })
  }

  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter)
  const cellStyle = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #334155' }

  if (loading) return <div style={{ color: '#94a3b8', padding: 20 }}>Carregando assinaturas...</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all', 'trialing', 'active', 'expired', 'cancelled', 'suspended'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? '#3b82f6' : '#334155', color: '#e2e8f0', border: 'none',
            borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: filter === f ? 700 : 400
          }}>
            {f === 'all' ? 'Todos' : f} ({f === 'all' ? subs.length : subs.filter(s => s.status === f).length})
          </button>
        ))}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e293b', borderRadius: 8 }}>
        <thead>
          <tr>
            <td style={{ ...cellStyle, fontWeight: 600, color: '#94a3b8' }}>Usuário</td>
            <td style={{ ...cellStyle, fontWeight: 600, color: '#94a3b8' }}>Plano</td>
            <td style={{ ...cellStyle, fontWeight: 600, color: '#94a3b8' }}>Status</td>
            <td style={{ ...cellStyle, fontWeight: 600, color: '#94a3b8' }}>Período</td>
            <td style={{ ...cellStyle, fontWeight: 600, color: '#94a3b8' }}>Ações</td>
          </tr>
        </thead>
        <tbody>
          {filtered.map(s => (
            <tr key={s.id}>
              <td style={cellStyle}>
                <div style={{ fontWeight: 500 }}>{s.profiles?.full_name || '—'}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{s.profiles?.email}</div>
              </td>
              <td style={cellStyle}>
                <select value={s.plan_id} onChange={e => changePlan(s, e.target.value)} style={{
                  background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155',
                  borderRadius: 4, padding: '3px 6px', fontSize: 11
                }}>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </td>
              <td style={cellStyle}>
                <span style={{
                  color: { trialing: '#f59e0b', active: '#22c55e', expired: '#ef4444', cancelled: '#6b7280', suspended: '#ef4444' }[s.status],
                  fontWeight: 600, fontSize: 11
                }}>{s.status}</span>
                {s.status === 'trialing' && s.trial_ends_at && (
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>
                    até {new Date(s.trial_ends_at).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </td>
              <td style={{ ...cellStyle, fontSize: 10, color: '#94a3b8' }}>
                {s.current_period_start ? new Date(s.current_period_start).toLocaleDateString('pt-BR') : '—'}
                {' → '}
                {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString('pt-BR') : '—'}
              </td>
              <td style={{ ...cellStyle, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {s.status !== 'active' && (
                  <button onClick={() => changeStatus(s, 'active')} style={{
                    background: '#22c55e', color: '#000', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer'
                  }}>Ativar</button>
                )}
                {s.status !== 'suspended' && (
                  <button onClick={() => changeStatus(s, 'suspended')} style={{
                    background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer'
                  }}>Suspender</button>
                )}
                {s.status === 'trialing' && (
                  <button onClick={() => extendTrial(s, 14)} style={{
                    background: '#f59e0b', color: '#000', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer'
                  }}>+14 dias</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
