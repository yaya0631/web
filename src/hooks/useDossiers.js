import { useState, useEffect, useCallback } from 'react'
import { supabase, TABLE } from '../lib/supabase'

export function useDossiers() {
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [connected, setConnected] = useState(false)
  const [error, setError]       = useState(null)

  // ── FETCH ALL ──────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      setRows(data)
      setConnected(true)
      setError(null)
    } catch (e) {
      setError(e.message)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── REALTIME ───────────────────────────────
  useEffect(() => {
    fetchAll()
    const channel = supabase
      .channel('dossiers-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchAll])

  // ── UPSERT ────────────────────────────────
  const upsert = useCallback(async (row) => {
    const payload = { ...row, updated_at: new Date().toISOString() }
    if (!row.created_at) payload.created_at = new Date().toISOString()
    const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'id' })
    if (error) throw error
    await fetchAll()
  }, [fetchAll])

  // ── UPDATE PATCH ──────────────────────────
  const update = useCallback(async (id, patch) => {
    const { error } = await supabase
      .from(TABLE)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    await fetchAll()
  }, [fetchAll])

  // ── DELETE ────────────────────────────────
  const remove = useCallback(async (id) => {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw error
    await fetchAll()
  }, [fetchAll])

  return { rows, loading, connected, error, upsert, update, remove, refresh: fetchAll }
}
