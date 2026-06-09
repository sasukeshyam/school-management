import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, UserCog, Shield, Check } from 'lucide-react'
import { rolesAPI, permissionsAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, Badge, Input, Label } from '@/components/ui/index.jsx'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { toast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import { useForm } from 'react-hook-form'

const RoleForm = ({ initial, onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: initial?.name || '', description: initial?.description || '' }
  })
  const mutation = useMutation({
    mutationFn: d => initial ? rolesAPI.update(initial._id, d) : rolesAPI.create(d),
    onSuccess: () => { toast.success(initial ? 'Role updated' : 'Role created'); onSuccess?.() },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Role Name *</Label>
        <Input placeholder="e.g. Librarian" {...register('name', { required: true })} />
        {errors.name && <p className="text-xs text-destructive">Name is required</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Input placeholder="What this role can do..." {...register('description')} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>{initial ? 'Update' : 'Create Role'}</Button>
      </div>
    </form>
  )
}

const PermissionModal = ({ role, onClose }) => {
  const qc = useQueryClient()
  const [selected, setSelected] = useState(new Set(role?.permissions?.map(p => p._id || p) || []))

  const { data: allPerms } = useQuery({ queryKey: ['all-permissions'], queryFn: () => permissionsAPI.getAll().then(r => r.data.data) })

  const mutation = useMutation({
    mutationFn: () => rolesAPI.assignPermissions(role._id, Array.from(selected)),
    onSuccess: () => { toast.success('Permissions updated'); qc.invalidateQueries(['roles']); onClose() },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })

  const toggle = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  // Group by module
  const grouped = (allPerms || []).reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = []
    acc[p.module].push(p)
    return acc
  }, {})

  return (
    <Modal open={!!role} onClose={onClose} title={`Permissions — ${role?.name}`} size="xl">
      <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
        {Object.entries(grouped).map(([module, perms]) => (
          <div key={module}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 capitalize">{module}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {perms.map(p => (
                <button key={p._id} type="button" onClick={() => toggle(p._id)}
                  className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs transition-all',
                    selected.has(p._id) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                  )}>
                  <div className={cn('h-4 w-4 rounded border flex items-center justify-center shrink-0',
                    selected.has(p._id) ? 'bg-primary border-primary' : 'border-border'
                  )}>
                    {selected.has(p._id) && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <span className="truncate capitalize">{p.action}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
        <p className="text-sm text-muted-foreground">{selected.size} permissions selected</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending}><Shield className="h-4 w-4" /> Save Permissions</Button>
        </div>
      </div>
    </Modal>
  )
}

export const RolesPage = () => {
  const qc = useQueryClient()
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [deleting,  setDeleting]  = useState(null)
  const [managing,  setManaging]  = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn:  () => rolesAPI.getAll({ limit: 50 }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: id => rolesAPI.remove(id),
    onSuccess: () => { toast.success('Role deleted'); qc.invalidateQueries(['roles']); setDeleting(null) },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed to delete — role may be in use'),
  })

  const roles = data?.data || []

  return (
    <div>
      <PageHeader title="Roles & Permissions" description="Manage roles and what each role can access"
        breadcrumbs={[{ label: 'System' }, { label: 'Roles' }]}
        action={<Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="h-4 w-4" /> Create Role</Button>}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-16">Loading roles...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <Card key={role._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <UserCog className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm capitalize">{role.name}</CardTitle>
                      {role.is_system && <Badge variant="secondary" className="text-[10px] mt-0.5">System</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!role.is_system && (
                      <>
                        <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(role); setShowForm(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(role)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {role.description && <p className="text-xs text-muted-foreground mb-3">{role.description}</p>}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{role.permissions?.length || 0}</span> permissions
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setManaging(role)}>
                    <Shield className="h-3.5 w-3.5" /> Manage Permissions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Edit Role' : 'Create Role'} size="sm">
        <RoleForm initial={editing} onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries(['roles']) }} onCancel={() => { setShowForm(false); setEditing(null) }} />
      </Modal>

      {managing && <PermissionModal role={managing} onClose={() => setManaging(null)} />}

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting?._id)}
        loading={deleteMutation.isPending} title="Delete Role" description={`Delete the "${deleting?.name}" role? Users with this role will lose access.`} />
    </div>
  )
}