import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Layers } from 'lucide-react'
import { classesAPI, sectionsAPI, shiftsAPI, classSetupsAPI, sessionsAPI, teachersAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Badge, Input, Label, Select } from '@/components/ui/index.jsx'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { toast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import { useForm } from 'react-hook-form'

const TABS = ['Classes', 'Sections', 'Shifts', 'Class Setup']

const SimpleForm = ({ fields, initial, onSubmit, onCancel, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initial || {} })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.name} className={cn('space-y-1.5', f.full && 'col-span-2')}>
            <Label>{f.label}{f.required && ' *'}</Label>
            {f.type === 'select' ? (
              <Select {...register(f.name, { required: f.required })}>
                <option value="">Select {f.label}</option>
                {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            ) : (
              <Input type={f.type || 'text'} placeholder={f.placeholder} {...register(f.name, { required: f.required })} />
            )}
            {errors[f.name] && <p className="text-xs text-destructive">{f.label} is required</p>}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Save</Button>
      </div>
    </form>
  )
}

export const ClassesPage = () => {
  const qc = useQueryClient()
  const [tab, setTab]           = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [page, setPage]         = useState(1)

  const { data: classesData,  isLoading: l0 } = useQuery({ queryKey: ['classes', page],      queryFn: () => classesAPI.getAll({ page, limit: 20 }).then(r => r.data),      enabled: tab === 0 })
  const { data: sectionsData, isLoading: l1 } = useQuery({ queryKey: ['sections', page],     queryFn: () => sectionsAPI.getAll({ page, limit: 20 }).then(r => r.data),     enabled: tab === 1 })
  const { data: shiftsData,   isLoading: l2 } = useQuery({ queryKey: ['shifts', page],       queryFn: () => shiftsAPI.getAll({ page, limit: 20 }).then(r => r.data),       enabled: tab === 2 })
  const { data: setupsData,   isLoading: l3 } = useQuery({ queryKey: ['class-setups', page], queryFn: () => classSetupsAPI.getAll({ page, limit: 20 }).then(r => r.data),  enabled: tab === 3 })

  const { data: allClasses }  = useQuery({ queryKey: ['classes-all'],  queryFn: () => classesAPI.getAll({ limit: 100 }).then(r => r.data.data)  })
  const { data: allSections } = useQuery({ queryKey: ['sections-all'], queryFn: () => sectionsAPI.getAll({ limit: 100 }).then(r => r.data.data) })
  const { data: allShifts }   = useQuery({ queryKey: ['shifts-all'],   queryFn: () => shiftsAPI.getAll({ limit: 100 }).then(r => r.data.data)   })
  const { data: allSessions } = useQuery({ queryKey: ['sessions-all'], queryFn: () => sessionsAPI.getAll({ limit: 100 }).then(r => r.data.data) })
  const { data: allTeachers } = useQuery({ queryKey: ['teachers-all'], queryFn: () => teachersAPI.getAll({ limit: 100 }).then(r => r.data.data) })

  const apis = [classesAPI, sectionsAPI, shiftsAPI, classSetupsAPI]
  const keys = ['classes', 'sections', 'shifts', 'class-setups']

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? apis[tab].update(editing._id, data) : apis[tab].create(data),
    onSuccess: () => {
      toast.success(editing ? 'Updated successfully' : 'Created successfully')
      qc.invalidateQueries([keys[tab]])
      qc.invalidateQueries([keys[tab] + '-all'])
      qc.invalidateQueries(['class-setups-all'])
      setShowForm(false); setEditing(null)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => apis[tab].remove(id),
    onSuccess: () => {
      toast.success('Deleted')
      qc.invalidateQueries([keys[tab]])
      qc.invalidateQueries([keys[tab] + '-all'])
      setDeleting(null)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete'),
  })

  const actionCol = {
    header: 'Actions', className: 'text-right', cellClassName: 'text-right',
    cell: (row) => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(row); setShowForm(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(row)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    ),
  }

  const tabs = [
    {
      data: classesData, loading: l0,
      columns: [
        { header: 'Name',          cell: r => <p className="text-sm font-medium">{r.name}</p> },
        { header: 'Numeric Value', cell: r => <p className="text-sm font-mono">{r.numeric_value || '—'}</p> },
        { header: 'Status',        cell: r => <Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
        actionCol,
      ],
      formFields: [
        { name: 'name',          label: 'Class Name',    required: true, placeholder: 'e.g. Class 6', full: true },
        { name: 'numeric_value', label: 'Numeric Value', type: 'number', placeholder: 'e.g. 6' },
      ],
      emptyTitle: 'No classes yet', emptyDesc: 'Create classes like Class 6, Class 7, Class 8',
    },
    {
      data: sectionsData, loading: l1,
      columns: [
        { header: 'Name',   cell: r => <p className="text-sm font-medium">{r.name}</p> },
        { header: 'Status', cell: r => <Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
        actionCol,
      ],
      formFields: [
        { name: 'name', label: 'Section Name', required: true, placeholder: 'e.g. A', full: true },
      ],
      emptyTitle: 'No sections yet', emptyDesc: 'Create sections like A, B, C',
    },
    {
      data: shiftsData, loading: l2,
      columns: [
        { header: 'Name',       cell: r => <p className="text-sm font-medium">{r.name}</p> },
        { header: 'Start Time', cell: r => <p className="text-sm font-mono">{r.start_time}</p> },
        { header: 'End Time',   cell: r => <p className="text-sm font-mono">{r.end_time}</p> },
        { header: 'Status',     cell: r => <Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
        actionCol,
      ],
      formFields: [
        { name: 'name',       label: 'Shift Name', required: true, placeholder: 'e.g. Morning' },
        { name: 'start_time', label: 'Start Time', required: true, placeholder: '08:00' },
        { name: 'end_time',   label: 'End Time',   required: true, placeholder: '14:00' },
      ],
      emptyTitle: 'No shifts yet', emptyDesc: 'Create shifts like Morning, Evening',
    },
    {
      data: setupsData, loading: l3,
      columns: [
        { header: 'Class',    cell: r => <p className="text-sm font-medium">{r.class_id?.name}</p> },
        { header: 'Section',  cell: r => <p className="text-sm">{r.section_id?.name}</p> },
        { header: 'Shift',    cell: r => <p className="text-sm">{r.shift_id?.name || '—'}</p> },
        { header: 'Session',  cell: r => <p className="text-sm">{r.session_id?.name || '—'}</p> },
        { header: 'Room',     cell: r => <p className="text-sm text-muted-foreground">{r.room || '—'}</p> },
        { header: 'Capacity', cell: r => <p className="text-sm font-mono">{r.capacity}</p> },
        { header: 'Status',   cell: r => <Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
        actionCol,
      ],
      formFields: [
        { name: 'class_id',   label: 'Class',   required: true, type: 'select', options: (allClasses  || []).map(c => ({ value: c._id, label: c.name })) },
        { name: 'section_id', label: 'Section', required: true, type: 'select', options: (allSections || []).map(s => ({ value: s._id, label: s.name })) },
        { name: 'shift_id',   label: 'Shift',                   type: 'select', options: (allShifts   || []).map(s => ({ value: s._id, label: s.name })) },
        { name: 'session_id', label: 'Session', required: true, type: 'select', options: (allSessions || []).map(s => ({ value: s._id, label: s.name })) },
        { name: 'class_teacher_id', label: 'Class Teacher', type: 'select', options: (allTeachers || []).map(t => ({ value: t._id, label: t.user_id?.name || t.employee_id || 'Teacher' })) },
        { name: 'room',     label: 'Room',     placeholder: 'e.g. Room 101' },
        { name: 'capacity', label: 'Capacity', type: 'number', placeholder: '40' },
      ],
      emptyTitle: 'No class setups yet', emptyDesc: 'Combine Class + Section + Shift + Session to create a class setup',
    },
  ]

  const current = tabs[tab]
  const rows    = current.data?.data       || []
  const pag     = current.data?.pagination || {}

  const editInitial = useMemo(() => {
    if (!editing) return {}
    if (tab === 3) return {
      class_id:         editing.class_id?._id         || '',
      section_id:       editing.section_id?._id       || '',
      shift_id:         editing.shift_id?._id         || '',
      session_id:       editing.session_id?._id       || '',
      class_teacher_id: editing.class_teacher_id?._id || '',
      room:             editing.room                  || '',
      capacity:         editing.capacity              || 40,
    }
    return editing
  }, [editing, tab])

  return (
    <div>
      <PageHeader
        title="Academic Setup"
        description="Manage classes, sections, shifts and class configurations"
        breadcrumbs={[{ label: 'Academic' }, { label: TABS[tab] }]}
        action={
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" /> Add {TABS[tab]}
          </Button>
        }
      />

      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-5">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => { setTab(i); setPage(1) }}
            className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              tab === i ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}>{t}</button>
        ))}
      </div>

      {tab === 3 && rows.length === 0 && !current.loading && (
        <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">📋 Setup order required</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            First create: <strong>Classes tab</strong> → then <strong>Sections tab</strong> → then <strong>Shifts tab</strong> → then come back here to <strong>Class Setup</strong> and combine them.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="pt-5">
          <DataTable
            columns={current.columns} data={rows}
            total={pag.total} page={pag.page} pages={pag.pages} limit={pag.limit}
            isLoading={current.loading} onPageChange={setPage}
            emptyIcon={Layers} emptyTitle={current.emptyTitle} emptyDescription={current.emptyDesc}
          />
        </CardContent>
      </Card>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? `Edit ${TABS[tab]}` : `Add ${TABS[tab]}`} size="md">
        <SimpleForm
          fields={current.formFields}
          initial={editInitial}
          onSubmit={(data) => {
            const clean = { ...data }
            ;['class_id','section_id','shift_id','session_id','class_teacher_id'].forEach(f => { if (!clean[f]) delete clean[f] })
            saveMutation.mutate(clean)
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
          loading={saveMutation.isPending}
        />
      </Modal>

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting?._id)} loading={deleteMutation.isPending}
        title={`Delete ${TABS[tab]}`} description={`Are you sure you want to delete this?`}
      />
    </div>
  )
}
