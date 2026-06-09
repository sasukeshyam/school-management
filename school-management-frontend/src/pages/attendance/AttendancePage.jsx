import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Save, ClipboardList } from 'lucide-react'
import { attendanceAPI, classSetupsAPI, sessionsAPI, subjectsAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Select, Label, Badge, Avatar } from '@/components/ui/index.jsx'
import { toast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'

const STATUS_OPTIONS = [
  { value: 'present',  label: 'Present',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'absent',   label: 'Absent',   color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'     },
  { value: 'late',     label: 'Late',     color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'half_day', label: 'Half Day', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' },
]

export const AttendancePage = () => {
  const today = new Date().toISOString().split('T')[0]
  const [classSetupId, setClassSetupId] = useState('')
  const [subjectId,    setSubjectId]    = useState('')
  const [date,         setDate]         = useState(today)
  const [records,      setRecords]      = useState({})
  const [notes,        setNotes]        = useState({})

  const { data: classSetups } = useQuery({
    queryKey: ['class-setups-all'],
    queryFn:  () => classSetupsAPI.getAll({ limit: 100 }).then((r) => r.data.data),
  })

  const { data: subjects } = useQuery({
    queryKey: ['subjects-all'],
    queryFn:  () => subjectsAPI.getAll({ limit: 100 }).then((r) => r.data.data),
  })

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['attendance-class', classSetupId, date, subjectId],
    queryFn:  () => attendanceAPI.getByClass({ class_setup_id: classSetupId, date, subject_id: subjectId || undefined }).then((r) => r.data.data),
    enabled:  !!classSetupId,
    onSuccess: (data) => {
      const r = {}, n = {}
      data.forEach((a) => {
        r[a.student_id?._id] = a.status
        n[a.student_id?._id] = a.note || ''
      })
      setRecords(r)
      setNotes(n)
    },
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => attendanceAPI.mark(payload),
    onSuccess:  () => toast.success('Attendance saved successfully'),
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to save attendance'),
  })

  const students = existing?.map((a) => a.student_id).filter(Boolean) || []

  const setAll = (status) => {
    const updated = {}
    students.forEach((s) => { updated[s._id] = status })
    setRecords(updated)
  }

  const handleSave = () => {
    if (!classSetupId) return toast.error('Please select a class')
    if (!date)         return toast.error('Please select a date')

    const payload = {
      class_setup_id: classSetupId,
      date,
      subject_id: subjectId || undefined,
      records: students.map((s) => ({
        student_id: s._id,
        status: records[s._id] || 'present',
        note:   notes[s._id]   || '',
      })),
    }
    saveMutation.mutate(payload)
  }

  const summary = students.reduce((acc, s) => {
    const st = records[s._id] || 'present'
    acc[st]  = (acc[st] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Mark and track student attendance"
        breadcrumbs={[{ label: 'Attendance' }]}
        action={
          <Button onClick={handleSave} loading={saveMutation.isPending} disabled={!classSetupId}>
            <Save className="h-4 w-4" /> Save Attendance
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Class *</Label>
              <Select value={classSetupId} onChange={(e) => setClassSetupId(e.target.value)}>
                <option value="">Select class</option>
                {(classSetups || []).map((cs) => (
                  <option key={cs._id} value={cs._id}>
                    {cs.class_id?.name} {cs.section_id?.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subject (optional)</Label>
              <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">All subjects</option>
                {(subjects || []).map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mark All</Label>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setAll('present')}>Present</Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setAll('absent')}>Absent</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary badges */}
      {students.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <span key={s.value} className={cn('text-xs font-medium px-3 py-1 rounded-full border', s.color)}>
              {s.label}: {summary[s.value] || 0}
            </span>
          ))}
          <span className="text-xs text-muted-foreground px-3 py-1 rounded-full border border-border">
            Total: {students.length}
          </span>
        </div>
      )}

      {/* Attendance rows */}
      {!classSetupId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="p-3 rounded-xl bg-muted"><ClipboardList className="h-8 w-8 text-muted-foreground" /></div>
            <p className="font-medium">Select a class to mark attendance</p>
            <p className="text-sm text-muted-foreground">Choose class and date from the filters above</p>
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="font-medium text-muted-foreground">No students found for this class</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {students.map((student, i) => {
                const currentStatus = records[student?._id] || 'present'
                return (
                  <div key={student?._id || i} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors">
                    <span className="text-xs text-muted-foreground w-6 shrink-0 font-mono">{String(i + 1).padStart(2, '0')}</span>
                    <Avatar name={student?.user_id?.name || ''} size="sm" src={student?.user_id?.avatar} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student?.user_id?.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{student?.roll_number || '—'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setRecords((prev) => ({ ...prev, [student._id]: s.value }))}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                            currentStatus === s.value ? s.color : 'border-transparent text-muted-foreground hover:bg-muted'
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Note..."
                      value={notes[student._id] || ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [student._id]: e.target.value }))}
                      className="w-28 h-7 px-2 text-xs rounded-md border border-input bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring hidden lg:block"
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
