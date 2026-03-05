import React, { useState, useEffect, useRef } from 'react'
import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const NOTES_DOC = doc(db, 'notes', 'main')

export default function NotesPanel() {
  const [text, setText] = useState('')
  const [status, setStatus] = useState('') // '' | 'saving' | 'saved'
  const [loading, setLoading] = useState(true)
  const saveTimer = useRef(null)

  // Load on mount
  useEffect(() => {
    getDoc(NOTES_DOC).then(snap => {
      if (snap.exists()) setText(snap.data().content || '')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Auto-save with debounce
  const handleChange = (e) => {
    const val = e.target.value
    setText(val)
    setStatus('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await setDoc(NOTES_DOC, { content: val, updatedAt: new Date().toISOString() })
        setStatus('saved')
        setTimeout(() => setStatus(''), 2000)
      } catch {
        setStatus('')
      }
    }, 800)
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', maxWidth: 1100, marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>📝 Notes</h2>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 3 }}>Notatki zapisują się automatycznie</div>
        </div>
        {status === 'saving' && (
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>Zapisywanie...</span>
        )}
        {status === 'saved' && (
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent)' }}>✓ Zapisano</span>
        )}
      </div>

      <textarea
        value={loading ? '' : text}
        onChange={handleChange}
        disabled={loading}
        placeholder={loading ? 'Ładowanie...' : 'Wpisz notatki, pomysły, zadania do zrobienia...'}
        style={{
          width: '100%',
          minHeight: 220,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          color: 'var(--text)',
          fontFamily: 'var(--mono)',
          fontSize: 14,
          lineHeight: 1.7,
          padding: '16px 20px',
          outline: 'none',
          resize: 'vertical',
          opacity: loading ? 0.5 : 1,
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}
