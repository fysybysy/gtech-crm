import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import { STAGES } from '../utils'

const EMPTY = {
  name: '', address: '', lastVisit: '',
  lastOrder: '', stage: '1 Wizyta', chance: '', sample: '', note: '', hours: '',
}

const label = { display: 'block', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }
const input = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 15, padding: '12px 16px', outline: 'none' }
const fgroup = { marginBottom: 20 }

export default function ClientForm({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(initial ? { ...EMPTY, ...initial } : EMPTY)
  }, [initial, open])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const openGoogleMaps = () => {
    const q = [form.name, form.address].filter(Boolean).join(' ')
    if (!q.trim()) return
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(q)}`, '_blank')
  }

  const canOpenMaps = form.name.trim() || form.address.trim()

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{initial?.id ? 'Edytuj klienta' : 'Nowy klient'}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={fgroup}>
          <label style={label}>Nazwa klienta *</label>
          <input style={input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="np. Salon Urody ABC" />
        </div>
        <div style={fgroup}>
          <label style={label}>Etap</label>
          <select style={{ ...input }} value={form.stage} onChange={e => set('stage', e.target.value)}>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={fgroup}>
        <label style={label}>Adres</label>
        <input style={input} value={form.address} onChange={e => set('address', e.target.value)} placeholder="ul. Przykładowa 1, 00-000 Warszawa" />
      </div>

      <div style={fgroup}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ ...label, marginBottom: 0 }}>Godziny otwarcia</label>
          <button
            onClick={openGoogleMaps}
            disabled={!canOpenMaps}
            style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--accent2)', background: 'rgba(92,170,255,0.1)', color: 'var(--accent2)', fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 700, cursor: canOpenMaps ? 'pointer' : 'default', opacity: canOpenMaps ? 1 : 0.4, whiteSpace: 'nowrap' }}
          >
            🔍 Pokaż w Google Maps
          </button>
        </div>
        <textarea
          style={{ ...input, resize: 'vertical', minHeight: 80, fontSize: 13, lineHeight: 1.6 }}
          value={form.hours}
          onChange={e => set('hours', e.target.value)}
          placeholder={'np. Pon–Pt: 9:00–18:00\nSob: 9:00–14:00\nNied: nieczynne'}
        />
      </div>

      <div style={fgroup}>
        <label style={label}>Ostatnia wizyta</label>
        <input style={input} type="date" value={form.lastVisit} onChange={e => set('lastVisit', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={fgroup}>
          <label style={label}>Ostatnie zamówienie</label>
          <input style={input} type="date" value={form.lastOrder} onChange={e => set('lastOrder', e.target.value)} />
        </div>
        <div style={fgroup}>
          <label style={label}>Szansa sprzedażowa (%)</label>
          <input style={input} type="number" min="0" max="100" value={form.chance} onChange={e => set('chance', e.target.value)} placeholder="np. 70" />
        </div>
      </div>

      <div style={fgroup}>
        <label style={label}>Próbka</label>
        <input style={input} value={form.sample} onChange={e => set('sample', e.target.value)} placeholder="np. koko prot, doping szampon..." />
      </div>

      <div style={fgroup}>
        <label style={label}>Notatka</label>
        <textarea style={{ ...input, resize: 'vertical', minHeight: 100 }} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Dodatkowe informacje o kliencie..." />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
        <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Anuluj
        </button>
        <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#0d0e10', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Zapisywanie...' : 'Zapisz klienta'}
        </button>
      </div>
    </Modal>
  )
}
