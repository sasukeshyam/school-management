import { cn } from '@/utils/cn'
import { TrendingUp, TrendingDown } from 'lucide-react'

export const StatCard = ({ label, value, icon: Icon, color = 'primary', trend, trendLabel, className }) => {
  const colors = {
    primary:  'bg-primary/10 text-primary',
    success:  'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning:  'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    danger:   'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    info:     'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    purple:   'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  }

  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="font-display text-2xl font-bold text-foreground">{value}</p>
          {(trend !== undefined) && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{Math.abs(trend)}% {trendLabel || (trend >= 0 ? 'up' : 'down')}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('p-2.5 rounded-xl', colors[color])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}
