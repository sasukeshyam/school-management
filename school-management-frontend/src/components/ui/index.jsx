import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-colors duration-150',
      className
    )}
    {...props}
  />
))
Input.displayName = 'Input'

// ─── Label ────────────────────────────────────────────────────────────────────
export const Label = forwardRef(({ className, ...props }, ref) => (
  <label ref={ref} className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)} {...props} />
))
Label.displayName = 'Label'

// ─── Textarea ─────────────────────────────────────────────────────────────────
export const Textarea = forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm',
      'placeholder:text-muted-foreground resize-none',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
      className
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

// ─── Select ───────────────────────────────────────────────────────────────────
export const Select = forwardRef(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer',
      className
    )}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ children, className, variant = 'default' }) => {
  const variants = {
    default:     'bg-primary/10 text-primary',
    secondary:   'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive/10 text-destructive',
    success:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    outline:     'border border-border text-foreground',
  }
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)} {...props} />
))
Card.displayName = 'Card'

export const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1 p-5 pb-3', className)} {...props} />
))
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('font-display font-semibold text-base leading-none tracking-tight', className)} {...props} />
))
CardTitle.displayName = 'CardTitle'

export const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-5 pt-0', className)} {...props} />
))
CardFooter.displayName = 'CardFooter'

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const Avatar = ({ src, name = '', size = 'md', className }) => {
  const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-11 w-11 text-base', xl: 'h-14 w-14 text-lg' }
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={cn('relative flex shrink-0 overflow-hidden rounded-full', sizes[size], className)}>
      {src
        ? <img src={src} alt={name} className="h-full w-full object-cover" />
        : <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-semibold">{initials || '?'}</div>
      }
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return (
    <div className={cn('animate-spin rounded-full border-2 border-border border-t-primary', sizes[size], className)} />
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
    {Icon && <div className="p-3 rounded-xl bg-muted"><Icon className="h-8 w-8 text-muted-foreground" /></div>}
    <div>
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
    {action}
  </div>
)

// ─── Separator ────────────────────────────────────────────────────────────────
export const Separator = ({ className, orientation = 'horizontal' }) => (
  <div className={cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)} />
)
