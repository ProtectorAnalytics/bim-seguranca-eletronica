import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import UserTable from './admin/UserTable'
import SubscriptionManager from './admin/SubscriptionManager'
import PlanEditor from './admin/PlanEditor'
import LicenseKeyManager from './admin/LicenseKeyManager'
import MetricsDashboard from './admin/MetricsDashboard'

const TABS = [
  { id: 'metrics', label: '📊 Métricas', component: MetricsDashboard },
  { id: 'users', label: '👥 Usuários', component: UserTable },
  { id: 'subs', label: '💳 Assinaturas', component: SubscriptionManager },
  { id: 'plans', label: '📋 Planos', component: PlanEditor },
  { id: 'keys', label: '🔑 Chaves', component: LicenseKeyManager },
]

export default function AdminPage({ onBack }) {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('metrics')

  if (!isAdmin) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#ef4444' }}>
      <div style={{ textAlign: 'center' }}>
        <h2>⛔ Acesso Negado</h2>
        <p>Você não tem permissão para acessar esta área.</p>
        <button onClick={onBack} style={{ padding: '8px 20px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer' }}>← Voltar</button>
      </div>
    </div>
  )

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: '#1e293b', borderBottom: '1px solid #334155', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{
            background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 6,
            padding: '6px 14px', fontSize: 13, cursor: 'pointer'
          }}>← Voltar</button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🛡️ Portal de Administração</h1>
        </div>
        <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, background: '#78350f', padding: '3px 10px', borderRadius: 20 }}>
          ADMIN
        </span>
      </div>

      {/* Tabs */}
      <div style={{
        background: '#1e293b', borderBottom: '1px solid #334155', padding: '0 24px',
        display: 'flex', gap: 2, overflowX: 'auto'
      }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? '#334155' : 'transparent',
            color: activeTab === tab.id ? '#e2e8f0' : '#94a3b8',
            border: 'none', borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
            padding: '12px 18px', fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  )
}
