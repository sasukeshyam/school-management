import { BookOpen, ClipboardList, DollarSign, Calendar, Award, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar } from '@/components/ui/index.jsx'
import { fDate, fPercent, STATUS_COLORS } from '@/utils/format'
import { cn } from '@/utils/cn'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const ATTENDANCE_COLORS = {
  present:  '#10b981',
  absent:   '#ef4444',
  late:     '#f59e0b',
  half_day: '#3b82f6',
  holiday:  '#8b5cf6',
}

export const StudentDashboard = ({ data = {} }) => {
  const { student, attendanceSummary = [], pendingFees = 0, upcomingEvents = [], upcomingExams = [] } = data

  const attendanceData = attendanceSummary
    .filter((a) => a._id && a._id !== 'holiday')
    .map((a) => ({ name: a._id, value: a.count, color: ATTENDANCE_COLORS[a._id] || '#94a3b8' }))

  const totalAttendance = attendanceSummary.reduce((s, a) => s + a.count, 0)
  const presentCount    = attendanceSummary.find((a) => a._id === 'present')?.count || 0
  const attendancePct   = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10">
        <Avatar name={student?.user_id?.name || ''} size="xl" src={student?.user_id?.avatar} />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold truncate">{student?.user_id?.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">Roll: {student?.roll_number || '—'}</Badge>
            <Badge variant="outline" className="text-xs">Adm: {student?.admission_no || '—'}</Badge>
            <Badge variant="success" className="text-xs capitalize">{student?.status || 'active'}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {student?.class_setup_id?.class_id?.name} {student?.class_setup_id?.section_id?.name}
            {student?.class_setup_id?.shift_id && ` · ${student.class_setup_id.shift_id.name} Shift`}
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-3xl font-display font-bold text-primary">{attendancePct}%</p>
          <p className="text-xs text-muted-foreground">Attendance</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Attendance"  value={`${attendancePct}%`} icon={ClipboardList} color="success" />
        <StatCard label="Pending Fees" value={pendingFees}         icon={DollarSign}    color={pendingFees > 0 ? 'danger' : 'success'} />
        <StatCard label="Events"      value={upcomingEvents.length} icon={Calendar}     color="info"    />
        <StatCard label="Exams"       value={upcomingExams.length}  icon={Award}        color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance chart */}
        <Card>
          <CardHeader><CardTitle>Attendance Summary</CardTitle></CardHeader>
          <CardContent>
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={attendanceData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {attendanceData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v, n) => [v, n.charAt(0).toUpperCase() + n.slice(1)]}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No attendance data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming exams */}
        <Card>
          <CardHeader><CardTitle>Upcoming Exams</CardTitle></CardHeader>
          <CardContent>
            {upcomingExams.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No upcoming exams</p>
              : <div className="space-y-3">
                  {upcomingExams.map((ex) => (
                    <div key={ex._id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                      <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                        <Award className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ex.title}</p>
                        <p className="text-xs text-muted-foreground">{ex.exam_type_id?.name}</p>
                      </div>
                      <span className={cn('text-xs px-2 py-0.5 rounded capitalize font-medium', STATUS_COLORS[ex.status])}>
                        {ex.status}
                      </span>
                    </div>
                  ))}
                </div>
            }
          </CardContent>
        </Card>

        {/* Upcoming events */}
        <Card>
          <CardHeader><CardTitle>Events</CardTitle></CardHeader>
          <CardContent>
            {upcomingEvents.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No upcoming events</p>
              : <div className="space-y-3">
                  {upcomingEvents.map((ev) => (
                    <div key={ev._id} className="flex items-start gap-3">
                      <div className="shrink-0 w-10 text-center rounded-lg bg-primary/10 py-1.5">
                        <p className="text-base font-bold text-primary leading-none">{new Date(ev.event_date).getDate()}</p>
                        <p className="text-[10px] text-primary/60">
                          {new Date(ev.event_date).toLocaleString('default', { month: 'short' })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{ev.location || 'School'}</p>
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
