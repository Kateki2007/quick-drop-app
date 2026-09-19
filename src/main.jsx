import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Merchant from './Merchant.jsx'

// Simple URL-based router
const isMerchant = window.location.pathname === '/merchant';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div style={{ background: '#222', padding: '10px', textAlign: 'center', color: '#fff' }}>
      <a 
        href="/" 
        style={{ marginRight: '15px', color: '#ff4757', fontWeight: 'bold', textDecoration: 'none' }}
      >
        📱 Customer App
      </a>
      <a 
        href="/merchant" 
        style={{ color: '#2ed573', fontWeight: 'bold', textDecoration: 'none' }}
      >
        🏪 Merchant Dashboard
      </a>
    </div>

    {isMerchant ? <Merchant /> : <App />}
  </React.StrictMode>,
)
