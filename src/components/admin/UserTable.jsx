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
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [confirmingRole, setConfirmingRole] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ email: '', fullName: '', company: '', role: 'user', planId: '', unlimited: false })
  const [creating, setCreating] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!supabase) throw new Error('Supabase nao configurado')
      const [usersRes, plansRes] = await Promise.all([
        supabase.from('profiles').select('*, subscriptions(*, plans(*))').order('created_at', { ascending: false }),
        supabase.from('plans').select('*').order('price_brl')
      ])
      if (usersRes.error) throw new Error(usersRes.error.message)
      setUsers(usersRes.data || [])
      setPlans(plansRes.data || [])
    } catch (e) {
      console.error('UserTable fetch error:', e)
      setError(e.message || 'Erro ao carregar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const createUser = async () => {
    setCreating(true)
    setActionError(null)
    try {
      if (!supabase) throw new Error('Supabase nao configurado')
      if (!createForm.email.trim()) throw new Error('Email é obrigatório')
      if (!createForm.fullName.trim()) throw new Error('Nome é obrigatório')

      // Generate temp password (user will reset via email)
      const tempPwd = 'Tmp!' + crypto.randomUUID().slice(0, 12) + '@1'

      // Save current session to restore after signUp
      const { data: { session: currentSession } } = await supabase.auth.getSession()

      // Create user via signUp (works with anon key)
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: createForm.email.trim(),
        password: tempPwd,
        options: { data: { full_name: createForm.fullName.trim() } }
      })

      if (authErr) throw new Error(authErr.message)

      const userId = authData?.user?.id
      if (!userId) throw new Error('Usuario criado mas sem ID retornado')

      // Restore admin session (signUp may have switched to the new user)
      if (currentSession) {
        await supabase.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token
        })
      }

      // Wait for profile trigger, then update — retry up to 5x (500ms each)
      let profileErr = null
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise(r => setTimeout(r, 600))
        const { error: pErr } = await supabase.from('profiles').update({
          full_name: createForm.fullName.trim(),
          company_name: createForm.company.trim() || null,
          role: createForm.role,
        }).eq('id', userId)
        if (!pErr) { profileErr = null; break }
        profileErr = pErr
        console.warn(`Profile update attempt ${attempt + 1} failed:`, pErr.message)
      }
      if (profileErr) console.warn('Profile update failed after retries:', profileErr.message)

      // Create subscription if plan selected
      if (createForm.planId) {
        const subData = {
          user_id: userId,
          plan_id: createForm.planId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: createForm.unlimited ? null : new Date(Date.now() + 365 * 86400000).toISOString(),
        }
        const { error: subErr } = await supabase.from('subscriptions').insert([subData])
        if (subErr) console.warn('Subscription create warning:', subErr.message)
      }

      // Send password reset email so user can set their own password
      await supabase.auth.resetPasswordForEmail(createForm.email.trim())

      setShowCreate(false)
      setCreateForm({ email: '', fullName: '', company: '', role: 'user', planId: '', unlimited: false })
      setActionError(null)
      // Show success message briefly
      setActionError(`✅ Usuario ${createForm.fullName.trim()} criado! Email de redefinicao de senha enviado para ${createForm.email.trim()}`)
      await fetchUsers()
    } catch (e) {
      console.error('Create user error:', e)
      setActionError(`Erro ao criar usuario: ${e.message}`)
    } finally {
      setCreating(false)
    }
  }

  const createSubscriptionForUser = async (userId, planId) => {
    setActionError(null)
    try {
      const { error: insertErr } = await supabase.from('subscriptions').insert([{
        user_id: userId,
        plan_id: planId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
      }])
      if (insertErr) throw new Error(insertErr.message)
      await fetchUsers()
    } catch (e) {
      setActionError(`Erro: ${e.message}`)
    }
  }

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
  const inputSt = {
    width: '100%', padding: '6px 8px', background: '#F0F5FA', border: '1px solid #E2E8F0',
    borderRadius: 6, color: '#1e293b', fontSize: 12, boxSizing: 'border-box'
  }

  if (loading) return <div style={{ color: '#94a3b8', padding: 20 }}>Carregando usuarios...</div>
  if (error) return <ErrorFallback error={error} onRetry={fetchUsers} />

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>{users.length} usuario(s)</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setShowCreate(true); setActionError(null) }} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#22c55e', color: '#000', border: 'none', borderRadius: 6,
            padding: '6px 14px', fontSize: 11, cursor: 'pointer', fontWeight: 600,
          }}>
            + Criar Usuario
          </button>
          <button onClick={fetchUsers} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#046BD2', color: '#fff', border: 'none', borderRadius: 6,
            padding: '6px 12px', fontSize: 11, cursor: 'pointer',
          }}>
            <RefreshIcon /> Atualizar
          </button>
        </div>
      </div>

      {/* ── Create User Form ── */}
      {showCreate && (
        <div style={{
          background: '#ffffff', border: '2px solid #22c55e', borderRadius: 10, padding: 20,
          marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8
        }}>
          <h4 style={{ margin: '0 0 4px', fontSize: 14, color: '#22c55e' }}>Novo Usuário</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Nome completo *</label>
              <input style={inputSt} placeholder="João Silva" value={createForm.fullName}
                onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Email *</label>
              <input type="email" style={inputSt} placeholder="email@empresa.com" value={createForm.email}
                onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Empresa</label>
              <input style={inputSt} placeholder="Nome da empresa" value={createForm.company}
                onChange={e => setCreateForm({ ...createForm, company: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Role</label>
              <select style={inputSt} value={createForm.role}
                onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Plano (opcional)</label>
              <select style={inputSt} value={createForm.planId}
                onChange={e => setCreateForm({ ...createForm, planId: e.target.value })}>
                <option value="">— Sem plano —</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} (R$ {Number(p.price_brl).toFixed(2)})</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 18 }}>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" checked={createForm.unlimited}
                  onChange={e => setCreateForm({ ...createForm, unlimited: e.target.checked })} />
                Assinatura sem validade (∞)
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={createUser} disabled={creating} style={{
              background: '#22c55e', color: '#000', border: 'none', borderRadius: 6,
              padding: '8px 20px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              opacity: creating ? 0.6 : 1,
            }}>{creating ? 'Criando...' : 'Criar Usuário'}</button>
            <button onClick={() => setShowCreate(false)} style={{
              background: '#F0F5FA', color: '#64748b', border: 'none', borderRadius: 6,
              padding: '8px 20px', fontSize: 12, cursor: 'pointer'
            }}>Cancelar</button>
          </div>
        </div>
      )}

      {actionError && (
        <div style={{
          padding: '10px 14px', marginBottom: 12, borderRadius: 8, fontSize: 12,
          background: actionError.startsWith('✅') ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
          color: actionError.startsWith('✅') ? '#22c55e' : '#fca5a5',
          border: `1px solid ${actionError.startsWith('✅') ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)'}`,
        }}>
          {actionError}
          <button onClick={() => setActionError(null)} style={{
            float: 'right', background: 'none', border: 'none',
            color: actionError.startsWith('✅') ? '#22c55e' : '#fca5a5',
            cursor: 'pointer', fontSize: 14,
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
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {isConfirming ? (
                      <>
                        <button onClick={() => toggleRole(u.id, u.role)} style={{
                          background: '#22c55e', color: '#000', border: 'none', borderRadius: 4,
                          padding: '3px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 600,
                        }}>Sim</button>
                        <button onClick={() => setConfirmingRole(null)} style={{
                          background: '#F0F5FA', color: '#64748b', border: 'none', borderRadius: 4,
                          padding: '3px 8px', fontSize: 10, cursor: 'pointer',
                        }}>Nao</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setConfirmingRole(u.id)} style={{
                          background: '#F0F5FA', color: '#64748b', border: 'none', borderRadius: 4,
                          padding: '3px 8px', fontSize: 10, cursor: 'pointer'
                        }}>
                          {u.role === 'admin' ? 'Rebaixar' : 'Promover'}
                        </button>
                        {!sub && plans.length > 0 && (
                          <select onChange={e => { if (e.target.value) createSubscriptionForUser(u.id, e.target.value); e.target.value = '' }}
                            defaultValue="" style={{
                              background: '#046BD2', color: '#fff', border: 'none', borderRadius: 4,
                              padding: '3px 6px', fontSize: 10, cursor: 'pointer'
                            }}>
                            <option value="" disabled>+ Assinatura</option>
                            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        )}
                      </>
                    )}
                  </div>
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
