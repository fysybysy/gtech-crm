import React, { useState, useRef, useEffect } from 'react'
import { todayISO, STAGES, matchSearch } from '../utils'
import StageBadge from './StageBadge'
import { saveClient } from '../firebase'

const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 14, padding: '11px 14px', outline: 'none' }
const lbl = { display: 'block', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7 }
const fg = { marginBottom: 18 }

export default function MeetingPanel({ clients, onSaved }) {
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [dropOpen, setDropOpen] = useState(false)
  const [date, setDate]         = useState(todayISO())
  const [note, setNote]         = useState('')
  const [sample, setSample]     = useState('')
  const [stage, setStage]       = useState('')
  const [chance, setChance]     = useState('')
  const [isOrder, setIsOrder]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const dropRef = useRef(null)

  const safeClients = Array.isArray(clients) ? clients : []
  const filtered = search.trim()
    ? safeClients.filter(c =>
        matchSearch(c.name, search) ||
        matchSearch(c.address || '', search)
      )
    : safeClients

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const pick = (c) => {
    setSelected(c)
    setSearch(c.name)
    setDropOpen(false)
    setStage(c.stage || STAGES[0])
    setChance(c.chance !== undefined && c.chance !== '' ? String(c.chance) : '0')
    setIsOrder(false)
  }

  const reset = () => {
    setSelected(null); setSearch(''); setNote(''); setSample('')
    setStage(''); setChance(''); setIsOrder(false); setDate(todayISO())
  }

  const handleSave = async () => {
    if (!selected || !date || !note.trim()) return
    setSaving(true)
    try {
      // Build updated client — always write stage, chance, lastVisit
      const updated = {
        ...selected,
        lastVisit: date,
        stage: stage,
        chance: chance,
        notes: [{ date, text: note, sample }, ...(selected.notes || [])],
      }
      if (sample !== '') updated.sample = sample
      if (isOrder) updated.lastOrder = date

      console.log('Saving client update:', { stage, chance, isOrder, lastOrder: updated.lastOrder })

      await saveClient(updated)
      setSavedMsg(`Spotkanie z ${selected.name} zapisane ✓`)
      setTimeout(() => setSavedMsg(''), 3000)
      if (onSaved) onSaved()
      reset()
    } catch (e) {
      console.error('Save error:', e)
      setSavedMsg('Błąd zapisu!')
    } finally {
      setSaving(false)
    }
  }

  const canSave = selected && date && note.trim() && !saving

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 28 }}>
      <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 22 }}>🤝 Nowe spotkanie</h2>

      {/* Client search */}
      <div style={fg}>
        <label style={lbl}>Wybierz klienta</label>
        <div ref={dropRef} style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 17, pointerEvents: 'none' }}>⌕</span>
            <input
              style={{ ...inp, paddingLeft: 42 }}
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setDropOpen(true)
                if (!e.target.value) { setSelected(null); setStage(''); setChance('') }
              }}
              onFocus={() => setDropOpen(true)}
              placeholder="Wpisz nazwę lub adres..."
              autoComplete="off"
            />
          </div>
          {dropOpen && filtered.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface2)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', maxHeight: 200, overflowY: 'auto', zIndex: 50 }}>
              {filtered.map(c => (
                <div
                  key={c.id}
                  onClick={() => pick(c)}
                  style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, borderBottom: '1px solid var(--border)', background: selected?.id === c.id ? 'rgba(212,255,92,0.08)' : 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                  onMouseLeave={e => e.currentTarget.style.background = selected?.id === c.id ? 'rgba(212,255,92,0.08)' : 'transparent'}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: selected?.id === c.id ? 'var(--accent)' : 'inherit' }}>{c.name}</div>
                    {c.address && <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address}</div>}
                  </div>
                  <StageBadge stage={c.stage} />
                </div>
              ))}
            </div>
          )}
        </div>
        {selected && (
          <div style={{ marginTop: 8, background: 'rgba(212,255,92,0.08)', border: '1px solid rgba(212,255,92,0.2)', borderRadius: 7, padding: '8px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13, flex: 1 }}>{selected.name}</span>
            <StageBadge stage={selected.stage} />
          </div>
        )}
      </div>

      {/* Stage + Chance — always visible after picking client */}
      {selected && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18, padding: 14, background: 'var(--bg)', border: '1px solid var(--accent)', borderRadius: 9 }}>
          <div>
            <label style={lbl}>Etap po spotkaniu</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={stage} onChange={e => { console.log('stage change:', e.target.value); setStage(e.target.value) }}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Szansa sprzedaży (%)</label>
            <input
              style={inp}
              type="number" min="0" max="100"
              value={chance}
              onChange={e => { console.log('chance change:', e.target.value); setChance(e.target.value) }}
              placeholder="0"
            />
          </div>
        </div>
      )}

      <div style={fg}>
        <label style={lbl}>Data spotkania</label>
        <input style={inp} type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div style={fg}>
        <label style={lbl}>Notatka ze spotkania</label>
        <textarea style={{ ...inp, resize: 'vertical', minHeight: 85 }} value={note} onChange={e => setNote(e.target.value)} placeholder="Co omawiano, ustalenia, kolejne kroki..." />
      </div>

      <div style={fg}>
        <label style={lbl}>Próbka</label>
        <input style={inp} value={sample} onChange={e => setSample(e.target.value)} placeholder="np. koko prot, doping szampon..." />
      </div>

      {/* Order checkbox */}
      <div
        onClick={() => setIsOrder(v => !v)}
        style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: isOrder ? 'rgba(92,255,180,0.08)' : 'var(--bg)', border: `1px solid ${isOrder ? '#5cffb8' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}
      >
        <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${isOrder ? '#5cffb8' : 'var(--muted)'}`, background: isOrder ? '#5cffb8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
          {isOrder && <span style={{ color: '#0d0e10', fontSize: 13, fontWeight: 900 }}>✓</span>}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: isOrder ? '#5cffb8' : 'var(--text)' }}>Zamówienie</div>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 2 }}>Aktualizuje „Ostatnie zamówienie" na datę spotkania</div>
        </div>
      </div>

      {savedMsg && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: savedMsg.includes('Błąd') ? 'rgba(255,92,92,0.1)' : 'rgba(212,255,92,0.1)', border: `1px solid ${savedMsg.includes('Błąd') ? 'var(--danger)' : 'var(--accent)'}`, fontSize: 13, color: savedMsg.includes('Błąd') ? 'var(--danger)' : 'var(--accent)', fontFamily: 'var(--mono)' }}>
          {savedMsg}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!canSave}
        style={{ width: '100%', padding: '13px 24px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#0d0e10', fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 700, cursor: canSave ? 'pointer' : 'not-allowed', opacity: canSave ? 1 : 0.5 }}
      >
        {saving ? 'Zapisywanie...' : 'Zapisz spotkanie'}
      </button>
    </div>
  )
}
