import React from 'react'
import MeetingPanel from './MeetingPanel'
import DayPlanner from './DayPlanner'
import AlertPanels from './AlertPanels'

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 28px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

export default function Dashboard({ clients, onMeetingSave, onClientClick, dayPlan, setDayPlan }) {
  return (
    <div style={{ padding: 40 }}>
      <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: -1 }}>Dobry dzień 👋</div>
      <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32, fontFamily: 'var(--mono)' }}>// Panel główny — zarządzanie klientami i spotkaniami</div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
        <StatCard label="Wszyscy klienci" value={clients.length} color="var(--accent)" />
        <StatCard label="1 Wizyta" value={clients.filter(c => c.stage === '1 Wizyta').length} color="var(--accent2)" />
        <StatCard label="Spotkanie prod." value={clients.filter(c => c.stage === 'Spotkanie produktowe').length} color="var(--warn)" />
        <StatCard label="Aktywni klienci" value={clients.filter(c => c.stage === 'Klient').length} color="var(--accent)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 1100 }}>
        <MeetingPanel clients={clients} onSave={onMeetingSave} />
        <DayPlanner clients={clients} onClientClick={onClientClick} dayPlan={dayPlan} setDayPlan={setDayPlan} />
      </div>

      <AlertPanels clients={clients} onClientClick={onClientClick} />
    </div>
  )
}
