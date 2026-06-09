import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { parentsAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Avatar } from '@/components/ui/index.jsx'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input, Label } from '@/components/ui/index.jsx'
import { toast } from '@/hooks/useToast'
import { useForm } from 'react-hook-form'
import api from '@/api/axios'

const ParentForm = ({ initial, onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: initial?.user_id?.name || '',
      email: initial?.user_id?.email || '',
      phone: initial?.user_id?.phone || '',
      occupation: initial?.occupation || '',
      national_id: initial?.national_id || '',
      address: initial?.address || '',
    }
  })
  const mutation = useMutation({
    mutationFn: async (data) => {
      if (initial) return parentsAPI.update(initial._id, data)
      const userRes = await api.post('/users', { name: data.name, email: data.email, phone: data.phone, password_hash: 'Parent@123456' })
      const userId = userRes.data.data._id
      const roleRes = await api.get('/roles?limit=100')
      const parentRole = roleRes.data.data.find(r => r.slug === 'parent')
      if (parentRole) await api.post('/roles/assign', { user_id: userId, role_id: parentRole._id })
      return parentsAPI.create({ ...data, user_id: userId })
    },
    onSuccess: () => { toast.success(initial ? 'Parent updated' : 'Parent created. Default password: Parent@123456'); onSuccess?.() },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: 'name',        label: 'Full Name *',  required: true, placeholder: 'Parent name' },
          { name: 'email',       label: 'Email *',      required: true, placeholder: 'parent@gmail.com', type: 'email' },
          { name: 'phone',       label: 'Phone',        placeholder: '+91 XXXXX XXXXX' },
          { name: 'occupation',  label: 'Occupation',   placeholder: 'Business' },
          { name: 'national_id', label: 'National ID',  placeholder: 'Aadhar / Passport' },
        ].map(f => (
          <div key={f.name} className="space-y-1.5">
            <Label>{f.label}</Label>
            <Input type={f.type || 'text'} placeholder={f.placeholder} {...register(f.name, { required: f.required })} />
            {errors[f.name] && <p className="text-xs text-destructive">{f.label} is required</p>}
          </div>
        ))}
        <div className="space-y-1.5 col-span-2">
          <Label>Address</Label>
          <Input placeholder="Home address" {...register('address')} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>{initial ? 'Update' : 'Create Parent'}</Button>
      </div>
    </form>
  )
}

export const ParentsPage = () => {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['parents', page, search],
    queryFn: () => parentsAPI.getAll({ page, limit: 10, search }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: id => parentsAPI.remove(id),
    onSuccess: () => { toast.success('Parent deleted'); qc.invalidateQueries(['parents']); setDeleting(null) },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  })

  const columns = [
    { header: 'Parent', cell: r => (
      <div className="flex items-center gap-2.5">
        <Avatar name={r.user_id?.name || ''} size="sm" />
        <div>
          <p className="text-sm font-medium">{r.user_id?.name}</p>
          <p className="text-xs text-muted-foreground">{r.user_id?.email}</p>
        </div>
      </div>
    )},
    { header: 'Phone',      cell: r => <p className="text-sm">{r.user_id?.phone || '—'}</p> },
    { header: 'Occupation', cell: r => <p className="text-sm">{r.occupation || '—'}</p> },
    { header: 'National ID',cell: r => <p className="text-sm text-muted-foreground">{r.national_id || '—'}</p> },
    { header: 'Actions', className: 'text-right', cellClassName: 'text-right', cell: r => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(r); setShowForm(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Parents" description="Manage parent accounts" breadcrumbs={[{ label: 'People' }, { label: 'Parents' }]}
        action={<Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="h-4 w-4" /> Add Parent</Button>}
      />
      <Card><CardContent className="pt-5">
        <DataTable columns={columns} data={data?.data || []} total={data?.pagination?.total} page={data?.pagination?.page}
          pages={data?.pagination?.pages} limit={data?.pagination?.limit} isLoading={isLoading} onPageChange={setPage}
          onSearch={v => { setSearch(v); setPage(1) }} searchPlaceholder="Search parents..."
          emptyIcon={Users} emptyTitle="No parents yet" emptyDescription="Add parent accounts to link with students"
        />
      </CardContent></Card>
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Edit Parent' : 'Add Parent'} size="lg">
        <ParentForm initial={editing} onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries(['parents']) }} onCancel={() => { setShowForm(false); setEditing(null) }} />
      </Modal>
      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting?._id)}
        loading={deleteMutation.isPending} title="Delete Parent" description={`Delete ${deleting?.user_id?.name}?`} />
    </div>
  )
}