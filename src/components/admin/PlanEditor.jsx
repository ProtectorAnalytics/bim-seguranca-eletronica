import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ErrorFallback } from '../AdminPage'

const COLORS = { gratis: '#94a3b8', basico: '#3b82f6', pro: '#f59e0b' }

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
  background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 20,
  flex: '1 1 280px', minWidth: 260
}
const inputStyle = {
  width: '100%', padding: '6px 8px', background: '#0f172a', border: '1px solid #334155',
  borderRadius: 6, color: '#e2e8f0', fontSize: 12, boxSizing: 'border-box'
}

function BoolBadge({ value }) {
  return value ? (
    <span style={{ color: '#22c55e', fontWeight: 700 }}><CheckIcon /></span>
  ) : (
    <span style={{ color: '#ef4444' }}><XIcon /></span>
  );
}

function PlanCard({ plan, isEditing, onEdit, onSave, onCancel, saveError }) {
  const [form, setForm] = useState({ ...plan })

  // Reset form when plan data changes or editing state changes
  useEffect(() => { setForm({ ...plan }) }, [plan, isEditing])

  const color = COLORS[plan.slug] || '#334155'

  return (
    <div style={{ ...cardStyle, borderColor: color }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color, fontSize: 18 }}>{plan.name}</h3>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>
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
              background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 6,
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
          <button onClick={() => onEdit(plan.id)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            marginTop: 12, background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 6,
            padding: '6px 14px', fontSize: 12, cursor: 'pointer', width: '100%'
          }}>
            <EditIcon /> Editar
          </button>
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

  if (loading) return <div style={{ color: '#94a3b8', padding: 20 }}>Carregando planos...</div>
  if (error) return <ErrorFallback error={error} onRetry={fetchPlans} />

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {plans.map(p => (
        <PlanCard
          key={p.id}
          plan={p}
          isEditing={editing === p.id}
          onEdit={(id) => { setSaveError(null); setEditing(id) }}
          onSave={savePlan}
          onCancel={() => { setSaveError(null); setEditing(null) }}
          saveError={editing === p.id ? saveError : null}
        />
      ))}
      {plans.length === 0 && (
        <div style={{ color: '#64748b', fontSize: 13, padding: 20, textAlign: 'center', width: '100%' }}>
          Nenhum plano encontrado
        </div>
      )}
    </div>
  )
}
