import React, { useState, useRef, useEffect } from 'react'
import StageBadge from './StageBadge'
import { formatDate } from '../utils'

const inp = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--sans)',
  fontSize: 14, padding: '10px 14px', outline: 'none',
}

function ClientSearchDrop({ clients, plannedIds, onAdd }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const q = search.trim().toLowerCase()
  const filtered = q
    ? clients.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q)
      )
    : []

  const pick = (c) => {
    onAdd(c)
    setSearch('')
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 16 }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 16, pointerEvents: 'none' }}>⌕</span>
        <input
          style={{ ...inp, paddingLeft: 38 }}
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Szukaj po nazwie lub adresie..."
          autoComplete="off"
        />
      </div>

      {open && q && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderTop: 'none', borderRadius: '0 0 8px 8px',
          maxHeight: 240, overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--mono)' }}>Brak wyników</div>
          ) : filtered.map(c => {
            const already = plannedIds.includes(c.id)
            return (
              <div
                key={c.id}
                onClick={() => !already && pick(c)}
                style={{
                  padding: '10px 16px', cursor: already ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  opacity: already ? 0.4 : 1, transition: 'background 0.15s',
                  borderBottom: '1px solid var(--border)',
                }}
                onMouseEnter={e => { if (!already) e.currentTarget.style.background = 'var(--border)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  {c.address && <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address}</div>}
                </div>
                <StageBadge stage={c.stage} />
                {already && <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>dodano</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function DayPlanner({ clients, dayPlan, setDayPlan }) {
  const plannedIds = dayPlan.map(c => c.id)

  const addClient = (c) => {
    if (plannedIds.includes(c.id)) return
    setDayPlan(prev => [...prev, c])
  }

  const removeClient = (id) => {
    setDayPlan(prev => prev.filter(c => c.id !== id))
  }

  const moveUp = (idx) => {
    if (idx === 0) return
    setDayPlan(prev => {
      const arr = [...prev]
      ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
      return arr
    })
  }

  const moveDown = (idx) => {
    if (idx === dayPlan.length - 1) return
    setDayPlan(prev => {
      const arr = [...prev]
      ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
      return arr
    })
  }

  const openMaps = () => {
    if (dayPlan.length === 0) return
    const addresses = dayPlan.map(c => encodeURIComponent(c.address || c.name)).join('/')
    window.open(`https://www.google.com/maps/dir/${addresses}`, '_blank')
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>📅 Planer dnia</h2>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 3 }}>
            {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        {dayPlan.length >= 2 && (
          <button
            onClick={openMaps}
            style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            🗺 Trasa w Maps
          </button>
        )}
      </div>

      <ClientSearchDrop clients={clients} plannedIds={plannedIds} onAdd={addClient} />

      {dayPlan.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12, border: '1px dashed var(--border)', borderRadius: 8 }}>
          Wyszukaj i dodaj klientów do planu dnia
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
          {dayPlan.map((c, idx) => (
            <div
              key={c.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px' }}
            >
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: '#0d0e10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                {c.address && <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{c.address}</div>}
                {c.lastVisit && <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 1 }}>ost. wizyta: {formatDate(c.lastVisit)}</div>}
              </div>
              <StageBadge stage={c.stage} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button onClick={() => moveUp(idx)} disabled={idx === 0} style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface2)', color: idx === 0 ? 'var(--border)' : 'var(--muted)', fontSize: 11, cursor: idx === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
                <button onClick={() => moveDown(idx)} disabled={idx === dayPlan.length - 1} style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface2)', color: idx === dayPlan.length - 1 ? 'var(--border)' : 'var(--muted)', fontSize: 11, cursor: idx === dayPlan.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
              </div>
              <button
                onClick={() => removeClient(c.id)}
                style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {dayPlan.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
            {dayPlan.length} {dayPlan.length === 1 ? 'wizyta' : dayPlan.length < 5 ? 'wizyty' : 'wizyt'} zaplanowane
          </span>
          <button onClick={() => setDayPlan([])} style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            wyczyść listę
          </button>
        </div>
      )}
    </div>
  )
}
