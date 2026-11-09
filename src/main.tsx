import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Offline-ready: register the service worker in production builds only.
if (import.meta.env.PROD) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({ immediate: true })
    })
    .catch((error) => console.warn('[PWA] Service worker registration failed', error))
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
