import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Clock, List, CheckCircle2, AlertCircle, Play, BookOpen, Trophy, RotateCcw } from 'lucide-react'
import { quizzesAPI } from '@/api'
import { Spinner } from '@/components/ui/index.jsx'
import { cn } from '@/utils/cn'
import { fDate } from '@/utils/format'

// Subject → gradient + illustration color mapping
const SUBJECT_THEMES = [
  { bg: 'from-indigo-600 to-violet-700',  light: 'bg-indigo-50 dark:bg-indigo-900/20',  text: 'text-indigo-600' },
  { bg: 'from-teal-500 to-cyan-600',      light: 'bg-teal-50 dark:bg-teal-900/20',      text: 'text-teal-600'   },
  { bg: 'from-orange-500 to-amber-600',   light: 'bg-orange-50 dark:bg-orange-900/20',  text: 'text-orange-600' },
  { bg: 'from-rose-500 to-pink-600',      light: 'bg-rose-50 dark:bg-rose-900/20',      text: 'text-rose-600'   },
  { bg: 'from-emerald-500 to-green-600',  light: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-600'},
  { bg: 'from-blue-500 to-blue-700',      light: 'bg-blue-50 dark:bg-blue-900/20',      text: 'text-blue-600'   },
]

// Simple SVG illustrations per subject keyword
const SubjectIllustration = ({ subject = '', theme }) => {
  const s = subject.toLowerCase()
  const color = 'white'

  if (s.includes('math') || s.includes('algebra') || s.includes('calculus')) return (
    <svg viewBox="0 0 120 80" className="w-full h-full opacity-20">
      <text x="10" y="30" fontSize="18" fill={color} fontFamily="monospace">x²+y²=r²</text>
      <text x="15" y="55" fontSize="14" fill={color} fontFamily="monospace">∫f(x)dx</text>
      <text x="60" y="72" fontSize="12" fill={color} fontFamily="monospace">π≈3.14</text>
      <circle cx="95" cy="25" r="18" stroke={color} strokeWidth="2" fill="none"/>
      <line x1="85" y1="25" x2="105" y2="25" stroke={color} strokeWidth="1.5"/>
      <line x1="95" y1="15" x2="95" y2="35" stroke={color} strokeWidth="1.5"/>
    </svg>
  )

  if (s.includes('physics') || s.includes('science')) return (
    <svg viewBox="0 0 120 80" className="w-full h-full opacity-20">
      <circle cx="60" cy="40" r="15" stroke={color} strokeWidth="2" fill="none"/>
      <ellipse cx="60" cy="40" rx="30" ry="12" stroke={color} strokeWidth="1.5" fill="none"/>
      <ellipse cx="60" cy="40" rx="30" ry="12" stroke={color} strokeWidth="1.5" fill="none" transform="rotate(60 60 40)"/>
      <ellipse cx="60" cy="40" rx="30" ry="12" stroke={color} strokeWidth="1.5" fill="none" transform="rotate(120 60 40)"/>
      <circle cx="60" cy="40" r="4" fill={color}/>
    </svg>
  )

  if (s.includes('chem') || s.includes('bio')) return (
    <svg viewBox="0 0 120 80" className="w-full h-full opacity-20">
      <circle cx="40" cy="35" r="10" stroke={color} strokeWidth="2" fill="none"/>
      <circle cx="70" cy="25" r="8"  stroke={color} strokeWidth="2" fill="none"/>
      <circle cx="80" cy="50" r="12" stroke={color} strokeWidth="2" fill="none"/>
      <line x1="50" y1="35" x2="62" y2="29" stroke={color} strokeWidth="1.5"/>
      <line x1="68" y1="32" x2="70" y2="38" stroke={color} strokeWidth="1.5"/>
      <text x="20" y="70" fontSize="12" fill={color} fontFamily="monospace">H₂O + CO₂</text>
    </svg>
  )

  if (s.includes('english') || s.includes('language') || s.includes('lit')) return (
    <svg viewBox="0 0 120 80" className="w-full h-full opacity-20">
      <rect x="20" y="10" width="50" height="65" rx="3" stroke={color} strokeWidth="2" fill="none"/>
      <line x1="30" y1="25" x2="60" y2="25" stroke={color} strokeWidth="1.5"/>
      <line x1="30" y1="35" x2="60" y2="35" stroke={color} strokeWidth="1.5"/>
      <line x1="30" y1="45" x2="50" y2="45" stroke={color} strokeWidth="1.5"/>
      <text x="75" y="35" fontSize="22" fill={color} fontFamily="serif">A</text>
      <text x="78" y="60" fontSize="16" fill={color} fontFamily="serif">a</text>
    </svg>
  )

  if (s.includes('history') || s.includes('social') || s.includes('geo')) return (
    <svg viewBox="0 0 120 80" className="w-full h-full opacity-20">
      <circle cx="65" cy="40" r="28" stroke={color} strokeWidth="2" fill="none"/>
      <ellipse cx="65" cy="40" rx="12" ry="28" stroke={color} strokeWidth="1" fill="none"/>
      <line x1="37" y1="40" x2="93" y2="40" stroke={color} strokeWidth="1"/>
      <line x1="43" y1="22" x2="87" y2="22" stroke={color} strokeWidth="1"/>
      <line x1="43" y1="58" x2="87" y2="58" stroke={color} strokeWidth="1"/>
    </svg>
  )

  // Default — generic quiz icon
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full opacity-20">
      <rect x="20" y="10" width="80" height="60" rx="6" stroke={color} strokeWidth="2" fill="none"/>
      <circle cx="40" cy="28" r="5" fill={color}/>
      <line x1="52" y1="28" x2="85" y2="28" stroke={color} strokeWidth="2"/>
      <circle cx="40" cy="44" r="5" fill={color}/>
      <line x1="52" y1="44" x2="85" y2="44" stroke={color} strokeWidth="2"/>
      <circle cx="40" cy="60" r="5" stroke={color} strokeWidth="2" fill="none"/>
      <line x1="52" y1="60" x2="75" y2="60" stroke={color} strokeWidth="2"/>
    </svg>
  )
}

// ─── Quiz Card ─────────────────────────────────────────────────────────────────
const QuizCard = ({ quiz, onStart, index }) => {
  const theme     = SUBJECT_THEMES[index % SUBJECT_THEMES.length]
  const submitted = quiz.attempt_status === 'submitted'
  const inProgress= quiz.attempt_status === 'in_progress'
  const now       = new Date()
  const isExpired = quiz.end_time && new Date(quiz.end_time) < now
  const notStarted= quiz.start_time && new Date(quiz.start_time) > now

  const getActionBtn = () => {
    if (submitted) return (
      <div className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2">
        <CheckCircle2 className="h-4 w-4" />
        Completed — {quiz.percentage}%
      </div>
    )
    if (isExpired) return (
      <div className="w-full py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-500 text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
        <AlertCircle className="h-4 w-4" /> Quiz Expired
      </div>
    )
    if (notStarted) return (
      <div className="w-full py-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 text-sm font-semibold flex items-center justify-center gap-2">
        <Clock className="h-4 w-4" /> Starts {fDate(quiz.start_time)}
      </div>
    )
    if (inProgress) return (
      <button onClick={() => onStart(quiz._id)}
        className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
        <RotateCcw className="h-4 w-4" /> Resume Quiz
      </button>
    )
    return (
      <button onClick={() => onStart(quiz._id)}
        className={cn('w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:shadow-md active:scale-95 bg-gradient-to-r', theme.bg)}>
        <Play className="h-4 w-4" /> Start Assessment
      </button>
    )
  }

  return (
    <div className={cn('rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col', submitted && 'opacity-80')}>
      {/* Banner */}
      <div className={cn('relative h-36 bg-gradient-to-br overflow-hidden flex items-center justify-center', theme.bg)}>
        <div className="absolute inset-0 w-full h-full">
          <SubjectIllustration subject={quiz.subject_id?.name || ''} theme={theme} />
        </div>
        {/* Class + Subject badge */}
        <div className="relative z-10 text-center px-4">
          <p className="text-white/80 text-xs font-medium mb-1">
            {(quiz.class_setup_ids || []).map(c => `${c.class_id?.name || ''} ${c.section_id?.name || ''}`).join(', ')} · Subject: <strong className="text-white">{quiz.subject_id?.name}</strong>
          </p>
          <h3 className="text-white font-display font-bold text-lg leading-tight drop-shadow">{quiz.title}</h3>
        </div>
        {/* Status badge top-right */}
        {submitted && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Done
          </div>
        )}
        {inProgress && (
          <div className="absolute top-3 right-3 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            In Progress
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {quiz.time_limit > 0 ? `${quiz.time_limit} Minutes` : 'No Limit'}
          </span>
          <span className="flex items-center gap-1.5">
            <List className="h-4 w-4" />
            {quiz.total_questions} Questions
          </span>
          <span className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4" />
            {quiz.total_marks} Marks
          </span>
        </div>

        {/* Teacher */}
        <p className="text-xs text-muted-foreground">
          By <span className="font-medium text-foreground">{quiz.teacher_id?.user_id?.name || 'Teacher'}</span>
          {quiz.end_time && !isExpired && (
            <span className="ml-2 text-amber-500">· Ends {fDate(quiz.end_time)}</span>
          )}
        </p>

        {/* Score if submitted */}
        {submitted && quiz.score !== null && (
          <div className={cn('rounded-xl p-3 text-sm font-medium flex items-center justify-between', theme.light)}>
            <span className={theme.text}>Your Score</span>
            <span className={cn('font-bold text-base', theme.text)}>{quiz.score} / {quiz.total_marks} ({quiz.percentage}%)</span>
          </div>
        )}

        {/* Action */}
        <div className="mt-auto pt-1">
          {getActionBtn()}
        </div>
      </div>
    </div>
  )
}

// ─── Main QuizTab ─────────────────────────────────────────────────────────────
export const QuizTab = ({ student }) => {
  const navigate = useNavigate()

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['student-quizzes'],
    queryFn:  () => quizzesAPI.studentQuizzes().then(r => r.data.data),
  })

  const available  = (quizzes || []).filter(q => !q.attempt_status || q.attempt_status === 'in_progress')
  const completed  = (quizzes || []).filter(q => q.attempt_status === 'submitted')

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">Loading quizzes...</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/70 p-5 text-white flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Welcome to EduQuiz Portal!</h2>
          <p className="text-white/80 text-sm mt-0.5">
            {student
              ? `Hello ${student?.user_id?.name?.split(' ')[0]}! Your quizzes for ${student?.class_setup_id?.class_id?.name} ${student?.class_setup_id?.section_id?.name}`
              : 'Your available quizzes are listed below'}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
          <span className="text-2xl font-bold">{available.length}</span>
          <span className="text-xs text-white/70">Available</span>
        </div>
      </div>

      {/* Available quizzes */}
      {available.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-base">Available Quizzes</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{available.length} quiz{available.length !== 1 ? 'zes' : ''}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {available.map((quiz, i) => (
              <QuizCard key={quiz._id} quiz={quiz} index={i} onStart={id => navigate(`/quiz/${id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* Completed quizzes */}
      {completed.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-base">Completed</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{completed.length} done</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {completed.map((quiz, i) => (
              <QuizCard key={quiz._id} quiz={quiz} index={i + available.length} onStart={() => {}} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!quizzes?.length && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
          <div>
            <p className="font-display font-bold text-lg">No Quizzes Yet</p>
            <p className="text-sm text-muted-foreground mt-1">Your teacher hasn't assigned any quizzes to your class yet.</p>
          </div>
        </div>
      )}
    </div>
  )
}
