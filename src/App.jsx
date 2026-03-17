import React, { useState } from 'react'
import { useClients } from './hooks/useClients'
import { useToast } from './hooks/useToast'
import Dashboard from './components/Dashboard'
import ClientsTable from './components/ClientsTable'
import ClientForm from './components/ClientForm'
import ClientDetail from './components/ClientDetail'
import NotesPanel from './components/NotesPanel'
import ClientMap from './components/ClientMap'
import MeetingPanel from './components/MeetingPanel'
import ToastContainer from './components/Toast'

export default function App() {
  const { clients, loading, save, remove } = useClients()
  const { toasts, toast } = useToast()

  const [view, setView] = useState('home')
  const [formOpen, setFormOpen] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [detailClient, setDetailClient] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [meetingClient, setMeetingClient] = useState(null)
  const [meetingOpen, setMeetingOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('crm-theme') || 'dark')

  // Apply theme to <html>
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('crm-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const handleSaveClient = async (form) => {
    try {
      await save(form)
      toast(form.id ? 'Klient zaktualizowany ✓' : 'Klient dodany ✓')
      setFormOpen(false); setEditClient(null)
      if (detailClient?.id === form.id) setDetailClient(null)
    } catch { toast('Błąd zapisu — sprawdź połączenie', true) }
  }

  const handleDeleteClient = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć tego klienta?')) return
    try { await remove(id); toast('Klient usunięty'); setDetailClient(null) }
    catch { toast('Błąd usuwania', true) }
  }

  const handleMeetingSave = async ({ client, date, note, sample, stage, chance }) => {
    try {
      const updated = {
        ...client,
        lastVisit: date,
        stage: stage || client.stage,
        chance: (chance !== '' && chance !== undefined) ? chance : client.chance,
        notes: [{ date, text: note, sample }, ...(client.notes || [])],
        ...(sample !== '' ? { sample } : {}),
      }
      await save(updated)
      toast(`Spotkanie z ${client.name} zapisane ✓`)
    } catch { toast('Błąd zapisu spotkania', true) }
  }

  const openEdit = (c) => { setEditClient(c); setDetailClient(null); setFormOpen(true) }
  const openDetail = (c) => { setDetailClient(clients.find(x => x.id === c.id) || c) }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ exportDate: new Date().toISOString(), clients }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'database.json'; a.click()
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return
      try {
        const data = JSON.parse(await file.text())
        const list = data.clients || data
        if (!Array.isArray(list)) throw new Error()
        toast('Importowanie...')
        for (const c of list) await save(c)
        toast(`Zaimportowano ${list.length} klientów ✓`)
      } catch { toast('Błąd importu — nieprawidłowy plik', true) }
    }
    input.click()
  }

  const navTo = (v) => { setView(v); setMenuOpen(false) }

  const navBtn = (active) => ({
    padding: '8px 18px', borderRadius: 6, border: 'none',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#0d0e10' : 'var(--muted)',
    fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  })
  const utilBtn = { padding: '8px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }

  return (
    <>
      {/* Header */}
      <header className="header-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 60, borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="header-logo" style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, flexShrink: 0 }}>
          G-TECH<span style={{ color: 'var(--accent)' }}>.</span>crm
        </div>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button style={navBtn(view === 'home')} onClick={() => navTo('home')}>Pulpit</button>
          <button style={navBtn(view === 'clients')} onClick={() => navTo('clients')}>Klienci</button>
          <button style={navBtn(view === 'notes')} onClick={() => navTo('notes')}>Notes</button>
          <button style={navBtn(view === 'map')} onClick={() => navTo('map')}>🗺 Mapa</button>
          <button
            className="header-add-btn"
            style={{ ...navBtn(false), background: 'var(--accent)', color: '#0d0e10', marginLeft: 4 }}
            onClick={() => { setEditClient(null); setFormOpen(true) }}
          >
            + Nowy klient
          </button>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'}
            style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="header-divider" style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
          <button className="header-util" style={utilBtn} onClick={handleImport}>↑ Importuj</button>
          <button className="header-util" style={utilBtn} onClick={handleExport}>↓ Eksportuj</button>
        </div>

        {/* Mobile: add + hamburger */}
        <div className="mobile-nav" style={{ display: 'none', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => { setEditClient(null); setFormOpen(true) }}
            style={{ padding: '7px 12px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#0d0e10', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            + Nowy
          </button>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: 56, left: 0, right: 0, zIndex: 99, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: 12, gap: 6 }}>
          {[['home','🏠 Pulpit'],['clients','👥 Klienci'],['notes','📝 Notes'],['map','🗺 Mapa']].map(([v, label]) => (
            <button
              key={v}
              onClick={() => navTo(v)}
              style={{ padding: '12px 16px', borderRadius: 8, border: 'none', background: view === v ? 'var(--accent)' : 'var(--surface2)', color: view === v ? '#0d0e10' : 'var(--text)', fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
            >
              {label}
            </button>
          ))}
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { handleImport(); setMenuOpen(false) }} style={{ ...utilBtn, flex: 1 }}>↑ Importuj</button>
            <button onClick={() => { handleExport(); setMenuOpen(false) }} style={{ ...utilBtn, flex: 1 }}>↓ Eksportuj</button>
          </div>
          <button
            onClick={() => { toggleTheme(); setMenuOpen(false) }}
            style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
          >
            {theme === 'dark' ? '☀️ Jasny motyw' : '🌙 Ciemny motyw'}
          </button>
        </div>
      )}

      {loading && (
        <div style={{ height: 3, background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%', background: 'var(--accent)', animation: 'loadbar 1.2s ease infinite' }} />
          <style>{`@keyframes loadbar { from { left: -60% } to { left: 110% } }`}</style>
        </div>
      )}

      {view === 'home' && <Dashboard clients={clients} onMeetingSave={handleMeetingSave} onClientClick={openDetail} />}

      {view === 'clients' && (
        <div className="page-padding" style={{ padding: 40 }}>
          <div className="page-title" style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: -1 }}>Lista klientów</div>
          <div className="page-subtitle" style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32, fontFamily: 'var(--mono)' }}>// Wszystkie rekordy — filtruj, sortuj, edytuj</div>
          <ClientsTable clients={clients} loading={loading} onRowClick={openDetail} onEdit={openEdit} onAdd={() => { setEditClient(null); setFormOpen(true) }} />
        </div>
      )}

      {view === 'notes' && <NotesPanel />}

      {view === 'map' && (
        <ClientMap
          clients={clients}
          onClientClick={openDetail}
          onAddClient={(data) => { setEditClient({ name: data.name || '', address: data.address || '' }); setFormOpen(true) }}
          onAddMeeting={(client) => { setMeetingClient(client); setMeetingOpen(true) }}
        />
      )}

      {meetingOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setMeetingOpen(false) }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: 4, position: 'relative' }}>
            <button onClick={() => setMeetingOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', zIndex: 1 }}>✕</button>
            <MeetingPanel
              clients={clients}
              preselected={meetingClient}
              onSaved={() => { setMeetingOpen(false); setMeetingClient(null) }}
              onSave={handleMeetingSave}
            />
          </div>
        </div>
      )}

      <ClientForm open={formOpen} onClose={() => { setFormOpen(false); setEditClient(null) }} onSave={handleSaveClient} initial={editClient} />
      <ClientDetail open={!!detailClient} onClose={() => setDetailClient(null)} client={detailClient} onEdit={openEdit} onDelete={handleDeleteClient} />
      <ToastContainer toasts={toasts} />
    </>
  )
}
