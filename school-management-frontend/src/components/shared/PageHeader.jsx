import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export const PageHeader = ({ title, description, action, breadcrumbs = [], className }) => (
  <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6', className)}>
    <div>
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              {b.to ? <Link to={b.to} className="hover:text-foreground transition-colors">{b.label}</Link>
                     : <span className={i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>{b.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <h1 className="font-display text-xl font-bold">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
)
