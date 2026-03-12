import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ErrorFallback } from '../AdminPage'

// Dynamic color palette — known slugs + hash-based for custom plans
const KNOWN_COLORS = { gratis: '#94a3b8', basico: '#3b82f6', pro: '#f59e0b' }
const PALETTE = ['#8b5cf6','#ec4899','#06b6d4','#14b8a6','#f97316','#6366f1','#84cc16','#a855f7','#ef4444','#0ea5e9']
function slugColor(slug) {
  if (KNOWN_COLORS[slug]) return KNOWN_COLORS[slug]
  let h = 0; for (let i = 0; i < slug.length; i++) h = ((h << 5) - h + slug.charCodeAt(i)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}

/* ─── SVG Icons ─── */
const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const FolderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const DeviceIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
);
const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const RulerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/>
  </svg>
);
const WrenchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const cardStyle = {
  background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20,
  flex: '1 1 280px', minWidth: 260
}
const inputStyle = {
  width: '100%', padding: '6px 8px', background: '#F0F5FA', border: '1px solid #E2E8F0',
  borderRadius: 6, color: '#1e293b', fontSize: 12, boxSizing: 'border-box'
}

function BoolBadge({ value }) {
  return value ? (
    <span style={{ color: '#22c55e', fontWeight: 700 }}><CheckIcon /></span>
  ) : (
    <span style={{ color: '#ef4444' }}><XIcon /></span>
  );
}

function PlanCard({ plan, isEditing, onEdit, onSave, onCancel, onDelete, saveError }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState({ ...plan })

  // Reset form when plan data changes or editing state changes
  useEffect(() => { setForm({ ...plan }) }, [plan, isEditing])

  const color = slugColor(plan.slug)

  return (
    <div style={{ ...cardStyle, borderColor: color }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color, fontSize: 18 }}>{plan.name}</h3>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>
          {plan.price_brl > 0 ? `R$ ${Number(plan.price_brl).toFixed(2)}` : 'Gratis'}
        </span>
      </div>

      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 11, color: '#94a3b8' }}>Preco (R$)</label>
          <input type="number" step="0.01" style={inputStyle} value={form.price_brl}
            onChange={e => setForm({ ...form, price_brl: e.target.value })} />

          <label style={{ fontSize: 11, color: '#94a3b8' }}>Max projetos (-1 = ilimitado)</label>
          <input type="number" style={inputStyle} value={form.max_projects}
            onChange={e => setForm({ ...form, max_projects: parseInt(e.target.value) || 0 })} />

          <label style={{ fontSize: 11, color: '#94a3b8' }}>Max devices/andar (-1 = ilimitado)</label>
          <input type="number" style={inputStyle} value={form.max_devices_per_floor}
            onChange={e => setForm({ ...form, max_devices_per_floor: parseInt(e.target.value) || 0 })} />

          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            <label><input type="checkbox" checked={!!form.can_export_pdf}
              onChange={e => setForm({ ...form, can_export_pdf: e.target.checked })} /> PDF</label>
            <label><input type="checkbox" checked={!!form.can_export_dwg}
              onChange={e => setForm({ ...form, can_export_dwg: e.target.checked })} /> DWG</label>
            <label><input type="checkbox" checked={!!form.can_custom_devices}
              onChange={e => setForm({ ...form, can_custom_devices: e.target.checked })} /> Custom</label>
          </div>

          {saveError && (
            <div style={{ fontSize: 11, color: '#fca5a5', background: 'rgba(239,68,68,.1)', padding: '6px 10px', borderRadius: 6 }}>
              {saveError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => onSave(form)} style={{
              background: '#22c55e', color: '#000', border: 'none', borderRadius: 6,
              padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flex: 1
            }}>Salvar</button>
            <button onClick={onCancel} style={{
              background: '#F0F5FA', color: '#64748b', border: 'none', borderRadius: 6,
              padding: '6px 14px', fontSize: 12, cursor: 'pointer'
            }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{plan.description}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FolderIcon /> Projetos: <b>{plan.max_projects === -1 ? 'Ilimitado' : plan.max_projects}</b>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <DeviceIcon /> Devices/andar: <b>{plan.max_devices_per_floor === -1 ? 'Ilimitado' : plan.max_devices_per_floor}</b>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileIcon /> PDF: <BoolBadge value={plan.can_export_pdf} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RulerIcon /> DWG: <BoolBadge value={plan.can_export_dwg} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <WrenchIcon /> Custom: <BoolBadge value={plan.can_custom_devices} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <button onClick={() => onEdit(plan.id)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#F0F5FA', color: '#64748b', border: 'none', borderRadius: 6,
              padding: '6px 14px', fontSize: 12, cursor: 'pointer', flex: 1
            }}>
              <EditIcon /> Editar
            </button>
            {confirmDelete ? (
              <>
                <button onClick={() => { onDelete(plan.id); setConfirmDelete(false) }} style={{
                  background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6,
                  padding: '6px 10px', fontSize: 10, cursor: 'pointer', fontWeight: 600
                }}>Confirmar</button>
                <button onClick={() => setConfirmDelete(false)} style={{
                  background: '#F0F5FA', color: '#64748b', border: 'none', borderRadius: 6,
                  padding: '6px 10px', fontSize: 10, cursor: 'pointer'
                }}>Nao</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} style={{
                background: 'rgba(239,68,68,.1)', color: '#ef4444', border: 'none', borderRadius: 6,
                padding: '6px 10px', fontSize: 10, cursor: 'pointer'
              }}>
                <XIcon />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlanEditor() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '', slug: '', description: '', price_brl: 0,
    max_projects: -1, max_devices_per_floor: -1,
    can_export_pdf: true, can_export_dwg: true, can_custom_devices: true, is_active: true
  })

  const fetchPlans = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!supabase) throw new Error('Supabase nao configurado')
      const { data, error: fetchErr } = await supabase.from('plans').select('*').order('price_brl')
      if (fetchErr) throw new Error(fetchErr.message)
      setPlans(data || [])
    } catch (e) {
      console.error('PlanEditor fetch error:', e)
      setError(e.message || 'Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlans() }, [])

  const savePlan = async (formData) => {
    setSaveError(null)
    try {
      if (!supabase) throw new Error('Supabase nao configurado')
      const { id, created_at, ...updates } = formData
      const { error: updateErr } = await supabase.from('plans').update(updates).eq('id', id)
      if (updateErr) throw new Error(updateErr.message)
      setEditing(null)
      await fetchPlans()
    } catch (e) {
      console.error('Save plan error:', e)
      setSaveError(`Erro ao salvar: ${e.message}`)
    }
  }

  const createPlan = async () => {
    setSaveError(null)
    try {
      if (!supabase) throw new Error('Supabase nao configurado')
      if (!createForm.name.trim()) throw new Error('Nome é obrigatório')
      if (!createForm.slug.trim()) throw new Error('Slug é obrigatório')
      if (createForm.slug.trim().length < 3) throw new Error('Slug deve ter pelo menos 3 caracteres')
      if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(createForm.slug.trim())) throw new Error('Slug deve começar/terminar com letra ou número (ex: meu-plano)')
      const { error: insertErr } = await supabase.from('plans').insert([{
        ...createForm,
        price_brl: Number(createForm.price_brl) || 0,
        max_projects: parseInt(createForm.max_projects) || -1,
        max_devices_per_floor: parseInt(createForm.max_devices_per_floor) || -1,
      }])
      if (insertErr) throw new Error(insertErr.message)
      setShowCreate(false)
      setCreateForm({
        name: '', slug: '', description: '', price_brl: 0,
        max_projects: -1, max_devices_per_floor: -1,
        can_export_pdf: true, can_export_dwg: true, can_custom_devices: true, is_active: true
      })
      await fetchPlans()
    } catch (e) {
      console.error('Create plan error:', e)
      setSaveError(`Erro ao criar: ${e.message}`)
    }
  }

  const deletePlan = async (planId) => {
    try {
      if (!supabase) throw new Error('Supabase nao configurado')
      const { error: delErr } = await supabase.from('plans').delete().eq('id', planId)
      if (delErr) {
        if (delErr.message?.includes('violates foreign key') || delErr.code === '23503')
          throw new Error('Este plano possui assinaturas ativas. Remova ou altere as assinaturas antes de excluir.')
        throw new Error(delErr.message)
      }
      await fetchPlans()
    } catch (e) {
      console.error('Delete plan error:', e)
      setSaveError(`Erro ao excluir: ${e.message}`)
    }
  }

  if (loading) return <div style={{ color: '#94a3b8', padding: 20 }}>Carregando planos...</div>
  if (error) return <ErrorFallback error={error} onRetry={fetchPlans} />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>{plans.length} plano(s)</span>
        <button onClick={() => { setShowCreate(true); setSaveError(null) }} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#046BD2', color: '#fff', border: 'none', borderRadius: 6,
          padding: '6px 14px', fontSize: 11, cursor: 'pointer', fontWeight: 600,
        }}>
          + Criar Plano
        </button>
      </div>

      {/* ── Create Plan Form ── */}
      {showCreate && (
        <div style={{
          background: '#ffffff', border: '2px solid #046BD2', borderRadius: 10, padding: 20,
          marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8
        }}>
          <h4 style={{ margin: '0 0 4px', fontSize: 14, color: '#046BD2' }}>Novo Plano</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Nome *</label>
              <input style={inputStyle} placeholder="Ex: Grátis Ilimitado" value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Slug *</label>
              <input style={inputStyle} placeholder="Ex: gratis-ilimitado" value={createForm.slug}
                onChange={e => setCreateForm({ ...createForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Descrição</label>
              <input style={inputStyle} placeholder="Descrição do plano" value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Preço (R$)</label>
              <input type="number" step="0.01" style={inputStyle} value={createForm.price_brl}
                onChange={e => setCreateForm({ ...createForm, price_brl: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Max projetos (-1 = ∞)</label>
              <input type="number" style={inputStyle} value={createForm.max_projects}
                onChange={e => setCreateForm({ ...createForm, max_projects: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Max devices/andar (-1 = ∞)</label>
              <input type="number" style={inputStyle} value={createForm.max_devices_per_floor}
                onChange={e => setCreateForm({ ...createForm, max_devices_per_floor: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            <label><input type="checkbox" checked={!!createForm.can_export_pdf}
              onChange={e => setCreateForm({ ...createForm, can_export_pdf: e.target.checked })} /> PDF</label>
            <label><input type="checkbox" checked={!!createForm.can_export_dwg}
              onChange={e => setCreateForm({ ...createForm, can_export_dwg: e.target.checked })} /> DWG</label>
            <label><input type="checkbox" checked={!!createForm.can_custom_devices}
              onChange={e => setCreateForm({ ...createForm, can_custom_devices: e.target.checked })} /> Custom</label>
          </div>
          {saveError && (
            <div style={{ fontSize: 11, color: '#fca5a5', background: 'rgba(239,68,68,.1)', padding: '6px 10px', borderRadius: 6 }}>
              {saveError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={createPlan} style={{
              background: '#22c55e', color: '#000', border: 'none', borderRadius: 6,
              padding: '8px 20px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}>Criar Plano</button>
            <button onClick={() => setShowCreate(false)} style={{
              background: '#F0F5FA', color: '#64748b', border: 'none', borderRadius: 6,
              padding: '8px 20px', fontSize: 12, cursor: 'pointer'
            }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {plans.map(p => (
          <PlanCard
            key={p.id}
            plan={p}
            isEditing={editing === p.id}
            onEdit={(id) => { setSaveError(null); setEditing(id) }}
            onSave={savePlan}
            onCancel={() => { setSaveError(null); setEditing(null) }}
            onDelete={deletePlan}
            saveError={editing === p.id ? saveError : null}
          />
        ))}
        {plans.length === 0 && (
          <div style={{ color: '#64748b', fontSize: 13, padding: 20, textAlign: 'center', width: '100%' }}>
            Nenhum plano encontrado
          </div>
        )}
      </div>
    </div>
  )
}
