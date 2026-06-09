import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useToast } from '@/hooks/useToast'

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
  warning: AlertTriangle,
}
const STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  error:   'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300',
  info:    'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
}

export const ToastContainer = () => {
  const { toasts, dismiss } = useToast()
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info
        return (
          <div key={t.id} className={cn('flex items-start gap-3 rounded-lg border p-3.5 shadow-lg animate-fade-in', STYLES[t.type])}>
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="text-sm flex-1 leading-snug">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100 shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
