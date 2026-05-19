import React, { useState, useEffect } from 'react'
import { initGoogleCalendar, signIn, isSignedIn, ensureSignedIn } from '../hooks/useGoogleCalendar'

export default function CalendarAuthScreen({ user, onDone }) {
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    initGoogleCalendar().then(async () => {
      setReady(true)
      // Try silent restore first — skip screen if successful
      const ok = await ensureSignedIn()
      if (ok) onDone()
    }).catch(() => setError('Błąd ładowania Google API'))
  }, [])

  const handleConnect = async () => {
    setLoading(true)
    setError('')
    try {
      await signIn()
      onDone()
    } catch (e) {
      setError('Odmowa dostępu — spróbuj ponownie')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/login-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.45)',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(10,20,60,0.7) 0%, rgba(0,30,80,0.5) 100%)',
        zIndex: 1,
      }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: 420,
        margin: '0 20px',
        background: 'rgba(10,15,35,0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: '48px 40px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, color: '#fff', fontFamily: "'Lato', sans-serif", marginBottom: 8 }}>
          G-TECH<span style={{ color: '#d4ff5c' }}>.</span>crm
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 40, fontFamily: "'DM Mono', monospace" }}>
          Zalogowano jako <span style={{ color: '#d4ff5c' }}>{user.username}</span>
        </div>

        <div style={{ fontSize: 48, marginBottom: 16 }}>📆</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8, fontFamily: "'Lato', sans-serif" }}>
          Połącz z Google Calendar
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
          Wymagane do planowania wizyt<br />i wyświetlania kalendarza
        </div>

        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: 'rgba(255,92,92,0.15)', border: '1px solid rgba(255,92,92,0.4)', fontSize: 13, color: '#ff9090', fontFamily: "'DM Mono', monospace" }}>
            {error}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={!ready || loading}
          style={{
            width: '100%', padding: '15px',
            borderRadius: 10, border: 'none',
            background: !ready || loading ? 'rgba(212,255,92,0.5)' : '#d4ff5c',
            color: '#0d0e10',
            fontFamily: "'Lato', sans-serif",
            fontSize: 15, fontWeight: 900,
            cursor: ready && !loading ? 'pointer' : 'default',
            marginBottom: 12,
          }}
        >
          {!ready ? 'Ładowanie...' : loading ? 'Łączenie z Google...' : 'Zaloguj się przez Google'}
        </button>

        <button
          onClick={onDone}
          style={{
            width: '100%', padding: '12px',
            borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: "'Lato', sans-serif",
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Pomiń — użyj bez kalendarza
        </button>
      </div>
    </div>
  )
}
