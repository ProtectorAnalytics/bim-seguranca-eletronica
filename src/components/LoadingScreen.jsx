import React from 'react'

export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0f172a', color: '#e2e8f0', gap: 16
    }}>
      <div style={{
        width: 48, height: 48, border: '4px solid #334155',
        borderTop: '4px solid #3b82f6', borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ fontSize: 14, opacity: 0.7 }}>Carregando...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
