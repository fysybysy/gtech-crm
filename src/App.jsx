import React, { useState } from 'react'
import { useClients } from './hooks/useClients'
import { useToast } from './hooks/useToast'
import Dashboard from './components/Dashboard'
import ClientsTable from './components/ClientsTable'
import ClientForm from './components/ClientForm'
import ClientDetail from './components/ClientDetail'
import ToastContainer from './components/Toast'

export default function App() {
  const { clients, loading, save, remove } = useClients()
  const { toasts, toast } = useToast()

  const [view, setView] = useState('home') // 'home' | 'clients'
  const [formOpen, setFormOpen] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [detailClient, setDetailClient] = useState(null)

  // ── Handlers ──────────────────────────────────────────
  const handleSaveClient = async (form) => {
    try {
      await save(form)
      toast(form.id ? 'Klient zaktualizowany ✓' : 'Klient dodany ✓')
      setFormOpen(false)
      setEditClient(null)
      // refresh detail if open
      if (detailClient?.id === form.id) setDetailClient(null)
    } catch (e) {
      toast('Błąd zapisu — sprawdź połączenie', true)
    }
  }

  const handleDeleteClient = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć tego klienta? Tej operacji nie można cofnąć.')) return
    try {
      await remove(id)
      toast('Klient usunięty')
      setDetailClient(null)
    } catch {
      toast('Błąd usuwania', true)
    }
  }

  const handleMeetingSave = async ({ client, date, note, sample }) => {
    try {
      const updated = {
        ...client,
        lastVisit: date,
        notes: [{ date, text: note, sample }, ...(client.notes || [])],
        ...(sample ? { sample } : {}),
      }
      await save(updated)
      toast(`Spotkanie z ${client.name} zapisane ✓`)
    } catch {
      toast('Błąd zapisu spotkania', true)
    }
  }

  const openEdit = (c) => {
    setEditClient(c)
    setDetailClient(null)
    setFormOpen(true)
  }

  const openDetail = (c) => {
    // always get fresh data from clients array
    const fresh = clients.find(x => x.id === c.id) || c
    setDetailClient(fresh)
  }

  // ── Export / Import ────────────────────────────────────
  const handleExport = () => {
    const json = JSON.stringify({ exportDate: new Date().toISOString(), clients }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'database.json'; a.click()
    URL.revokeObjectURL(url)
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

  // ── Styles ─────────────────────────────────────────────
  const navBtn = (active) => ({
    padding: '8px 20px', borderRadius: 6, border: 'none',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#0d0e10' : 'var(--muted)',
    fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
  })

  const utilBtn = {
    padding: '8px 16px', borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--muted)',
    fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
  }

  return (
    <>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
          G-TECH<span style={{ color: 'var(--accent)' }}>.</span>crm
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button style={navBtn(view === 'home')} onClick={() => setView('home')}>Pulpit</button>
          <button style={navBtn(view === 'clients')} onClick={() => setView('clients')}>Klienci</button>
          <button
            style={{ ...navBtn(false), background: 'var(--accent)', color: '#0d0e10' }}
            onClick={() => { setEditClient(null); setFormOpen(true) }}
          >
            + Nowy klient
          </button>
          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
          <button style={utilBtn} onClick={handleImport}>↑ Importuj</button>
          <button style={utilBtn} onClick={handleExport}>↓ Eksportuj</button>
        </div>
      </header>

      {/* Loading bar */}
      {loading && (
        <div style={{ height: 3, background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%', background: 'var(--accent)', animation: 'loadbar 1.2s ease infinite' }} />
          <style>{`@keyframes loadbar { from { left: -60% } to { left: 110% } }`}</style>
        </div>
      )}

      {/* Views */}
      {view === 'home' && (
        <Dashboard
          clients={clients}
          onMeetingSave={handleMeetingSave}
          onClientClick={openDetail}
        />
      )}

      {view === 'clients' && (
        <div style={{ padding: 40 }}>
          <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: -1 }}>Lista klientów</div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32, fontFamily: 'var(--mono)' }}>// Wszystkie rekordy — filtruj, sortuj, edytuj</div>
          <ClientsTable
            clients={clients}
            loading={loading}
            onRowClick={openDetail}
            onEdit={openEdit}
            onAdd={() => { setEditClient(null); setFormOpen(true) }}
          />
        </div>
      )}

      {/* Modals */}
      <ClientForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditClient(null) }}
        onSave={handleSaveClient}
        initial={editClient}
      />

      <ClientDetail
        open={!!detailClient}
        onClose={() => setDetailClient(null)}
        client={detailClient}
        onEdit={openEdit}
        onDelete={handleDeleteClient}
      />

      <ToastContainer toasts={toasts} />
    </>
  )
}
