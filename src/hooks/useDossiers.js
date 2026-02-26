import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, TABLE } from '../lib/supabase'
import { STATUS, normalizeDossier, toDbPayload, isInTrash } from '../lib/compat'

function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}

export function useDossiers() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const rowsRef = useRef([])

  useEffect(() => {
    rowsRef.current = rows
  }, [rows])

  const fetchAll = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      const normalized = (data || [])
        .map((item) => normalizeDossier(item))
        .filter(Boolean)

      setRows(normalized)
      setConnected(true)
      setError(null)
    } catch (e) {
      setError(e.message)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const channel = supabase
      .channel('dossiers-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, fetchAll)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAll])

  const upsert = useCallback(async (row) => {
    const payload = toDbPayload(row)
    if (!payload) throw new Error('Dossier invalide')
    const { error: upsertError } = await supabase
      .from(TABLE)
      .upsert(payload, { onConflict: 'id' })
    if (upsertError) throw upsertError
    await fetchAll()
  }, [fetchAll])

  const update = useCallback(async (id, patch) => {
    const existing = rowsRef.current.find((row) => row.id === id) || { id }
    const payload = toDbPayload({ ...existing, ...patch, id })
    if (!payload) throw new Error('Mise a jour invalide')

    const { error: updateError } = await supabase
      .from(TABLE)
      .update(payload)
      .eq('id', id)
    if (updateError) throw updateError
    await fetchAll()
  }, [fetchAll])

  const moveToTrash = useCallback(async (id) => {
    await update(id, {
      etat: STATUS.TRASH,
      archive: false,
      date_archive: todayYmd(),
    })
  }, [update])

  const restoreFromTrash = useCallback(async (id) => {
    const existing = rowsRef.current.find((row) => row.id === id)
    if (!existing || !isInTrash(existing)) return
    await update(id, {
      etat: STATUS.IN_PROGRESS,
    })
  }, [update])

  const toggleArchive = useCallback(async (id) => {
    const existing = rowsRef.current.find((row) => row.id === id)
    if (!existing || isInTrash(existing)) return
    const nextArchive = !existing.archive
    await update(id, {
      archive: nextArchive,
      date_archive: nextArchive ? todayYmd() : null,
      etat: nextArchive ? STATUS.ARCHIVED : STATUS.IN_PROGRESS,
    })
  }, [update])

  const purge = useCallback(async (id) => {
    const { error: deleteError } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
    if (deleteError) throw deleteError
    await fetchAll()
  }, [fetchAll])

  return {
    rows,
    loading,
    connected,
    error,
    upsert,
    update,
    remove: moveToTrash,
    moveToTrash,
    restoreFromTrash,
    toggleArchive,
    purge,
    refresh: fetchAll,
  }
}
