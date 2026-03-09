import React, { useState, useEffect, useRef } from 'react'
import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const NOTES_DOC = doc(db, 'notes', 'main')

// Parses text into blocks: {type:'text'|'check', text, checked, id}
function parseBlocks(raw) {
  return raw.split('\n').map((line, i) => {
    const checkMatch = line.match(/^\[(x| )\] (.*)$/i)
    if (checkMatch) {
      return { id: i, type: 'check', checked: checkMatch[1].toLowerCase() === 'x', text: checkMatch[2] }
    }
    return { id: i, type: 'text', text: line }
  })
}

function blocksToRaw(blocks) {
  return blocks.map(b => b.type === 'check' ? `[${b.checked ? 'x' : ' '}] ${b.text}` : b.text).join('\n')
}

export default function NotesPanel() {
  const [raw, setRaw] = useState('')
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('write') // 'write' | 'view'
  const saveTimer = useRef(null)

  useEffect(() => {
    getDoc(NOTES_DOC).then(snap => {
      if (snap.exists()) setRaw(snap.data().content || '')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const persistRaw = (val) => {
    setStatus('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await setDoc(NOTES_DOC, { content: val, updatedAt: new Date().toISOString() })
        setStatus('saved')
        setTimeout(() => setStatus(''), 2000)
      } catch { setStatus('') }
    }, 700)
  }

  const handleRawChange = (e) => {
    setRaw(e.target.value)
    persistRaw(e.target.value)
  }

  const toggleCheck = (lineIdx) => {
    const blocks = parseBlocks(raw)
    blocks[lineIdx].checked = !blocks[lineIdx].checked
    const newRaw = blocksToRaw(blocks)
    setRaw(newRaw)
    persistRaw(newRaw)
  }

  const addChecklist = () => {
    const newRaw = raw + (raw.endsWith('\n') || raw === '' ? '' : '\n') + '[ ] '
    setRaw(newRaw)
    persistRaw(newRaw)
    setMode('write')
    setTimeout(() => {
      const ta = document.getElementById('notes-textarea')
      if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length) }
    }, 50)
  }

  // Search highlight
  const q = search.trim().toLowerCase()
  const blocks = parseBlocks(raw)
  const filteredBlocks = q ? blocks.filter(b => b.text.toLowerCase().includes(q)) : blocks

  const mono = { fontFamily: 'var(--mono)', fontSize: 14 }
  const btnBase = { padding: '7px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }

  return (
    <div style={{ padding: 40, height: 'calc(100vh - 65px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>📝 Notes</div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, fontFamily: 'var(--mono)' }}>// Notatki i checklisty — zapisują się automatycznie</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {status === 'saving' && <span style={{ ...mono, color: 'var(--muted)', fontSize: 12 }}>Zapisywanie...</span>}
          {status === 'saved' && <span style={{ ...mono, color: 'var(--accent)', fontSize: 12 }}>✓ Zapisano</span>}
          <button onClick={addChecklist} style={{ ...btnBase, color: '#5cffb8', borderColor: '#5cffb8' }}>☑ Dodaj punkt</button>
          <button onClick={() => setMode(mode === 'write' ? 'view' : 'write')} style={{ ...btnBase, color: mode === 'view' ? 'var(--accent)' : 'var(--muted)' }}>
            {mode === 'write' ? '👁 Podgląd' : '✏️ Edytuj'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 16, pointerEvents: 'none' }}>⌕</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Szukaj w notatkach..."
          style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 14, padding: '10px 14px 10px 42px', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {q && (
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
            {filteredBlocks.length} wyników
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>Ładowanie...</div>
      ) : mode === 'write' && !q ? (
        /* Write mode — raw textarea */
        <textarea
          id="notes-textarea"
          value={raw}
          onChange={handleRawChange}
          placeholder={'Wpisz notatki...\n\nAby dodać punkt checklisty użyj przycisku "Dodaj punkt" lub wpisz ręcznie:\n[ ] zadanie do zrobienia\n[x] zadanie wykonane'}
          style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', ...mono, lineHeight: 1.8, padding: '20px 24px', outline: 'none', resize: 'none' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      ) : (
        /* View mode or search — rendered blocks */
        <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', overflowY: 'auto' }}>
          {filteredBlocks.length === 0 ? (
            <div style={{ color: 'var(--muted)', ...mono, fontSize: 13 }}>Brak wyników dla „{q}"</div>
          ) : filteredBlocks.map((block, i) => {
            const globalIdx = q ? blocks.findIndex((b, bi) => bi >= i && b.text === block.text && b.type === block.type) : i
            if (block.type === 'check') {
              return (
                <div
                  key={i}
                  onClick={() => toggleCheck(globalIdx)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '6px 0', cursor: 'pointer', borderRadius: 6 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${block.checked ? '#5cffb8' : 'var(--muted)'}`, background: block.checked ? '#5cffb8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, transition: 'all 0.15s' }}>
                    {block.checked && <span style={{ color: '#0d0e10', fontSize: 12, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ ...mono, lineHeight: 1.7, textDecoration: block.checked ? 'line-through' : 'none', color: block.checked ? 'var(--muted)' : 'var(--text)', transition: 'all 0.15s' }}>
                    {q ? highlightText(block.text, q) : block.text}
                  </span>
                </div>
              )
            }
            if (block.text === '') return <div key={i} style={{ height: 10 }} />
            return (
              <div key={i} style={{ ...mono, lineHeight: 1.8, padding: '2px 0', color: 'var(--text)' }}>
                {q ? highlightText(block.text, q) : block.text}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function highlightText(text, q) {
  const idx = text.toLowerCase().indexOf(q)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(212,255,92,0.35)', color: 'var(--text)', borderRadius: 3, padding: '0 2px' }}>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}
