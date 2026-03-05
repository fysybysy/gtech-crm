import React, { useState, useRef, useEffect, useCallback } from 'react'
import StageBadge from './StageBadge'
import { formatDate } from '../utils'
import { getDayPlan, saveDayPlan } from '../firebase'

const inp = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--sans)',
  fontSize: 14, padding: '10px 14px', outline: 'none',
}

export default function DayPlanner({ clients, onClientClick }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)

  // Load from Firebase on mount
  useEffect(() => {
    getDayPlan().then(items => {
      setList(Array.isArray(items) ? items : [])
      setLoading(false)
    })
  }, [])

  // Save to Firebase whenever list changes (skip initial load)
  const isFirst = useRef(true)
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    saveDayPlan(list)
  }, [list])

  // Expose addClient globally for ClientDetail button
  useEffect(() => {
    window.__dayPlannerAdd = (client) => {
      setList(prev => {
        if (prev.find(x => x.id === client.id)) return prev
        return [...prev, client]
      })
    }
    window.__dayPlannerHas = (id) => list.some(x => x.id === id)
    return () => { delete window.__dayPlannerAdd; delete window.__dayPlannerHas }
  }, [list])

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const safeClients = Array.isArray(clients) ? clients : []
  const listedIds = list.map(c => c.id)
  const q = search.trim().toLowerCase()
  const filtered = q
    ? safeClients.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q)
      )
    : []

  const addFromSearch = (c) => {
    if (!listedIds.includes(c.id)) setList(prev => [...prev, c])
    setSearch('')
    setDropOpen(false)
  }

  const remove = (id) => setList(prev => prev.filter(c => c.id !== id))

  const moveUp = (idx) => {
    if (idx === 0) return
    setList(prev => {
      const a = [...prev]
      ;[a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]
      return a
    })
  }

  const moveDown = (idx) => {
    if (idx === list.length - 1) return
    setList(prev => {
      const a = [...prev]
      ;[a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]
      return a
    })
  }

  const openMaps = () => {
    const addr = list.map(c => encodeURIComponent(c.address || c.name)).join('/')
    window.open(`https://www.google.com/maps/dir/${addr}`, '_blank')
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>📅 Planer dnia</h2>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 3 }}>
            {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        {list.length >= 2 && (
          <button onClick={openMaps} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            🗺 Trasa w Maps
          </button>
        )}
      </div>

      {/* Search */}
      <div ref={dropRef} style={{ position: 'relative', marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 16, pointerEvents: 'none' }}>⌕</span>
          <input
            style={{ ...inp, paddingLeft: 38 }}
            value={search}
            onChange={e => { setSearch(e.target.value); setDropOpen(true) }}
            onFocus={() => setDropOpen(true)}
            placeholder="Szukaj po nazwie lub adresie..."
            autoComplete="off"
          />
        </div>
        {dropOpen && q && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60, background: 'var(--surface2)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--mono)' }}>Brak wyników</div>
              : filtered.map(c => {
                const already = listedIds.includes(c.id)
                return (
                  <div
                    key={c.id}
                    onClick={() => !already && addFromSearch(c)}
                    style={{ padding: '10px 16px', cursor: already ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, opacity: already ? 0.45 : 1, borderBottom: '1px solid var(--border)', background: 'transparent', transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (!already) e.currentTarget.style.background = 'var(--border)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      {c.address && <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address}</div>}
                    </div>
                    <StageBadge stage={c.stage} />
                    {already && <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>dodano</span>}
                  </div>
                )
              })
            }
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
          Ładowanie planu...
        </div>
      )}

      {/* Empty */}
      {!loading && list.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12, border: '1px dashed var(--border)', borderRadius: 8 }}>
          Wyszukaj klienta lub użyj „Dodaj do planu dnia" w szczegółach klienta
        </div>
      )}

      {/* List */}
      {!loading && list.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
          {list.map((c, idx) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
              {/* Number */}
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', color: '#0d0e10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                {idx + 1}
              </div>
              {/* Info - clickable */}
              <div
                onClick={() => onClientClick && onClientClick(c)}
                style={{ flex: 1, minWidth: 0, cursor: onClientClick ? 'pointer' : 'default' }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}
                  onMouseEnter={e => { if (onClientClick) e.currentTarget.style.color = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text)' }}
                >{c.name}</div>
                {c.address && <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{c.address}</div>}
                {c.lastVisit && <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 2 }}>ost. wizyta: {formatDate(c.lastVisit)}</div>}
              </div>
              <StageBadge stage={c.stage} />
              {/* Move */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                <button onClick={() => moveUp(idx)} disabled={idx === 0} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface2)', color: idx === 0 ? 'var(--border)' : 'var(--text)', fontSize: 10, cursor: idx === 0 ? 'default' : 'pointer' }}>▲</button>
                <button onClick={() => moveDown(idx)} disabled={idx === list.length - 1} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface2)', color: idx === list.length - 1 ? 'var(--border)' : 'var(--text)', fontSize: 10, cursor: idx === list.length - 1 ? 'default' : 'pointer' }}>▼</button>
              </div>
              {/* Remove */}
              <button
                onClick={() => remove(c.id)}
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {!loading && list.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
            {list.length} {list.length === 1 ? 'wizyta' : list.length < 5 ? 'wizyty' : 'wizyt'} zaplanowane
          </span>
          <button onClick={() => setList([])} style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            wyczyść listę
          </button>
        </div>
      )}
    </div>
  )
}
