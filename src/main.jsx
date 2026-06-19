import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { StackProvider, StackTheme } from '@stackframe/react'
import { stackClientApp } from './stack'

const root = ReactDOM.createRoot(document.getElementById('root'))

if (!stackClientApp) {
  // Keys not set yet (for example an unconfigured preview). Say so plainly.
  root.render(
    <div style={{ fontFamily: "ui-sans-serif, -apple-system, Segoe UI, Roboto, sans-serif", maxWidth: 560, margin: "80px auto", padding: "0 24px", lineHeight: 1.6, color: "#1A1208" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Sign in is not configured yet</h1>
      <p>This deployment is missing its Neon Auth keys. Set VITE_STACK_PROJECT_ID and VITE_STACK_PUBLISHABLE_CLIENT_KEY in the Vercel environment, then redeploy.</p>
    </div>
  )
} else {
  root.render(
    <React.StrictMode>
      <Suspense fallback={<div style={{ fontFamily: "ui-sans-serif, sans-serif", padding: 40, color: "#7A6A55" }}>Loading...</div>}>
        <StackProvider app={stackClientApp}>
          <StackTheme>
            <App />
          </StackTheme>
        </StackProvider>
      </Suspense>
    </React.StrictMode>,
  )
}
