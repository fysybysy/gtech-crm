import React, { useState, useMemo } from 'react'
import StageBadge from './StageBadge'
import { STAGES, formatDate } from '../utils'

function ChanceBar({ value }) {
  const n = Number(value) || 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2 }}>
        <div style={{ height: 4, borderRadius: 2, background: 'var(--accent)', width: `${n}%`, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{n}%</span>
    </div>
  )
}

const thStyle = {
  padding: '12px 16px', textAlign: 'left', fontSize: 11,
  fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase',
  letterSpacing: 1, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  cursor: 'pointer', userSelect: 'none',
}

export default function ClientsTable({ clients, loading, onRowClick, onEdit, onAdd }) {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState(1)

  const filtered = useMemo(() => {
    let list = clients
    if (search.trim()) list = list.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(search.toLowerCase())
    )
    if (stageFilter) list = list.filter(c => c.stage === stageFilter)
    return [...list].sort((a, b) => {
      let av = a[sortKey] || '', bv = b[sortKey] || ''
      if (sortKey === 'chance') { av = Number(av); bv = Number(bv) }
      if (av < bv) return -sortDir
      if (av > bv) return sortDir
      return 0
    })
  }, [clients, search, stageFilter, sortKey, sortDir])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d * -1)
    else { setSortKey(key); setSortDir(1) }
  }

  const sortIcon = (key) => sortKey === key ? (sortDir === 1 ? ' ↑' : ' ↓') : ' ↕'

  const inp = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 14, padding: '10px 14px', outline: 'none' }

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 18, pointerEvents: 'none' }}>⌕</span>
          <input
            style={{ ...inp, width: '100%', paddingLeft: 44 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj po nazwie lub adresie..."
          />
        </div>
        <select
          style={{ ...inp, maxWidth: 200 }}
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
        >
          <option value="">Wszystkie etapy</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={onAdd}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#0d0e10', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          + Dodaj klienta
        </button>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 12 }}>
        {loading ? 'Ładowanie...' : `${filtered.length} klientów`}
        {(search || stageFilter) && ` (z ${clients.length} łącznie)`}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {[['name','Nazwa'],['lastVisit','Ost. wizyta'],['lastOrder','Ost. zamówienie'],['stage','Etap'],['chance','Szansa']].map(([key, label]) => (
                <th key={key} style={{ ...thStyle, color: sortKey === key ? 'var(--accent)' : 'var(--muted)' }} onClick={() => handleSort(key)}>
                  {label}{sortIcon(key)}
                </th>
              ))}
              <th style={{ ...thStyle, cursor: 'default' }}>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr
                key={c.id}
                onClick={() => onRowClick(c)}
                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 16px', fontWeight: 700 }}>{c.name}</td>
                <td style={{ padding: '14px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{formatDate(c.lastVisit) || '—'}</td>
                <td style={{ padding: '14px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{formatDate(c.lastOrder) || '—'}</td>
                <td style={{ padding: '14px 16px' }}><StageBadge stage={c.stage} /></td>
                <td style={{ padding: '14px 16px' }}><ChanceBar value={c.chance} /></td>
                <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => onEdit(c)}
                    style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Edytuj
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>Brak wyników — spróbuj innych filtrów</p>
          </div>
        )}
      </div>
    </div>
  )
}
