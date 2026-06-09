import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

export const Modal = ({ open, onClose, title, description, children, size = 'md', className }) => {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-7xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative z-10 w-full rounded-xl border bg-card shadow-xl animate-fade-in flex flex-col max-h-[90vh]', sizes[size], className)}>
        {(title || onClose) && (
          <div className="flex items-start justify-between p-5 border-b border-border shrink-0">
            <div>
              {title       && <h2 className="font-display font-semibold text-lg">{title}</h2>}
              {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>
            {onClose && (
              <Button variant="ghost" size="icon-sm" onClick={onClose} className="shrink-0 -mt-0.5">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

export const ConfirmModal = ({ open, onClose, onConfirm, title, description, confirmLabel = 'Delete', loading }) => (
  <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
    <div className="flex gap-2 justify-end mt-2">
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="destructive" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
    </div>
  </Modal>
)
