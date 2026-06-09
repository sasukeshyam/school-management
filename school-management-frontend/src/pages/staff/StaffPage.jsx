import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, UserSquare } from 'lucide-react'
import { staffAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Avatar, Badge } from '@/components/ui/index.jsx'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input, Label } from '@/components/ui/index.jsx'
import { toast } from '@/hooks/useToast'
import { fDate, fCurrency } from '@/utils/format'
import { useForm } from 'react-hook-form'
import api from '@/api/axios'

const StaffForm = ({ initial, onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name:        initial?.user_id?.name  || '',
      email:       initial?.user_id?.email || '',
      phone:       initial?.user_id?.phone || '',
      employee_id: initial?.employee_id   || '',
      designation: initial?.designation   || '',
      department:  initial?.department    || '',
      salary:      initial?.salary        || '',
      join_date:   initial?.join_date?.split('T')[0] || '',
    }
  })

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (initial) return staffAPI.update(initial._id, data)
      const userRes = await api.post('/users', {
        name: data.name, email: data.email, phone: data.phone,
        password_hash: 'Staff@123456',
      })
      const userId = userRes.data.data._id
      const roleRes = await api.get('/roles?limit=100')
      const staffRole = roleRes.data.data.find(r => r.slug === 'staff' || r.slug === 'librarian' || r.slug === 'accountant')
      if (staffRole) await api.post('/roles/assign', { user_id: userId, role_id: staffRole._id })
      return staffAPI.create({ ...data, user_id: userId })
    },
    onSuccess: () => {
      toast.success(initial ? 'Staff updated' : 'Staff created. Default password: Staff@123456')
      onSuccess?.()
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save'),
  })

  const fields = [
    { name: 'name',        label: 'Full Name *',  required: true, placeholder: 'Staff name' },
    { name: 'email',       label: 'Email *',      required: true, placeholder: 'staff@school.com', type: 'email' },
    { name: 'phone',       label: 'Phone',        placeholder: '+91 XXXXX XXXXX' },
    { name: 'employee_id', label: 'Employee ID',  placeholder: 'EMP001' },
    { name: 'designation', label: 'Designation',  placeholder: 'e.g. Librarian, Accountant' },
    { name: 'department',  label: 'Department',   placeholder: 'e.g. Admin, Library' },
    { name: 'salary',      label: 'Salary',       type: 'number', placeholder: '25000' },
    { name: 'join_date',   label: 'Join Date',    type: 'date' },
  ]

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.name} className="space-y-1.5">
            <Label>{f.label}</Label>
            <Input
              type={f.type || 'text'}
              placeholder={f.placeholder}
              {...register(f.name, { required: f.required })}
            />
            {errors[f.name] && <p className="text-xs text-destructive">{f.label} is required</p>}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>
          {initial ? 'Update Staff' : 'Create Staff'}
        </Button>
      </div>
    </form>
  )
}

export const StaffPage = () => {
  const qc = useQueryClient()
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['staff', page, search],
    queryFn:  () => staffAPI.getAll({ page, limit: 10, search }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: id => staffAPI.remove(id),
    onSuccess: () => {
      toast.success('Staff member deleted')
      qc.invalidateQueries(['staff'])
      setDeleting(null)
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to delete'),
  })

  const columns = [
    {
      header: 'Staff Member',
      cell: r => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.user_id?.name || ''} size="sm" src={r.user_id?.avatar} />
          <div>
            <p className="text-sm font-medium">{r.user_id?.name}</p>
            <p className="text-xs text-muted-foreground">{r.user_id?.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'Employee ID',  cell: r => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.employee_id || '—'}</code> },
    { header: 'Designation',  cell: r => <p className="text-sm">{r.designation || '—'}</p> },
    { header: 'Department',   cell: r => <p className="text-sm">{r.department || '—'}</p> },
    { header: 'Salary',       cell: r => <p className="text-sm font-medium">{r.salary ? fCurrency(r.salary) : '—'}</p> },
    { header: 'Join Date',    cell: r => <p className="text-sm text-muted-foreground">{fDate(r.join_date)}</p> },
    { header: 'Status',       cell: r => <Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
    {
      header: 'Actions', className: 'text-right', cellClassName: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(r); setShowForm(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(r)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Manage non-teaching staff members"
        breadcrumbs={[{ label: 'People' }, { label: 'Staff' }]}
        action={
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-5">
          <DataTable
            columns={columns}
            data={data?.data || []}
            total={data?.pagination?.total}
            page={data?.pagination?.page}
            pages={data?.pagination?.pages}
            limit={data?.pagination?.limit}
            isLoading={isLoading}
            onPageChange={setPage}
            onSearch={v => { setSearch(v); setPage(1) }}
            searchPlaceholder="Search staff..."
            emptyIcon={UserSquare}
            emptyTitle="No staff members yet"
            emptyDescription="Add non-teaching staff like librarians, accountants, office staff"
          />
        </CardContent>
      </Card>

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Edit Staff' : 'Add Staff Member'}
        size="lg"
      >
        <StaffForm
          initial={editing}
          onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries(['staff']) }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      </Modal>

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting?._id)}
        loading={deleteMutation.isPending}
        title="Delete Staff Member"
        description={`Are you sure you want to delete ${deleting?.user_id?.name}?`}
      />
    </div>
  )
}