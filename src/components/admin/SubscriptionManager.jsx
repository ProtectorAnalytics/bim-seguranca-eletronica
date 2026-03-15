import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ErrorFallback } from '../AdminPage'

export default function SubscriptionManager() {
  const [subs, setSubs] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [confirmAction, setConfirmAction] = useState(null) // { subId, action, label }
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!supabase) throw new Error('Supabase nao configurado')

      const [subsRes, plansRes] = await Promise.all([
        supabase.from('subscriptions').select('*, profiles(full_name, email), plans(name, slug)').order('created_at', { ascending: false }),
        supabase.from('plans').select('*').order('price_brl')
      ])

      if (subsRes.error) throw new Error('Erro assinaturas: ' + subsRes.error.message)
      if (plansRes.error) throw new Error('Erro planos: ' + plansRes.error.message)

      setSubs(subsRes.data || [])
      setPlans(plansRes.data || [])
    } catch (e) {
      console.error('SubscriptionManager fetch error:', e)
      setError(e.message || 'Erro ao carregar assinaturas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const updateSub = async (subId, updates) => {
    setActionError(null)
    try {
      const { error: updateErr } = await supabase
        .from('subscriptions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', subId)
      if (updateErr) throw new Error(updateErr.message)
      await fetchData()
    } catch (e) {
      console.error('Update subscription error:', e)
      setActionError(`Erro ao atualizar assinatura: ${e.message}`)
    }
  }

  const changeStatus = async (sub, newStatus) => {
    setConfirmAction(null)
    const updates = { status: newStatus }
    if (newStatus === 'active') {
      updates.current_period_start = new Date().toISOString()
      // Use 365 days by default (standard annual subscription)
      // null means unlimited (no expiry)
      updates.current_period_end = new Date(Date.now() + 365 * 86400000).toISOString()
    }
    await updateSub(sub.id, updates)
  }

  const changePlan = async (sub, newPlanId) => {
    await updateSub(sub.id, { plan_id: newPlanId })
  }

  const extendTrial = async (sub, days) => {
    setConfirmAction(null)
    const newEnd = new Date(sub.trial_ends_at || Date.now())
    newEnd.setDate(newEnd.getDate() + days)
    await updateSub(sub.id, { trial_ends_at: newEnd.toISOString(), status: 'trialing' })
  }

  const setNeverExpires = async (sub) => {
    setConfirmAction(null)
    await updateSub(sub.id, {
      status: 'active',
      current_period_end: null,
      current_period_start: sub.current_period_start || new Date().toISOString()
    })
  }

  const extendPeriod = async (sub, days) => {
    setConfirmAction(null)
    const base = sub.current_period_end ? new Date(sub.current_period_end) : new Date()
    base.setDate(base.getDate() + days)
    await updateSub(sub.id, { current_period_end: base.toISOString(), status: 'active' })
  }

  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter)
  const cellStyle = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #E2E8F0' }
  const thStyle = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #E2E8F0', fontWeight: 600, color: '#64748b', textAlign: 'left', background: '#F0F5FA' }

  if (loading) return <div style={{ color: '#94a3b8', padding: 20 }}>Carregando assinaturas...</div>
  if (error) return <ErrorFallback error={error} onRetry={fetchData} />

  return (
    <div>
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

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all', 'trialing', 'active', 'expired', 'cancelled', 'suspended'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(0); }} style={{
            background: filter === f ? '#3b82f6' : '#E2E8F0', color: filter === f ? '#fff' : '#64748b', border: 'none',
            borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: filter === f ? 700 : 400
          }}>
            {f === 'all' ? 'Todos' : f} ({f === 'all' ? subs.length : subs.filter(s => s.status === f).length})
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', borderRadius: 8 }}>
          <thead>
            <tr>
              <th style={thStyle}>Usuario</th>
              <th style={thStyle}>Plano</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Periodo</th>
              <th style={thStyle}>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(s => {
              const isConfirming = confirmAction?.subId === s.id
              return (
                <tr key={s.id}>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 500 }}>{s.profiles?.full_name || '—'}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{s.profiles?.email || ''}</div>
                  </td>
                  <td style={cellStyle}>
                    <select value={s.plan_id || ''} onChange={e => changePlan(s, e.target.value)} style={{
                      background: '#F0F5FA', color: '#1e293b', border: '1px solid #E2E8F0',
                      borderRadius: 4, padding: '3px 6px', fontSize: 11
                    }}>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td style={cellStyle}>
                    <span style={{
                      color: { trialing: '#f59e0b', active: '#22c55e', expired: '#ef4444', cancelled: '#6b7280', suspended: '#ef4444' }[s.status] || '#6b7280',
                      fontWeight: 600, fontSize: 11
                    }}>{s.status || '—'}</span>
                    {s.status === 'trialing' && s.trial_ends_at && (
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>
                        ate {new Date(s.trial_ends_at).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </td>
                  <td style={{ ...cellStyle, fontSize: 10, color: '#94a3b8' }}>
                    {s.current_period_start ? new Date(s.current_period_start).toLocaleDateString('pt-BR') : '—'}
                    {' → '}
                    {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString('pt-BR') : (
                      <span style={{ color: '#22c55e', fontWeight: 700 }}>∞ sem validade</span>
                    )}
                  </td>
                  <td style={cellStyle}>
                    {isConfirming ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: '#fbbf24' }}>{confirmAction.label}?</span>
                        <button onClick={() => {
                          if (confirmAction.action === 'activate') changeStatus(s, 'active')
                          else if (confirmAction.action === 'suspend') changeStatus(s, 'suspended')
                          else if (confirmAction.action === 'extend') extendTrial(s, 14)
                          else if (confirmAction.action === 'never_expires') setNeverExpires(s)
                        }} style={{
                          background: '#22c55e', color: '#000', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 600,
                        }}>Sim</button>
                        <button onClick={() => setConfirmAction(null)} style={{
                          background: '#F0F5FA', color: '#64748b', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer',
                        }}>Nao</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {s.status !== 'active' && (
                          <button onClick={() => setConfirmAction({ subId: s.id, action: 'activate', label: 'Ativar' })} style={{
                            background: '#22c55e', color: '#000', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer'
                          }}>Ativar</button>
                        )}
                        {s.status !== 'suspended' && (
                          <button onClick={() => setConfirmAction({ subId: s.id, action: 'suspend', label: 'Suspender' })} style={{
                            background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer'
                          }}>Suspender</button>
                        )}
                        {s.status === 'trialing' && (
                          <button onClick={() => setConfirmAction({ subId: s.id, action: 'extend', label: '+14 dias' })} style={{
                            background: '#f59e0b', color: '#000', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer'
                          }}>+14 dias</button>
                        )}
                        {s.current_period_end && (
                          <>
                            <button onClick={() => setConfirmAction({ subId: s.id, action: 'never_expires', label: '∞ Sem validade' })} style={{
                              background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer'
                            }}>∞</button>
                            <button onClick={() => extendPeriod(s, 30)} style={{
                              background: '#F0F5FA', color: '#64748b', border: 'none', borderRadius: 4, padding: '3px 6px', fontSize: 10, cursor: 'pointer'
                            }}>+30d</button>
                            <button onClick={() => extendPeriod(s, 365)} style={{
                              background: '#F0F5FA', color: '#64748b', border: 'none', borderRadius: 4, padding: '3px 6px', fontSize: 10, cursor: 'pointer'
                            }}>+1a</button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ ...cellStyle, textAlign: 'center', color: '#64748b', padding: 20 }}>Nenhuma assinatura encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ padding: '4px 10px', fontSize: 11, border: '1px solid #E2E8F0', borderRadius: 4, cursor: page === 0 ? 'default' : 'pointer', background: '#fff', color: page === 0 ? '#cbd5e1' : '#1e293b' }}>
            ← Anterior
          </button>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            {page + 1} / {Math.ceil(filtered.length / PAGE_SIZE)}
          </span>
          <button onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / PAGE_SIZE) - 1, p + 1))} disabled={(page + 1) * PAGE_SIZE >= filtered.length}
            style={{ padding: '4px 10px', fontSize: 11, border: '1px solid #E2E8F0', borderRadius: 4, cursor: (page + 1) * PAGE_SIZE >= filtered.length ? 'default' : 'pointer', background: '#fff', color: (page + 1) * PAGE_SIZE >= filtered.length ? '#cbd5e1' : '#1e293b' }}>
            Próximo →
          </button>
        </div>
      )}
    </div>
  )
}
