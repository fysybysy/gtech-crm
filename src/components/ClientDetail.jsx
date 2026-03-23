import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import StageBadge from './StageBadge'
import { formatDate } from '../utils'
import { getDayPlan, saveDayPlan } from '../firebase'

function DetailItem({ label, children }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{children || <span style={{ color: 'var(--muted)' }}>—</span>}</div>
    </div>
  )
}

export default function ClientDetail({ open, onClose, client, onEdit, onDelete }) {
  const [inPlan, setInPlan] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (client && open) {
      getDayPlan().then(items => {
        setInPlan(Array.isArray(items) && items.some(x => x.id === client.id))
      })
    }
  }, [client, open])

  if (!client) return null
  const notes = client.notes || []

  const handleAddToPlan = async () => {
    if (inPlan || adding) return
    setAdding(true)
    try {
      const current = await getDayPlan()
      const list = Array.isArray(current) ? current : []
      if (!list.find(x => x.id === client.id)) await saveDayPlan([...list, client])
      setInPlan(true)
      onClose()
    } catch (e) { console.error(e) }
    finally { setAdding(false) }
  }

  const openRoute = () => {
    if (!client.address) return
    const q = encodeURIComponent(client.address)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, '_blank')
  }

  const openGoogleMaps = () => {
    const q = [client.name, client.address].filter(Boolean).join(' ')
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(q)}`, '_blank')
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={700}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{client.name}</div>
          {client.address && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 5, fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>{client.address}</span>
              <button
                onClick={openRoute}
                style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid var(--accent2)', background: 'rgba(92,170,255,0.1)', color: 'var(--accent2)', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--sans)' }}
              >
                🧭 Wyznacz trasę
              </button>
            </div>
          )}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', flexShrink: 0, padding: 4 }}>✕</button>
      </div>

      {/* Info grid */}
      <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        <DetailItem label="Etap"><StageBadge stage={client.stage} /></DetailItem>
        <DetailItem label="Szansa sprzedaży">
          <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{client.chance || 0}%</span>
        </DetailItem>
        <DetailItem label="Ostatnia wizyta">{formatDate(client.lastVisit)}</DetailItem>
        <DetailItem label="Ostatnie zamówienie">{formatDate(client.lastOrder)}</DetailItem>
        {client.sample && (
          <DetailItem label="Próbka">
            <span style={{ fontSize: 12, fontWeight: 400 }}>{client.sample}</span>
          </DetailItem>
        )}
      </div>

      {/* Hours */}
      {(client.hours || true) && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Godziny otwarcia</div>
            <button
              onClick={openGoogleMaps}
              style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid var(--accent2)', background: 'rgba(92,170,255,0.1)', color: 'var(--accent2)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' }}
            >
              🔍 Google Maps
            </button>
          </div>
          {client.hours ? (
            <div style={{ fontSize: 13, fontFamily: 'var(--mono)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{client.hours}</div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)', fontStyle: 'italic' }}>
              Brak danych — kliknij "Edytuj" aby uzupełnić lub "Google Maps" aby sprawdzić
            </div>
          )}
        </div>
      )}

      {/* Note */}
      {client.note && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Notatka</div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>{client.note}</div>
        </div>
      )}

      {/* Notes history */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Historia notatek</div>
        {notes.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', padding: '12px 0' }}>Brak historii</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
            {notes.map((n, i) => (
              <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 5 }}>
                  {formatDate(n.date)}
                  {n.sample && <span style={{ marginLeft: 8, color: 'var(--accent)' }}>próbka: {n.sample}</span>}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>{n.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="footer-btns" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => onDelete(client.id)}
          style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginRight: 'auto' }}
        >
          Usuń
        </button>
        <button
          onClick={handleAddToPlan}
          disabled={inPlan || adding}
          style={{ padding: '9px 14px', borderRadius: 8, fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700, cursor: inPlan || adding ? 'default' : 'pointer', border: inPlan ? '1px solid var(--border)' : '1px solid var(--accent2)', background: inPlan ? 'var(--surface2)' : 'rgba(92,170,255,0.12)', color: inPlan ? 'var(--muted)' : 'var(--accent2)', opacity: inPlan || adding ? 0.6 : 1 }}
        >
          {adding ? '...' : inPlan ? '✓ W planie dnia' : '📅 Plan dnia'}
        </button>
        <button
          onClick={onClose}
          style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          Zamknij
        </button>
        <button
          onClick={() => onEdit(client)}
          style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#0d0e10', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          Edytuj
        </button>
      </div>
    </Modal>
  )
}
