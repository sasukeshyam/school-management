import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, FileText, Eye, Zap } from 'lucide-react'
import { examsAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Badge } from '@/components/ui/index.jsx'
import { fDate, STATUS_COLORS } from '@/utils/format'
import { cn } from '@/utils/cn'
import { toast } from '@/hooks/useToast'
import { Link } from 'react-router-dom'

export const ExamsPage = () => {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['exams', page],
    queryFn:  () => examsAPI.getAll({ page, limit: 10 }).then((r) => r.data),
  })
  const genAdmit = useMutation({ mutationFn: (id) => examsAPI.generateAdmitCards(id), onSuccess: (r) => toast.success(r.data.data.generated + ' admit cards generated'), onError: (e) => toast.error(e.response?.data?.message || 'Failed') })
  const genSheet = useMutation({ mutationFn: (id) => examsAPI.generateMarksheets(id),  onSuccess: (r) => toast.success(r.data.data.generated + ' marksheets generated'),  onError: (e) => toast.error(e.response?.data?.message || 'Failed') })

  const columns = [
    { header: 'Title',      cell: (r) => <p className="text-sm font-medium">{r.title}</p> },
    { header: 'Type',       cell: (r) => <Badge variant="outline">{r.exam_type_id?.name || 'N/A'}</Badge> },
    { header: 'Class',      cell: (r) => <p className="text-sm">{r.class_setup_id?.class_id?.name} {r.class_setup_id?.section_id?.name}</p> },
    { header: 'Marks',      cell: (r) => <p className="text-sm font-mono">{r.total_marks} / {r.passing_marks}</p> },
    { header: 'Status',     cell: (r) => <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md capitalize', STATUS_COLORS[r.status])}>{r.status}</span> },
    { header: 'Date',       cell: (r) => <span className="text-xs text-muted-foreground">{fDate(r.created_at)}</span> },
    {
      header: 'Actions', className: 'text-right', cellClassName: 'text-right',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Link to={"/exams/" + r._id}><Button variant="ghost" size="icon-sm"><Eye className="h-3.5 w-3.5" /></Button></Link>
          <Button variant="ghost" size="icon-sm" title="Generate Admit Cards" onClick={() => genAdmit.mutate(r._id)}><FileText className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon-sm" title="Generate Marksheets"  onClick={() => genSheet.mutate(r._id)}><Zap className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Examinations" description="Manage exams, admit cards and results" breadcrumbs={[{ label: 'Examination' }]}
        action={<Button size="sm" onClick={() => toast.info('Add exam coming soon')}><Plus className="h-4 w-4" /> Add Exam</Button>}
      />
      <Card><CardContent className="pt-5">
        <DataTable columns={columns} data={data?.data || []} total={data?.pagination?.total} page={data?.pagination?.page}
          pages={data?.pagination?.pages} limit={data?.pagination?.limit} isLoading={isLoading} onPageChange={setPage}
          emptyIcon={FileText} emptyTitle="No exams yet" emptyDescription="Create your first exam"
        />
      </CardContent></Card>
    </div>
  )
}
