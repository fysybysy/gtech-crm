import React, { useState } from 'react'
import StageBadge from './StageBadge'

function ClientRow({ c, onClick, showDays }) {
  const days = showDays && c.lastVisit
    ? Math.floor((new Date() - new Date(c.lastVisit)) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div
      onClick={() => onClick(c)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 8,
        border: '1px solid var(--border)', background: 'var(--bg)',
        cursor: 'pointer', transition: 'border-color 0.15s',
        marginBottom: 8,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
        {c.address && (
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address}</div>
        )}
        {days !== null && (
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', marginTop: 3, fontWeight: 700, color: days >= 30 ? 'var(--danger)' : 'var(--warn)' }}>
            {days} {days === 1 ? 'dzień' : 'dni'} bez wizyty
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <StageBadge stage={c.stage} />
      </div>
    </div>
  )
}

function Panel({ title, icon, accent, clients, emptyMsg, onClientClick, extra, showDays }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? clients : clients.slice(0, 5)
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: `3px solid ${accent}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{icon} {title}</div>
          {extra && <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 3 }}>{extra}</div>}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: accent }}>{clients.length}</div>
      </div>

      {clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>{emptyMsg}</div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: expanded ? 'auto' : 'visible', maxHeight: expanded ? 400 : 'none' }}>
            {visible.map(c => <ClientRow key={c.id} c={c} onClick={onClientClick} showDays={showDays} />)}
          </div>
          {clients.length > 5 && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ marginTop: 8, background: 'none', border: 'none', color: accent, fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: '4px 0' }}
            >
              {expanded ? '▲ Zwiń' : `▼ Pokaż wszystkie (${clients.length})`}
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default function AlertPanels({ clients, onClientClick }) {
  const now = new Date()

  const overdue = clients
    .filter(c => {
      if (!c.lastVisit) return false
      const diff = (now - new Date(c.lastVisit)) / (1000 * 60 * 60 * 24)
      return diff >= 14
    })
    .sort((a, b) => new Date(a.lastVisit) - new Date(b.lastVisit))

  const highChance = clients
    .filter(c => Number(c.chance) > 70)
    .sort((a, b) => Number(b.chance) - Number(a.chance))

  const oldestDays = overdue.length > 0
    ? Math.floor((now - new Date(overdue[0].lastVisit)) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="dash-grid" style={{ marginTop: 20 }}>
      <Panel
        title="Do ponownej wizyty"
        icon="🔔"
        accent="var(--warn)"
        clients={overdue}
        emptyMsg="Brak wizyt starszych niż 14 dni"
        onClientClick={onClientClick}
        extra={oldestDays ? `najstarsza wizyta: ${oldestDays} dni temu` : 'wizyty starsze niż 14 dni'}
        showDays={true}
      />
      <Panel
        title="Wysoka szansa sprzedaży"
        icon="🎯"
        accent="var(--accent)"
        clients={highChance}
        emptyMsg="Brak klientów z szansą > 70%"
        onClientClick={onClientClick}
        extra="szansa sprzedaży powyżej 70%"
        showDays={false}
      />
    </div>
  )
}
