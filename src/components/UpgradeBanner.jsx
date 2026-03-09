import React from 'react'

export default function UpgradeBanner({ message, onUpgrade }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #92400e 0%, #78350f 100%)',
      border: '1px solid #f59e0b',
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      margin: '8px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <span style={{ fontSize: 13, color: '#fde68a', fontWeight: 500 }}>
          {message || 'Você atingiu o limite do seu plano. Faça upgrade!'}
        </span>
      </div>
      {onUpgrade && (
        <button onClick={onUpgrade} style={{
          background: '#f59e0b', color: '#000', border: 'none', borderRadius: 6,
          padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}>
          Fazer Upgrade
        </button>
      )}
    </div>
  )
}
