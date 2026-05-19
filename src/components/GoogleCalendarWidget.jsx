import React, { useState, useEffect } from 'react'
import { initGoogleCalendar, getUpcomingEvents, isSignedIn, signIn, signOut } from '../hooks/useGoogleCalendar'
import { formatDate } from '../utils'

function EventCard({ event }) {
  const start = event.start?.dateTime || event.start?.date
  const dt = start ? new Date(start) : null
  const isAllDay = !event.start?.dateTime

  const timeStr = dt
    ? isAllDay
      ? dt.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })
      : dt.toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ' ' + dt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    : ''

  const isToday = dt && new Date().toDateString() === dt.toDateString()
  const isTomorrow = dt && new Date(Date.now() + 86400000).toDateString() === dt.toDateString()

  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flexShrink: 0, width: 48, textAlign: 'center' }}>
        {dt && (
          <>
            <div style={{ fontSize: 20, fontWeight: 900, color: isToday ? 'var(--accent)' : 'var(--text)', lineHeight: 1 }}>
              {dt.getDate()}
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase' }}>
              {dt.toLocaleDateString('pl-PL', { month: 'short' })}
            </div>
          </>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          {isToday && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(212,255,92,0.2)', color: 'var(--accent)', fontFamily: 'var(--mono)', fontWeight: 700 }}>DZIŚ</span>}
          {isTomorrow && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(92,170,255,0.2)', color: 'var(--accent2)', fontFamily: 'var(--mono)', fontWeight: 700 }}>JUTRO</span>}
          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.summary}</div>
        </div>
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
          {!isAllDay && dt && dt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
          {event.location && <span style={{ marginLeft: 8 }}>📍 {event.location}</span>}
        </div>
      </div>
    </div>
  )
}

export default function GoogleCalendarWidget() {
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    initGoogleCalendar()
      .then(() => {
        setReady(true)
        if (isSignedIn()) {
          setSignedIn(true)
          loadEvents()
        }
      })
      .catch(() => setError('Błąd ładowania Google Calendar'))
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const ev = await getUpcomingEvents(30)
      setEvents(ev)
    } catch {}
    setLoading(false)
  }

  const handleSignIn = async () => {
    setLoading(true)
    try {
      await signIn()
      setSignedIn(true)
      await loadEvents()
    } catch {
      setError('Błąd logowania — sprawdź uprawnienia')
    }
    setLoading(false)
  }

  const handleSignOut = () => {
    signOut()
    setSignedIn(false)
    setEvents([])
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', minHeight: 300 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>📆 Kalendarz Google</div>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 3 }}>Nadchodzące wizyty — 30 dni</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {signedIn && (
            <button onClick={loadEvents} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              ↻ Odśwież
            </button>
          )}
          {signedIn ? (
            <button onClick={handleSignOut} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              Wyloguj
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={!ready || loading}
              style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: '#0d0e10', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 700, cursor: ready ? 'pointer' : 'default', opacity: ready ? 1 : 0.5 }}
            >
              {loading ? 'Łączenie...' : 'Połącz z Google'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,92,92,0.1)', border: '1px solid var(--danger)', fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--danger)', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {!signedIn && !error && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '20px 0' }}>
          <div style={{ fontSize: 40 }}>📆</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--mono)', textAlign: 'center' }}>Połącz z kontem Google<br/>aby zobaczyć nadchodzące wizyty</div>
        </div>
      )}

      {signedIn && loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
          Ładowanie wydarzeń...
        </div>
      )}

      {signedIn && !loading && events.length === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
          Brak zaplanowanych wizyt w ciągu 30 dni
        </div>
      )}

      {signedIn && !loading && events.length > 0 && (
        <div style={{ overflowY: 'auto', flex: 1, maxHeight: 420 }}>
          {events.map(ev => <EventCard key={ev.id} event={ev} />)}
        </div>
      )}
    </div>
  )
}
