import { Users, DollarSign, Calendar, ClipboardList } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar } from '@/components/ui/index.jsx'
import { fDate, STATUS_COLORS } from '@/utils/format'
import { cn } from '@/utils/cn'

export const ParentDashboard = ({ data = {} }) => {
  const { parent, children = [], pending_fees = 0, upcoming_events = [] } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar name={parent?.user_id?.name || ''} size="xl" />
        <div>
          <h1 className="font-display text-2xl font-bold">
            Welcome, {parent?.user_id?.name?.split(' ')[0] || 'Parent'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {children.length} child{children.length !== 1 ? 'ren' : ''} enrolled
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Children"     value={children.length}    icon={Users}         color="primary" />
        <StatCard label="Pending Fees" value={pending_fees}       icon={DollarSign}    color={pending_fees > 0 ? 'danger' : 'success'} />
        <StatCard label="Events"       value={upcoming_events.length} icon={Calendar}  color="info"    />
        <StatCard label="Linked Since" value={fDate(parent?.created_at)} icon={ClipboardList} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Children list */}
        <Card>
          <CardHeader><CardTitle>My Children</CardTitle></CardHeader>
          <CardContent>
            {children.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No children linked</p>
              : <div className="space-y-3">
                  {children.map((link) => {
                    const s = link.student_id
                    return (
                      <div key={link._id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                        <Avatar name={s?.user_id?.name || ''} size="md" src={s?.user_id?.avatar} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s?.user_id?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Roll: {s?.roll_number || '—'} · {s?.class_setup_id?.class_id?.name} {s?.class_setup_id?.section_id?.name}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="outline" className="text-xs capitalize">{link.relation}</Badge>
                          <p className={cn('text-xs mt-1 font-medium capitalize', STATUS_COLORS[s?.status])}>
                            {s?.status}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </CardContent>
        </Card>

        {/* Events */}
        <Card>
          <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
          <CardContent>
            {upcoming_events.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No upcoming events</p>
              : <div className="space-y-3">
                  {upcoming_events.map((ev) => (
                    <div key={ev._id} className="flex items-start gap-3">
                      <div className="shrink-0 w-10 text-center rounded-lg bg-primary/10 py-1.5">
                        <p className="text-base font-bold text-primary leading-none">{new Date(ev.event_date).getDate()}</p>
                        <p className="text-[10px] text-primary/60">
                          {new Date(ev.event_date).toLocaleString('default', { month: 'short' })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{ev.location || 'School'} · {ev.start_time || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
