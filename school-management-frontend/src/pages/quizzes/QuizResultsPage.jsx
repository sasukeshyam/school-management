import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Trophy, Users, CheckCircle2, XCircle, Clock, BarChart3 } from 'lucide-react'
import { quizzesAPI } from '@/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, Badge, Avatar, Spinner } from '@/components/ui/index.jsx'
import { fPercent, fDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export const QuizResultsPage = () => {
  const { id } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['quiz-results', id],
    queryFn:  () => quizzesAPI.getResults(id).then(r => r.data.data),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!data)     return <p className="text-center py-20 text-muted-foreground">No data found</p>

  const { quiz, attempts = [], total, totalStudents, analysis = [] } = data

  const avgScore     = attempts.length ? (attempts.reduce((s, a) => s + a.score, 0) / attempts.length).toFixed(1) : 0
  const avgPercent   = attempts.length ? (attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length).toFixed(1) : 0
  const passCount    = attempts.filter(a => a.is_pass).length
  const notAttempted = totalStudents - attempts.length

  // Score distribution for chart
  const distribution = [
    { range: '0-20%',   count: attempts.filter(a => a.percentage < 20).length },
    { range: '20-40%',  count: attempts.filter(a => a.percentage >= 20 && a.percentage < 40).length },
    { range: '40-60%',  count: attempts.filter(a => a.percentage >= 40 && a.percentage < 60).length },
    { range: '60-80%',  count: attempts.filter(a => a.percentage >= 60 && a.percentage < 80).length },
    { range: '80-100%', count: attempts.filter(a => a.percentage >= 80).length },
  ]

  const pieData = [
    { name: 'Passed',        value: passCount,                        color: '#10b981' },
    { name: 'Failed',        value: attempts.length - passCount,      color: '#ef4444' },
    { name: 'Not attempted', value: notAttempted > 0 ? notAttempted : 0, color: '#94a3b8' },
  ].filter(d => d.value > 0)

  const formatTime = (seconds) => {
    if (!seconds) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/quizzes">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold">{quiz?.title} — Results</h1>
          <p className="text-xs text-muted-foreground">{quiz?.subject_id?.name} · {quiz?.total_questions} questions · {quiz?.total_marks} marks</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Students',  value: totalStudents,           icon: Users,        color: 'text-primary' },
          { label: 'Attempted',       value: attempts.length,         icon: CheckCircle2, color: 'text-blue-500' },
          { label: 'Avg Score',       value: `${avgPercent}%`,        icon: BarChart3,    color: 'text-amber-500' },
          { label: 'Pass Rate',       value: attempts.length ? `${((passCount/attempts.length)*100).toFixed(0)}%` : '—', icon: Trophy, color: 'text-emerald-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={cn('text-2xl font-bold font-display mt-1', s.color)}>{s.value}</p>
                </div>
                <div className={cn('p-2 rounded-xl bg-muted', s.color)}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Score distribution */}
        <Card>
          <CardHeader><CardTitle>Score Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="hsl(246 80% 58%)" radius={[4,4,0,0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pass/Fail pie */}
        <Card>
          <CardHeader><CardTitle>Attempt Overview</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Student results table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Results ({attempts.length} attempts)</CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No attempts yet</p>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-6 gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <span className="col-span-2">Student</span>
                <span className="text-center">Score</span>
                <span className="text-center">Percentage</span>
                <span className="text-center">Time</span>
                <span className="text-center">Result</span>
              </div>
              {attempts.map((attempt, i) => (
                <div key={attempt._id}
                  className={cn('grid grid-cols-6 gap-3 px-3 py-3 rounded-lg items-center transition-colors hover:bg-muted/30',
                    i % 2 === 0 ? '' : 'bg-muted/10'
                  )}>
                  <div className="col-span-2 flex items-center gap-2.5">
                    <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">#{i+1}</span>
                    <Avatar name={attempt.student_id?.user_id?.name || ''} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{attempt.student_id?.user_id?.name}</p>
                      <p className="text-xs text-muted-foreground">{fDate(attempt.submitted_at)}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">{attempt.score}</p>
                    <p className="text-xs text-muted-foreground">/ {attempt.total_marks}</p>
                  </div>
                  <div className="text-center">
                    <p className={cn('text-sm font-bold', attempt.percentage >= 75 ? 'text-emerald-600' : attempt.percentage >= 50 ? 'text-amber-500' : 'text-red-500')}>
                      {attempt.percentage}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" /> {formatTime(attempt.time_taken)}
                    </p>
                  </div>
                  <div className="text-center">
                    {quiz?.pass_marks > 0
                      ? (attempt.is_pass
                          ? <span className="text-xs font-semibold text-emerald-600 flex items-center justify-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Pass</span>
                          : <span className="text-xs font-semibold text-red-500 flex items-center justify-center gap-1"><XCircle className="h-3.5 w-3.5" /> Fail</span>
                        )
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Not attempted */}
      {notAttempted > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              ⚠️ {notAttempted} student{notAttempted !== 1 ? 's' : ''} {notAttempted !== 1 ? 'have' : 'has'} not attempted this quiz yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}