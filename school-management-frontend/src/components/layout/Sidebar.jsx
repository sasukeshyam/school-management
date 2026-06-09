import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/index.jsx'
import {
  LayoutDashboard, Users, GraduationCap, UserCheck, BookOpen, Clock,
  ClipboardList, FileText, DollarSign, Library, Bell, Settings,
  ChevronRight, School, Calendar, Award, UserCog, BarChart3,
  BookMarked, UserSquare, Layers, PanelLeft, LogOut,PenSquare,
} from 'lucide-react'
import { useLogout } from '@/hooks/useAuth'

const NAV = [
  { label: 'Main', items: [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/events',       icon: Calendar,        label: 'Events'    },
  ]},
  { label: 'People', items: [
    { to: '/students',  icon: GraduationCap, label: 'Students',  roles: ['super_admin','admin'] },
    { to: '/parents',   icon: Users,         label: 'Parents',   roles: ['super_admin','admin'] },
    { to: '/teachers',  icon: UserCheck,     label: 'Teachers',  roles: ['super_admin','admin'] },
    { to: '/staff',     icon: UserSquare,    label: 'Staff',     roles: ['super_admin','admin'] },
  ]},
  { label: 'Academic', items: [
    { to: '/classes',       icon: Layers,        label: 'Classes',    roles: ['super_admin','admin'] },
    { to: '/subjects',      icon: BookOpen,      label: 'Subjects',   roles: ['super_admin','admin'] },
    { to: '/class-routines',icon: Clock,         label: 'Routine',    roles: ['super_admin','admin','teacher'] },
    { to: '/attendance',    icon: ClipboardList, label: 'Attendance', roles: ['super_admin','admin','teacher'] },
    { to: '/assignments',   icon: BookMarked,    label: 'Assignments' },
  ]},
    { label: 'Examination', items: [
    { to: '/exams',       icon: FileText,   label: 'Exams',       roles: ['super_admin','admin','teacher'] },
    { to: '/quizzes',     icon: PenSquare,  label: 'Quizzes',     roles: ['super_admin','admin','teacher'] },
    { to: '/admit-cards', icon: Award,      label: 'Admit Cards', roles: ['super_admin','admin'] },
    { to: '/marksheets',  icon: BarChart3,  label: 'Marksheets',  roles: ['super_admin','admin','teacher'] },
  ]},
  { label: 'Finance', items: [
    { to: '/fees', icon: DollarSign, label: 'Fees', roles: ['super_admin','admin','accountant'] },
  ]},
  { label: 'Library', items: [
    { to: '/library', icon: Library, label: 'Library' },
  ]},
  { label: 'System', items: [
    { to: '/notifications', icon: Bell,     label: 'Notifications' },
    { to: '/roles',         icon: UserCog,  label: 'Roles & Perms', roles: ['super_admin'] },
    { to: '/settings',      icon: Settings, label: 'Settings'       },
  ]},
]

export const Sidebar = () => {
  const open          = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const user          = useAuthStore((s) => s.user)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const roles         = useAuthStore((s) => s.roles)
  const { mutate: logout } = useLogout()

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={toggleSidebar} />}

      <aside className={cn(
        'fixed top-0 left-0 z-30 h-screen flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
        'transition-all duration-300 ease-in-out',
        open ? 'w-60' : 'w-16',
        'lg:relative lg:z-auto'
      )}>
        {/* Logo */}
        <div className="flex items-center h-14 px-3 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <School className="h-4 w-4 text-white" />
            </div>
            {open && (
              <span className="font-display font-bold text-base text-white whitespace-nowrap animate-fade-in">
                EduCore
              </span>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="ml-auto p-1 rounded-md hover:bg-sidebar-border/50 transition-colors shrink-0"
          >
            <PanelLeft className="h-4 w-4 opacity-60" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin">
          {NAV.map((group) => {
            const visible = group.items.filter((item) => {
              if (!item.roles) return true  // no restriction = show to all
              return item.roles.some((r) => roles.includes(r))
            })
            if (!visible.length) return null
            return (
              <div key={group.label}>
                {open && (
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {visible.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150',
                        isActive
                          ? 'bg-sidebar-accent text-white font-medium'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-border/40 hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {open && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t border-sidebar-border p-2 shrink-0">
          <div className={cn('flex items-center gap-2.5 rounded-lg px-2.5 py-2', open && 'mb-1')}>
            <Avatar name={user?.name || ''} size="sm" className="shrink-0" />
            {open && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
                <p className="text-xs text-sidebar-foreground/50 capitalize truncate">{roles[0] || 'user'}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => logout()}
            className={cn(
              'flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm',
              'text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10 transition-colors'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {open && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
