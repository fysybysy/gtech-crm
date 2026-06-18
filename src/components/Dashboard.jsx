import React from 'react'
import MeetingPanel from './MeetingPanel'
import DayPlanner from './DayPlanner'
import AlertPanels from './AlertPanels'

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 22px' }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
    </div>
  )
}

export default function Dashboard({ clients, onMeetingSave, onClientClick }) {
  const safe = Array.isArray(clients) ? clients : []
  const active = safe.filter(c => c.stage === '1 Zamówienie' || c.stage === 'Klient').length
  const nowy = safe.filter(c => c.stage === 'Nowy').length
  const spotkanie = safe.filter(c => c.stage === 'Spotkanie produktowe').length

  return (
    <div className="page-padding">
      <div className="page-title">Dobry dzień 👋</div>
      <div className="page-subtitle">// Panel główny</div>

      <div className="stats-row">
        <StatCard label="Aktywni klienci" value={active} color="var(--accent)" />
        <StatCard label="Nowi" value={nowy} color="var(--accent2)" />
        <StatCard label="Spotkanie prod." value={spotkanie} color="var(--warn)" />
        <StatCard label="Wszyscy" value={safe.length} color="var(--muted)" />
      </div>

      <div className="dash-grid">
        <MeetingPanel clients={safe} onSave={onMeetingSave} />
        <DayPlanner clients={safe} onClientClick={onClientClick} />
      </div>

      <AlertPanels clients={safe} onClientClick={onClientClick} />
    </div>
  )
}
