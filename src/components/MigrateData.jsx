import React, { useState } from 'react'
import { getAllClients, saveClient } from '../firebase'
import { migrateStage } from '../utils'

// One-time migration component — shows in settings or can be triggered manually
export default function MigrateData() {
  const [status, setStatus] = useState('')
  const [running, setRunning] = useState(false)

  const run = async () => {
    setRunning(true)
    setStatus('Pobieranie klientów...')
    try {
      const clients = await getAllClients()
      let migrated = 0
      for (const c of clients) {
        const newStage = migrateStage(c.stage)
        // Migrate chance from % to scale 1-5
        let newChance = c.chance
        if (c.chance !== undefined && c.chance !== '') {
          const pct = Number(c.chance)
          if (pct > 5) {
            // Convert % to 1-5 scale
            newChance = Math.max(1, Math.min(5, Math.round(pct / 20)))
          }
        }
        if (newStage !== c.stage || newChance !== c.chance) {
          await saveClient({ ...c, stage: newStage, chance: newChance })
          migrated++
          setStatus(`Migracja: ${migrated}/${clients.length}...`)
        }
      }
      setStatus(`✓ Gotowe! Zaktualizowano ${migrated} z ${clients.length} klientów.`)
    } catch (e) {
      setStatus('Błąd: ' + e.message)
    }
    setRunning(false)
  }

  return (
    <div style={{ padding: '20px 24px', background: 'var(--surface)', border: '1px solid var(--warn)', borderRadius: 12, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: 'var(--warn)' }}>⚠ Migracja danych</div>
      <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 12 }}>
        Konwertuje: Wizyta 1/2/3 → Nowy, szansa % → skala 1-5
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={run}
          disabled={running}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--warn)', color: '#0d0e10', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 700, cursor: running ? 'default' : 'pointer', opacity: running ? 0.6 : 1 }}
        >
          {running ? 'Migracja...' : 'Uruchom migrację'}
        </button>
        {status && <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: status.startsWith('✓') ? 'var(--accent)' : 'var(--muted)' }}>{status}</span>}
      </div>
    </div>
  )
}
