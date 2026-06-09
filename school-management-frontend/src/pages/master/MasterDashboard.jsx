import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, School, Users, Eye, EyeOff, Copy, Check, LogOut, ShieldCheck, ToggleLeft, ToggleRight, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/api/axios'
import { Button } from '@/components/ui/Button'
import { Input, Label, Card, CardContent, CardHeader, CardTitle, Badge, Avatar, Spinner } from '@/components/ui/index.jsx'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { fDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

// ─── API helpers ─────────────────────────────────────────────────────────────
const masterAPI = {
  getSchools:    (params) => api.get('/schools', { params }),
  createSchool:  (data)   => api.post('/schools', data),
  updateSchool:  (id, d)  => api.put(`/schools/${id}`, d),
  toggleActive:  (id, v)  => api.put(`/schools/${id}`, { is_active: v }),
  createUser:    (data)   => api.post('/users', data),
  assignRole:    (data)   => api.post('/roles/assign', data),
  getRoles:      (params) => api.get('/roles', { params }),
  createSession: (data)   => api.post('/sessions', data),
}

// ─── Create School Form ───────────────────────────────────────────────────────
const schema = z.object({
  school_name:    z.string().min(2, 'School name required'),
  school_address: z.string().optional(),
  school_phone:   z.string().optional(),
  school_email:   z.string().email('Valid email required').optional().or(z.literal('')),
  admin_name:     z.string().min(2, 'Admin name required'),
  admin_email:    z.string().email('Valid email required'),
  admin_phone:    z.string().optional(),
  admin_password: z.string().min(8, 'Min 8 characters'),
  subscription:   z.string().default('premium'),
})

const CreateSchoolForm = ({ onSuccess, onCancel }) => {
  const [showPass, setShowPass]           = useState(false)
  const [generatedCreds, setGeneratedCreds] = useState(null)
  const [copied, setCopied]               = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { subscription: 'premium' },
  })

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$'
    const pass  = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setValue('admin_password', pass)
  }

  const mutation = useMutation({
    mutationFn: async (data) => {
  // 1. Create school
    const schoolRes = await masterAPI.createSchool({
        name:         data.school_name,
        address:      data.school_address,
        phone:        data.school_phone,
        email:        data.school_email,
        subscription: data.subscription,
        is_active:    true,
    })
    const school = schoolRes.data.data

    // 2. Create session
    const year = new Date().getFullYear()
    await masterAPI.createSession({
        school_id:  school._id,
        name:       `${year}-${year + 1}`,
        year,
        start_date: new Date(`${year}-04-01`),
        end_date:   new Date(`${year + 1}-03-31`),
        is_current: true,
    })

    // 3. Seed roles for this new school by calling backend seed endpoint
    await api.post('/schools/' + school._id + '/seed-roles')

    // 4. Create admin user
    const userRes = await masterAPI.createUser({
        school_id:     school._id,
        name:          data.admin_name,
        email:         data.admin_email,
        phone:         data.admin_phone,
        password_hash: data.admin_password,
        is_active:     true,
    })
    const user = userRes.data.data

    // 5. Assign admin role
    const rolesRes = await api.get('/roles?limit=100')
    const adminRole = rolesRes.data.data.find(r => r.slug === 'admin' && r.school_id === school._id)
    if (adminRole) {
        await masterAPI.assignRole({ user_id: user._id, role_id: adminRole._id })
    }

    return { school, user, password: data.admin_password }
    },
    onSuccess: ({ school, user, password }) => {
      setGeneratedCreds({ school, user, password })
      toast.success('School created successfully!')
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to create school'),
  })

  const copyToClipboard = (creds) => {
    const text = `
EduCore School Management — Login Credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
School Name : ${creds.school.name}
School ID   : ${creds.school._id}
Login URL   : ${window.location.origin}/login
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Admin Email : ${creds.user.email}
Password    : ${creds.password}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Please change your password after first login.
    `.trim()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Credentials copied to clipboard!')
  }

  // Show success screen after creation
  if (generatedCreds) {
    const { school, user, password } = generatedCreds
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
            <Check className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">School Created Successfully!</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Share the credentials below with the school admin</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 font-mono text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Login Credentials</span>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedCreds)}>
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy All'}
            </Button>
          </div>
          {[
            { label: 'School Name', value: school.name },
            { label: 'School ID',   value: school._id,        mono: true, highlight: true },
            { label: 'Login URL',   value: `${window.location.origin}/login` },
            { label: 'Admin Email', value: user.email },
            { label: 'Password',    value: password,           highlight: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
              <span className="text-xs text-muted-foreground w-28 shrink-0">{item.label}</span>
              <span className={cn('text-sm flex-1 break-all', item.highlight && 'font-bold text-primary', item.mono && 'font-mono text-xs')}>
                {item.value}
              </span>
              <button onClick={() => { navigator.clipboard.writeText(item.value); toast.success(`${item.label} copied!`) }}
                className="shrink-0 text-muted-foreground hover:text-foreground">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            ⚠️ <strong>Important:</strong> Save these credentials now. The password cannot be recovered later — only reset.
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => { setGeneratedCreds(null) }}>Create Another School</Button>
          <Button onClick={() => { onSuccess?.(); setGeneratedCreds(null) }}>Done</Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
      {/* School info */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">School Information</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label>School Name *</Label>
            <Input placeholder="e.g. Delhi Public School" {...register('school_name')} className={cn(errors.school_name && 'border-destructive')} />
            {errors.school_name && <p className="text-xs text-destructive">{errors.school_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>School Phone</Label>
            <Input placeholder="+91 XXXXX XXXXX" {...register('school_phone')} />
          </div>
          <div className="space-y-1.5">
            <Label>School Email</Label>
            <Input type="email" placeholder="info@school.com" {...register('school_email')} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Address</Label>
            <Input placeholder="City, State" {...register('school_address')} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Subscription Plan</Label>
            <select {...register('subscription')}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Admin info */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Admin Account</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Admin Full Name *</Label>
            <Input placeholder="e.g. Rajesh Kumar" {...register('admin_name')} className={cn(errors.admin_name && 'border-destructive')} />
            {errors.admin_name && <p className="text-xs text-destructive">{errors.admin_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Admin Phone</Label>
            <Input placeholder="+91 XXXXX XXXXX" {...register('admin_phone')} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Admin Email *</Label>
            <Input type="email" placeholder="admin@school.com" {...register('admin_email')} className={cn(errors.admin_email && 'border-destructive')} />
            {errors.admin_email && <p className="text-xs text-destructive">{errors.admin_email.message}</p>}
          </div>
          <div className="space-y-1.5 col-span-2">
            <div className="flex items-center justify-between">
              <Label>Password *</Label>
              <button type="button" onClick={generatePassword} className="text-xs text-primary hover:underline">
                Generate strong password
              </button>
            </div>
            <div className="relative">
              <Input type={showPass ? 'text' : 'password'} placeholder="Min 8 characters"
                {...register('admin_password')} className={cn('pr-9', errors.admin_password && 'border-destructive')} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.admin_password && <p className="text-xs text-destructive">{errors.admin_password.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>
          <School className="h-4 w-4" /> Create School
        </Button>
      </div>
    </form>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export const MasterDashboard = () => {
  const qc       = useQueryClient()
  const logout   = useAuthStore(s => s.logout)
  const user     = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [viewCreds, setViewCreds]   = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['master-schools', page, search],
    queryFn:  () => masterAPI.getSchools({ page, limit: 12, search }).then(r => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, val }) => masterAPI.toggleActive(id, val),
    onSuccess: () => { toast.success('School status updated'); qc.invalidateQueries(['master-schools']) },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })

  const schools    = data?.data       || []
  const pagination = data?.pagination || {}
  const totalPages = pagination.pages || 1

  const handleLogout = () => { logout(); navigate('/master') }

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer />

      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center gap-3 h-14 px-6 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-display font-bold text-sm">EduCore Master Admin</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
          <Avatar name={user?.name || ''} size="sm" />
          <Button variant="ghost" size="icon-sm" onClick={handleLogout} title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">All Schools</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pagination.total || 0} school{(pagination.total || 0) !== 1 ? 's' : ''} on the platform
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Create New School
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Schools',  value: pagination.total || 0,                                       color: 'bg-primary/10 text-primary' },
            { label: 'Active',         value: schools.filter(s => s.is_active).length,                     color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
            { label: 'Inactive',       value: schools.filter(s => !s.is_active).length,                    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
            { label: 'Premium',        value: schools.filter(s => s.subscription === 'premium').length,    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', s.color)}>
                  <School className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search schools..."
            className="w-full h-9 pl-3 pr-3 text-sm rounded-lg border border-border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Schools grid */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : schools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="p-4 rounded-2xl bg-muted"><School className="h-8 w-8 text-muted-foreground" /></div>
            <p className="font-medium">No schools yet</p>
            <p className="text-sm text-muted-foreground">Create your first school to get started</p>
            <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Create School</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map(school => (
              <Card key={school._id} className={cn('hover:shadow-md transition-shadow', !school.is_active && 'opacity-60')}>
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <School className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-semibold truncate">{school.name}</p>
                        <Badge variant={school.is_active ? 'success' : 'secondary'} className="text-[10px] shrink-0">
                          {school.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{school.email || school.phone || '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">{school.address || '—'}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-muted-foreground">Plan</p>
                      <p className="font-semibold capitalize mt-0.5">{school.subscription || 'free'}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-semibold mt-0.5">{fDate(school.created_at)}</p>
                    </div>
                  </div>

                  {/* School ID */}
                  <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border">
                    <p className="text-[10px] text-muted-foreground shrink-0">ID:</p>
                    <code className="text-[10px] font-mono flex-1 truncate text-foreground">{school._id}</code>
                    <button onClick={() => { navigator.clipboard.writeText(school._id); toast.success('School ID copied!') }}
                      className="shrink-0 text-muted-foreground hover:text-foreground">
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant={school.is_active ? 'outline' : 'success'}
                      size="sm" className="flex-1 text-xs"
                      onClick={() => toggleMutation.mutate({ id: school._id, val: !school.is_active })}
                      loading={toggleMutation.isPending}
                    >
                      {school.is_active
                        ? <><ToggleLeft className="h-3.5 w-3.5" /> Deactivate</>
                        : <><ToggleRight className="h-3.5 w-3.5" /> Activate</>
                      }
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs"
                      onClick={() => setViewCreds(school)}>
                      <Eye className="h-3.5 w-3.5" /> Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>← Prev</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next →</Button>
          </div>
        )}
      </div>

      {/* Create School Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New School" description="Set up a new school and generate admin credentials" size="lg">
        <CreateSchoolForm
          onSuccess={() => { setShowCreate(false); qc.invalidateQueries(['master-schools']) }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* School Details Modal */}
      <Modal open={!!viewCreds} onClose={() => setViewCreds(null)} title="School Details" size="md">
        {viewCreds && (
          <div className="space-y-4">
            <div className="space-y-3">
              {[
                { label: 'School Name',  value: viewCreds.name },
                { label: 'School ID',    value: viewCreds._id,    mono: true },
                { label: 'Email',        value: viewCreds.email   || '—' },
                { label: 'Phone',        value: viewCreds.phone   || '—' },
                { label: 'Address',      value: viewCreds.address || '—' },
                { label: 'Plan',         value: viewCreds.subscription, badge: true },
                { label: 'Status',       value: viewCreds.is_active ? 'Active' : 'Inactive', badge: true },
                { label: 'Created',      value: fDate(viewCreds.created_at) },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 gap-4">
                  <span className="text-sm text-muted-foreground w-28 shrink-0">{item.label}</span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {item.badge
                      ? <Badge variant={item.value === 'Active' || item.value === 'premium' ? 'success' : 'secondary'} className="capitalize">{item.value}</Badge>
                      : <span className={cn('text-sm font-medium break-all text-right', item.mono && 'font-mono text-xs')}>{item.value}</span>
                    }
                    {item.mono && (
                      <button onClick={() => { navigator.clipboard.writeText(item.value); toast.success('Copied!') }}
                        className="text-muted-foreground hover:text-foreground shrink-0">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                💡 Share the <strong>School ID</strong> with the school admin. They need it along with their email and password to log in.
              </p>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setViewCreds(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}