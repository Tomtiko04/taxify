import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Toaster } from 'react-hot-toast'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#1e293b',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0',
          padding: '16px',
        },
        success: {
          iconTheme: {
            primary: '#16a34a',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#dc2626',
            secondary: '#fff',
          },
        },
      }}
    />
  </React.StrictMode>,
)
