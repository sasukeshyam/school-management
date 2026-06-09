import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Pencil, Trash2, UserCheck } from 'lucide-react'
import { teachersAPI, staffAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Avatar, Badge } from '@/components/ui/index.jsx'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input, Label, Select } from '@/components/ui/index.jsx'
import { toast } from '@/hooks/useToast'
import { fDate } from '@/utils/format'
import { useForm } from 'react-hook-form'
import { useMutation as useApiMutation } from '@tanstack/react-query'
import api from '@/api/axios'

const TeacherForm = ({ initial, onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: initial?.user_id?.name || '',
      email: initial?.user_id?.email || '',
      phone: initial?.user_id?.phone || '',
      employee_id: initial?.employee_id || '',
      department: initial?.department || '',
      designation: initial?.designation || '',
      qualification: initial?.qualification || '',
      join_date: initial?.join_date?.split('T')[0] || '',
    }
  })
  const mutation = useMutation({
    mutationFn: async (data) => {
      if (initial) return teachersAPI.update(initial._id, data)
      // Create user first, then teacher profile
      // Get school_id from auth store
      const { useAuthStore } = await import('@/store/authStore')
      const schoolId = useAuthStore.getState().schoolId

      const userRes = await api.post('/users', {
        name:          data.name,
        email:         data.email,
        phone:         data.phone,
        password_hash: 'Teacher@123456',
        school_id:     schoolId,
      })
      const userId = userRes.data.data._id
      // Assign teacher role
      const roleRes = await api.get('/roles?limit=100')
      const teacherRole = roleRes.data.data.find(r => r.slug === 'teacher')
      if (teacherRole) await api.post('/roles/assign', { user_id: userId, role_id: teacherRole._id })
      return teachersAPI.create({ ...data, user_id: userId })
    },
    onSuccess: () => { toast.success(initial ? 'Teacher updated' : 'Teacher created. Default password: Teacher@123456'); onSuccess?.() },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: 'name',          label: 'Full Name *',    required: true,  placeholder: 'John Smith' },
          { name: 'email',         label: 'Email *',        required: true,  placeholder: 'teacher@school.com', type: 'email' },
          { name: 'phone',         label: 'Phone',          placeholder: '+91 XXXXX XXXXX' },
          { name: 'employee_id',   label: 'Employee ID',    placeholder: 'EMP001' },
          { name: 'department',    label: 'Department',     placeholder: 'Science' },
          { name: 'designation',   label: 'Designation',    placeholder: 'Senior Teacher' },
          { name: 'qualification', label: 'Qualification',  placeholder: 'B.Ed, M.Sc' },
          { name: 'join_date',     label: 'Join Date',      type: 'date' },
        ].map(f => (
          <div key={f.name} className="space-y-1.5">
            <Label>{f.label}</Label>
            <Input type={f.type || 'text'} placeholder={f.placeholder} {...register(f.name, { required: f.required })} />
            {errors[f.name] && <p className="text-xs text-destructive">{f.label} is required</p>}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>{initial ? 'Update' : 'Create Teacher'}</Button>
      </div>
    </form>
  )
}

export const TeachersPage = () => {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', page, search],
    queryFn: () => teachersAPI.getAll({ page, limit: 10, search }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: id => teachersAPI.remove(id),
    onSuccess: () => { toast.success('Teacher deleted'); qc.invalidateQueries(['teachers']); setDeleting(null) },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  })

  const columns = [
    { header: 'Teacher', cell: r => (
      <div className="flex items-center gap-2.5">
        <Avatar name={r.user_id?.name || ''} size="sm" src={r.user_id?.avatar} />
        <div>
          <p className="text-sm font-medium">{r.user_id?.name}</p>
          <p className="text-xs text-muted-foreground">{r.user_id?.email}</p>
        </div>
      </div>
    )},
    { header: 'Employee ID', cell: r => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.employee_id || '—'}</code> },
    { header: 'Department',  cell: r => <p className="text-sm">{r.department || '—'}</p> },
    { header: 'Designation', cell: r => <p className="text-sm">{r.designation || '—'}</p> },
    { header: 'Join Date',   cell: r => <p className="text-sm text-muted-foreground">{fDate(r.join_date)}</p> },
    { header: 'Status',      cell: r => <Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Actions', className: 'text-right', cellClassName: 'text-right', cell: r => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(r); setShowForm(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Teachers" description="Manage teaching staff" breadcrumbs={[{ label: 'People' }, { label: 'Teachers' }]}
        action={<Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="h-4 w-4" /> Add Teacher</Button>}
      />
      <Card><CardContent className="pt-5">
        <DataTable columns={columns} data={data?.data || []} total={data?.pagination?.total} page={data?.pagination?.page}
          pages={data?.pagination?.pages} limit={data?.pagination?.limit} isLoading={isLoading} onPageChange={setPage}
          onSearch={v => { setSearch(v); setPage(1) }} searchPlaceholder="Search teachers..."
          emptyIcon={UserCheck} emptyTitle="No teachers yet" emptyDescription="Add your first teacher"
        />
      </CardContent></Card>
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Edit Teacher' : 'Add Teacher'} size="lg">
        <TeacherForm initial={editing} onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries(['teachers']) }} onCancel={() => { setShowForm(false); setEditing(null) }} />
      </Modal>
      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting?._id)}
        loading={deleteMutation.isPending} title="Delete Teacher" description={`Delete ${deleting?.user_id?.name}?`} />
    </div>
  )
}