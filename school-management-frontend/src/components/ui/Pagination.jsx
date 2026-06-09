import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

export const Pagination = ({ page, pages, total, limit, onPageChange }) => {
  if (pages <= 1) return null
  const from = (page - 1) * limit + 1
  const to   = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}–{to}</span> of <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          let p = i + 1
          if (pages > 5) {
            if (page <= 3)       p = i + 1
            else if (page >= pages - 2) p = pages - 4 + i
            else                 p = page - 2 + i
          }
          return (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="icon-sm"
              onClick={() => onPageChange(p)}
              className="text-xs"
            >
              {p}
            </Button>
          )
        })}
        <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page + 1)} disabled={page >= pages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
