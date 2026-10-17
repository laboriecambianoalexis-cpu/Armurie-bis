import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'rgba(18, 12, 9, 0.92)',
          color: '#f1ece2',
          border: '1px solid rgba(241, 236, 226, 0.12)',
          borderRadius: 14,
          backdropFilter: 'blur(14px)',
          fontFamily: '"Crimson Pro", Georgia, serif',
          fontSize: 17,
        },
      }}
    />
  </StrictMode>,
)
