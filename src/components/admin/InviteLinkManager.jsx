import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { ErrorFallback } from '../AdminPage'

/* ─── SVG Icons ─── */
const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)

export default function InviteLinkManager() {
  const { profile } = useAuth()
  const [invites, setInvites] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [copiedToken, setCopiedToken] = useState(null)
  const [confirmRevoke, setConfirmRevoke] = useState(null)

  // Generator form
  const [showGen, setShowGen] = useState(false)
  const [genType, setGenType] = useState('self_register')
  const [genEmail, setGenEmail] = useState('')
  const [genPlanId, setGenPlanId] = useState('')
  const [genMaxUses, setGenMaxUses] = useState(1)
  const [genExpDays, setGenExpDays] = useState(7)
  const [generating, setGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!supabase) throw new Error('Supabase nao configurado')
      const [invRes, plansRes] = await Promise.all([
        supabase.from('invite_links')
          .select('*, plans(name, slug), profiles!invite_links_created_by_fkey(full_name, email)')
          .order('created_at', { ascending: false }),
        supabase.from('plans').select('*').order('price_brl'),
      ])
      if (invRes.error) throw new Error('Erro convites: ' + invRes.error.message)
      if (plansRes.error) throw new Error('Erro planos: ' + plansRes.error.message)
      setInvites(invRes.data || [])
      setPlans(plansRes.data || [])
      if (!genPlanId && plansRes.data?.length) {
        setGenPlanId(plansRes.data[1]?.id || plansRes.data[0]?.id || '')
      }
    } catch (e) {
      console.error('InviteLinkManager fetch error:', e)
      setError(e.message || 'Erro ao carregar convites')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const generateInvite = async () => {
    if (!genPlanId) return
    if (genType === 'pre_register' && !genEmail.trim()) {
      setActionError('Informe o email do convidado para convite pré-registro')
      return
    }
    if (genType === 'pre_register' && genEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(genEmail.trim())) {
      setActionError('Formato de email inválido')
      return
    }
    setGenerating(true)
    setActionError(null)
    setGeneratedUrl('')
    try {
      const insertData = {
        type: genType,
        plan_id: genPlanId,
        max_uses: genType === 'pre_register' ? 1 : Math.max(1, genMaxUses),
        created_by: profile?.id || null,
      }
      if (genType === 'pre_register') {
        insertData.email = genEmail.trim().toLowerCase()
      }
      if (genExpDays > 0) {
        insertData.expires_at = new Date(Date.now() + genExpDays * 86400000).toISOString()
      }

      const { data, error: insertErr } = await supabase
        .from('invite_links')
        .insert([insertData])
        .select('token')
        .single()
      if (insertErr) throw new Error(insertErr.message)

      const url = `${window.location.origin}?invite=${data.token}`
      setGeneratedUrl(url)
      copyToClipboard(url)
      await fetchData()
    } catch (e) {
      console.error('Generate invite error:', e)
      setActionError(`Erro ao gerar convite: ${e.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const revokeInvite = async (id) => {
    setConfirmRevoke(null)
    setActionError(null)
    try {
      const { error: updateErr } = await supabase
        .from('invite_links')
        .update({ status: 'revoked' })
        .eq('id', id)
      if (updateErr) throw new Error(updateErr.message)
      await fetchData()
    } catch (e) {
      setActionError(`Erro ao revogar: ${e.message}`)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }

  const copyInviteUrl = async (token) => {
    const url = `${window.location.origin}?invite=${token}`
    await copyToClipboard(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const filtered = filter === 'all' ? invites : invites.filter(i => i.status === filter)
  const statusColors = { active: '#22c55e', used: '#3b82f6', expired: '#f59e0b', revoked: '#ef4444' }
  const statusLabels = { active: 'Ativo', used: 'Usado', expired: 'Expirado', revoked: 'Revogado' }

  const cellStyle = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #E2E8F0' }
  const thStyle = { padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #E2E8F0', fontWeight: 600, color: '#64748b', textAlign: 'left', background: '#F0F5FA' }
  const inputSt = {
    width: '100%', padding: '6px 8px', background: '#F0F5FA', border: '1px solid #E2E8F0',
    borderRadius: 6, color: '#1e293b', fontSize: 12, boxSizing: 'border-box',
  }

  if (loading) return <div style={{ color: '#94a3b8', padding: 20 }}>Carregando convites...</div>
  if (error) return <ErrorFallback error={error} onRetry={fetchData} />

  return (
    <div>
      {actionError && (
        <div style={{
          padding: '10px 14px', marginBottom: 12, borderRadius: 8, fontSize: 12,
          background: actionError.startsWith('✅') ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
          color: actionError.startsWith('✅') ? '#22c55e' : '#dc2626',
          border: `1px solid ${actionError.startsWith('✅') ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)'}`,
        }}>
          {actionError}
          <button onClick={() => setActionError(null)} style={{
            float: 'right', background: 'none', border: 'none',
            color: actionError.startsWith('✅') ? '#22c55e' : '#dc2626',
            cursor: 'pointer', fontSize: 14,
          }}>×</button>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>
          {invites.length} convite(s) — {invites.filter(i => i.status === 'active').length} ativo(s)
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setShowGen(!showGen); setGeneratedUrl(''); setActionError(null) }} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#22c55e', color: '#000', border: 'none', borderRadius: 6,
            padding: '6px 14px', fontSize: 11, cursor: 'pointer', fontWeight: 600,
          }}>
            <LinkIcon /> {showGen ? 'Fechar' : 'Gerar Convite'}
          </button>
          <button onClick={fetchData} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#046BD2', color: '#fff', border: 'none', borderRadius: 6,
            padding: '6px 12px', fontSize: 11, cursor: 'pointer',
          }}>
            <RefreshIcon /> Atualizar
          </button>
        </div>
      </div>

      {/* ── Generator Form ── */}
      {showGen && (
        <div style={{
          background: '#ffffff', border: '2px solid #22c55e', borderRadius: 10, padding: 20,
          marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <h4 style={{ margin: '0 0 4px', fontSize: 14, color: '#22c55e' }}>Novo Convite</h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Tipo de convite</label>
              <select value={genType} onChange={e => setGenType(e.target.value)} style={inputSt}>
                <option value="self_register">Auto-cadastro (link aberto)</option>
                <option value="pre_register">Pré-registro (email específico)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Plano *</label>
              <select value={genPlanId} onChange={e => setGenPlanId(e.target.value)} style={inputSt}>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} (R$ {Number(p.price_brl || 0).toFixed(2)})</option>)}
              </select>
            </div>
            {genType === 'pre_register' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Email do convidado *</label>
                <input type="email" value={genEmail} onChange={e => setGenEmail(e.target.value)}
                  placeholder="usuario@empresa.com" style={inputSt} />
              </div>
            )}
            {genType === 'self_register' && (
              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Máx. de usos</label>
                <input type="number" min={1} max={100} value={genMaxUses} onChange={e => setGenMaxUses(parseInt(e.target.value) || 1)} style={inputSt} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Validade (dias)</label>
              <input type="number" min={1} max={365} value={genExpDays} onChange={e => setGenExpDays(parseInt(e.target.value) || 7)} style={inputSt} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={generateInvite} disabled={generating} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#22c55e', color: '#000', border: 'none', borderRadius: 6,
              padding: '8px 20px', fontSize: 12, fontWeight: 600, cursor: generating ? 'wait' : 'pointer',
              opacity: generating ? 0.6 : 1,
            }}>
              {generating ? 'Gerando...' : 'Gerar Link'}
            </button>
            <button onClick={() => setShowGen(false)} style={{
              background: '#F0F5FA', color: '#64748b', border: 'none', borderRadius: 6,
              padding: '8px 20px', fontSize: 12, cursor: 'pointer',
            }}>Cancelar</button>
          </div>

          {/* Generated URL display */}
          {generatedUrl && (
            <div style={{
              background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)',
              borderRadius: 8, padding: '12px 14px', marginTop: 4,
            }}>
              <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 6 }}>Link gerado e copiado!</div>
              <code style={{
                fontSize: 11, color: '#1e293b', wordBreak: 'break-all',
                background: '#F0F5FA', padding: '4px 8px', borderRadius: 4, display: 'block',
              }}>
                {generatedUrl}
              </code>
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all', 'active', 'used', 'expired', 'revoked'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? '#3b82f6' : '#E2E8F0', color: filter === f ? '#fff' : '#64748b',
            border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer',
            fontWeight: filter === f ? 700 : 400,
          }}>
            {f === 'all' ? 'Todos' : statusLabels[f] || f} ({f === 'all' ? invites.length : invites.filter(i => i.status === f).length})
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', borderRadius: 8 }}>
          <thead>
            <tr>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Plano</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Usos</th>
              <th style={thStyle}>Expira em</th>
              <th style={thStyle}>Criado em</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => {
              const isRevokeConfirm = confirmRevoke === inv.id
              const isExpired = inv.expires_at && new Date(inv.expires_at) < new Date()
              const typeLabel = inv.type === 'pre_register' ? 'Pré-registro' : 'Auto-cadastro'
              const typeColor = inv.type === 'pre_register' ? '#8b5cf6' : '#3b82f6'
              return (
                <tr key={inv.id}>
                  <td style={cellStyle}>
                    <span style={{
                      background: `${typeColor}10`, color: typeColor,
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                    }}>{typeLabel}</span>
                  </td>
                  <td style={cellStyle}>{inv.plans?.name || '—'}</td>
                  <td style={{ ...cellStyle, fontSize: 11, color: '#94a3b8' }}>{inv.email || '—'}</td>
                  <td style={cellStyle}>
                    <span style={{
                      color: statusColors[inv.status] || '#6b7280',
                      fontWeight: 600, fontSize: 11,
                    }}>{statusLabels[inv.status] || inv.status}</span>
                  </td>
                  <td style={cellStyle}>
                    <span style={{ fontSize: 11 }}>{inv.used_count}/{inv.max_uses}</span>
                  </td>
                  <td style={{ ...cellStyle, fontSize: 11, color: isExpired ? '#ef4444' : '#94a3b8' }}>
                    {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('pt-BR') : '∞'}
                  </td>
                  <td style={{ ...cellStyle, fontSize: 11, color: '#94a3b8' }}>
                    {inv.created_at ? new Date(inv.created_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {inv.status === 'active' && (
                        <>
                          <button onClick={() => copyInviteUrl(inv.token)} style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            background: '#046BD2', color: '#fff', border: 'none', borderRadius: 4,
                            padding: '3px 8px', fontSize: 10, cursor: 'pointer',
                          }}>
                            {copiedToken === inv.token ? <><CheckIcon /> Copiado</> : <><CopyIcon /> Copiar</>}
                          </button>
                          {isRevokeConfirm ? (
                            <>
                              <button onClick={() => revokeInvite(inv.id)} style={{
                                background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4,
                                padding: '3px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 600,
                              }}>Sim</button>
                              <button onClick={() => setConfirmRevoke(null)} style={{
                                background: '#F0F5FA', color: '#64748b', border: 'none', borderRadius: 4,
                                padding: '3px 8px', fontSize: 10, cursor: 'pointer',
                              }}>Não</button>
                            </>
                          ) : (
                            <button onClick={() => setConfirmRevoke(inv.id)} style={{
                              background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4,
                              padding: '3px 8px', fontSize: 10, cursor: 'pointer',
                            }}>Revogar</button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ ...cellStyle, textAlign: 'center', color: '#64748b', padding: 20 }}>Nenhum convite encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
