import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)
      const [
        { count: totalUsers },
        { count: activeCount },
        { count: trialingCount },
        { count: availableKeys },
        { count: redeemedKeys },
        { data: planSubs }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'trialing'),
        supabase.from('license_keys').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('license_keys').select('*', { count: 'exact', head: true }).eq('status', 'redeemed'),
        supabase.from('subscriptions').select('plans(price_brl)').eq('status', 'active')
      ])

      const mrrEstimate = (planSubs || []).reduce((sum, s) => sum + Number(s.plans?.price_brl || 0), 0)

      setMetrics({
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeCount || 0,
        trialingUsers: trialingCount || 0,
        availableKeys: availableKeys || 0,
        redeemedKeys: redeemedKeys || 0,
        mrrEstimate
      })
      setLoading(false)
    }
    fetchMetrics()
  }, [])

  const cardStyle = {
    background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '20px 24px',
    flex: '1 1 200px', minWidth: 180
  }

  if (loading) return <div style={{ color: '#94a3b8', padding: 20 }}>Carregando métricas...</div>
  if (!metrics) return null

  const cards = [
    { label: 'Total de Usuários', value: metrics.totalUsers, icon: '👥', color: '#3b82f6' },
    { label: 'Assinaturas Ativas', value: metrics.activeSubscriptions, icon: '✅', color: '#22c55e' },
    { label: 'Em Trial', value: metrics.trialingUsers, icon: '⏳', color: '#f59e0b' },
    { label: 'Chaves Disponíveis', value: metrics.availableKeys, icon: '🔑', color: '#8b5cf6' },
    { label: 'Chaves Resgatadas', value: metrics.redeemedKeys, icon: '🎟️', color: '#06b6d4' },
    { label: 'MRR Estimado', value: `R$ ${metrics.mrrEstimate.toFixed(2)}`, icon: '💰', color: '#22c55e' },
  ]

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {cards.map(c => (
        <div key={c.label} style={cardStyle}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>{c.icon}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{c.label}</div>
        </div>
      ))}
    </div>
  )
}
