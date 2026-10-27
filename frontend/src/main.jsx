import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Automatically add tunnel reminder bypass header for seamless tunneling
if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = function(resource, init = {}) {
    const url = typeof resource === 'string' ? resource : resource?.url || '';
    if (url.includes('loca.lt') || url.includes('/api') || url.includes('/health')) {
      const headers = new Headers(init.headers || (typeof resource === 'object' && resource.headers ? resource.headers : {}));
      if (!headers.has('Bypass-Tunnel-Reminder')) {
        headers.set('Bypass-Tunnel-Reminder', 'true');
      }
      return originalFetch(resource, { ...init, headers });
    }
    return originalFetch(resource, init);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
