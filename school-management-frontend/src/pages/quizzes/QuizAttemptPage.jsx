import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle,
  Send, Trophy, XCircle, BookOpen, Circle, Play, RotateCcw
} from 'lucide-react'
import { quizzesAPI } from '@/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Spinner } from '@/components/ui/index.jsx'
import { toast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import { ToastContainer } from '@/components/ui/Toast'

// ─── Countdown Timer ──────────────────────────────────────────────────────────
const Timer = ({ seconds, onExpire }) => {
  const [remaining, setRemaining] = useState(seconds)
  const ref = useRef(null)

  useEffect(() => {
    if (!seconds) return
    ref.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(ref.current); onExpire(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [])

  const m    = Math.floor(remaining / 60)
  const s    = remaining % 60
  const pct  = seconds ? (remaining / seconds) * 100 : 100
  const color = pct > 50 ? 'text-emerald-400' : pct > 20 ? 'text-amber-400' : 'text-red-400'
  const bg    = pct > 50 ? 'bg-emerald-500/20' : pct > 20 ? 'bg-amber-500/20' : 'bg-red-500/20'

  return (
    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg', bg)}>
      <Clock className={cn('h-4 w-4', color)} />
      <span className={cn('font-mono font-bold text-base tabular-nums', color)}>
        {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
      </span>
    </div>
  )
}

// ─── Result Screen ────────────────────────────────────────────────────────────
const ResultScreen = ({ result, quiz, onBack }) => {
  const { attempt, correctAnswers } = result
  const pct    = attempt?.percentage || 0
  const passed = attempt?.is_pass
  const correct = attempt?.answers?.filter(a => a.is_correct).length || 0
  const wrong   = (attempt?.answers?.length || 0) - correct

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start py-8 px-4">
      <ToastContainer />
      <div className="w-full max-w-lg space-y-5 animate-fade-in">

        {/* Score hero */}
        <div className={cn(
          'rounded-2xl p-8 text-center text-white relative overflow-hidden',
          passed ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-rose-700'
        )}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 h-20 w-20 rounded-full border-4 border-white" />
            <div className="absolute bottom-4 right-4 h-16 w-16 rounded-full border-4 border-white" />
          </div>
          <div className="relative z-10">
            <div className="text-6xl mb-3">{passed ? '🏆' : '😔'}</div>
            <h2 className="font-display text-3xl font-bold">{pct}%</h2>
            <p className="text-white/80 text-lg mt-1">{passed ? 'Congratulations! You Passed!' : 'Better luck next time!'}</p>
            <p className="text-white/60 text-sm mt-1">{quiz?.title}</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: 'Score',    value: `${attempt?.score}/${attempt?.total_marks}` },
                { label: 'Correct',  value: correct },
                { label: 'Wrong',    value: wrong    },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-white/20 p-3">
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-white/70 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {quiz?.pass_marks > 0 && (
              <p className="mt-4 text-sm text-white/70">Pass marks: {quiz.pass_marks}</p>
            )}
          </div>
        </div>

        {/* Answer review */}
        {attempt?.answers?.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-semibold mb-3">Answer Summary</p>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {attempt.answers.map((ans, i) => (
                  <div key={i} className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold border-2',
                    ans.is_correct
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20'
                      : ans.selected_option !== null && ans.selected_option !== undefined
                        ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20'
                        : 'border-gray-300 bg-gray-50 text-gray-400 dark:bg-gray-800'
                  )}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-200 inline-block" /> Correct</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-200 inline-block" /> Wrong</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-gray-200 inline-block" /> Skipped</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Correct answers */}
        {correctAnswers?.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-semibold mb-4">Correct Answers</p>
              <div className="space-y-4">
                {correctAnswers.map((ca, i) => {
                  const myAns   = attempt?.answers?.[i]
                  const correct = myAns?.is_correct
                  const skipped = myAns?.selected_option === null || myAns?.selected_option === undefined
                  return (
                    <div key={i} className="border-b border-border/40 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-start gap-2 mb-2">
                        {correct
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        }
                        <p className="text-sm font-medium">{i + 1}. {ca.question}</p>
                      </div>
                      <div className="ml-6 space-y-1 text-xs">
                        <p className="text-emerald-600 font-medium">
                          ✓ Correct: Option {String.fromCharCode(65 + ca.correct_option)}
                        </p>
                        {!correct && !skipped && (
                          <p className="text-red-500">
                            ✗ Your answer: Option {String.fromCharCode(65 + myAns.selected_option)}
                          </p>
                        )}
                        {skipped && <p className="text-muted-foreground">— Skipped</p>}
                        {ca.explanation && (
                          <p className="text-muted-foreground mt-1 italic">💡 {ca.explanation}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Button className="w-full" size="lg" onClick={onBack}>
          <BookOpen className="h-4 w-4" /> Back to Quizzes
        </Button>
      </div>
    </div>
  )
}

// ─── Pre-Start Screen ─────────────────────────────────────────────────────────
const PreStartScreen = ({ quiz, onStart, loading }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <ToastContainer />
    <div className="w-full max-w-md animate-fade-in">
      <div className="rounded-2xl overflow-hidden border shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary/70 p-8 text-white text-center">
          <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold">{quiz?.title}</h1>
          <p className="text-white/70 mt-1 text-sm">{quiz?.subject_id?.name}</p>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-px bg-border">
          {[
            { label: 'Questions',   value: quiz?.total_questions || '—' },
            { label: 'Total Marks', value: quiz?.total_marks     || '—' },
            { label: 'Time Limit',  value: quiz?.time_limit > 0 ? `${quiz.time_limit} min` : 'No limit' },
            { label: 'Pass Marks',  value: quiz?.pass_marks > 0 ? quiz.pass_marks : 'No pass/fail' },
          ].map(item => (
            <div key={item.label} className="bg-card p-4 text-center">
              <p className="text-xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-card p-5 space-y-3">
          {quiz?.instructions && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">📋 Instructions</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 whitespace-pre-line">{quiz.instructions}</p>
            </div>
          )}

          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {quiz?.shuffle_questions && <li>• Questions will appear in random order</li>}
            {quiz?.show_result       && <li>• Your score will be shown immediately after submission</li>}
            {quiz?.show_answers      && <li>• Correct answers will be revealed after submission</li>}
            {quiz?.time_limit > 0    && <li>• Quiz will auto-submit when timer reaches zero</li>}
            {!quiz?.allow_reattempt  && <li>• Only <strong>one attempt</strong> is allowed</li>}
          </ul>

          <button onClick={onStart} disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? <Spinner size="sm" /> : <Play className="h-5 w-5" />}
            {loading ? 'Starting...' : 'Start Quiz'}
          </button>
        </div>
      </div>
    </div>
  </div>
)

// ─── Already Submitted Screen ─────────────────────────────────────────────────
const AlreadySubmitted = ({ attempt, onBack }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="w-full max-w-sm text-center space-y-4 animate-fade-in">
      <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
      </div>
      <div>
        <h2 className="font-display font-bold text-xl">Already Submitted</h2>
        <p className="text-muted-foreground text-sm mt-1">You have already completed this quiz.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border bg-card text-center">
          <p className="text-2xl font-bold text-primary">{attempt?.score}</p>
          <p className="text-xs text-muted-foreground">Score</p>
        </div>
        <div className="p-4 rounded-xl border bg-card text-center">
          <p className="text-2xl font-bold text-primary">{attempt?.percentage}%</p>
          <p className="text-xs text-muted-foreground">Percentage</p>
        </div>
      </div>
      <Button className="w-full" onClick={onBack}>Back to Portal</Button>
    </div>
  </div>
)

// ─── Main Quiz Attempt Page ───────────────────────────────────────────────────
export const QuizAttemptPage = () => {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [phase,    setPhase]    = useState('loading')  // loading | prestart | quiz | result | done
  const [attempt,  setAttempt]  = useState(null)
  const [questions,setQuestions]= useState([])
  const [quiz,     setQuiz]     = useState(null)
  const [answers,  setAnswers]  = useState({})
  const [current,  setCurrent]  = useState(0)
  const [result,   setResult]   = useState(null)

  // Check existing attempt
  const { data: existingAttempt, isLoading: checkingAttempt } = useQuery({
    queryKey: ['my-attempt', id],
    queryFn:  () => quizzesAPI.myAttempt(id).then(r => r.data.data),
    onSuccess: (data) => {
      if (data?.status === 'submitted') setPhase('done')
      else if (data?.status === 'in_progress') setPhase('prestart')
      else setPhase('prestart')
    },
    onError: () => setPhase('prestart'),
  })

  // Quiz info for pre-start screen
  const { data: quizInfo } = useQuery({
    queryKey: ['quiz-info', id],
    queryFn:  () => quizzesAPI.getById(id).then(r => r.data.data),
  })

  useEffect(() => {
    if (!checkingAttempt && phase === 'loading') setPhase('prestart')
  }, [checkingAttempt])

  const startMutation = useMutation({
    mutationFn: () => quizzesAPI.startQuiz(id),
    onSuccess: ({ data }) => {
      const { attempt: att, questions: qs, quiz: q } = data.data
      setAttempt(att)
      setQuestions(qs)
      setQuiz(q)
      // Restore answers if resuming
      if (att.answers?.length > 0) {
        const pre = {}
        att.answers.forEach(a => { if (a.selected_option !== null && a.selected_option !== undefined) pre[a.question_id] = a.selected_option })
        setAnswers(pre)
      }
      setPhase('quiz')
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to start quiz'),
  })

  const submitMutation = useMutation({
    mutationFn: (answersArr) => quizzesAPI.submitQuiz(attempt._id, answersArr),
    onSuccess: ({ data }) => {
      setResult(data.data)
      setPhase('result')
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to submit'),
  })

  const handleSelect = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleSubmit = useCallback(() => {
    const answersArr = questions.map(q => ({
      question_id:     q._id,
      selected_option: answers[q._id] !== undefined ? answers[q._id] : null,
    }))
    submitMutation.mutate(answersArr)
  }, [questions, answers])

  const handleTimeExpire = useCallback(() => {
    toast.error('Time is up! Auto-submitting...')
    handleSubmit()
  }, [handleSubmit])

  const answeredCount  = Object.keys(answers).length
  const totalQuestions = questions.length
  const currentQ       = questions[current]

  // ── Render phases ──────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  if (phase === 'done') return (
    <AlreadySubmitted attempt={existingAttempt} onBack={() => navigate('/student')} />
  )

  if (phase === 'result' && result) return (
    <ResultScreen result={result} quiz={quiz} onBack={() => navigate('/student')} />
  )

  if (phase === 'prestart') return (
    <PreStartScreen
      quiz={quizInfo}
      onStart={() => startMutation.mutate()}
      loading={startMutation.isPending}
    />
  )

  // ── Quiz in progress ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ToastContainer />

      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{quiz?.title}</p>
            <p className="text-xs text-muted-foreground">{quiz?.subject_id?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {answeredCount}/{totalQuestions} answered
          </span>
          {quiz?.time_limit > 0 && (
            <Timer seconds={quiz.time_limit * 60} onExpire={handleTimeExpire} />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((current + 1) / totalQuestions) * 100}%` }} />
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-4">

        {/* Question navigator */}
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={cn(
                'h-8 w-8 rounded-full text-xs font-bold transition-all border-2',
                i === current
                  ? 'bg-primary text-white border-primary ring-2 ring-primary/30 ring-offset-1'
                  : answers[q._id] !== undefined
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/40'
              )}>
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        {currentQ && (
          <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
            {/* Question header */}
            <div className="bg-primary/5 px-5 py-4 border-b border-border">
              <div className="flex items-start gap-3">
                <span className="h-8 w-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {current + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Question {current + 1} of {totalQuestions}
                    <span className="ml-2 text-xs">· {currentQ.marks} mark{currentQ.marks !== 1 ? 's' : ''}</span>
                  </p>
                  <p className="text-base font-semibold leading-relaxed">{currentQ.question}</p>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="p-5 space-y-3">
              {currentQ.options.map((opt, oi) => {
                const isSelected = answers[currentQ._id] === oi
                const label      = String.fromCharCode(65 + oi)
                return (
                  <button key={oi} type="button" onClick={() => handleSelect(currentQ._id, oi)}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150',
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border hover:border-primary/30 hover:bg-muted/40'
                    )}>
                    {/* Radio circle */}
                    <div className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    {/* Label */}
                    <span className={cn(
                      'h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0',
                      isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    )}>{label}</span>
                    {/* Text */}
                    <span className={cn('text-sm flex-1', isSelected && 'font-medium')}>{opt.text}</span>
                  </button>
                )
              })}
            </div>

            {/* Navigation */}
            <div className="px-5 pb-5 flex items-center justify-between gap-3">
              <Button variant="outline" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              {current < totalQuestions - 1 ? (
                <Button onClick={() => setCurrent(c => Math.min(totalQuestions - 1, c + 1))}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="success" onClick={() => {
                  const ua = totalQuestions - answeredCount
                  if (ua > 0 && !window.confirm(`${ua} unanswered question(s). Submit anyway?`)) return
                  handleSubmit()
                }} loading={submitMutation.isPending}>
                  <Send className="h-4 w-4" /> Submit Quiz
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Unanswered warning */}
        {answeredCount < totalQuestions && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>{totalQuestions - answeredCount}</strong> question(s) not answered. Green circles = answered, white = unanswered.
            </p>
          </div>
        )}

        {/* Final submit */}
        <button
          onClick={() => {
            const ua = totalQuestions - answeredCount
            if (ua > 0 && !window.confirm(`${ua} unanswered question(s). Submit anyway?`)) return
            handleSubmit()
          }}
          disabled={submitMutation.isPending}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
          {submitMutation.isPending ? <Spinner size="sm" /> : <Send className="h-5 w-5" />}
          {submitMutation.isPending ? 'Submitting...' : `Submit Quiz (${answeredCount}/${totalQuestions} answered)`}
        </button>
      </div>
    </div>
  )
}
