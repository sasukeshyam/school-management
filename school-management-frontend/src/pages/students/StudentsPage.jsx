import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Upload, Eye, Pencil, Trash2, GraduationCap } from 'lucide-react'
import { studentsAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Avatar, Badge, Card, CardContent } from '@/components/ui/index.jsx'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { fDate, STATUS_COLORS } from '@/utils/format'
import { cn } from '@/utils/cn'
import { toast } from '@/hooks/useToast'
import { StudentForm } from './StudentForm'
import { Link } from 'react-router-dom'

export const StudentsPage = () => {
  const qc = useQueryClient()
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState(null)
  const [deleting, setDeleting]   = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search],
    queryFn:  () => studentsAPI.getAll({ page, limit: 10, search }).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => studentsAPI.remove(id),
    onSuccess: () => {
      toast.success('Student deleted')
      qc.invalidateQueries(['students'])
      setDeleting(null)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete'),
  })

  const students   = data?.data        || []
  const pagination = data?.pagination  || {}

  const columns = [
    {
      header: 'Student',
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.user_id?.name || ''} size="sm" src={row.user_id?.avatar} />
          <div>
            <p className="text-sm font-medium">{row.user_id?.name}</p>
            <p className="text-xs text-muted-foreground">{row.user_id?.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Roll / Adm No',
      cell: (row) => (
        <div>
          <p className="text-sm font-mono">{row.roll_number || '—'}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.admission_no || '—'}</p>
        </div>
      ),
    },
    {
      header: 'Class',
      cell: (row) => (
        <span className="text-sm">
          {row.class_setup_id?.class_id?.name} {row.class_setup_id?.section_id?.name || ''}
        </span>
      ),
    },
    {
      header: 'Gender',
      cell: (row) => <span className="text-sm capitalize">{row.gender || '—'}</span>,
    },
    {
      header: 'Enrolled',
      cell: (row) => <span className="text-sm text-muted-foreground">{fDate(row.enrollment_date)}</span>,
    },
    {
      header: 'Status',
      cell: (row) => (
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md capitalize', STATUS_COLORS[row.status])}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/students/${row._id}`}>
            <Button variant="ghost" size="icon-sm"><Eye className="h-3.5 w-3.5" /></Button>
          </Link>
          <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(row); setShowForm(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(row)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage student enrollments and profiles"
        breadcrumbs={[{ label: 'People' }, { label: 'Students' }]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.info('Upload CSV feature coming soon')}>
              <Upload className="h-4 w-4" /> Bulk Import
            </Button>
            <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
              <Plus className="h-4 w-4" /> Add Student
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-5">
          <DataTable
            columns={columns}
            data={students}
            total={pagination.total}
            page={pagination.page}
            pages={pagination.pages}
            limit={pagination.limit}
            isLoading={isLoading}
            onPageChange={setPage}
            onSearch={(v) => { setSearch(v); setPage(1) }}
            searchPlaceholder="Search by name, roll no, admission no..."
            emptyIcon={GraduationCap}
            emptyTitle="No students found"
            emptyDescription="Add your first student to get started"
          />
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Edit Student' : 'Add New Student'}
        size="lg"
      >
        <StudentForm
          initial={editing}
          onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries(['students']) }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting?._id)}
        loading={deleteMutation.isPending}
        title="Delete Student"
        description={`Are you sure you want to delete ${deleting?.user_id?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
