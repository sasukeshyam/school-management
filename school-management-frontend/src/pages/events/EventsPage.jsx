import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Calendar, MapPin, Clock } from 'lucide-react'
import { eventsAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Badge, Input, Label, Select, Textarea } from '@/components/ui/index.jsx'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { toast } from '@/hooks/useToast'
import { fDate, fDateTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useForm } from 'react-hook-form'

const AUDIENCE_OPTIONS = ['all','students','parents','teachers','staff','admin']

const EventForm = ({ initial, onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title:       initial?.title                    || '',
      description: initial?.description              || '',
      event_date:  initial?.event_date?.split('T')[0]|| '',
      start_time:  initial?.start_time               || '',
      end_time:    initial?.end_time                 || '',
      location:    initial?.location                 || '',
      audience:    initial?.audience                 || 'all',
    }
  })

  const mutation = useMutation({
    mutationFn: d => initial ? eventsAPI.update(initial._id, d) : eventsAPI.create(d),
    onSuccess: () => { toast.success(initial ? 'Event updated' : 'Event created'); onSuccess?.() },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Event Title *</Label>
        <Input placeholder="e.g. Annual Sports Day" {...register('title', { required: true })} />
        {errors.title && <p className="text-xs text-destructive">Title is required</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea placeholder="Event details..." {...register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Event Date *</Label>
          <Input type="date" {...register('event_date', { required: true })} />
          {errors.event_date && <p className="text-xs text-destructive">Date is required</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Audience</Label>
          <Select {...register('audience')}>
            {AUDIENCE_OPTIONS.map(a => (
              <option key={a} value={a} className="capitalize">{a.charAt(0).toUpperCase() + a.slice(1)}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Start Time</Label>
          <Input type="time" {...register('start_time')} />
        </div>
        <div className="space-y-1.5">
          <Label>End Time</Label>
          <Input type="time" {...register('end_time')} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Location</Label>
          <Input placeholder="e.g. School Auditorium, Ground" {...register('location')} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>{initial ? 'Update Event' : 'Create Event'}</Button>
      </div>
    </form>
  )
}

const AUDIENCE_COLORS = {
  all:      'bg-primary/10 text-primary',
  students: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  parents:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  teachers: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  staff:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  admin:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export const EventsPage = () => {
  const qc = useQueryClient()
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [view, setView]         = useState('table') // 'table' | 'grid'

  const { data, isLoading } = useQuery({
    queryKey: ['events', page, search],
    queryFn:  () => eventsAPI.getAll({ page, limit: 10, search }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: id => eventsAPI.remove(id),
    onSuccess: () => { toast.success('Event deleted'); qc.invalidateQueries(['events']); setDeleting(null) },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })

  const rows = data?.data       || []
  const pag  = data?.pagination || {}

  const columns = [
    { header: 'Event', cell: r => (
      <div>
        <p className="text-sm font-medium">{r.title}</p>
        {r.description && <p className="text-xs text-muted-foreground truncate max-w-48">{r.description}</p>}
      </div>
    )},
    { header: 'Date', cell: r => (
      <div className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <p className="text-sm">{fDate(r.event_date)}</p>
      </div>
    )},
    { header: 'Time', cell: r => (
      r.start_time
        ? <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-sm">{r.start_time}{r.end_time ? ` – ${r.end_time}` : ''}</p>
          </div>
        : <p className="text-sm text-muted-foreground">—</p>
    )},
    { header: 'Location', cell: r => (
      r.location
        ? <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-sm truncate max-w-32">{r.location}</p>
          </div>
        : <p className="text-sm text-muted-foreground">—</p>
    )},
    { header: 'Audience', cell: r => (
      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md capitalize', AUDIENCE_COLORS[r.audience] || '')}>
        {r.audience}
      </span>
    )},
    { header: 'Status', cell: r => {
      const isPast   = new Date(r.event_date) < new Date()
      const isToday  = fDate(r.event_date) === fDate(new Date())
      return (
        <Badge variant={isToday ? 'success' : isPast ? 'secondary' : 'default'}>
          {isToday ? 'Today' : isPast ? 'Past' : 'Upcoming'}
        </Badge>
      )
    }},
    { header: 'Actions', className: 'text-right', cellClassName: 'text-right', cell: r => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(r); setShowForm(true) }}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(r)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Events"
        description="Manage school events and announcements"
        breadcrumbs={[{ label: 'Events' }]}
        action={
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        }
      />

      {/* Upcoming events banner */}
      {rows.filter(r => new Date(r.event_date) >= new Date()).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {rows.filter(r => new Date(r.event_date) >= new Date()).slice(0, 3).map(ev => (
            <div key={ev._id} className="flex items-start gap-3 p-3.5 rounded-xl border bg-card hover:shadow-sm transition-shadow">
              <div className="shrink-0 w-11 text-center rounded-lg bg-primary/10 py-1.5">
                <p className="text-lg font-bold text-primary leading-none">{new Date(ev.event_date).getDate()}</p>
                <p className="text-[10px] text-primary/60">{new Date(ev.event_date).toLocaleString('default',{month:'short'})}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ev.title}</p>
                <p className="text-xs text-muted-foreground">{ev.location || 'School'}</p>
                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 inline-block capitalize', AUDIENCE_COLORS[ev.audience])}>
                  {ev.audience}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card><CardContent className="pt-5">
        <DataTable
          columns={columns}
          data={rows}
          total={pag.total} page={pag.page} pages={pag.pages} limit={pag.limit}
          isLoading={isLoading} onPageChange={setPage}
          onSearch={v => { setSearch(v); setPage(1) }}
          searchPlaceholder="Search events..."
          emptyIcon={Calendar}
          emptyTitle="No events yet"
          emptyDescription="Create school events to notify students, parents and teachers"
        />
      </CardContent></Card>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Edit Event' : 'Create Event'} size="lg">
        <EventForm
          initial={editing}
          onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries(['events']) }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      </Modal>

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting?._id)} loading={deleteMutation.isPending}
        title="Delete Event" description={`Delete "${deleting?.title}"?`}
      />
    </div>
  )
}