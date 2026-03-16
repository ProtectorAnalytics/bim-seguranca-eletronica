import React from 'react'
import ReactDOM from 'react-dom/client'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import App from './components/App'
import { ToastProvider } from './components/Toast'
import './styles/globals.css'

// ── Global error handlers (production observability) ──
window.addEventListener('error', (event) => {
  console.error('[BIM] Unhandled error:', event.error || event.message)
  // TODO: send to Sentry when DSN is configured
  // if (window.__SENTRY__) Sentry.captureException(event.error)
})
window.addEventListener('unhandledrejection', (event) => {
  console.error('[BIM] Unhandled promise rejection:', event.reason)
  // TODO: send to Sentry when DSN is configured
  // if (window.__SENTRY__) Sentry.captureException(event.reason)
})

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
          caches.keys().then(names =>
            Promise.all(names.map(n => caches.delete(n)))
          )
          const banner = document.createElement('div')
          banner.id = 'sw-update-banner'
          banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:99999;background:#046BD2;color:#fff;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.25);display:flex;align-items:center;gap:12px;font-family:Inter,sans-serif;animation:slideUp .3s ease-out'

          const label = document.createElement('span')
          label.textContent = 'Nova versão disponível!'
          banner.appendChild(label)

          const btnUpdate = document.createElement('button')
          btnUpdate.textContent = 'Atualizar'
          btnUpdate.style.cssText = 'background:#fff;color:#046BD2;border:none;padding:6px 14px;border-radius:6px;font-weight:700;cursor:pointer;font-size:12px'
          btnUpdate.addEventListener('click', () => window.location.reload())
          banner.appendChild(btnUpdate)

          const btnClose = document.createElement('button')
          btnClose.textContent = '\u2715'
          btnClose.style.cssText = 'background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;font-size:16px;padding:0 4px'
          btnClose.addEventListener('click', () => banner.remove())
          banner.appendChild(btnClose)

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
