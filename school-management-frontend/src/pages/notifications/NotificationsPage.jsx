import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Send, CheckCheck } from 'lucide-react'
import { notificationsAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Badge, Label, Select, Textarea, Input } from '@/components/ui/index.jsx'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/hooks/useToast'
import { fRelative } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useForm } from 'react-hook-form'
import { useUIStore } from '@/store/uiStore'

const TYPE_COLORS = {
  all:      'bg-primary/10 text-primary',
  students: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  parents:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  teachers: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  staff:    'bg-amber-100 text-amber-700',
  admin:    'bg-red-100 text-red-700',
}

const SendForm = ({ onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { target_role: 'all', is_broadcast: true } })
  const mutation = useMutation({
    mutationFn: d => notificationsAPI.send({ ...d, is_broadcast: d.target_role === 'all' }),
    onSuccess: () => { toast.success('Notification sent'); onSuccess?.() },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title *</Label>
        <Input placeholder="Notification title" {...register('title', { required: true })} />
        {errors.title && <p className="text-xs text-destructive">Title is required</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Message *</Label>
        <Textarea placeholder="Write your message..." rows={4} {...register('message', { required: true })} />
        {errors.message && <p className="text-xs text-destructive">Message is required</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Send To</Label>
        <Select {...register('target_role')}>
          {['all','students','parents','teachers','staff','admin'].map(r => (
            <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}><Send className="h-4 w-4" /> Send Notification</Button>
      </div>
    </form>
  )
}

export const NotificationsPage = () => {
  const qc          = useQueryClient()
  const clearUnread = useUIStore(s => s.clearUnread)
  const [page, setPage]         = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter]     = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['my-notifications', page, filter],
    queryFn:  () => notificationsAPI.my({ page, limit: 20, ...(filter !== 'all' && { is_read: filter === 'read' }) }).then(r => r.data),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => { toast.success('All marked as read'); qc.invalidateQueries(['my-notifications']); clearUnread() },
  })

  const markReadMutation = useMutation({
    mutationFn: id => notificationsAPI.markRead(id),
    onSuccess: () => qc.invalidateQueries(['my-notifications']),
  })

  const notifications = data?.data        || []
  const unreadCount   = data?.data?.unread_count || 0
  const pag           = data?.pagination  || {}

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="View and manage all notifications"
        breadcrumbs={[{ label: 'Notifications' }]}
        action={
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()} loading={markAllMutation.isPending}>
                <CheckCheck className="h-4 w-4" /> Mark all read
              </Button>
            )}
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Send className="h-4 w-4" /> Send Notification
            </Button>
          </div>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-5">
        {[['all','All'],['unread','Unread'],['read','Read']].map(([val, label]) => (
          <button key={val} onClick={() => { setFilter(val); setPage(1) }}
            className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              filter === val ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}>{label}</button>
        ))}
      </div>

      {isLoading ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground text-sm">Loading...</CardContent></Card>
      ) : notifications.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="p-3 rounded-xl bg-muted"><Bell className="h-8 w-8 text-muted-foreground" /></div>
          <p className="font-medium">No notifications</p>
          <p className="text-sm text-muted-foreground">You're all caught up!</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => {
            const n = item.notification_id || item
            const isRead = item.is_read
            return (
              <div key={item._id}
                onClick={() => !isRead && markReadMutation.mutate(n._id)}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer',
                  isRead ? 'bg-card border-border' : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                )}
              >
                <div className={cn('mt-0.5 h-2 w-2 rounded-full shrink-0', isRead ? 'bg-transparent' : 'bg-primary')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm truncate', !isRead && 'font-semibold')}>{n.title}</p>
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-md capitalize shrink-0', TYPE_COLORS[n.target_role] || '')}>
                      {n.target_role}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{fRelative(n.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Send Notification" size="md">
        <SendForm onSuccess={() => { setShowForm(false); qc.invalidateQueries(['my-notifications']) }} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}