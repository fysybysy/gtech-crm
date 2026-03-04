import { useState, useEffect, useCallback } from 'react'
import { getAllClients, saveClient as fbSave, deleteClient as fbDelete } from '../firebase'

export function useClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllClients()
      setClients(data)
    } catch (e) {
      console.error('Firebase load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (obj) => {
    const id = await fbSave(obj)
    await load()
    return id
  }, [load])

  const remove = useCallback(async (id) => {
    await fbDelete(id)
    setClients(prev => prev.filter(c => c.id !== id))
  }, [])

  return { clients, loading, save, remove, reload: load }
}
