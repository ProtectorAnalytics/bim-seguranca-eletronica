import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function PlanEditor() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  const fetchPlans = async () => {
    setLoading(true)
    const { data } = await supabase.from('plans').select('*').order('price_brl')
    setPlans(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPlans() }, [])

  const savePlan = async (plan) => {
    const { id, created_at, ...updates } = plan
    await supabase.from('plans').update(updates).eq('id', id)
    setEditing(null)
    fetchPlans()
  }

  const cardStyle = {
    background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 20,
    flex: '1 1 280px', minWidth: 260
  }
  const inputStyle = {
    width: '100%', padding: '6px 8px', background: '#0f172a', border: '1px solid #334155',
    borderRadius: 6, color: '#e2e8f0', fontSize: 12, boxSizing: 'border-box'
  }

  if (loading) return <div style={{ color: '#94a3b8', padding: 20 }}>Carregando planos...</div>

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {plans.map(p => {
        const isEditing = editing === p.id
        const [form, setForm] = useState({ ...p })

        const resetForm = () => { setForm({ ...p }); setEditing(null) }
        const colors = { gratis: '#94a3b8', basico: '#3b82f6', pro: '#f59e0b' }

        return (
          <div key={p.id} style={{ ...cardStyle, borderColor: colors[p.slug] || '#334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: colors[p.slug], fontSize: 18 }}>{p.name}</h3>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>
                {p.price_brl > 0 ? `R$ ${Number(p.price_brl).toFixed(2)}` : 'Grátis'}
              </span>
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11, color: '#94a3b8' }}>Preço (R$)</label>
                <input type="number" step="0.01" style={inputStyle} value={form.price_brl}
                  onChange={e => setForm({ ...form, price_brl: e.target.value })} />

                <label style={{ fontSize: 11, color: '#94a3b8' }}>Max projetos (-1 = ilimitado)</label>
                <input type="number" style={inputStyle} value={form.max_projects}
                  onChange={e => setForm({ ...form, max_projects: parseInt(e.target.value) })} />

                <label style={{ fontSize: 11, color: '#94a3b8' }}>Max devices/andar (-1 = ilimitado)</label>
                <input type="number" style={inputStyle} value={form.max_devices_per_floor}
                  onChange={e => setForm({ ...form, max_devices_per_floor: parseInt(e.target.value) })} />

                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  <label><input type="checkbox" checked={form.can_export_pdf}
                    onChange={e => setForm({ ...form, can_export_pdf: e.target.checked })} /> PDF</label>
                  <label><input type="checkbox" checked={form.can_export_dwg}
                    onChange={e => setForm({ ...form, can_export_dwg: e.target.checked })} /> DWG</label>
                  <label><input type="checkbox" checked={form.can_custom_devices}
                    onChange={e => setForm({ ...form, can_custom_devices: e.target.checked })} /> Custom</label>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => savePlan(form)} style={{
                    background: '#22c55e', color: '#000', border: 'none', borderRadius: 6,
                    padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flex: 1
                  }}>Salvar</button>
                  <button onClick={resetForm} style={{
                    background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 6,
                    padding: '6px 14px', fontSize: 12, cursor: 'pointer'
                  }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{p.description}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div>📁 Projetos: <b>{p.max_projects === -1 ? '∞' : p.max_projects}</b></div>
                  <div>📱 Devices/andar: <b>{p.max_devices_per_floor === -1 ? '∞' : p.max_devices_per_floor}</b></div>
                  <div>📄 PDF: <b>{p.can_export_pdf ? '✅' : '❌'}</b></div>
                  <div>📐 DWG: <b>{p.can_export_dwg ? '✅' : '❌'}</b></div>
                  <div>🔧 Custom: <b>{p.can_custom_devices ? '✅' : '❌'}</b></div>
                </div>
                <button onClick={() => { setEditing(p.id); setForm({ ...p }) }} style={{
                  marginTop: 12, background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 6,
                  padding: '6px 14px', fontSize: 12, cursor: 'pointer', width: '100%'
                }}>✏️ Editar</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
