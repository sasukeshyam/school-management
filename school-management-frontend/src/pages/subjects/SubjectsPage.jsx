import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { subjectsAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Badge, Input, Label, Select } from '@/components/ui/index.jsx'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { toast } from '@/hooks/useToast'
import { useForm } from 'react-hook-form'

const SubjectForm = ({ initial, onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name:      initial?.name      || '',
      code:      initial?.code      || '',
      type:      initial?.type      || 'theory',
      is_active: initial?.is_active ?? true,
    }
  })
  const mutation = useMutation({
    mutationFn: d => initial ? subjectsAPI.update(initial._id, d) : subjectsAPI.create(d),
    onSuccess: () => { toast.success(initial ? 'Subject updated' : 'Subject created'); onSuccess?.() },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Subject Name *</Label>
          <Input placeholder="e.g. Mathematics" {...register('name', { required: true })} />
          {errors.name && <p className="text-xs text-destructive">Name is required</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Subject Code *</Label>
          <Input placeholder="e.g. MATH101" {...register('code', { required: true })} />
          {errors.code && <p className="text-xs text-destructive">Code is required</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select {...register('type')}>
            <option value="theory">Theory</option>
            <option value="practical">Practical</option>
            <option value="both">Both</option>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>{initial ? 'Update Subject' : 'Create Subject'}</Button>
      </div>
    </form>
  )
}

export const SubjectsPage = () => {
  const qc = useQueryClient()
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['subjects', page, search],
    queryFn:  () => subjectsAPI.getAll({ page, limit: 10, search }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: id => subjectsAPI.remove(id),
    onSuccess: () => { toast.success('Subject deleted'); qc.invalidateQueries(['subjects']); setDeleting(null) },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })

  const columns = [
    { header: 'Name', cell: r => <p className="text-sm font-medium">{r.name}</p> },
    { header: 'Code', cell: r => <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{r.code}</code> },
    { header: 'Type', cell: r => (
      <Badge variant={r.type === 'theory' ? 'default' : r.type === 'practical' ? 'warning' : 'secondary'} className="capitalize">{r.type}</Badge>
    )},
    { header: 'Status', cell: r => <Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Actions', className: 'text-right', cellClassName: 'text-right', cell: r => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(r); setShowForm(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Subjects" description="Manage school subjects" breadcrumbs={[{ label: 'Academic' }, { label: 'Subjects' }]}
        action={<Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="h-4 w-4" /> Add Subject</Button>}
      />
      <Card><CardContent className="pt-5">
        <DataTable columns={columns} data={data?.data || []} total={data?.pagination?.total} page={data?.pagination?.page}
          pages={data?.pagination?.pages} limit={data?.pagination?.limit} isLoading={isLoading} onPageChange={setPage}
          onSearch={v => { setSearch(v); setPage(1) }} searchPlaceholder="Search subjects..."
          emptyIcon={BookOpen} emptyTitle="No subjects yet" emptyDescription="Add subjects like Mathematics, Science, English"
        />
      </CardContent></Card>
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Edit Subject' : 'Add Subject'} size="md">
        <SubjectForm initial={editing} onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries(['subjects']) }} onCancel={() => { setShowForm(false); setEditing(null) }} />
      </Modal>
      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting?._id)}
        loading={deleteMutation.isPending} title="Delete Subject" description={`Delete ${deleting?.name}?`} />
    </div>
  )
}