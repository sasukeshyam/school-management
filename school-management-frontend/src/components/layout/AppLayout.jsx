import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastContainer } from '@/components/ui/Toast'
import { useSocket } from '@/hooks/useSocket'
import { useUIStore } from '@/store/uiStore'
import { useEffect } from 'react'
import { cn } from '@/utils/cn'

// Page title map
const TITLES = {
  '/dashboard':       'Dashboard',
  '/students':        'Students',
  '/parents':         'Parents',
  '/teachers':        'Teachers',
  '/staff':           'Staff',
  '/classes':         'Classes',
  '/subjects':        'Subjects',
  '/class-routines':  'Class Routines',
  '/attendance':      'Attendance',
  '/assignments':     'Assignments',
  '/exams':           'Examinations',
  '/admit-cards':     'Admit Cards',
  '/marksheets':      'Marksheets',
  '/fees':            'Fees',
  '/library':         'Library',
  '/events':          'Events',
  '/notifications':   'Notifications',
  '/roles':           'Roles & Permissions',
  '/settings':        'Settings',
}

export const AppLayout = () => {
  const location   = useLocation()
  const initTheme  = useUIStore((s) => s.initTheme)
  const sidebarOpen= useUIStore((s) => s.sidebarOpen)
  const title      = TITLES[location.pathname] || ''

  useSocket()

  useEffect(() => { initTheme() }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className={cn('flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300')}>
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-screen-xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
