import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Clock } from 'lucide-react'
import { classRoutinesAPI, classSetupsAPI, subjectsAPI, teachersAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Badge, Label, Select, Input } from '@/components/ui/index.jsx'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { toast } from '@/hooks/useToast'
import { useForm } from 'react-hook-form'
import { cn } from '@/utils/cn'

const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

const RoutineForm = ({ initial, classSetups, subjects, teachers, onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      class_setup_id: initial?.class_setup_id?._id || '',
      subject_id:     initial?.subject_id?._id     || '',
      teacher_id:     initial?.teacher_id?._id     || '',
      day_of_week:    initial?.day_of_week         || 'monday',
      start_time:     initial?.start_time          || '',
      end_time:       initial?.end_time            || '',
      room:           initial?.room               || '',
    }
  })
  const mutation = useMutation({
    mutationFn: d => {
      const clean = { ...d }
      ;['class_setup_id','subject_id','teacher_id'].forEach(f => { if (!clean[f]) delete clean[f] })
      return initial ? classRoutinesAPI.update(initial._id, clean) : classRoutinesAPI.create(clean)
    },
    onSuccess: () => { toast.success(initial ? 'Routine updated' : 'Routine created'); onSuccess?.() },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
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
          <Label>Teacher *</Label>
          <Select {...register('teacher_id', { required: true })}>
            <option value="">Select teacher</option>
            {(teachers || []).map(t => <option key={t._id} value={t._id}>{t.user_id?.name || t.employee_id}</option>)}
          </Select>
          {errors.teacher_id && <p className="text-xs text-destructive">Teacher is required</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Day *</Label>
          <Select {...register('day_of_week', { required: true })}>
            {DAYS.map(d => <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Start Time *</Label>
          <Input type="time" {...register('start_time', { required: true })} />
          {errors.start_time && <p className="text-xs text-destructive">Required</p>}
        </div>
        <div className="space-y-1.5">
          <Label>End Time *</Label>
          <Input type="time" {...register('end_time', { required: true })} />
          {errors.end_time && <p className="text-xs text-destructive">Required</p>}
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Room</Label>
          <Input placeholder="e.g. Room 101" {...register('room')} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>{initial ? 'Update' : 'Add Period'}</Button>
      </div>
    </form>
  )
}

const DAY_COLORS = {
  sunday:'bg-red-100 text-red-700',monday:'bg-blue-100 text-blue-700',tuesday:'bg-purple-100 text-purple-700',
  wednesday:'bg-emerald-100 text-emerald-700',thursday:'bg-amber-100 text-amber-700',
  friday:'bg-indigo-100 text-indigo-700',saturday:'bg-pink-100 text-pink-700',
}

export const ClassRoutinesPage = () => {
  const qc = useQueryClient()
  const [page, setPage]         = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [filterClass, setFilterClass] = useState('')
  const [filterDay,   setFilterDay]   = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['class-routines', page, filterClass, filterDay],
    queryFn:  () => classRoutinesAPI.getAll({ page, limit: 20, ...(filterClass && { class_setup_id: filterClass }), ...(filterDay && { day_of_week: filterDay }) }).then(r => r.data),
  })

  const { data: classSetups } = useQuery({ queryKey: ['class-setups-all'], queryFn: () => import('@/api').then(m => m.classSetupsAPI.getAll({ limit: 100 }).then(r => r.data.data)) })
  const { data: subjects }    = useQuery({ queryKey: ['subjects-all'],     queryFn: () => import('@/api').then(m => m.subjectsAPI.getAll({ limit: 100 }).then(r => r.data.data)) })
  const { data: teachers }    = useQuery({ queryKey: ['teachers-all'],     queryFn: () => import('@/api').then(m => m.teachersAPI.getAll({ limit: 100 }).then(r => r.data.data)) })

  const deleteMutation = useMutation({
    mutationFn: id => classRoutinesAPI.remove(id),
    onSuccess: () => { toast.success('Period deleted'); qc.invalidateQueries(['class-routines']); setDeleting(null) },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })

  const columns = [
    { header: 'Class',   cell: r => <p className="text-sm font-medium">{r.class_setup_id?.class_id?.name} {r.class_setup_id?.section_id?.name}</p> },
    { header: 'Subject', cell: r => <Badge variant="outline">{r.subject_id?.name || '—'}</Badge> },
    { header: 'Teacher', cell: r => <p className="text-sm">{r.teacher_id?.user_id?.name || '—'}</p> },
    { header: 'Day', cell: r => (
      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md capitalize', DAY_COLORS[r.day_of_week] || '')}>
        {r.day_of_week}
      </span>
    )},
    { header: 'Time', cell: r => <p className="text-sm font-mono">{r.start_time} – {r.end_time}</p> },
    { header: 'Room', cell: r => <p className="text-sm text-muted-foreground">{r.room || '—'}</p> },
    { header: 'Actions', className: 'text-right', cellClassName: 'text-right', cell: r => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(r); setShowForm(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Class Routines" description="Manage class timetable and periods"
        breadcrumbs={[{ label: 'Academic' }, { label: 'Routine' }]}
        action={<Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="h-4 w-4" /> Add Period</Button>}
      />

      <Card className="mb-4"><CardContent className="pt-4">
        <div className="flex gap-3 flex-wrap">
          <div className="space-y-1 flex-1 min-w-32">
            <Label className="text-xs">Filter by Class</Label>
            <Select value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1) }}>
              <option value="">All Classes</option>
              {(classSetups || []).map(c => <option key={c._id} value={c._id}>{c.class_id?.name} {c.section_id?.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1 flex-1 min-w-32">
            <Label className="text-xs">Filter by Day</Label>
            <Select value={filterDay} onChange={e => { setFilterDay(e.target.value); setPage(1) }}>
              <option value="">All Days</option>
              {DAYS.map(d => <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </Select>
          </div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="pt-5">
        <DataTable columns={columns} data={data?.data || []} total={data?.pagination?.total} page={data?.pagination?.page}
          pages={data?.pagination?.pages} limit={data?.pagination?.limit} isLoading={isLoading} onPageChange={setPage}
          emptyIcon={Clock} emptyTitle="No routine periods yet" emptyDescription="Add class periods to build the timetable"
        />
      </CardContent></Card>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Edit Period' : 'Add Period'} size="lg">
        <RoutineForm initial={editing} classSetups={classSetups} subjects={subjects} teachers={teachers}
          onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries(['class-routines']) }}
          onCancel={() => { setShowForm(false); setEditing(null) }} />
      </Modal>

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting?._id)}
        loading={deleteMutation.isPending} title="Delete Period" description="Remove this period from the timetable?" />
    </div>
  )
}