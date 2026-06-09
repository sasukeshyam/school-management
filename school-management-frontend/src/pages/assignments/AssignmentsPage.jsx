import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, BookMarked, Eye, CheckCircle2 } from 'lucide-react'
import { assignmentsAPI, classSetupsAPI, subjectsAPI, sessionsAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Badge, Input, Label, Select, Textarea } from '@/components/ui/index.jsx'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { toast } from '@/hooks/useToast'
import { fDate, STATUS_COLORS } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/store/authStore'

const AssignmentForm = ({ initial, onSuccess, onCancel }) => {
  const { data: classSetups } = useQuery({ queryKey: ['class-setups-all'], queryFn: () => classSetupsAPI.getAll({ limit: 100 }).then(r => r.data.data) })
  const { data: subjects }    = useQuery({ queryKey: ['subjects-all'],     queryFn: () => subjectsAPI.getAll({ limit: 100 }).then(r => r.data.data)     })
  const { data: sessions }    = useQuery({ queryKey: ['sessions-all'],     queryFn: () => sessionsAPI.getAll({ limit: 100 }).then(r => r.data.data)     })

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title:          initial?.title                        || '',
      description:    initial?.description                  || '',
      class_setup_id: initial?.class_setup_id?._id         || '',
      subject_id:     initial?.subject_id?._id             || '',
      session_id:     initial?.session_id?._id             || '',
      due_date:       initial?.due_date?.split('T')[0]     || '',
      total_marks:    initial?.total_marks                  || 100,
    }
  })

  const mutation = useMutation({
    mutationFn: d => {
      const clean = { ...d }
      ;['class_setup_id','subject_id','session_id'].forEach(f => { if (!clean[f]) delete clean[f] })
      return initial ? assignmentsAPI.update(initial._id, clean) : assignmentsAPI.create(clean)
    },
    onSuccess: () => { toast.success(initial ? 'Assignment updated' : 'Assignment created & distributed to all class students'); onSuccess?.() },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title *</Label>
        <Input placeholder="e.g. Chapter 5 Exercise" {...register('title', { required: true })} />
        {errors.title && <p className="text-xs text-destructive">Title is required</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea placeholder="Assignment instructions..." {...register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Class *</Label>
          <Select {...register('class_setup_id', { required: true })}>
            <option value="">Select class</option>
            {(classSetups || []).map(c => <option key={c._id} value={c._id}>{c.class_id?.name} {c.section_id?.name}</option>)}
          </Select>
          {errors.class_setup_id && <p className="text-xs text-destructive">Class is required</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Subject *</Label>
          <Select {...register('subject_id', { required: true })}>
            <option value="">Select subject</option>
            {(subjects || []).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
          {errors.subject_id && <p className="text-xs text-destructive">Subject is required</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Session</Label>
          <Select {...register('session_id')}>
            <option value="">Select session</option>
            {(sessions || []).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Due Date *</Label>
          <Input type="date" {...register('due_date', { required: true })} />
          {errors.due_date && <p className="text-xs text-destructive">Due date is required</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Total Marks</Label>
          <Input type="number" placeholder="100" {...register('total_marks')} />
        </div>
      </div>
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-xs text-primary font-medium">📢 Auto-distribution</p>
        <p className="text-xs text-muted-foreground mt-0.5">When you create this assignment, it will automatically be distributed to all students in the selected class.</p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>{initial ? 'Update' : 'Create & Distribute'}</Button>
      </div>
    </form>
  )
}

const GradeModal = ({ submission, onClose, onSuccess }) => {
  const { register, handleSubmit } = useForm()
  const mutation = useMutation({
    mutationFn: d => assignmentsAPI.grade(submission.assignment_id, submission._id, d),
    onSuccess: () => { toast.success('Graded successfully'); onSuccess?.(); onClose() },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })
  return (
    <Modal open={!!submission} onClose={onClose} title="Grade Submission" size="sm">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Marks Obtained</Label>
          <Input type="number" placeholder="e.g. 85" {...register('marks_obtained', { required: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>Feedback</Label>
          <Textarea placeholder="Write feedback for the student..." {...register('feedback')} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>Submit Grade</Button>
        </div>
      </form>
    </Modal>
  )
}

export const AssignmentsPage = () => {
  const qc              = useQueryClient()
  const isTeacher       = useAuthStore(s => s.isTeacher())
  const isStudent       = useAuthStore(s => s.isStudent())
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [grading, setGrading]       = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['assignments', page, search],
    queryFn:  () => isStudent
      ? assignmentsAPI.myAssignments({ page, limit: 10 }).then(r => r.data)
      : assignmentsAPI.getAll({ page, limit: 10, search }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: id => assignmentsAPI.remove(id),
    onSuccess: () => { toast.success('Assignment deleted'); qc.invalidateQueries(['assignments']); setDeleting(null) },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })

  // Teacher/Admin columns
  const teacherColumns = [
    { header: 'Title',    cell: r => <p className="text-sm font-medium">{r.title}</p> },
    { header: 'Class',    cell: r => <p className="text-sm">{r.class_setup_id?.class_id?.name} {r.class_setup_id?.section_id?.name}</p> },
    { header: 'Subject',  cell: r => <Badge variant="outline">{r.subject_id?.name || '—'}</Badge> },
    { header: 'Due Date', cell: r => <p className="text-sm text-muted-foreground">{fDate(r.due_date)}</p> },
    { header: 'Marks',    cell: r => <p className="text-sm font-mono">{r.total_marks}</p> },
    { header: 'Created',  cell: r => <p className="text-xs text-muted-foreground">{fDate(r.created_at)}</p> },
    { header: 'Actions', className: 'text-right', cellClassName: 'text-right', cell: r => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(r); setShowForm(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ]

  // Student columns (shows their submission status)
  const studentColumns = [
    { header: 'Assignment', cell: r => <p className="text-sm font-medium">{r.assignment_id?.title || r.title}</p> },
    { header: 'Subject',    cell: r => <Badge variant="outline">{r.assignment_id?.subject_id?.name || '—'}</Badge> },
    { header: 'Due Date',   cell: r => <p className="text-sm text-muted-foreground">{fDate(r.assignment_id?.due_date || r.due_date)}</p> },
    { header: 'Total Marks',cell: r => <p className="text-sm font-mono">{r.assignment_id?.total_marks || r.total_marks}</p> },
    { header: 'Status',     cell: r => <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md capitalize', STATUS_COLORS[r.status] || '')}>{r.status}</span> },
    { header: 'Marks',      cell: r => <p className="text-sm font-semibold">{r.marks_obtained ?? '—'}</p> },
    { header: 'Feedback',   cell: r => <p className="text-xs text-muted-foreground truncate max-w-32">{r.feedback || '—'}</p> },
    { header: 'Actions', className: 'text-right', cellClassName: 'text-right', cell: r => (
      r.status === 'pending' || r.status === 'submitted'
        ? <Button size="sm" variant="outline" onClick={() => toast.info('Submit via student portal')}>Submit</Button>
        : <span className="text-xs text-muted-foreground">Graded</span>
    )},
  ]

  const rows = data?.data || []
  const pag  = data?.pagination || {}

  return (
    <div>
      <PageHeader
        title="Assignments"
        description={isStudent ? 'Your assignments and submissions' : 'Create and manage class assignments'}
        breadcrumbs={[{ label: 'Academic' }, { label: 'Assignments' }]}
        action={!isStudent && (
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" /> Create Assignment
          </Button>
        )}
      />

      <Card><CardContent className="pt-5">
        <DataTable
          columns={isStudent ? studentColumns : teacherColumns}
          data={rows}
          total={pag.total} page={pag.page} pages={pag.pages} limit={pag.limit}
          isLoading={isLoading} onPageChange={setPage}
          onSearch={!isStudent ? (v => { setSearch(v); setPage(1) }) : undefined}
          searchPlaceholder="Search assignments..."
          emptyIcon={BookMarked}
          emptyTitle="No assignments yet"
          emptyDescription={isStudent ? 'No assignments have been given to your class yet' : 'Create an assignment to distribute it to a class'}
        />
      </CardContent></Card>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Edit Assignment' : 'Create Assignment'} size="lg">
        <AssignmentForm
          initial={editing}
          onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries(['assignments']) }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      </Modal>

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting?._id)} loading={deleteMutation.isPending}
        title="Delete Assignment" description={`Delete "${deleting?.title}"? All student submissions will also be removed.`}
      />

      {grading && (
        <GradeModal submission={grading} onClose={() => setGrading(null)}
          onSuccess={() => qc.invalidateQueries(['assignments'])} />
      )}
    </div>
  )
}