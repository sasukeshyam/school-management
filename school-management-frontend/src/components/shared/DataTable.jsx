import { useState } from 'react'
import { Search, Filter, RefreshCw } from 'lucide-react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Input } from '@/components/ui/index.jsx'
import { Button } from '@/components/ui/Button'
import { Spinner, EmptyState } from '@/components/ui/index.jsx'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/utils/cn'

export const DataTable = ({
  columns,
  data = [],
  total = 0,
  page = 1,
  pages = 1,
  limit = 10,
  isLoading,
  onPageChange,
  onSearch,
  searchPlaceholder = 'Search...',
  filters,
  emptyIcon,
  emptyTitle = 'No data found',
  emptyDescription,
  className,
}) => {
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    const val = e.target.value
    setSearch(val)
    onSearch?.(val)
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toolbar */}
      {(onSearch || filters) && (
        <div className="flex items-center gap-2 flex-wrap">
          {onSearch && (
            <div className="relative flex-1 min-w-48 max-w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={handleSearch}
                placeholder={searchPlaceholder}
                className="pl-8 h-8 text-xs"
              />
            </div>
          )}
          {filters}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {columns.map((col, i) => (
                <TableHead key={i} className={col.className}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Spinner size="md" />
                    <p className="text-sm">Loading...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, ri) => (
                <TableRow key={row._id || ri}>
                  {columns.map((col, ci) => (
                    <TableCell key={ci} className={col.cellClassName}>
                      {col.cell ? col.cell(row) : row[col.accessor]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <Pagination page={page} pages={pages} total={total} limit={limit} onPageChange={onPageChange} />
      )}
    </div>
  )
}
