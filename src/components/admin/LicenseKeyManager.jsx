import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ErrorFallback } from '../AdminPage'

/* ─── SVG Icons ─── */
const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const KeyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);
const LoaderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function LicenseKeyManager() {
  const [keys, setKeys] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [genPlanId, setGenPlanId] = useState('')
  const [genCount, setGenCount] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(null) // keyId
  const [copiedKey, setCopiedKey] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!supabase) throw new Error('Supabase nao configurado')

      const [keysRes, plansRes] = await Promise.all([
        supabase.from('license_keys').select('*, plans(name, slug), profiles(full_name, email)').order('created_at', { ascending: false }),
        supabase.from('plans').select('*').order('price_brl')
      ])

      if (keysRes.error) throw new Error('Erro chaves: ' + keysRes.error.message)
      if (plansRes.error) throw new Error('Erro planos: ' + plansRes.error.message)

      setKeys(keysRes.data || [])
      setPlans(plansRes.data || [])
      if (!genPlanId && plansRes.data?.length) {
        setGenPlanId(plansRes.data[1]?.id || plansRes.data[0]?.id || '')
      }
    } catch (e) {
      console.error('LicenseKeyManager fetch error:', e)
      setError(e.message || 'Erro ao carregar chaves')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const generateKeys = async () => {
    if (!genPlanId || genCount < 1) return
    setGenerating(true)
    setActionError(null)
    try {
      const batch = Array.from({ length: genCount }, () => ({ plan_id: genPlanId }))
      const { error: insertErr } = await supabase.from('license_keys').insert(batch)
      if (insertErr) throw new Error(insertErr.message)
      await fetchData()
    } catch (e) {
      console.error('Generate keys error:', e)
      setActionError(`Erro ao gerar chaves: ${e.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const revokeKey = async (keyId) => {
    setConfirmRevoke(null)
    setActionError(null)
    try {
      const { error: updateErr } = await supabase
        .from('license_keys')
        .update({ status: 'revoked' })
        .eq('id', keyId)
      if (updateErr) throw new Error(updateErr.message)
      await fetchData()
    } catch (e) {
      console.error('Revoke key error:', e)
      setActionError(`Erro ao revogar chave: ${e.message}`)
    }
  }

  const copyKey = async (key) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = key
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  const filtered = filter === 'all' ? keys : keys.filter(k => k.status === filter)
  const cellStyle = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #334155' }
  const thStyle = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #334155', fontWeight: 600, color: '#94a3b8', textAlign: 'left', background: '#0f172a' }

  if (loading) return <div style={{ color: '#94a3b8', padding: 20 }}>Carregando chaves...</div>
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

      {/* Generator */}
      <div style={{
        background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 16, marginBottom: 16,
        display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Plano</label>
          <select value={genPlanId} onChange={e => setGenPlanId(e.target.value)} style={{
            background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155',
            borderRadius: 6, padding: '6px 10px', fontSize: 12
          }}>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} (R$ {Number(p.price_brl || 0).toFixed(2)})</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Quantidade</label>
          <input type="number" min={1} max={50} value={genCount} onChange={e => setGenCount(parseInt(e.target.value) || 1)}
            style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', fontSize: 12, width: 70 }} />
        </div>
        <button onClick={generateKeys} disabled={generating} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#22c55e', color: '#000', border: 'none', borderRadius: 6,
          padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: generating ? 'wait' : 'pointer',
          opacity: generating ? 0.5 : 1
        }}>
          {generating ? <><LoaderIcon /> Gerando...</> : <><KeyIcon /> Gerar Chaves</>}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all', 'available', 'redeemed', 'revoked'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? '#3b82f6' : '#334155', color: '#e2e8f0', border: 'none',
            borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer',
            fontWeight: filter === f ? 700 : 400,
          }}>
            {f === 'all' ? 'Todas' : f} ({f === 'all' ? keys.length : keys.filter(k => k.status === f).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e293b', borderRadius: 8 }}>
          <thead>
            <tr>
              <th style={thStyle}>Chave</th>
              <th style={thStyle}>Plano</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Resgatada por</th>
              <th style={thStyle}>Criada em</th>
              <th style={thStyle}>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(k => {
              const isRevokeConfirm = confirmRevoke === k.id
              return (
                <tr key={k.id}>
                  <td style={cellStyle}>
                    <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: 4, fontSize: 11, letterSpacing: 1 }}>
                      {k.key || '—'}
                    </code>
                    {k.key && (
                      <button onClick={() => copyKey(k.key)} style={{
                        background: 'transparent', border: 'none', color: copiedKey === k.key ? '#22c55e' : '#94a3b8',
                        cursor: 'pointer', marginLeft: 6, display: 'inline-flex', alignItems: 'center',
                      }} title="Copiar">
                        {copiedKey === k.key ? <CheckIcon /> : <CopyIcon />}
                      </button>
                    )}
                  </td>
                  <td style={cellStyle}>{k.plans?.name || '—'}</td>
                  <td style={cellStyle}>
                    <span style={{
                      color: { available: '#22c55e', redeemed: '#3b82f6', revoked: '#ef4444' }[k.status] || '#6b7280',
                      fontWeight: 600, fontSize: 11
                    }}>{k.status || '—'}</span>
                  </td>
                  <td style={{ ...cellStyle, fontSize: 11, color: '#94a3b8' }}>
                    {k.profiles ? `${k.profiles.full_name || ''} (${k.profiles.email || ''})` : '—'}
                  </td>
                  <td style={{ ...cellStyle, fontSize: 11, color: '#94a3b8' }}>
                    {k.created_at ? new Date(k.created_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td style={cellStyle}>
                    {k.status === 'available' && (
                      isRevokeConfirm ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => revokeKey(k.id)} style={{
                            background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4,
                            padding: '3px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 600,
                          }}>Sim</button>
                          <button onClick={() => setConfirmRevoke(null)} style={{
                            background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 4,
                            padding: '3px 8px', fontSize: 10, cursor: 'pointer',
                          }}>Nao</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmRevoke(k.id)} style={{
                          background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4,
                          padding: '3px 8px', fontSize: 10, cursor: 'pointer'
                        }}>Revogar</button>
                      )
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ ...cellStyle, textAlign: 'center', color: '#64748b', padding: 20 }}>Nenhuma chave encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
