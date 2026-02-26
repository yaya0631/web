import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((type, msg) => {
    const id = Date.now()
    setToasts((current) => [...current, { id, type, msg }])
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div id="toasts">
        {toasts.map((item) => (
          <div key={item.id} className={`toast t-${item.type}`}>
            <span>{{ ok: '[OK]', err: '[ERR]', inf: '[i]' }[item.type]}</span>
            <span>{item.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
