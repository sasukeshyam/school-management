import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, Eye, Pencil, Trash2, Play, Square, BarChart3, CheckCircle2, Clock } from 'lucide-react'
import { quizzesAPI, classSetupsAPI, subjectsAPI, sessionsAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Badge, Input, Label, Select, Textarea } from '@/components/ui/index.jsx'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { toast } from '@/hooks/useToast'
import { fDate, fDateTime, STATUS_COLORS } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

// ─── Quiz Form ────────────────────────────────────────────────────────────────
const QuizForm = ({ initial, onSuccess, onCancel }) => {
  const { data: classSetups } = useQuery({ queryKey: ['class-setups-all'], queryFn: () => classSetupsAPI.getAll({ limit: 100 }).then(r => r.data.data) })
  const { data: subjects }    = useQuery({ queryKey: ['subjects-all'],     queryFn: () => subjectsAPI.getAll({ limit: 100 }).then(r => r.data.data) })
  const { data: sessions }    = useQuery({ queryKey: ['sessions-all'],     queryFn: () => sessionsAPI.getAll({ limit: 100 }).then(r => r.data.data) })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title:             initial?.title              || '',
      description:       initial?.description        || '',
      instructions:      initial?.instructions       || '',
      subject_id:        initial?.subject_id?._id    || '',
      session_id:        initial?.session_id?._id    || '',
      class_setup_ids:   initial?.class_setup_ids?.map(c => c._id || c) || [],
      time_limit:        initial?.time_limit         || 30,
      pass_marks:        initial?.pass_marks         || 0,
      shuffle_questions: initial?.shuffle_questions  || false,
      show_result:       initial?.show_result        ?? true,
      show_answers:      initial?.show_answers       || false,
      allow_reattempt:   initial?.allow_reattempt    || false,
      start_time:        initial?.start_time ? new Date(initial.start_time).toISOString().slice(0,16) : '',
      end_time:          initial?.end_time   ? new Date(initial.end_time).toISOString().slice(0,16)   : '',
    }
  })

  const selectedClasses = watch('class_setup_ids') || []

  const toggleClass = (id) => {
    const current = watch('class_setup_ids') || []
    if (current.includes(id)) setValue('class_setup_ids', current.filter(c => c !== id))
    else setValue('class_setup_ids', [...current, id])
  }

  const mutation = useMutation({
    mutationFn: d => {
      const clean = { ...d }
      if (!clean.subject_id) delete clean.subject_id
      if (!clean.session_id) delete clean.session_id
      if (!clean.start_time) delete clean.start_time
      if (!clean.end_time)   delete clean.end_time
      return initial ? quizzesAPI.update(initial._id, clean) : quizzesAPI.create(clean)
    },
    onSuccess: () => { toast.success(initial ? 'Quiz updated' : 'Quiz created! Now add questions.'); onSuccess?.() },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Quiz Title *</Label>
        <Input placeholder="e.g. Chapter 5 MCQ Test" {...register('title', { required: true })} />
        {errors.title && <p className="text-xs text-destructive">Title is required</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea placeholder="Brief description about this quiz..." {...register('description')} />
      </div>

      <div className="space-y-1.5">
        <Label>Instructions for students</Label>
        <Textarea placeholder="e.g. Read each question carefully. No negative marking." {...register('instructions')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Subject *</Label>
          <Select {...register('subject_id', { required: true })}>
            <option value="">Select subject</option>
            {(subjects || []).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
          {errors.subject_id && <p className="text-xs text-destructive">Required</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Session</Label>
          <Select {...register('session_id')}>
            <option value="">Select session</option>
            {(sessions || []).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Time Limit (minutes) — 0 = no limit</Label>
          <Input type="number" min="0" {...register('time_limit')} />
        </div>
        <div className="space-y-1.5">
          <Label>Pass Marks (0 = no pass/fail)</Label>
          <Input type="number" min="0" {...register('pass_marks')} />
        </div>
        <div className="space-y-1.5">
          <Label>Start Time (optional)</Label>
          <Input type="datetime-local" {...register('start_time')} />
        </div>
        <div className="space-y-1.5">
          <Label>End Time (optional)</Label>
          <Input type="datetime-local" {...register('end_time')} />
        </div>
      </div>

      {/* Class selection */}
      <div className="space-y-2">
        <Label>Assign to Classes *</Label>
        <p className="text-xs text-muted-foreground">Select one or more classes that can take this quiz</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
          {(classSetups || []).map(cs => {
            const isSelected = selectedClasses.includes(cs._id)
            return (
              <button type="button" key={cs._id} onClick={() => toggleClass(cs._id)}
                className={cn('p-2.5 rounded-lg border text-left text-xs transition-all',
                  isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                )}>
                <p className="font-medium">{cs.class_id?.name} {cs.section_id?.name}</p>
                {cs.shift_id && <p className="text-[10px] opacity-70">{cs.shift_id.name}</p>}
                {isSelected && <CheckCircle2 className="h-3 w-3 mt-1 text-primary" />}
              </button>
            )
          })}
          {!(classSetups?.length) && <p className="text-xs text-muted-foreground col-span-3 py-4 text-center">No classes found. Create classes first.</p>}
        </div>
        {selectedClasses.length > 0 && (
          <p className="text-xs text-primary">{selectedClasses.length} class(es) selected</p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2">
        <Label>Options</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: 'shuffle_questions', label: 'Shuffle Questions',         desc: 'Random order for each student' },
            { name: 'show_result',       label: 'Show Result Immediately',   desc: 'Student sees score after submit' },
            { name: 'show_answers',      label: 'Show Correct Answers',      desc: 'Student sees answers after submit' },
            { name: 'allow_reattempt',   label: 'Allow Re-attempt',          desc: 'Student can take quiz again' },
          ].map(opt => (
            <label key={opt.name} className="flex items-start gap-2.5 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer">
              <input type="checkbox" {...register(opt.name)} className="mt-0.5 h-4 w-4 rounded" />
              <div>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>
          {initial ? 'Update Quiz' : 'Create Quiz & Add Questions →'}
        </Button>
      </div>
    </form>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    draft:     { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800', label: 'Draft'     },
    published: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Published' },
    ended:     { color: 'bg-red-100 text-red-600 dark:bg-red-900/30', label: 'Ended'     },
  }[status] || { color: 'bg-gray-100 text-gray-600', label: status }
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md', cfg.color)}>{cfg.label}</span>
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const QuizzesPage = () => {
  const qc = useQueryClient()
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['quizzes', page, search],
    queryFn:  () => quizzesAPI.getAll({ page, limit: 10, search }).then(r => r.data),
  })

  const publishMutation = useMutation({
    mutationFn: id => quizzesAPI.publish(id),
    onSuccess: () => { toast.success('Quiz published! Students can now attempt it.'); qc.invalidateQueries(['quizzes']) },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed to publish'),
  })

  const endMutation = useMutation({
    mutationFn: id => quizzesAPI.end(id),
    onSuccess: () => { toast.success('Quiz ended'); qc.invalidateQueries(['quizzes']) },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: id => quizzesAPI.remove(id),
    onSuccess: () => { toast.success('Quiz deleted'); qc.invalidateQueries(['quizzes']); setDeleting(null) },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })

  const columns = [
    { header: 'Quiz', cell: r => (
      <div>
        <p className="text-sm font-medium">{r.title}</p>
        <p className="text-xs text-muted-foreground">{r.subject_id?.name} · {r.total_questions} questions · {r.total_marks} marks</p>
      </div>
    )},
    { header: 'Classes', cell: r => (
      <div className="flex flex-wrap gap-1">
        {(r.class_setup_ids || []).slice(0, 2).map(c => (
          <Badge key={c._id} variant="outline" className="text-[10px]">
            {c.class_id?.name} {c.section_id?.name}
          </Badge>
        ))}
        {(r.class_setup_ids || []).length > 2 && (
          <Badge variant="outline" className="text-[10px]">+{r.class_setup_ids.length - 2}</Badge>
        )}
      </div>
    )},
    { header: 'Time',   cell: r => <p className="text-sm">{r.time_limit ? `${r.time_limit} min` : 'No limit'}</p> },
    { header: 'Window', cell: r => (
      <div>
        {r.start_time && <p className="text-xs text-muted-foreground">From: {fDate(r.start_time)}</p>}
        {r.end_time   && <p className="text-xs text-muted-foreground">To: {fDate(r.end_time)}</p>}
        {!r.start_time && !r.end_time && <p className="text-xs text-muted-foreground">Always open</p>}
      </div>
    )},
    { header: 'Status', cell: r => <StatusBadge status={r.status} /> },
    { header: 'Actions', className: 'text-right', cellClassName: 'text-right', cell: r => (
      <div className="flex items-center justify-end gap-1 flex-wrap">
        {/* Edit questions */}
        <Link to={`/quizzes/${r._id}/builder`}>
          <Button variant="outline" size="sm" className="text-xs">
            <FileText className="h-3 w-3" /> Questions
          </Button>
        </Link>
        {/* Publish */}
        {r.status === 'draft' && (
          <Button variant="success" size="sm" className="text-xs"
            onClick={() => publishMutation.mutate(r._id)} loading={publishMutation.isPending}>
            <Play className="h-3 w-3" /> Publish
          </Button>
        )}
        {/* End */}
        {r.status === 'published' && (
          <Button variant="outline" size="sm" className="text-xs text-red-500"
            onClick={() => endMutation.mutate(r._id)}>
            <Square className="h-3 w-3" /> End
          </Button>
        )}
        {/* Results */}
        {r.status !== 'draft' && (
          <Link to={`/quizzes/${r._id}/results`}>
            <Button variant="ghost" size="icon-sm"><BarChart3 className="h-3.5 w-3.5" /></Button>
          </Link>
        )}
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
        title="Quizzes & MCQ Tests"
        description="Create online MCQ tests for your classes"
        breadcrumbs={[{ label: 'Examination' }, { label: 'Quizzes' }]}
        action={
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" /> Create Quiz
          </Button>
        }
      />

      {/* Info banner */}
      <div className="mb-5 p-4 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">📝 How it works</p>
        <div className="text-xs text-blue-700 dark:text-blue-400 mt-1 space-y-0.5">
          <p>1. <strong>Create quiz</strong> — set title, subject, class, time limit</p>
          <p>2. <strong>Add questions</strong> — click Questions button to add MCQs</p>
          <p>3. <strong>Publish</strong> — students can now see and attempt the quiz</p>
          <p>4. <strong>View results</strong> — see scores, analysis after students submit</p>
        </div>
      </div>

      <Card><CardContent className="pt-5">
        <DataTable
          columns={columns}
          data={data?.data || []}
          total={data?.pagination?.total}
          page={data?.pagination?.page}
          pages={data?.pagination?.pages}
          limit={data?.pagination?.limit}
          isLoading={isLoading}
          onPageChange={setPage}
          onSearch={v => { setSearch(v); setPage(1) }}
          searchPlaceholder="Search quizzes..."
          emptyIcon={FileText}
          emptyTitle="No quizzes yet"
          emptyDescription="Create your first MCQ quiz to test your students"
        />
      </CardContent></Card>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Edit Quiz' : 'Create New Quiz'} size="lg">
        <QuizForm
          initial={editing}
          onSuccess={() => {
            setShowForm(false)
            setEditing(null)
            qc.invalidateQueries(['quizzes'])
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      </Modal>

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting?._id)} loading={deleteMutation.isPending}
        title="Delete Quiz" description={`Delete "${deleting?.title}"? All student attempts will also be deleted.`}
      />
    </div>
  )
}