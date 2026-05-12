import React, { useState } from 'react'
import { loginUser, saveSession } from '../hooks/useAuth'

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      const user = await loginUser(username.trim().toLowerCase(), password)
      saveSession(user, remember)
      onLogin(user)
    } catch (err) {
      setError(err.message || 'Błąd logowania')
    }
    setLoading(false)
  }

  const inp = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontFamily: "'Lato', sans-serif",
    fontSize: 15,
    outline: 'none',
    backdropFilter: 'blur(4px)',
    transition: 'border-color 0.2s',
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
      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/login-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.45)',
        zIndex: 0,
      }} />

      {/* Blue overlay gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(10,20,60,0.7) 0%, rgba(0,30,80,0.5) 100%)',
        zIndex: 1,
      }} />

      {/* Form card */}
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
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, color: '#fff', fontFamily: "'Lato', sans-serif" }}>
            G-TECH<span style={{ color: '#d4ff5c' }}>.</span>crm
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6, fontFamily: "'DM Mono', monospace" }}>
            Panel zarządzania klientami
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
              Login
            </label>
            <input
              style={inp}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="nazwa użytkownika"
              autoComplete="username"
              autoFocus
              onFocus={e => e.target.style.borderColor = 'rgba(212,255,92,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
              Hasło
            </label>
            <input
              style={inp}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              onFocus={e => e.target.style.borderColor = 'rgba(212,255,92,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
          </div>

          {/* Remember me */}
          <div
            onClick={() => setRemember(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              border: `2px solid ${remember ? '#d4ff5c' : 'rgba(255,255,255,0.3)'}`,
              background: remember ? '#d4ff5c' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.2s',
            }}>
              {remember && <span style={{ color: '#0d0e10', fontSize: 11, fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: "'Lato', sans-serif" }}>
              Nie wylogowuj mnie
            </span>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 20, padding: '12px 16px', borderRadius: 8,
              background: 'rgba(255,92,92,0.15)', border: '1px solid rgba(255,92,92,0.4)',
              fontSize: 13, color: '#ff9090', fontFamily: "'DM Mono', monospace",
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            style={{
              width: '100%', padding: '15px',
              borderRadius: 10, border: 'none',
              background: loading ? 'rgba(212,255,92,0.5)' : '#d4ff5c',
              color: '#0d0e10',
              fontFamily: "'Lato', sans-serif",
              fontSize: 15, fontWeight: 900,
              cursor: loading || !username.trim() || !password ? 'default' : 'pointer',
              opacity: !username.trim() || !password ? 0.5 : 1,
              transition: 'all 0.2s',
              letterSpacing: 0.5,
            }}
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
      </div>
    </div>
  )
}
