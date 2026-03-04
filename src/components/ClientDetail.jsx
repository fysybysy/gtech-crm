import React from 'react'
import Modal from './Modal'
import StageBadge from './StageBadge'
import { formatDate } from '../utils'

function DetailItem({ label, children }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{children || <span style={{ color: 'var(--muted)' }}>—</span>}</div>
    </div>
  )
}

export default function ClientDetail({ open, onClose, client, onEdit, onDelete, onAddToDayPlan, dayPlanIds = [] }) {
  if (!client) return null
  const notes = client.notes || []

  return (
    <Modal open={open} onClose={onClose} maxWidth={780}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{client.name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--mono)' }}>{client.address || 'Brak adresu'}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <DetailItem label="Etap"><StageBadge stage={client.stage} /></DetailItem>
        <DetailItem label="Szansa sprzedażowa">
          <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{client.chance || 0}%</span>
        </DetailItem>
        <DetailItem label="Próbka">
          {client.sample && <span style={{ fontSize: 13, fontWeight: 400 }}>{client.sample}</span>}
        </DetailItem>
        <DetailItem label="Ostatnia wizyta">{formatDate(client.lastVisit)}</DetailItem>
        <DetailItem label="Ostatni kontakt">{formatDate(client.lastContact)}</DetailItem>
        <DetailItem label="Ostatnie zamówienie">{formatDate(client.lastOrder)}</DetailItem>
        {client.note && (
          <div style={{ gridColumn: '1 / -1', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Notatka</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, fontWeight: 400 }}>{client.note}</div>
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 14, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Historia notatek</div>
        {notes.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--mono)', padding: '16px 0' }}>Brak historii notatek</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflowY: 'auto' }}>
            {notes.map((n, i) => (
              <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 6 }}>
                  {formatDate(n.date)}
                  {n.sample && <span style={{ marginLeft: 10, color: 'var(--accent)' }}>próbka: {n.sample}</span>}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{n.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28, borderTop: '1px solid var(--border)', paddingTop: 24, flexWrap: 'wrap' }}>
        <button onClick={() => onDelete(client.id)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginRight: 'auto' }}>
          Usuń klienta
        </button>
        {onAddToDayPlan && (() => {
          const inPlan = dayPlanIds.includes(client.id)
          return (
            <button
              onClick={() => { onAddToDayPlan(client); if (!inPlan) onClose() }}
              disabled={inPlan}
              style={{ padding: '12px 20px', borderRadius: 8, border: `1px solid ${inPlan ? 'var(--border)' : 'var(--accent2)'}`, background: inPlan ? 'var(--surface2)' : 'rgba(92,170,255,0.1)', color: inPlan ? 'var(--muted)' : 'var(--accent2)', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, cursor: inPlan ? 'default' : 'pointer' }}
            >
              {inPlan ? '✓ W planie dnia' : '📅 Dodaj do planu dnia'}
            </button>
          )
        })()}
        <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Zamknij
        </button>
        <button onClick={() => onEdit(client)} style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#0d0e10', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Edytuj
        </button>
      </div>
    </Modal>
  )
}
