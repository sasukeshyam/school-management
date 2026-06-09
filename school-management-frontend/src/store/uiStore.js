import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set, get) => ({
      sidebarOpen:   true,
      theme:         'light',
      notifications: [],
      unreadCount:   0,

      toggleSidebar:  ()      => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (v)     => set({ sidebarOpen: v }),

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        set({ theme: next })
        document.documentElement.classList.toggle('dark', next === 'dark')
      },

      initTheme: () => {
        const theme = get().theme
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },

      addNotification: (n) => set((s) => ({
        notifications: [n, ...s.notifications].slice(0, 50),
        unreadCount:   s.unreadCount + 1,
      })),

      clearUnread: () => set({ unreadCount: 0 }),
    }),
    {
      name:       'ui-store',
      partialize: (s) => ({ theme: s.theme, sidebarOpen: s.sidebarOpen }),
    }
  )
)
