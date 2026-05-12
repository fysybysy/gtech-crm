// ONE-TIME SETUP COMPONENT — add ?setup=1 to URL to show
// Creates user 'lb' with password '12345678' in Firebase
import React, { useState } from 'react'
import { createUser } from '../hooks/useAuth'

export default function SetupUser() {
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    try {
      await createUser('lb', '12345678', 'l1bajerowski@gmail.com')
      setDone(true)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h2>Setup użytkownika</h2>
      {done ? (
        <p style={{ color: 'green' }}>✓ Użytkownik lb utworzony. Usuń ?setup=1 z URL.</p>
      ) : (
        <>
          <p>Kliknij aby utworzyć użytkownika: <strong>lb / 12345678</strong></p>
          <button onClick={run} style={{ padding: '10px 20px', background: '#d4ff5c', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
            Utwórz użytkownika
          </button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </>
      )}
    </div>
  )
}
