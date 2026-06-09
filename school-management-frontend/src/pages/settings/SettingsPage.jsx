import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { User, Lock, School, Bell, Palette, Save, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '@/api'
import api from '@/api/axios'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Avatar, Badge } from '@/components/ui/index.jsx'
import { toast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import { fDate } from '@/utils/format'

const TABS = [
  { id: 'profile',       label: 'My Profile',    icon: User   },
  { id: 'password',      label: 'Password',       icon: Lock   },
  { id: 'school',        label: 'School Info',    icon: School },
  { id: 'appearance',    label: 'Appearance',     icon: Palette },
  { id: 'notifications', label: 'Notifications',  icon: Bell   },
]

// ─── Profile Tab ─────────────────────────────────────────────────────────────
const ProfileTab = ({ user, roles }) => {
  const { register, handleSubmit } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '' }
  })
  const mutation = useMutation({
    mutationFn: d => api.put(`/users/${user._id}`, d),
    onSuccess: () => toast.success('Profile updated'),
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-5 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10">
        <Avatar name={user?.name || ''} size="xl" src={user?.avatar} />
        <div>
          <h3 className="font-display font-bold text-lg">{user?.name}</h3>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {roles.map(r => (
              <Badge key={r} variant="default" className="text-xs capitalize">{r}</Badge>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label>Full Name</Label>
            <Input placeholder="Your name" {...register('name')} />
          </div>
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label>Phone</Label>
            <Input placeholder="+91 XXXXX XXXXX" {...register('phone')} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed. Contact admin.</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={mutation.isPending}><Save className="h-4 w-4" /> Save Profile</Button>
        </div>
      </form>

      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Account Info</p>
        <div className="space-y-2">
          {[
            { label: 'Account Status', value: user?.is_active ? 'Active' : 'Inactive', badge: true },
            { label: 'Last Login',     value: fDate(user?.last_login) },
            { label: 'Member Since',   value: fDate(user?.created_at) },
            { label: 'School ID',      value: user?.school_id, mono: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              {item.badge
                ? <Badge variant={user?.is_active ? 'success' : 'secondary'}>{item.value}</Badge>
                : <span className={cn('text-sm font-medium', item.mono && 'font-mono text-xs break-all text-right max-w-48')}>{item.value}</span>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Password Tab ─────────────────────────────────────────────────────────────
const PasswordTab = () => {
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()
  const mutation = useMutation({
    mutationFn: d => authAPI.changePassword({ current_password: d.current_password, new_password: d.new_password }),
    onSuccess: () => { toast.success('Password changed successfully'); reset() },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed to change password'),
  })
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 max-w-md">
      <div className="space-y-1.5">
        <Label>Current Password *</Label>
        <div className="relative">
          <Input type={showOld ? 'text' : 'password'} placeholder="Enter current password"
            {...register('current_password', { required: 'Current password is required' })}
            className={cn('pr-9', errors.current_password && 'border-destructive')} />
          <button type="button" onClick={() => setShowOld(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.current_password && <p className="text-xs text-destructive">{errors.current_password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>New Password *</Label>
        <div className="relative">
          <Input type={showNew ? 'text' : 'password'} placeholder="Min 8 characters"
            {...register('new_password', { required: 'New password required', minLength: { value: 8, message: 'Min 8 characters' } })}
            className={cn('pr-9', errors.new_password && 'border-destructive')} />
          <button type="button" onClick={() => setShowNew(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.new_password && <p className="text-xs text-destructive">{errors.new_password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Confirm New Password *</Label>
        <Input type="password" placeholder="Repeat new password"
          {...register('confirm_password', {
            required: 'Please confirm password',
            validate: v => v === watch('new_password') || 'Passwords do not match'
          })}
          className={cn(errors.confirm_password && 'border-destructive')} />
        {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
      </div>

      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground font-medium mb-1">Password requirements:</p>
        <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
          <li>At least 8 characters</li>
          <li>Use a mix of letters, numbers and symbols</li>
          <li>Do not reuse recent passwords</li>
        </ul>
      </div>

      <Button type="submit" loading={mutation.isPending}><Lock className="h-4 w-4" /> Change Password</Button>
    </form>
  )
}

// ─── School Info Tab ──────────────────────────────────────────────────────────
const SchoolTab = ({ schoolId }) => {
  const { data: school, isLoading } = useQuery({
    queryKey: ['school-info', schoolId],
    queryFn:  () => api.get(`/schools/${schoolId}`).then(r => r.data.data),
    enabled:  !!schoolId,
  })
  const { register, handleSubmit } = useForm({
    values: {
      name:     school?.name     || '',
      phone:    school?.phone    || '',
      email:    school?.email    || '',
      address:  school?.address  || '',
      currency: school?.currency || 'INR',
      timezone: school?.timezone || 'Asia/Kolkata',
    }
  })
  const mutation = useMutation({
    mutationFn: d => api.put(`/schools/${schoolId}`, d),
    onSuccess: () => toast.success('School info updated'),
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })
  if (isLoading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading school info...</p>
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>School Name</Label>
          <Input placeholder="School name" {...register('name')} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input placeholder="+91 XXXXX XXXXX" {...register('phone')} />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" placeholder="school@example.com" {...register('email')} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Address</Label>
          <Input placeholder="Full address" {...register('address')} />
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <select {...register('currency')}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="INR">INR — Indian Rupee</option>
            <option value="USD">USD — US Dollar</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Timezone</Label>
          <select {...register('timezone')}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={mutation.isPending}><Save className="h-4 w-4" /> Save School Info</Button>
      </div>
    </form>
  )
}

// ─── Appearance Tab ───────────────────────────────────────────────────────────
const AppearanceTab = () => {
  const theme       = useUIStore(s => s.theme)
  const toggleTheme = useUIStore(s => s.toggleTheme)
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium mb-3">Theme</p>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {[
            { value: 'light', label: 'Light', desc: 'Clean and bright' },
            { value: 'dark',  label: 'Dark',  desc: 'Easy on the eyes' },
          ].map(t => (
            <button key={t.value} type="button"
              onClick={() => theme !== t.value && toggleTheme()}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                theme === t.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              )}>
              <div className={cn('h-8 w-full rounded-md mb-2', t.value === 'light' ? 'bg-gray-100' : 'bg-gray-800')} />
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
              {theme === t.value && <Badge variant="success" className="text-[10px] mt-1">Active</Badge>}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-medium mb-1">Sidebar</p>
        <p className="text-xs text-muted-foreground mb-3">Toggle sidebar collapse from the panel icon or the button below</p>
        <Button variant="outline" size="sm" onClick={() => useUIStore.getState().toggleSidebar()}>Toggle Sidebar</Button>
      </div>
    </div>
  )
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
const NotificationsTab = () => (
  <div className="space-y-4 max-w-md">
    {[
      { label: 'New student enrolled',   desc: 'Get notified when a new student joins' },
      { label: 'Fee payment received',   desc: 'Get notified on every fee collection' },
      { label: 'Assignment submitted',   desc: 'When students submit assignments' },
      { label: 'Leave request',          desc: 'When students apply for leave' },
      { label: 'Exam results published', desc: 'When marksheets are published' },
    ].map((item, i) => (
      <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-border hover:bg-muted/30 transition-colors">
        <div>
          <p className="text-sm font-medium">{item.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" defaultChecked className="sr-only peer" />
          <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
        </label>
      </div>
    ))}
    <Button className="mt-2"><Save className="h-4 w-4" /> Save Preferences</Button>
  </div>
)

// ─── Main Page ────────────────────────────────────────────────────────────────
export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const user    = useAuthStore(s => s.user)
  const roles   = useAuthStore(s => s.roles)
  const isAdmin = useAuthStore(s => s.isAdmin())

  const visibleTabs = TABS.filter(t => {
    if (t.id === 'school') return isAdmin
    return true
  })

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account and school preferences"
        breadcrumbs={[{ label: 'Settings' }]} />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <div className="lg:w-52 shrink-0">
          <Card>
            <CardContent className="p-2">
              {visibleTabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}>
                  <tab.icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>{visibleTabs.find(t => t.id === activeTab)?.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {activeTab === 'profile'       && <ProfileTab user={user} roles={roles} />}
              {activeTab === 'password'      && <PasswordTab />}
              {activeTab === 'school'        && <SchoolTab schoolId={user?.school_id} />}
              {activeTab === 'appearance'    && <AppearanceTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}