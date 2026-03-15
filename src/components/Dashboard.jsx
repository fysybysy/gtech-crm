import React from 'react'
import MeetingPanel from './MeetingPanel'
import DayPlanner from './DayPlanner'
import AlertPanels from './AlertPanels'

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 22px', flex: '1 1 120px' }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

export default function Dashboard({ clients, onMeetingSave, onClientClick }) {
  const safe = Array.isArray(clients) ? clients : []
  return (
    <div className="page-padding" style={{ padding: 40 }}>
      <div className="page-title" style={{ fontSize: 32, fontWeight: 800, marginBottom: 6, letterSpacing: -1 }}>Dobry dzień 👋</div>
      <div className="page-subtitle" style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28, fontFamily: 'var(--mono)' }}>// Panel główny</div>

      <div className="stats-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
        <StatCard label="Wszyscy klienci" value={safe.length} color="var(--accent)" />
        <StatCard label="1 Wizyta" value={safe.filter(c => c.stage === '1 Wizyta').length} color="var(--accent2)" />
        <StatCard label="Spotkanie prod." value={safe.filter(c => c.stage === 'Spotkanie produktowe').length} color="var(--warn)" />
        <StatCard label="Aktywni klienci" value={safe.filter(c => c.stage === 'Klient').length} color="var(--accent)" />
      </div>

      <div className="dash-grid">
        <MeetingPanel clients={safe} onSave={onMeetingSave} />
        <DayPlanner clients={safe} onClientClick={onClientClick} />
      </div>

      <AlertPanels clients={safe} onClientClick={onClientClick} />
    </div>
  )
}
