import React from 'react'
import ReactDOM from 'react-dom/client'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import App from './components/App'
import './styles/globals.css'

// ── Auto-update: força SW a atualizar e limpa caches antigos ──
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(reg => {
    // Checa update a cada 60s (padrão PWA é 24h)
    setInterval(() => reg.update(), 60_000)

    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing
      if (!newSW) return
      newSW.addEventListener('statechange', () => {
        // Quando o novo SW ativa, limpa todos os caches e recarrega
        if (newSW.state === 'activated') {
          caches.keys().then(names =>
            Promise.all(names.map(n => caches.delete(n)))
          ).then(() => window.location.reload())
        }
      })
    })
  })

  // Se já existe um SW esperando (skipWaiting), ativa imediatamente
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>
)
