import { Users, GraduationCap, UserCheck, Calendar, DollarSign, TrendingUp, BookOpen, Award } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui/index.jsx'
import { fCurrency, fDate, STATUS_COLORS } from '@/utils/format'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { cn } from '@/utils/cn'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export const AdminDashboard = ({ data = {} }) => {
  const { stats = {}, fees = {}, upcoming_events = [], recent_exams = [], current_session } = data

  const monthlyData = MONTHS.map((month, i) => {
    const found = fees.monthly_collection?.find((m) => m._id?.month === i + 1)
    return { month, amount: found?.total || 0 }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {current_session ? `Session: ${current_session.name}` : 'Welcome back'}
          </p>
        </div>
        <Badge variant="success" className="text-xs px-3 py-1">
          {current_session?.name || 'Active'}
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats.students ?? 0} icon={GraduationCap} color="primary"  />
        <StatCard label="Teachers"        value={stats.teachers ?? 0} icon={UserCheck}     color="success"  />
        <StatCard label="Parents"         value={stats.parents  ?? 0} icon={Users}          color="info"     />
        <StatCard label="Sessions"        value={stats.sessions ?? 0} icon={Calendar}       color="warning"  />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fee collection chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fee Collection {new Date().getFullYear()}</span>
              <span className="font-sans text-sm font-normal text-muted-foreground">Monthly</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(246 80% 58%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(246 80% 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v) => [fCurrency(v), 'Collected']}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(246 80% 58%)" strokeWidth={2} fill="url(#feeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee summary */}
        <Card>
          <CardHeader><CardTitle>Fee Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Total Assigned', value: fees.summary?.total_assigned || 0, color: 'text-foreground'  },
{ label: 'Paid',           value: fees.summary?.paid_count     || 0, color: 'text-emerald-600' },
{ label: 'Unpaid',         value: fees.summary?.unpaid_count   || 0, color: 'text-red-500'     },
{ label: 'Overdue',        value: 0,                                  color: 'text-amber-500'   },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={cn('text-sm font-semibold', item.color)}>{fCurrency(item.value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming events */}
        <Card>
          <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
          <CardContent>
            {upcoming_events.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-6">No upcoming events</p>
              : <div className="space-y-3">
                  {upcoming_events.map((ev) => (
                    <div key={ev._id} className="flex items-start gap-3">
                      <div className="shrink-0 w-10 text-center rounded-lg bg-primary/10 py-1">
                        <p className="text-lg font-bold text-primary leading-none">{new Date(ev.event_date).getDate()}</p>
                        <p className="text-[10px] text-primary/70">{MONTHS[new Date(ev.event_date).getMonth()]}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{ev.location || 'School'} · {ev.start_time || ''}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize shrink-0">{ev.audience}</Badge>
                    </div>
                  ))}
                </div>
            }
          </CardContent>
        </Card>

        {/* Recent exams */}
        <Card>
          <CardHeader><CardTitle>Recent Exams</CardTitle></CardHeader>
          <CardContent>
            {recent_exams.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-6">No exams yet</p>
              : <div className="space-y-3">
                  {recent_exams.map((ex) => (
                    <div key={ex._id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ex.title}</p>
                        <p className="text-xs text-muted-foreground">{ex.exam_type_id?.name} · {fDate(ex.created_at)}</p>
                      </div>
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md capitalize', STATUS_COLORS[ex.status] || '')}>
                        {ex.status}
                      </span>
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
