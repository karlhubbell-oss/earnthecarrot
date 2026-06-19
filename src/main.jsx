import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { authClient } from './lib/auth'

const root = ReactDOM.createRoot(document.getElementById('root'))

if (!authClient) {
  // Keys not set yet (for example an unconfigured preview). Say so plainly.
  root.render(
    <div style={{ fontFamily: "ui-sans-serif, -apple-system, Segoe UI, Roboto, sans-serif", maxWidth: 560, margin: "80px auto", padding: "0 24px", lineHeight: 1.6, color: "#1A1208" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Sign in is not configured yet</h1>
      <p>This deployment is missing its Neon Auth URL. Set VITE_NEON_AUTH_URL in the Vercel environment, then redeploy.</p>
    </div>
  )
} else {
  // authClient.useSession (the Better Auth React adapter) needs no provider
  // wrapper, so the tree is just the app.
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
