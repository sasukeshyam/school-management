import { Bell, Search, Sun, Moon, Menu } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { Avatar, Badge } from '@/components/ui/index.jsx'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { Link } from 'react-router-dom'

export const Topbar = ({ title }) => {
  const toggleSidebar  = useUIStore((s) => s.toggleSidebar)
  const toggleTheme    = useUIStore((s) => s.toggleTheme)
  const theme          = useUIStore((s) => s.theme)
  const unreadCount    = useUIStore((s) => s.unreadCount)
  const user           = useAuthStore((s) => s.user)

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 h-14 px-4 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
      {/* Mobile menu */}
      <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={toggleSidebar}>
        <Menu className="h-4 w-4" />
      </Button>

      {/* Page title */}
      {title && <h1 className="font-display font-semibold text-base hidden sm:block">{title}</h1>}

      {/* Search */}
      <div className="flex-1 max-w-sm hidden md:flex">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            className="w-full h-8 pl-8 pr-3 text-sm rounded-lg border border-border bg-muted/50 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Theme toggle */}
        <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <Link to="/notifications">
          <Button variant="ghost" size="icon-sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        {/* User avatar */}
        <Link to="/settings">
          <Avatar name={user?.name || ''} size="sm" className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all" />
        </Link>
      </div>
    </header>
  )
}
