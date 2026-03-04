import { useState, useCallback } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, error = false) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, error }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800)
  }, [])

  return { toasts, toast }
}
