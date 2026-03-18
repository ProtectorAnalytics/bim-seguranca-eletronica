import React, { useState, useEffect } from 'react'

export default function LoadingScreen() {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div role="status" aria-label="Carregando aplicação" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#F0F5FA', color: '#1e293b', gap: 20
    }}>
      <img
        src="/logo-proti.png"
        alt="Protector Sistemas"
        style={{ height: 52, marginBottom: 4, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.15))', animation: 'fadeIn .4s ease-out' }}
      />
      <div style={{
        width: 36, height: 36, border: '3px solid #E2E8F0',
        borderTop: '3px solid #046BD2', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} aria-hidden="true" />
      <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Carregando...</p>
      {slow && (
        <p style={{ fontSize: 12, color: '#94a3b8', maxWidth: 300, textAlign: 'center', lineHeight: 1.6, padding: '0 16px' }}>
          A conexão está demorando. Verifique sua internet ou recarregue a página.
        </p>
      )}
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important}}
      `}</style>
    </div>
  )
}
