import { useCallback, useRef } from 'react'

export function useUndo(toast) {
    const undoRef = useRef(null)

    const pushUndo = useCallback((label, reverseFn) => {
        undoRef.current = { label, reverseFn }
        // Auto-expire after 30 seconds
        setTimeout(() => {
            if (undoRef.current?.label === label) {
                undoRef.current = null
            }
        }, 30000)
    }, [])

    const doUndo = useCallback(async () => {
        const entry = undoRef.current
        if (!entry) {
            toast?.('inf', 'Rien a annuler.')
            return
        }
        undoRef.current = null
        try {
            await entry.reverseFn()
            toast?.('ok', `Annule: ${entry.label}`)
        } catch (error) {
            toast?.('err', `Erreur annulation: ${error.message}`)
        }
    }, [toast])

    const getUndoLabel = useCallback(() => {
        return undoRef.current?.label || null
    }, [])

    return { pushUndo, doUndo, getUndoLabel }
}
