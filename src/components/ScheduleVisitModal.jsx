import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import { initGoogleCalendar, addCalendarEvent, isSignedIn, signIn } from '../hooks/useGoogleCalendar'
import { todayISO } from '../utils'

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 7:00 - 19:00

const inp = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--sans)',
  fontSize: 14, padding: '11px 14px', outline: 'none',
}
const lbl = {
  display: 'block', fontSize: 11, fontFamily: 'var(--mono)',
  color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7,
}

export default function ScheduleVisitModal({ open, onClose, client }) {
  const [date, setDate] = useState(todayISO())
  const [hour, setHour] = useState(10)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [calReady, setCalReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (!open) { setStatus(''); return }
    initGoogleCalendar()
      .then(() => {
        setCalReady(true)
        setSignedIn(isSignedIn())
      })
      .catch(() => setStatus('Błąd ładowania Google Calendar'))
  }, [open])

  if (!client) return null

  const lastNote = client.notes?.[0]?.text || ''

  const handleSchedule = async () => {
    if (!date || !calReady) return
    setSaving(true)
    setStatus('')
    try {
      if (!isSignedIn()) {
        setStatus('Logowanie do Google...')
        await signIn()
        setSignedIn(true)
      }
      setStatus('Dodawanie do kalendarza...')
      await addCalendarEvent({
        title: client.name,
        address: client.address || '',
        date,
        hour,
        description: lastNote ? `Ostatnia notatka:\n${lastNote}` : '',
      })
      setStatus('✓ Dodano do kalendarza!')
      setTimeout(() => { onClose(); setStatus('') }, 1500)
    } catch (e) {
      console.error(e)
      setStatus('Błąd — sprawdź uprawnienia Google Calendar')
    }
    setSaving(false)
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={440}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>📅 Zaplanuj wizytę</div>
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>{client.name}</div>
          {client.address && <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 2 }}>{client.address}</div>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={lbl}>Data wizyty</label>
        <input style={inp} type="date" value={date} onChange={e => setDate(e.target.value)} min={todayISO()} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={lbl}>Godzina</label>
        <select style={{ ...inp, cursor: 'pointer' }} value={hour} onChange={e => setHour(Number(e.target.value))}>
          {HOURS.map(h => (
            <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
          ))}
        </select>
      </div>

      {lastNote && (
        <div style={{ marginBottom: 18, padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Opis (ostatnia notatka)</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)', lineHeight: 1.5, maxHeight: 80, overflowY: 'auto' }}>{lastNote}</div>
        </div>
      )}

      {!calReady && !status && (
        <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 12 }}>Ładowanie Google Calendar...</div>
      )}

      {status && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: status.startsWith('✓') ? 'rgba(212,255,92,0.1)' : status.includes('Błąd') ? 'rgba(255,92,92,0.1)' : 'rgba(92,170,255,0.1)', border: `1px solid ${status.startsWith('✓') ? 'var(--accent)' : status.includes('Błąd') ? 'var(--danger)' : 'var(--accent2)'}`, fontSize: 13, fontFamily: 'var(--mono)', color: status.startsWith('✓') ? 'var(--accent)' : status.includes('Błąd') ? 'var(--danger)' : 'var(--accent2)' }}>
          {status}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Anuluj
        </button>
        <button
          onClick={handleSchedule}
          disabled={saving || !calReady || !date}
          style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#0d0e10', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving || !calReady ? 0.6 : 1 }}
        >
          {saving ? 'Dodawanie...' : '📅 Dodaj do Kalendarza Google'}
        </button>
      </div>
    </Modal>
  )
}
