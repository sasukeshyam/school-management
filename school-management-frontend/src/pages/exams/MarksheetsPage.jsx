import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart3, CheckCircle2, Globe } from 'lucide-react'
import { marksheetsAPI, examsAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Label, Select } from '@/components/ui/index.jsx'
import { toast } from '@/hooks/useToast'
import { fDate, fPercent, STATUS_COLORS } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'

export const MarksheetsPage = () => {
  const qc      = useQueryClient()
  const isAdmin = useAuthStore(s => s.isAdmin())
  const [page, setPage]       = useState(1)
  const [filterExam, setFilterExam] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['marksheets', page, filterExam],
    queryFn:  () => marksheetsAPI.getAll({ page, limit: 20, ...(filterExam && { exam_id: filterExam }) }).then(r => r.data),
  })

  const { data: exams } = useQuery({ queryKey: ['exams-all'], queryFn: () => examsAPI.getAll({ limit: 100 }).then(r => r.data.data) })

  const generateMutation = useMutation({
    mutationFn: id => examsAPI.generateMarksheets(id),
    onSuccess:  r  => { toast.success(`${r.data.data.generated} marksheets generated`); qc.invalidateQueries(['marksheets']) },
    onError:    e  => toast.error(e.response?.data?.message || 'Failed'),
  })
  const approveMutation = useMutation({
    mutationFn: id => examsAPI.approveMarksheet(id),
    onSuccess:  () => { toast.success('Sent for approval'); qc.invalidateQueries(['marksheets']) },
    onError:    e  => toast.error(e.response?.data?.message || 'Failed'),
  })
  const publishMutation = useMutation({
    mutationFn: id => examsAPI.publishMarksheets(id),
    onSuccess:  () => { toast.success('Marksheets published!'); qc.invalidateQueries(['marksheets']) },
    onError:    e  => toast.error(e.response?.data?.message || 'Failed'),
  })

  const columns = [
    { header: 'Student',    cell: r => <div><p className="text-sm font-medium">{r.student_id?.user_id?.name || '—'}</p><p className="text-xs text-muted-foreground font-mono">{r.student_id?.roll_number || '—'}</p></div> },
    { header: 'Exam',       cell: r => <p className="text-sm">{r.exam_id?.title || '—'}</p> },
    { header: 'Obtained',   cell: r => <p className="text-sm font-mono font-semibold">{r.total_obtained} / {r.total_marks}</p> },
    { header: 'Percentage', cell: r => <p className="text-sm font-semibold text-primary">{fPercent(r.percentage)}</p> },
    { header: 'Grade',      cell: r => <span className="text-sm font-bold">{r.final_grade || '—'}</span> },
    { header: 'Rank',       cell: r => r.rank ? <span className="text-sm font-mono">#{r.rank}</span> : <span className="text-muted-foreground text-sm">—</span> },
    { header: 'Result',     cell: r => <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-md', r.is_pass ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>{r.is_pass ? 'PASS' : 'FAIL'}</span> },
    { header: 'Status',     cell: r => <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md capitalize', STATUS_COLORS[r.status] || '')}>{r.status?.replace('_',' ')}</span> },
  ]

  const selectedExam = (exams || []).find(e => e._id === filterExam)
  const hasDraft     = (data?.data || []).some(m => m.status === 'draft')
  const hasPending   = (data?.data || []).some(m => m.status === 'pending_approval')

  return (
    <div>
      <PageHeader title="Marksheets" description="Generate, approve and publish student marksheets"
        breadcrumbs={[{ label: 'Examination' }, { label: 'Marksheets' }]}
        action={isAdmin && filterExam && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => generateMutation.mutate(filterExam)} loading={generateMutation.isPending}>
              <BarChart3 className="h-4 w-4" /> Generate
            </Button>
            {hasDraft && (
              <Button size="sm" variant="outline" onClick={() => approveMutation.mutate(filterExam)} loading={approveMutation.isPending}>
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
            )}
            {hasPending && (
              <Button size="sm" onClick={() => publishMutation.mutate(filterExam)} loading={publishMutation.isPending}>
                <Globe className="h-4 w-4" /> Publish
              </Button>
            )}
          </div>
        )}
      />

      <Card className="mb-4"><CardContent className="pt-4">
        <div className="flex gap-3">
          <div className="space-y-1 flex-1 max-w-xs">
            <Label className="text-xs">Select Exam</Label>
            <Select value={filterExam} onChange={e => { setFilterExam(e.target.value); setPage(1) }}>
              <option value="">All Exams</option>
              {(exams || []).map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
            </Select>
          </div>
        </div>
      </CardContent></Card>

      {!filterExam && isAdmin && (
        <div className="mb-4 p-4 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">💡 Marksheet workflow</p>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
            1. Select an exam → 2. Click <strong>Generate</strong> (auto-calculates marks & grades) → 3. <strong>Approve</strong> → 4. <strong>Publish</strong> (students can now see results)
          </p>
        </div>
      )}

      <Card><CardContent className="pt-5">
        <DataTable columns={columns} data={data?.data || []} total={data?.pagination?.total} page={data?.pagination?.page}
          pages={data?.pagination?.pages} limit={data?.pagination?.limit} isLoading={isLoading} onPageChange={setPage}
          emptyIcon={BarChart3} emptyTitle="No marksheets yet" emptyDescription="Select an exam and click Generate to create marksheets"
        />
      </CardContent></Card>
    </div>
  )
}