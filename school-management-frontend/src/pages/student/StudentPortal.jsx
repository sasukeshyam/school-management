import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, Clock, ClipboardList, FileText,
  DollarSign, Award, BookMarked, Bell, User, LogOut,
  School, Calendar, TrendingUp, BookOpen, CheckCircle2,
  AlertCircle, ChevronRight, Download, PenSquare
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useLogout } from '@/hooks/useAuth'
import { dashboardAPI, attendanceAPI, feeCollectAPI, assignmentsAPI,
         classRoutinesAPI, notificationsAPI, marksheetsAPI, eventsAPI } from '@/api'
import api from '@/api/axios'
import { Avatar, Badge, Card, CardContent, CardHeader, CardTitle, Spinner } from '@/components/ui/index.jsx'
import { Button } from '@/components/ui/Button'
import { fDate, fCurrency, fPercent, STATUS_COLORS } from '@/utils/format'
import { cn } from '@/utils/cn'
import { ToastContainer } from '@/components/ui/Toast'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { QuizTab } from './QuizTab'

const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
const TODAY = DAYS[new Date().getDay()]

const NAV = [
  { id: 'dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'routine',       label: 'Class Routine', icon: Clock           },
  { id: 'attendance',    label: 'Attendance',    icon: ClipboardList   },
  { id: 'assignments',   label: 'Assignments',   icon: BookMarked      },
  { id: 'exams',         label: 'Exams & Results',icon: Award          },
  { id: 'fees',          label: 'Fee Payment',   icon: DollarSign      },
  { id: 'quiz',          label: 'Quizzes',        icon: FileText        },
  { id: 'notifications', label: 'Notifications', icon: Bell            },
  { id: 'profile',       label: 'My Profile',    icon: User            },
]

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = ({ data = {}, student }) => {
  const { attendanceSummary = [], pendingFees = 0, upcomingEvents = [], upcomingExams = [] } = data
  const total    = attendanceSummary.reduce((s, a) => s + a.count, 0)
  const present  = attendanceSummary.find(a => a._id === 'present')?.count || 0
  const pct      = total > 0 ? ((present / total) * 100).toFixed(1) : 0
  const pieData  = attendanceSummary.filter(a => a._id && a._id !== 'holiday')
    .map(a => ({ name: a._id, value: a.count,
      color: { present:'#10b981', absent:'#ef4444', late:'#f59e0b', half_day:'#3b82f6' }[a._id] || '#94a3b8' }))

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-5 text-white">
        <div className="flex items-center gap-3">
          <Avatar name={student?.user_id?.name || ''} size="lg" src={student?.user_id?.avatar} className="border-2 border-white/30" />
          <div>
            <p className="text-white/70 text-sm">Welcome back,</p>
            <h2 className="font-display text-xl font-bold">{student?.user_id?.name}</h2>
            <div className="flex gap-2 mt-1 flex-wrap">
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {student?.class_setup_id?.class_id?.name} {student?.class_setup_id?.section_id?.name}
              </span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Roll: {student?.roll_number || '—'}</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Adm: {student?.admission_no || '—'}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Attendance', value: `${pct}%` },
            { label: 'Pending Fees', value: pendingFees },
            { label: 'Upcoming Exams', value: upcomingExams.length },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/10 p-3 text-center">
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Attendance chart */}
        <Card>
          <CardHeader><CardTitle>Attendance Overview</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {attendanceSummary.map(a => (
                    <div key={a._id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                      <span className="text-xs capitalize text-muted-foreground">{a._id}</span>
                      <span className="text-sm font-semibold">{a.count}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10 col-span-2">
                    <span className="text-xs text-primary font-medium">Attendance Rate</span>
                    <span className="text-sm font-bold text-primary">{pct}%</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No attendance data yet</p>
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
                  {upcomingExams.map(ex => (
                    <div key={ex._id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                        <Award className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{ex.title}</p>
                        <p className="text-xs text-muted-foreground">{ex.exam_type_id?.name}</p>
                      </div>
                      <span className={cn('text-xs px-2 py-0.5 rounded capitalize font-medium', STATUS_COLORS[ex.status])}>{ex.status}</span>
                    </div>
                  ))}
                </div>
            }
          </CardContent>
        </Card>
      </div>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {upcomingEvents.map(ev => (
                <div key={ev._id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <div className="shrink-0 w-10 text-center rounded-lg bg-primary/10 py-1.5">
                    <p className="text-base font-bold text-primary leading-none">{new Date(ev.event_date).getDate()}</p>
                    <p className="text-[10px] text-primary/60">{new Date(ev.event_date).toLocaleString('default', { month: 'short' })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{ev.location || 'School'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Routine Tab ──────────────────────────────────────────────────────────────
const RoutineTab = ({ student }) => {
  const classSetupId = student?.class_setup_id?._id || student?.class_setup_id
  const [selectedDay, setSelectedDay] = useState(TODAY)

  const { data, isLoading } = useQuery({
    queryKey: ['student-routine', classSetupId, selectedDay],
    queryFn:  () => classRoutinesAPI.getAll({ class_setup_id: classSetupId, day_of_week: selectedDay, limit: 50 }).then(r => r.data.data),
    enabled:  !!classSetupId,
  })

  const DAY_COLORS = {
    sunday:'bg-red-100 text-red-700', monday:'bg-blue-100 text-blue-700',
    tuesday:'bg-purple-100 text-purple-700', wednesday:'bg-emerald-100 text-emerald-700',
    thursday:'bg-amber-100 text-amber-700', friday:'bg-indigo-100 text-indigo-700',
    saturday:'bg-pink-100 text-pink-700',
  }

  const periods = [...(data || [])].sort((a, b) => a.start_time?.localeCompare(b.start_time))

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Select Day</p>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(d => (
              <button key={d} onClick={() => setSelectedDay(d)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border',
                  selectedDay === d ? DAY_COLORS[d] + ' border-current' : 'border-border text-muted-foreground hover:bg-muted'
                )}>
                {d === TODAY ? `${d} (Today)` : d}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : periods.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <Clock className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No classes on {selectedDay}</p>
          <p className="text-sm text-muted-foreground">Enjoy your free time!</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {periods.map((period, i) => {
            const isNow = (() => {
              if (selectedDay !== TODAY) return false
              const now = new Date()
              const [sh, sm] = (period.start_time || '').split(':').map(Number)
              const [eh, em] = (period.end_time   || '').split(':').map(Number)
              const start = sh * 60 + sm, end = eh * 60 + em
              const cur   = now.getHours() * 60 + now.getMinutes()
              return cur >= start && cur <= end
            })()
            return (
              <div key={period._id}
                className={cn('flex items-center gap-4 p-4 rounded-xl border transition-all',
                  isNow ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card'
                )}>
                <div className="shrink-0 text-center w-16">
                  <p className="text-xs font-mono font-semibold text-muted-foreground">{period.start_time}</p>
                  <div className="h-px bg-border my-1" />
                  <p className="text-xs font-mono text-muted-foreground">{period.end_time}</p>
                </div>
                <div className={cn('w-1 h-12 rounded-full shrink-0', isNow ? 'bg-primary' : 'bg-border')} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{period.subject_id?.name}</p>
                    {isNow && <Badge variant="success" className="text-[10px]">Now</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {period.teacher_id?.user_id?.name || 'Teacher'} · Room {period.room || '—'}
                  </p>
                </div>
                <div className={cn('px-2 py-1 rounded-lg text-xs font-medium capitalize', DAY_COLORS[selectedDay])}>
                  {period.subject_id?.type || 'theory'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────
const AttendanceTab = ({ student }) => {
  const studentId = student?._id
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const year = new Date().getFullYear()

  const { data, isLoading } = useQuery({
    queryKey: ['student-attendance-report', studentId, month],
    queryFn:  () => attendanceAPI.studentReport(studentId, {
      from: `${year}-${String(month).padStart(2,'0')}-01`,
      to:   `${year}-${String(month).padStart(2,'0')}-31`,
    }).then(r => r.data.data),
    enabled: !!studentId,
  })

  const records = data?.records || []
  const summary = data?.summary || {}

  const STATUS_CONFIG = {
    present:  { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    absent:   { color: 'bg-red-100 text-red-700 border-red-200',             dot: 'bg-red-500'     },
    late:     { color: 'bg-amber-100 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   },
    half_day: { color: 'bg-blue-100 text-blue-700 border-blue-200',          dot: 'bg-blue-500'    },
    holiday:  { color: 'bg-purple-100 text-purple-700 border-purple-200',    dot: 'bg-purple-500'  },
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="space-y-4">
      {/* Month picker */}
      <Card><CardContent className="pt-4">
        <div className="flex gap-2 flex-wrap">
          {MONTHS.map((m, i) => (
            <button key={m} onClick={() => setMonth(i + 1)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                month === i + 1 ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:bg-muted'
              )}>{m}</button>
          ))}
        </div>
      </CardContent></Card>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Present',  value: summary.present  || 0, color: 'text-emerald-600' },
          { label: 'Absent',   value: summary.absent   || 0, color: 'text-red-500'     },
          { label: 'Late',     value: summary.late     || 0, color: 'text-amber-500'   },
          { label: 'Rate',     value: `${summary.percentage || 0}%`, color: 'text-primary' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 text-center">
              <p className={cn('text-2xl font-bold font-display', s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress bar */}
      <Card><CardContent className="pt-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Attendance Rate</span>
          <span className="font-bold text-primary">{summary.percentage || 0}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${summary.percentage || 0}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0%</span>
          <span className={cn('font-medium', Number(summary.percentage) >= 75 ? 'text-emerald-600' : 'text-red-500')}>
            {Number(summary.percentage) >= 75 ? '✓ Good standing' : '⚠ Below 75% — at risk'}
          </span>
          <span>100%</span>
        </div>
      </CardContent></Card>

      {/* Day by day */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : records.length === 0 ? (
        <Card><CardContent className="text-center py-12 text-muted-foreground text-sm">No attendance records for this month</CardContent></Card>
      ) : (
        <Card><CardContent className="pt-4">
          <div className="space-y-2">
            {records.map(r => {
              const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.present
              return (
                <div key={r._id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', cfg.dot)} />
                    <p className="text-sm font-medium">{fDate(r.date, 'EEE, dd MMM')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.note && <p className="text-xs text-muted-foreground hidden sm:block">{r.note}</p>}
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md capitalize border', cfg.color)}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent></Card>
      )}
    </div>
  )
}

// ─── Assignments Tab ──────────────────────────────────────────────────────────
const AssignmentsTab = ({ student }) => {
  const [filter, setFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['student-assignments', filter],
    queryFn:  () => assignmentsAPI.myAssignments({ limit: 50, ...(filter !== 'all' && { status: filter }) }).then(r => r.data),
  })

  const items = data?.data || []

  const STATUS_CFG = {
    pending:   { color: 'bg-amber-100 text-amber-700', label: 'Pending'   },
    submitted: { color: 'bg-blue-100 text-blue-700',   label: 'Submitted' },
    graded:    { color: 'bg-emerald-100 text-emerald-700', label: 'Graded' },
    late:      { color: 'bg-red-100 text-red-700',     label: 'Late'      },
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {['all','pending','submitted','graded','late'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
              filter === f ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}>{f}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="text-center py-12 text-muted-foreground text-sm">No assignments found</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(sub => {
            const assign = sub.assignment_id || sub
            const cfg    = STATUS_CFG[sub.status] || STATUS_CFG.pending
            const isOverdue = new Date(assign.due_date) < new Date() && sub.status === 'pending'
            return (
              <Card key={sub._id} className={cn('hover:shadow-sm transition-shadow', isOverdue && 'border-red-200 dark:border-red-800')}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{assign.title}</p>
                        {isOverdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {assign.subject_id?.name} · Due: <span className={cn('font-medium', isOverdue ? 'text-red-500' : 'text-foreground')}>{fDate(assign.due_date)}</span>
                      </p>
                      {assign.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{assign.description}</p>}
                    </div>
                    <span className={cn('text-xs font-medium px-2 py-1 rounded-lg shrink-0', cfg.color)}>{cfg.label}</span>
                  </div>
                  {sub.marks_obtained !== null && sub.marks_obtained !== undefined && (
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Marks: <span className="font-bold text-foreground">{sub.marks_obtained} / {assign.total_marks}</span></p>
                      {sub.feedback && <p className="text-xs text-muted-foreground italic">"{sub.feedback}"</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Fees Tab ─────────────────────────────────────────────────────────────────
const FeesTab = ({ student }) => {
  const studentId = student?._id

  const { data, isLoading } = useQuery({
    queryKey: ['student-fees-portal', studentId],
    queryFn:  () => feeCollectAPI.studentFees(studentId, { limit: 50 }).then(r => r.data),
    enabled:  !!studentId,
  })

  const fees = data?.data || []
  const totalDue  = fees.filter(f => f.status !== 'paid').reduce((s, f) => s + (f.amount - (f.total_paid || 0)), 0)
  const totalPaid = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0)

  const STATUS_CFG = {
    paid:    { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    unpaid:  { color: 'bg-red-100 text-red-700',         icon: AlertCircle  },
    partial: { color: 'bg-amber-100 text-amber-700',     icon: AlertCircle  },
    overdue: { color: 'bg-red-100 text-red-700',         icon: AlertCircle  },
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Due</p>
            <p className="text-2xl font-bold font-display text-red-500 mt-1">{fCurrency(totalDue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{fees.filter(f => f.status !== 'paid').length} pending</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold font-display text-emerald-600 mt-1">{fCurrency(totalPaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">{fees.filter(f => f.status === 'paid').length} cleared</p>
          </CardContent>
        </Card>
      </div>

      {/* Fee notice */}
      {totalDue > 0 && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Payment Due</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              You have outstanding fees of <strong>{fCurrency(totalDue)}</strong>. Please contact the school office or pay at the fee counter.
            </p>
          </div>
        </div>
      )}

      {/* Fee list */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : fees.length === 0 ? (
        <Card><CardContent className="text-center py-12 text-muted-foreground text-sm">No fee records found</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {fees.map(fee => {
            const cfg = STATUS_CFG[fee.status] || STATUS_CFG.unpaid
            const StatusIcon = cfg.icon
            return (
              <Card key={fee._id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={cn('p-2 rounded-lg shrink-0', cfg.color)}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{fee.fee_master_id?.fee_type_id?.name || 'Fee'}</p>
                        <p className="text-xs text-muted-foreground">{fee.fee_master_id?.fee_group_id?.name}</p>
                        <p className="text-xs text-muted-foreground">Due: {fDate(fee.due_date)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold">{fCurrency(fee.amount)}</p>
                      {fee.total_paid > 0 && fee.status !== 'paid' && (
                        <p className="text-xs text-emerald-600">Paid: {fCurrency(fee.total_paid)}</p>
                      )}
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md capitalize', cfg.color)}>{fee.status}</span>
                    </div>
                  </div>

                  {/* Payment history */}
                  {fee.payments?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Payment History</p>
                      {fee.payments.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{fDate(p.paid_date)} · {p.payment_method} · {p.receipt_no}</span>
                          <span className="font-medium text-emerald-600">{fCurrency(p.amount_paid)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Exams & Results Tab ──────────────────────────────────────────────────────
const ExamsTab = ({ student }) => {
  const classSetupId = student?.class_setup_id?._id || student?.class_setup_id
  const studentId    = student?._id

  const { data: examsData } = useQuery({
    queryKey: ['student-exams', classSetupId],
    queryFn:  () => api.get('/exams', { params: { class_setup_id: classSetupId, limit: 20 } }).then(r => r.data.data),
    enabled: !!classSetupId,
  })

  const { data: marksData } = useQuery({
    queryKey: ['student-marksheets', studentId],
    queryFn:  () => marksheetsAPI.getAll({ student_id: studentId, status: 'published', limit: 20 }).then(r => r.data.data),
    enabled: !!studentId,
  })

  const { data: admitData } = useQuery({
    queryKey: ['student-admit-cards', studentId],
    queryFn:  () => api.get('/admit-cards', { params: { student_id: studentId, limit: 20 } }).then(r => r.data.data),
    enabled: !!studentId,
  })

  return (
    <div className="space-y-5">
      {/* Admit Cards */}
      {admitData?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>My Admit Cards</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {admitData.map(card => (
                <div key={card._id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium">{card.exam_id?.title || 'Exam'}</p>
                    <p className="text-xs text-muted-foreground">Seat No: <strong>{card.seat_number}</strong> · {fDate(card.issued_at)}</p>
                  </div>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md capitalize', STATUS_COLORS[card.status])}>{card.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Published Results */}
      <Card>
        <CardHeader><CardTitle>My Results</CardTitle></CardHeader>
        <CardContent>
          {!marksData?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No results published yet</p>
          ) : (
            <div className="space-y-3">
              {marksData.map(m => (
                <div key={m._id} className="p-4 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">{m.exam_id?.title}</p>
                    <span className={cn('text-xs font-semibold px-2 py-1 rounded-lg', m.is_pass ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                      {m.is_pass ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Obtained',   value: m.total_obtained },
                      { label: 'Total',      value: m.total_marks    },
                      { label: 'Percentage', value: `${m.percentage}%` },
                      { label: 'Grade',      value: m.final_grade,   big: true },
                    ].map(s => (
                      <div key={s.label} className="p-2 rounded-lg bg-muted/40">
                        <p className={cn('font-bold', s.big ? 'text-xl text-primary' : 'text-sm')}>{s.value}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {m.rank && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">Class Rank: <strong>#{m.rank}</strong></p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming exams */}
      <Card>
        <CardHeader><CardTitle>Upcoming Exams</CardTitle></CardHeader>
        <CardContent>
          {!examsData?.filter(e => e.status === 'published').length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No upcoming exams scheduled</p>
          ) : (
            <div className="space-y-3">
              {examsData.filter(e => e.status === 'published').map(ex => (
                <div key={ex._id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ex.title}</p>
                    <p className="text-xs text-muted-foreground">{ex.exam_type_id?.name} · Total: {ex.total_marks} marks · Pass: {ex.passing_marks}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
const NotificationsTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['student-notifications'],
    queryFn:  () => notificationsAPI.my({ limit: 30 }).then(r => r.data),
  })
  const items = data?.data || []
  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <Bell className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No notifications yet</p>
        </CardContent></Card>
      ) : items.map(item => {
        const n = item.notification_id || item
        return (
          <div key={item._id} className={cn('p-4 rounded-xl border transition-all',
            item.is_read ? 'border-border bg-card' : 'border-primary/30 bg-primary/5'
          )}>
            <div className="flex items-start gap-3">
              <div className={cn('mt-1 h-2 w-2 rounded-full shrink-0', item.is_read ? 'bg-muted' : 'bg-primary')} />
              <div className="flex-1">
                <p className={cn('text-sm', !item.is_read && 'font-semibold')}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{fDate(n.created_at)}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
const ProfileTab = ({ student, user }) => (
  <div className="space-y-4">
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name || ''} size="xl" src={user?.avatar} />
          <div>
            <h3 className="font-display font-bold text-xl">{user?.name}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground">{user?.phone || '—'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Academic Info</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'Class',         value: `${student?.class_setup_id?.class_id?.name || ''} ${student?.class_setup_id?.section_id?.name || ''}` },
            { label: 'Roll Number',   value: student?.roll_number    || '—' },
            { label: 'Admission No',  value: student?.admission_no   || '—' },
            { label: 'Session',       value: student?.session_id?.name || '—' },
            { label: 'Enrolled',      value: fDate(student?.enrollment_date) },
            { label: 'Status',        value: student?.status,        badge: true },
          ].map(item => (
            <div key={item.label} className="flex justify-between py-1.5 border-b border-border/40 last:border-0 text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              {item.badge
                ? <Badge variant="success" className="capitalize">{item.value}</Badge>
                : <span className="font-medium">{item.value}</span>
              }
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'Date of Birth', value: fDate(student?.dob) },
            { label: 'Gender',        value: student?.gender      || '—' },
            { label: 'Blood Group',   value: student?.blood_group || '—' },
            { label: 'Religion',      value: student?.religion    || '—' },
            { label: 'Address',       value: student?.address     || '—' },
          ].map(item => (
            <div key={item.label} className="flex justify-between py-1.5 border-b border-border/40 last:border-0 text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium capitalize text-right max-w-40 truncate">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
)

// ─── Main Portal ──────────────────────────────────────────────────────────────
export const StudentPortal = () => {
  const user          = useAuthStore(s => s.user)
  const toggleTheme   = useUIStore(s => s.toggleTheme)
  const theme         = useUIStore(s => s.theme)
  const unreadCount   = useUIStore(s => s.unreadCount)
  const { mutate: logout } = useLogout()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['student-portal-dashboard'],
    queryFn:  () => dashboardAPI.getStudent().then(r => r.data.data),
  })

  const student = dashData?.student

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading your portal...</p>
      </div>
    </div>
  )

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':     return <OverviewTab data={dashData} student={student} />
      case 'routine':       return <RoutineTab student={student} />
      case 'attendance':    return <AttendanceTab student={student} />
      case 'assignments':   return <AssignmentsTab student={student} />
      case 'exams':         return <ExamsTab student={student} />
      case 'fees':          return <FeesTab student={student} />
      case 'quiz':          return <QuizTab student={student} />
      case 'notifications': return <NotificationsTab />
      case 'profile':       return <ProfileTab student={student} user={user} />
      default:              return null
    }
  }

  const currentNav = NAV.find(n => n.id === activeTab)

  return (
    <div className="min-h-screen bg-background flex">
      <ToastContainer />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 z-30 h-screen flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-0 lg:w-60 overflow-hidden lg:overflow-visible'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 h-14 px-4 border-b border-sidebar-border shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <School className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm text-white truncate">EduCore</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">Student Portal</p>
          </div>
        </div>

        {/* Student info */}
        <div className="px-3 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-sidebar-border/20">
            <Avatar name={user?.name || ''} size="sm" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">
                {student?.class_setup_id?.class_id?.name} {student?.class_setup_id?.section_id?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
              className={cn(
                'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm transition-all text-left relative',
                activeTab === item.id
                  ? 'bg-sidebar-accent text-white font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-border/40 hover:text-sidebar-foreground'
              )}>
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              {item.id === 'notifications' && unreadCount > 0 && (
                <span className="ml-auto h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-sidebar-border">
          <button onClick={() => logout()}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex items-center gap-3 h-14 px-4 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)} className="lg:hidden p-1.5 rounded-md hover:bg-muted">
            <div className="space-y-1"><div className="h-0.5 w-5 bg-foreground" /><div className="h-0.5 w-5 bg-foreground" /><div className="h-0.5 w-5 bg-foreground" /></div>
          </button>
          <h1 className="font-display font-semibold text-base">{currentNav?.label}</h1>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={() => { setActiveTab('notifications'); setSidebarOpen(false) }}
              className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full animate-fade-in">
          {renderTab()}
        </main>
      </div>
    </div>
  )
}
