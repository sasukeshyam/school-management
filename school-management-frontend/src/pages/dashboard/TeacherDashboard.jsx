import { BookOpen, Users, Clock, Calendar } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar } from '@/components/ui/index.jsx'
import { fDate, STATUS_COLORS } from '@/utils/format'
import { cn } from '@/utils/cn'

export const TeacherDashboard = ({ data = {} }) => {
  const { teacher, my_classes = [], total_subjects = 0, upcoming_events = [] } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar name={teacher?.user_id?.name || ''} size="xl" />
        <div>
          <h1 className="font-display text-2xl font-bold">Welcome, {teacher?.user_id?.name?.split(' ')[0] || 'Teacher'}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{teacher?.designation || 'Teacher'} · {teacher?.department || 'Department'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Classes"   value={my_classes.length} icon={Users}    color="primary" />
        <StatCard label="Subjects"     value={total_subjects}    icon={BookOpen}  color="success" />
        <StatCard label="Upcoming Events" value={upcoming_events.length} icon={Calendar} color="info" />
        <StatCard label="Employee ID"  value={teacher?.employee_id || '—'} icon={Clock} color="warning" />
      </div>

      {/* Classes & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>My Classes</CardTitle></CardHeader>
          <CardContent>
            {my_classes.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No classes assigned</p>
              : <div className="space-y-3">
                  {my_classes.map((sa) => (
                    <div key={sa._id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                      <div>
                        <p className="text-sm font-medium">
                          {sa.class_setup_id?.class_id?.name} {sa.class_setup_id?.section_id?.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{sa.subject_id?.name} · {sa.subject_id?.code}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{sa.subject_id?.type}</Badge>
                    </div>
                  ))}
                </div>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
          <CardContent>
            {upcoming_events.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No upcoming events</p>
              : <div className="space-y-3">
                  {upcoming_events.map((ev) => (
                    <div key={ev._id} className="flex items-start gap-3 p-2">
                      <div className="shrink-0 w-10 text-center rounded-lg bg-primary/10 py-1.5">
                        <p className="text-base font-bold text-primary leading-none">{new Date(ev.event_date).getDate()}</p>
                        <p className="text-[10px] text-primary/60">
                          {new Date(ev.event_date).toLocaleString('default', { month: 'short' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{ev.location || 'School'}</p>
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
