import { useState, useCallback } from 'react'

let toastHandlers = []

export const toast = {
  success: (msg, opts) => toastHandlers.forEach((h) => h({ type: 'success', message: msg, ...opts })),
  error:   (msg, opts) => toastHandlers.forEach((h) => h({ type: 'error',   message: msg, ...opts })),
  info:    (msg, opts) => toastHandlers.forEach((h) => h({ type: 'info',    message: msg, ...opts })),
  warning: (msg, opts) => toastHandlers.forEach((h) => h({ type: 'warning', message: msg, ...opts })),
}

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((t) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), t.duration || 4000)
  }, [])

  // Register handler
  useState(() => {
    toastHandlers.push(addToast)
    return () => { toastHandlers = toastHandlers.filter((h) => h !== addToast) }
  })

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((x) => x.id !== id)), [])

  return { toasts, dismiss }
}
