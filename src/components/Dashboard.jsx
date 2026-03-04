import React from 'react'
import MeetingPanel from './MeetingPanel'
import StageBadge from './StageBadge'
import { formatDate } from '../utils'

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 28px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

export default function Dashboard({ clients, onMeetingSave, onClientClick }) {
  const recent = [...clients]
    .filter(c => c.lastVisit)
    .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit))
    .slice(0, 6)

  return (
    <div style={{ padding: 40 }}>
      <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: -1 }}>Dobry dzień 👋</div>
      <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32, fontFamily: 'var(--mono)' }}>// Panel główny — zarządzanie klientami i spotkaniami</div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
        <StatCard label="Wszyscy klienci" value={clients.length} color="var(--accent)" />
        <StatCard label="1 Wizyta" value={clients.filter(c => c.stage === '1 Wizyta').length} color="var(--accent2)" />
        <StatCard label="Spotkanie prod." value={clients.filter(c => c.stage === 'Spotkanie produktowe').length} color="var(--warn)" />
        <StatCard label="Aktywni klienci" value={clients.filter(c => c.stage === 'Klient').length} color="var(--accent)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 1100 }}>
        <MeetingPanel clients={clients} onSave={onMeetingSave} />

        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Ostatnio aktywni</h2>
          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>📭 Brak ostatnich spotkań</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recent.map(c => (
                <div
                  key={c.id}
                  onClick={() => onClientClick(c)}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, cursor: 'pointer', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                    <StageBadge stage={c.stage} />
                  </div>
                  <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
                    Wizyta: {formatDate(c.lastVisit)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
