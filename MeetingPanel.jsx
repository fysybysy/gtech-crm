import React, { useState, useRef, useEffect } from 'react'
import { todayISO } from '../utils'
import StageBadge from './StageBadge'

const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 15, padding: '12px 16px', outline: 'none' }
const lbl = { display: 'block', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }
const fg = { marginBottom: 20 }

export default function MeetingPanel({ clients, onSave }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [dropOpen, setDropOpen] = useState(false)
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [sample, setSample] = useState('')
  const [saving, setSaving] = useState(false)
  const dropRef = useRef(null)

  const filtered = search.trim()
    ? clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.address || '').toLowerCase().includes(search.toLowerCase())
      )
    : clients

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pick = (c) => {
    setSelected(c)
    setSearch(c.name)
    setDropOpen(false)
  }

  const reset = () => {
    setSelected(null)
    setSearch('')
    setNote('')
    setSample('')
    setDate(todayISO())
  }

  const handleSave = async () => {
    if (!selected || !date || !note.trim()) return
    setSaving(true)
    try {
      await onSave({ client: selected, date, note, sample })
      reset()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>🤝 Nowe spotkanie</h2>

      {/* Client search */}
      <div style={fg}>
        <label style={lbl}>Wybierz klienta</label>
        <div ref={dropRef} style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 18, pointerEvents: 'none' }}>⌕</span>
            <input
              style={{ ...inp, paddingLeft: 44 }}
              value={search}
              onChange={e => { setSearch(e.target.value); setDropOpen(true); if (!e.target.value) setSelected(null) }}
              onFocus={() => setDropOpen(true)}
              placeholder="Wpisz nazwę lub adres klienta..."
              autoComplete="off"
            />
          </div>
          {dropOpen && filtered.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface2)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', maxHeight: 220, overflowY: 'auto', zIndex: 50 }}>
              {filtered.map(c => (
                <div
                  key={c.id}
                  onClick={() => pick(c)}
                  style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, background: selected?.id === c.id ? 'rgba(212,255,92,0.08)' : 'transparent', transition: 'background 0.15s', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                  onMouseLeave={e => e.currentTarget.style.background = selected?.id === c.id ? 'rgba(212,255,92,0.08)' : 'transparent'}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: selected?.id === c.id ? 'var(--accent)' : 'inherit', fontWeight: 600 }}>{c.name}</div>
                    {c.address && <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address}</div>}
                  </div>
                  <StageBadge stage={c.stage} />
                </div>
              ))}
            </div>
          )}
        </div>
        {selected && (
          <div style={{ marginTop: 10, background: 'rgba(212,255,92,0.08)', border: '1px solid rgba(212,255,92,0.2)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>{selected.name}</span>
            <StageBadge stage={selected.stage} />
          </div>
        )}
      </div>

      <div style={fg}>
        <label style={lbl}>Data spotkania</label>
        <input style={inp} type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div style={fg}>
        <label style={lbl}>Notatka ze spotkania</label>
        <textarea style={{ ...inp, resize: 'vertical', minHeight: 100 }} value={note} onChange={e => setNote(e.target.value)} placeholder="Co omawiano, ustalenia, kolejne kroki..." />
      </div>

      <div style={fg}>
        <label style={lbl}>Próbka</label>
        <input style={inp} value={sample} onChange={e => setSample(e.target.value)} placeholder="np. koko prot, doping szampon..." />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !selected || !note.trim() || !date}
        style={{ width: '100%', padding: '14px 24px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#0d0e10', fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 700, cursor: saving || !selected || !note.trim() || !date ? 'not-allowed' : 'pointer', opacity: saving || !selected || !note.trim() || !date ? 0.5 : 1, transition: 'all 0.2s' }}
      >
        {saving ? 'Zapisywanie...' : 'Zapisz spotkanie'}
      </button>
    </div>
  )
}
