import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, DollarSign, CreditCard, BarChart3 } from 'lucide-react'
import { feeGroupsAPI, feeTypesAPI, feeMastersAPI, feeCollectAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, Badge, Select, Label } from '@/components/ui/index.jsx'
import { Modal } from '@/components/ui/Modal'
import { fCurrency, fDate, STATUS_COLORS } from '@/utils/format'
import { cn } from '@/utils/cn'
import { toast } from '@/hooks/useToast'

const TABS = ['Fee Types', 'Fee Masters', 'Collection', 'Report']

export const FeesPage = () => {
  const qc = useQueryClient()
  const [tab,        setTab]    = useState(0)
  const [page,       setPage]   = useState(1)
  const [search,     setSearch] = useState('')
  const [showForm,   setShowForm] = useState(false)

  const { data: feeTypesData, isLoading: loadingTypes } = useQuery({
    queryKey: ['fee-types', page, search],
    queryFn:  () => feeTypesAPI.getAll({ page, limit: 10, search }).then((r) => r.data),
    enabled:  tab === 0,
  })

  const { data: feeMastersData, isLoading: loadingMasters } = useQuery({
    queryKey: ['fee-masters', page],
    queryFn:  () => feeMastersAPI.getAll({ page, limit: 10 }).then((r) => r.data),
    enabled:  tab === 1,
  })

  const { data: reportData } = useQuery({
    queryKey: ['fee-report'],
    queryFn:  () => feeCollectAPI.report({}).then((r) => r.data.data),
    enabled:  tab === 3,
  })

  const feeTypeColumns = [
    { header: 'Name',        cell: (r) => <p className="text-sm font-medium">{r.name}</p> },
    { header: 'Code',        cell: (r) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{r.code}</code> },
    { header: 'Description', cell: (r) => <p className="text-sm text-muted-foreground truncate max-w-48">{r.description || '—'}</p> },
    { header: 'Status',      cell: (r) => <Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
    {
      header: 'Actions', className: 'text-right', cellClassName: 'text-right',
      cell: (r) => (
        <Button variant="outline" size="sm" onClick={() => toast.info('Edit coming soon')}>Edit</Button>
      ),
    },
  ]

  const feeMasterColumns = [
    { header: 'Fee Group', cell: (r) => <p className="text-sm font-medium">{r.fee_group_id?.name}</p> },
    { header: 'Fee Type',  cell: (r) => <p className="text-sm">{r.fee_type_id?.name}</p> },
    { header: 'Class',     cell: (r) => <p className="text-sm">{r.class_setup_id ? `${r.class_setup_id?.class_id?.name} ${r.class_setup_id?.section_id?.name}` : 'All Classes'}</p> },
    { header: 'Amount',    cell: (r) => <p className="text-sm font-semibold">{fCurrency(r.amount)}</p> },
    { header: 'Due Date',  cell: (r) => <p className="text-sm text-muted-foreground">{fDate(r.due_date)}</p> },
    { header: 'Status',    cell: (r) => <Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
    {
      header: 'Actions', className: 'text-right', cellClassName: 'text-right',
      cell: (r) => (
        <Button variant="outline" size="sm" onClick={() => {
          feeCollectAPI.bulkAssign({ fee_master_id: r._id })
            .then(() => { toast.success('Fee assigned to students'); qc.invalidateQueries(['fee-assigns']) })
            .catch((e) => toast.error(e.response?.data?.message || 'Failed'))
        }}>Bulk Assign</Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Fee Management"
        description="Manage fee types, masters, and collections"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Fees' }]}
        action={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Add Fee Type
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-5">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => { setTab(i); setPage(1) }}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              tab === i ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <Card><CardContent className="pt-5">
          <DataTable
            columns={feeTypeColumns}
            data={feeTypesData?.data || []}
            total={feeTypesData?.pagination?.total}
            page={feeTypesData?.pagination?.page}
            pages={feeTypesData?.pagination?.pages}
            limit={feeTypesData?.pagination?.limit}
            isLoading={loadingTypes}
            onPageChange={setPage}
            onSearch={(v) => { setSearch(v); setPage(1) }}
            searchPlaceholder="Search fee types..."
            emptyIcon={DollarSign}
            emptyTitle="No fee types"
            emptyDescription="Create fee types to get started"
          />
        </CardContent></Card>
      )}

      {tab === 1 && (
        <Card><CardContent className="pt-5">
          <DataTable
            columns={feeMasterColumns}
            data={feeMastersData?.data || []}
            total={feeMastersData?.pagination?.total}
            page={feeMastersData?.pagination?.page}
            pages={feeMastersData?.pagination?.pages}
            limit={feeMastersData?.pagination?.limit}
            isLoading={loadingMasters}
            onPageChange={setPage}
            emptyIcon={CreditCard}
            emptyTitle="No fee masters"
            emptyDescription="Create fee masters to assign fees to classes"
          />
        </CardContent></Card>
      )}

      {tab === 2 && (
        <Card><CardContent className="pt-5 flex flex-col items-center justify-center py-16 gap-3">
          <div className="p-3 rounded-xl bg-muted"><CreditCard className="h-8 w-8 text-muted-foreground" /></div>
          <p className="font-medium">Fee Collection</p>
          <p className="text-sm text-muted-foreground">Go to student profile to collect individual fees</p>
        </CardContent></Card>
      )}

      {tab === 3 && reportData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(reportData.summary || []).map((s) => (
            <Card key={s._id}>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground capitalize mb-1">{s._id || 'Unknown'}</p>
                <p className="text-xl font-bold">{fCurrency(s.total_amount)}</p>
                <p className="text-xs text-muted-foreground">{s.count} records</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
