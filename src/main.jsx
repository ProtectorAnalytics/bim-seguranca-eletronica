import React from 'react'
import ReactDOM from 'react-dom/client'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import App from './components/App'
import { ToastProvider } from './components/Toast'
import './styles/globals.css'

// ── Auto-update: detecta nova versão e notifica o usuário ──
let swUpdateShown = false
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(reg => {
    setInterval(() => reg.update(), 120_000)

    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing
      if (!newSW) return
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'activated' && !swUpdateShown) {
          swUpdateShown = true
          // Limpa caches antigos mas NÃO recarrega automaticamente
          caches.keys().then(names =>
            Promise.all(names.map(n => caches.delete(n)))
          )
          // Mostra banner não-intrusivo pedindo para atualizar
          const banner = document.createElement('div')
          banner.id = 'sw-update-banner'
          banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:99999;background:#046BD2;color:#fff;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.25);display:flex;align-items:center;gap:12px;font-family:Inter,sans-serif;animation:slideUp .3s ease-out'
          banner.innerHTML = '<span>Nova versão disponível!</span><button onclick="window.location.reload()" style="background:#fff;color:#046BD2;border:none;padding:6px 14px;border-radius:6px;font-weight:700;cursor:pointer;font-size:12px">Atualizar</button><button onclick="this.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;font-size:16px;padding:0 4px">✕</button>'
          document.body.appendChild(banner)
        }
      })
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </ErrorBoundary>
)
