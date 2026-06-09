import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, BookOpen, DollarSign, ClipboardList } from 'lucide-react'
import { studentsAPI, attendanceAPI, feeCollectAPI } from '@/api'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, Avatar, Badge, Spinner } from '@/components/ui/index.jsx'
import { fDate, fCurrency, STATUS_COLORS, fPercent } from '@/utils/format'
import { cn } from '@/utils/cn'

export const StudentDetailPage = () => {
  const { id } = useParams()

  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn:  () => studentsAPI.getById(id).then((r) => r.data.data),
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['student-attendance', id],
    queryFn:  () => attendanceAPI.studentReport(id, {}).then((r) => r.data.data),
    enabled:  !!id,
  })

  const { data: feesData } = useQuery({
    queryKey: ['student-fees', id],
    queryFn:  () => feeCollectAPI.studentFees(id, {}).then((r) => r.data),
    enabled:  !!id,
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!studentData) return <p className="text-center py-20 text-muted-foreground">Student not found</p>

  const student  = studentData
  const user     = student.user_id || {}
  const parents  = student.parents || []
  const summary  = attendanceData?.summary || {}
  const fees     = feesData?.data          || []

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link to="/students">
        <Button variant="ghost" size="sm" className="-ml-2">
          <ArrowLeft className="h-4 w-4" /> Back to Students
        </Button>
      </Link>

      {/* Profile header */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar name={user.name} size="xl" src={user.avatar} />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold">{user.name}</h2>
                <Badge variant="success" className="capitalize">{student.status}</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                {[
                  { icon: Mail, value: user.email },
                  { icon: Phone, value: user.phone || '—' },
                  { icon: BookOpen, value: `${student.class_setup_id?.class_id?.name || ''} ${student.class_setup_id?.section_id?.name || ''}` },
                  { icon: Calendar, value: `Roll: ${student.roll_number || '—'}` },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:text-right shrink-0">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xl font-bold text-foreground">{summary.percentage || 0}%</p>
                <p className="text-xs text-muted-foreground">Attendance</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xl font-bold text-foreground">{student.admission_no || '—'}</p>
                <p className="text-xs text-muted-foreground">Adm No</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Personal info */}
        <Card>
          <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Date of Birth',  value: fDate(student.dob) },
              { label: 'Gender',         value: student.gender || '—' },
              { label: 'Blood Group',    value: student.blood_group || '—' },
              { label: 'Religion',       value: student.religion || '—' },
              { label: 'Enrolled',       value: fDate(student.enrollment_date) },
              { label: 'Session',        value: student.session_id?.name || '—' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm py-1 border-b border-border/40 last:border-0">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium capitalize">{item.value}</span>
              </div>
            ))}
            {student.address && (
              <div className="flex items-start gap-1.5 text-sm pt-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{student.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parents */}
        <Card>
          <CardHeader><CardTitle>Parents / Guardians</CardTitle></CardHeader>
          <CardContent>
            {parents.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-6">No parents linked</p>
              : <div className="space-y-3">
                  {parents.map((link) => (
                    <div key={link._id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{link.parent_id?.user_id?.name}</p>
                        <Badge variant="outline" className="text-xs capitalize">{link.relation}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{link.parent_id?.user_id?.phone || '—'}</p>
                      <p className="text-xs text-muted-foreground">{link.parent_id?.user_id?.email}</p>
                      {link.is_primary && <p className="text-xs text-primary font-medium mt-1">Primary guardian</p>}
                    </div>
                  ))}
                </div>
            }
          </CardContent>
        </Card>

        {/* Attendance summary */}
        <Card>
          <CardHeader><CardTitle>Attendance Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Present',  value: summary.present  || 0, color: 'text-emerald-600' },
              { label: 'Absent',   value: summary.absent   || 0, color: 'text-red-500' },
              { label: 'Late',     value: summary.late     || 0, color: 'text-amber-500' },
              { label: 'Half Day', value: summary.half_day || 0, color: 'text-blue-500' },
              { label: 'Total',    value: summary.total    || 0, color: 'text-foreground' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm py-1 border-b border-border/40 last:border-0">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={cn('font-semibold', item.color)}>{item.value}</span>
              </div>
            ))}
            <div className="pt-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Attendance Rate</span>
                <span className="font-bold text-primary">{summary.percentage || 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${summary.percentage || 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee ledger */}
      {fees.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Fee Ledger</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fees.map((fa) => (
                <div key={fa._id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{fa.fee_master_id?.fee_type_id?.name}</p>
                    <p className="text-xs text-muted-foreground">Due: {fDate(fa.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fCurrency(fa.amount)}</p>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md capitalize', STATUS_COLORS[fa.status])}>
                      {fa.status}
                    </span>
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
