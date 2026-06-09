import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Award, CheckCircle2, FileText } from 'lucide-react'
import { admitCardsAPI, examsAPI, classSetupsAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Badge, Label, Select } from '@/components/ui/index.jsx'
import { toast } from '@/hooks/useToast'
import { fDate, STATUS_COLORS } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'

export const AdmitCardsPage = () => {
  const qc        = useQueryClient()
  const isAdmin   = useAuthStore(s => s.isAdmin())
  const [page, setPage]         = useState(1)
  const [filterExam, setFilterExam]   = useState('')
  const [filterClass, setFilterClass] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admit-cards', page, filterExam, filterClass],
    queryFn:  () => admitCardsAPI.getAll({ page, limit: 20, ...(filterExam && { exam_id: filterExam }), ...(filterClass && { class_setup_id: filterClass }) }).then(r => r.data),
  })

  const { data: exams }       = useQuery({ queryKey: ['exams-all'],       queryFn: () => examsAPI.getAll({ limit: 100 }).then(r => r.data.data) })
  const { data: classSetups } = useQuery({ queryKey: ['class-setups-all'],queryFn: () => classSetupsAPI.getAll({ limit: 100 }).then(r => r.data.data) })

  const generateMutation = useMutation({
    mutationFn: examId => examsAPI.generateAdmitCards(examId),
    onSuccess: r => { toast.success(`${r.data.data.generated} admit cards generated`); qc.invalidateQueries(['admit-cards']) },
    onError:   e => toast.error(e.response?.data?.message || 'Failed'),
  })

  const approveMutation = useMutation({
    mutationFn: ({ examId, cardId }) => examsAPI.approveAdmitCard(examId, cardId),
    onSuccess: () => { toast.success('Admit card approved'); qc.invalidateQueries(['admit-cards']) },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })

  const columns = [
    { header: 'Student',     cell: r => <div><p className="text-sm font-medium">{r.student_id?.user_id?.name || '—'}</p><p className="text-xs text-muted-foreground font-mono">{r.student_id?.admission_no || '—'}</p></div> },
    { header: 'Exam',        cell: r => <p className="text-sm">{r.exam_id?.title || '—'}</p> },
    { header: 'Seat No',     cell: r => <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{r.seat_number || '—'}</code> },
    { header: 'Issued',      cell: r => <p className="text-sm text-muted-foreground">{fDate(r.issued_at)}</p> },
    { header: 'Status',      cell: r => <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md capitalize', STATUS_COLORS[r.status] || '')}>{r.status}</span> },
    { header: 'Actions', className: 'text-right', cellClassName: 'text-right', cell: r => (
      isAdmin && r.status === 'draft'
        ? <Button size="sm" variant="outline" onClick={() => approveMutation.mutate({ examId: r.exam_id?._id, cardId: r._id })} loading={approveMutation.isPending}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
          </Button>
        : <span className="text-xs text-muted-foreground capitalize">{r.status}</span>
    )},
  ]

  return (
    <div>
      <PageHeader title="Admit Cards" description="Generate and manage exam admit cards"
        breadcrumbs={[{ label: 'Examination' }, { label: 'Admit Cards' }]}
        action={isAdmin && filterExam && (
          <Button size="sm" onClick={() => generateMutation.mutate(filterExam)} loading={generateMutation.isPending}>
            <FileText className="h-4 w-4" /> Generate for Exam
          </Button>
        )}
      />

      <Card className="mb-4"><CardContent className="pt-4">
        <div className="flex gap-3 flex-wrap">
          <div className="space-y-1 flex-1 min-w-40">
            <Label className="text-xs">Filter by Exam</Label>
            <Select value={filterExam} onChange={e => { setFilterExam(e.target.value); setPage(1) }}>
              <option value="">All Exams</option>
              {(exams || []).map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
            </Select>
          </div>
          <div className="space-y-1 flex-1 min-w-40">
            <Label className="text-xs">Filter by Class</Label>
            <Select value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1) }}>
              <option value="">All Classes</option>
              {(classSetups || []).map(c => <option key={c._id} value={c._id}>{c.class_id?.name} {c.section_id?.name}</option>)}
            </Select>
          </div>
        </div>
      </CardContent></Card>

      {!filterExam && isAdmin && (
        <div className="mb-4 p-4 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">💡 How to generate admit cards</p>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Select an exam from the filter above, then click <strong>Generate for Exam</strong>. Admit cards will be auto-generated for all students in that exam's class.</p>
        </div>
      )}

      <Card><CardContent className="pt-5">
        <DataTable columns={columns} data={data?.data || []} total={data?.pagination?.total} page={data?.pagination?.page}
          pages={data?.pagination?.pages} limit={data?.pagination?.limit} isLoading={isLoading} onPageChange={setPage}
          emptyIcon={Award} emptyTitle="No admit cards yet" emptyDescription="Select an exam and click Generate to create admit cards"
        />
      </CardContent></Card>
    </div>
  )
}