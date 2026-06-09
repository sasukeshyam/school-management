import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

let socketInstance = null

export const useSocket = () => {
  const user            = useAuthStore((s) => s.user)
  const addNotification = useUIStore((s) => s.addNotification)
  const initialized     = useRef(false)

  useEffect(() => {
    if (!user?._id || initialized.current) return
    initialized.current = true

    socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true,
    })

    socketInstance.on('connect', () => {
      socketInstance.emit('join', user._id)
    })

    socketInstance.on('notification', (data) => {
      addNotification(data)
    })

    return () => {
      socketInstance?.disconnect()
      initialized.current = false
    }
  }, [user?._id])

  return socketInstance
}

export const getSocket = () => socketInstance
