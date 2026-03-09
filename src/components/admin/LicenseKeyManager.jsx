import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function LicenseKeyManager() {
  const [keys, setKeys] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [genPlanId, setGenPlanId] = useState('')
  const [genCount, setGenCount] = useState(5)
  const [generating, setGenerating] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const [{ data: keysData }, { data: plansData }] = await Promise.all([
      supabase.from('license_keys').select('*, plans(name, slug), profiles(full_name, email)').order('created_at', { ascending: false }),
      supabase.from('plans').select('*').order('price_brl')
    ])
    setKeys(keysData || [])
    setPlans(plansData || [])
    if (!genPlanId && plansData?.length) setGenPlanId(plansData[1]?.id || plansData[0]?.id)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const generateKeys = async () => {
    if (!genPlanId || genCount < 1) return
    setGenerating(true)
    const batch = Array.from({ length: genCount }, () => ({ plan_id: genPlanId }))
    const { error } = await supabase.from('license_keys').insert(batch)
    if (error) alert('Erro ao gerar chaves: ' + error.message)
    setGenerating(false)
    fetchData()
  }

  const revokeKey = async (keyId) => {
    if (!confirm('Revogar esta chave?')) return
    await supabase.from('license_keys').update({ status: 'revoked' }).eq('id', keyId)
    fetchData()
  }

  const copyKey = (key) => {
    navigator.clipboard.writeText(key).then(() => {
      // Visual feedback handled by browser
    })
  }

  const filtered = filter === 'all' ? keys : keys.filter(k => k.status === filter)
  const cellStyle = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #334155' }

  if (loading) return <div style={{ color: '#94a3b8', padding: 20 }}>Carregando chaves...</div>

  return (
    <div>
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
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} (R$ {Number(p.price_brl).toFixed(2)})</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Quantidade</label>
          <input type="number" min={1} max={50} value={genCount} onChange={e => setGenCount(parseInt(e.target.value) || 1)}
            style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', fontSize: 12, width: 70 }} />
        </div>
        <button onClick={generateKeys} disabled={generating} style={{
          background: '#22c55e', color: '#000', border: 'none', borderRadius: 6,
          padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          opacity: generating ? 0.5 : 1
        }}>
          {generating ? '⏳ Gerando...' : '🔑 Gerar Chaves'}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {['all', 'available', 'redeemed', 'revoked'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? '#3b82f6' : '#334155', color: '#e2e8f0', border: 'none',
            borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer'
          }}>
            {f === 'all' ? 'Todas' : f} ({f === 'all' ? keys.length : keys.filter(k => k.status === f).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e293b', borderRadius: 8 }}>
        <thead>
          <tr>
            <td style={{ ...cellStyle, fontWeight: 600, color: '#94a3b8' }}>Chave</td>
            <td style={{ ...cellStyle, fontWeight: 600, color: '#94a3b8' }}>Plano</td>
            <td style={{ ...cellStyle, fontWeight: 600, color: '#94a3b8' }}>Status</td>
            <td style={{ ...cellStyle, fontWeight: 600, color: '#94a3b8' }}>Resgatada por</td>
            <td style={{ ...cellStyle, fontWeight: 600, color: '#94a3b8' }}>Criada em</td>
            <td style={{ ...cellStyle, fontWeight: 600, color: '#94a3b8' }}>Ações</td>
          </tr>
        </thead>
        <tbody>
          {filtered.map(k => (
            <tr key={k.id}>
              <td style={cellStyle}>
                <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: 4, fontSize: 11, letterSpacing: 1 }}>
                  {k.key}
                </code>
                <button onClick={() => copyKey(k.key)} style={{
                  background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: 6, fontSize: 12
                }} title="Copiar">📋</button>
              </td>
              <td style={cellStyle}>{k.plans?.name || '—'}</td>
              <td style={cellStyle}>
                <span style={{
                  color: { available: '#22c55e', redeemed: '#3b82f6', revoked: '#ef4444' }[k.status],
                  fontWeight: 600, fontSize: 11
                }}>{k.status}</span>
              </td>
              <td style={{ ...cellStyle, fontSize: 11, color: '#94a3b8' }}>
                {k.profiles ? `${k.profiles.full_name || ''} (${k.profiles.email})` : '—'}
              </td>
              <td style={{ ...cellStyle, fontSize: 11, color: '#94a3b8' }}>
                {new Date(k.created_at).toLocaleDateString('pt-BR')}
              </td>
              <td style={cellStyle}>
                {k.status === 'available' && (
                  <button onClick={() => revokeKey(k.id)} style={{
                    background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4,
                    padding: '3px 8px', fontSize: 10, cursor: 'pointer'
                  }}>Revogar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
