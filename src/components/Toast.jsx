import React, { useEffect, useState } from 'react'

function ToastItem({ msg, error }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])
  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${error ? 'var(--danger)' : 'var(--accent)'}`,
      borderRadius: 8,
      padding: '14px 20px',
      fontSize: 14,
      minWidth: 260,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      transform: visible ? 'translateX(0)' : 'translateX(40px)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.3s ease',
      fontFamily: 'var(--sans)',
    }}>
      {msg}
    </div>
  )
}

export default function ToastContainer({ toasts }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      zIndex: 999, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map(t => <ToastItem key={t.id} msg={t.msg} error={t.error} />)}
    </div>
  )
}
