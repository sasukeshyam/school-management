import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Play, ArrowLeft, CheckCircle2, Circle } from 'lucide-react'
import { quizzesAPI } from '@/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Badge, Spinner } from '@/components/ui/index.jsx'
import { toast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'

const EMPTY_OPTION = { text: '', is_correct: false }
const EMPTY_QUESTION = {
  question: '',
  options: [
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ],
  marks: 1,
  explanation: '',
}

export const QuizBuilderPage = () => {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const qc           = useQueryClient()
  const [questions, setQuestions] = useState([{ ...EMPTY_QUESTION, options: EMPTY_QUESTION.options.map(o => ({ ...o })) }])
  const [dirty, setDirty]         = useState(false)

  const { data: quizData, isLoading } = useQuery({
    queryKey: ['quiz', id],
    queryFn:  () => quizzesAPI.getById(id).then(r => r.data.data),
  })

  const { data: existingQs } = useQuery({
    queryKey: ['quiz-questions', id],
    queryFn:  () => quizzesAPI.getQuestions(id).then(r => r.data.data),
    onSuccess: (data) => {
      if (data?.length > 0) {
        setQuestions(data.map(q => ({
          _id:         q._id,
          question:    q.question,
          marks:       q.marks,
          explanation: q.explanation || '',
          options:     q.options.map(o => ({ text: o.text, is_correct: o.is_correct })),
        })))
      }
    }
  })

  useEffect(() => {
    if (existingQs?.length > 0) {
      setQuestions(existingQs.map(q => ({
        _id:         q._id,
        question:    q.question,
        marks:       q.marks,
        explanation: q.explanation || '',
        options:     q.options.map(o => ({ text: o.text, is_correct: o.is_correct })),
      })))
    }
  }, [existingQs])

  const saveMutation = useMutation({
    mutationFn: () => quizzesAPI.saveQuestions(id, questions),
    onSuccess:  () => { toast.success('Questions saved!'); setDirty(false); qc.invalidateQueries(['quiz', id]) },
    onError:    e  => toast.error(e.response?.data?.message || 'Failed to save'),
  })

  const publishMutation = useMutation({
    mutationFn: async () => {
      await quizzesAPI.saveQuestions(id, questions)
      return quizzesAPI.publish(id)
    },
    onSuccess: () => { toast.success('Quiz published! Students can now attempt it.'); navigate('/quizzes') },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed to publish'),
  })

  // ─── Question helpers ──────────────────────────────────────────────────────
  const updateQuestion = (qi, field, value) => {
    setQuestions(prev => {
      const updated = [...prev]
      updated[qi] = { ...updated[qi], [field]: value }
      return updated
    })
    setDirty(true)
  }

  const updateOption = (qi, oi, field, value) => {
    setQuestions(prev => {
      const updated  = [...prev]
      const options  = [...updated[qi].options]
      options[oi]    = { ...options[oi], [field]: value }
      // If marking as correct, unmark others (single correct answer)
      if (field === 'is_correct' && value === true) {
        options.forEach((o, i) => { if (i !== oi) options[i] = { ...o, is_correct: false } })
      }
      updated[qi] = { ...updated[qi], options }
      return updated
    })
    setDirty(true)
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, { ...EMPTY_QUESTION, options: EMPTY_QUESTION.options.map(o => ({ ...o })) }])
    setDirty(true)
    // Scroll to bottom
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100)
  }

  const deleteQuestion = (qi) => {
    if (questions.length === 1) { toast.error('Quiz must have at least 1 question'); return }
    setQuestions(prev => prev.filter((_, i) => i !== qi))
    setDirty(true)
  }

  const moveQuestion = (qi, dir) => {
    const newQs = [...questions]
    const swap  = qi + dir
    if (swap < 0 || swap >= newQs.length) return
    ;[newQs[qi], newQs[swap]] = [newQs[swap], newQs[qi]]
    setQuestions(newQs)
    setDirty(true)
  }

  const duplicateQuestion = (qi) => {
    const q = { ...questions[qi], options: questions[qi].options.map(o => ({ ...o })), _id: undefined }
    setQuestions(prev => [...prev.slice(0, qi + 1), q, ...prev.slice(qi + 1)])
    setDirty(true)
  }

  const addOption = (qi) => {
    if (questions[qi].options.length >= 6) { toast.error('Maximum 6 options allowed'); return }
    updateQuestion(qi, 'options', [...questions[qi].options, { text: '', is_correct: false }])
  }

  const removeOption = (qi, oi) => {
    if (questions[qi].options.length <= 2) { toast.error('Minimum 2 options required'); return }
    const opts = questions[qi].options.filter((_, i) => i !== oi)
    updateQuestion(qi, 'options', opts)
  }

  // Validation
  const validate = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question.trim())          { toast.error(`Question ${i+1}: Question text is required`);   return false }
      if (q.options.some(o => !o.text.trim())) { toast.error(`Question ${i+1}: All options must have text`); return false }
      if (!q.options.some(o => o.is_correct)) { toast.error(`Question ${i+1}: Mark at least one correct answer`); return false }
    }
    return true
  }

  const handleSave    = () => { if (!validate()) return; saveMutation.mutate() }
  const handlePublish = () => { if (!validate()) return; publishMutation.mutate() }

  const totalMarks = questions.reduce((s, q) => s + Number(q.marks || 1), 0)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const quiz = quizData

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/quizzes">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold">{quiz?.title}</h1>
            <p className="text-xs text-muted-foreground">{quiz?.subject_id?.name} · {questions.length} questions · {totalMarks} total marks</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} loading={saveMutation.isPending} disabled={!dirty}>
            <Save className="h-4 w-4" /> Save
          </Button>
          {quiz?.status === 'draft' && (
            <Button size="sm" onClick={handlePublish} loading={publishMutation.isPending}>
              <Play className="h-4 w-4" /> Save & Publish
            </Button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex gap-3 p-3 rounded-xl border bg-card text-sm flex-wrap">
        <div className="flex items-center gap-1.5"><Badge variant="default">{questions.length}</Badge><span className="text-muted-foreground">Questions</span></div>
        <div className="flex items-center gap-1.5"><Badge variant="success">{totalMarks}</Badge><span className="text-muted-foreground">Total Marks</span></div>
        <div className="flex items-center gap-1.5"><Badge variant="outline">{quiz?.time_limit || 0} min</Badge><span className="text-muted-foreground">Time Limit</span></div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', quiz?.status === 'published' ? 'bg-emerald-500' : quiz?.status === 'ended' ? 'bg-red-500' : 'bg-amber-500')} />
          <span className="text-muted-foreground capitalize">{quiz?.status}</span>
        </div>
      </div>

      {/* Questions */}
      {questions.map((q, qi) => {
        const hasCorrect = q.options.some(o => o.is_correct)
        return (
          <Card key={qi} className={cn('border-2 transition-colors', !hasCorrect && q.question ? 'border-amber-300 dark:border-amber-700' : 'border-border')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">{qi + 1}</span>
                  <span className="text-sm font-medium text-muted-foreground">Question {qi + 1}</span>
                  {!hasCorrect && q.question && (
                    <Badge variant="warning" className="text-[10px]">No correct answer marked</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => moveQuestion(qi, -1)} disabled={qi === 0}><ChevronUp className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => moveQuestion(qi, 1)} disabled={qi === questions.length - 1}><ChevronDown className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => duplicateQuestion(qi)} title="Duplicate" className="text-blue-500">
                    <span className="text-xs font-bold">2x</span>
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => deleteQuestion(qi)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question text */}
              <div className="space-y-1.5">
                <Textarea
                  placeholder={`Enter question ${qi + 1}...`}
                  value={q.question}
                  onChange={e => updateQuestion(qi, 'question', e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Options — click circle to mark correct answer</Label>
                  <button type="button" onClick={() => addOption(qi)} className="text-xs text-primary hover:underline">+ Add option</button>
                </div>
                {q.options.map((opt, oi) => (
                  <div key={oi} className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border transition-all',
                    opt.is_correct ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20' : 'border-border'
                  )}>
                    {/* Correct toggle */}
                    <button type="button" onClick={() => updateOption(qi, oi, 'is_correct', !opt.is_correct)}
                      className="shrink-0 transition-transform hover:scale-110">
                      {opt.is_correct
                        ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        : <Circle className="h-5 w-5 text-muted-foreground" />
                      }
                    </button>
                    {/* Option label */}
                    <span className="shrink-0 text-xs font-bold text-muted-foreground w-5">
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    {/* Option text */}
                    <input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                      value={opt.text}
                      onChange={e => updateOption(qi, oi, 'text', e.target.value)}
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    {/* Remove option */}
                    {q.options.length > 2 && (
                      <button type="button" onClick={() => removeOption(qi, oi)} className="shrink-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Marks + Explanation */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Marks for this question</Label>
                  <Input type="number" min="0.5" step="0.5" value={q.marks}
                    onChange={e => updateQuestion(qi, 'marks', parseFloat(e.target.value) || 1)}
                    className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Explanation (shown after submit)</Label>
                  <Input placeholder="Optional explanation..." value={q.explanation}
                    onChange={e => updateQuestion(qi, 'explanation', e.target.value)}
                    className="h-8 text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Add question button */}
      <button type="button" onClick={addQuestion}
        className="w-full border-2 border-dashed border-border rounded-xl p-5 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
        <Plus className="h-5 w-5" />
        <span className="font-medium">Add Question</span>
      </button>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {questions.length} questions · {totalMarks} marks
          {dirty && <span className="text-amber-500 ml-2">· Unsaved changes</span>}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} loading={saveMutation.isPending}>
            <Save className="h-4 w-4" /> Save Draft
          </Button>
          {quiz?.status === 'draft' && (
            <Button size="sm" onClick={handlePublish} loading={publishMutation.isPending}>
              <Play className="h-4 w-4" /> Save & Publish
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}