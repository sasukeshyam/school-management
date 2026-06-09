const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFound } = require('./middlewares/errorMiddleware');
const logger = require('./config/logger');

// Route imports
const authRoutes          = require('./routes/authRoutes');
const schoolRoutes        = require('./routes/schoolRoutes');
const sessionRoutes       = require('./routes/sessionRoutes');
const roleRoutes          = require('./routes/roleRoutes');
const permissionRoutes    = require('./routes/permissionRoutes');
const userRoutes          = require('./routes/userRoutes');
const studentRoutes       = require('./routes/studentRoutes');
const parentRoutes        = require('./routes/parentRoutes');
const teacherRoutes       = require('./routes/teacherRoutes');
const staffRoutes         = require('./routes/staffRoutes');
const admissionRoutes     = require('./routes/admissionRoutes');
const leaveRoutes         = require('./routes/leaveRoutes');
const classRoutes         = require('./routes/classRoutes');
const sectionRoutes       = require('./routes/sectionRoutes');
const shiftRoutes         = require('./routes/shiftRoutes');
const classSetupRoutes    = require('./routes/classSetupRoutes');
const subjectRoutes       = require('./routes/subjectRoutes');
const subjectAssignRoutes = require('./routes/subjectAssignRoutes');
const classRoutineRoutes  = require('./routes/classRoutineRoutes');
const lessonPlanRoutes    = require('./routes/lessonPlanRoutes');
const studyMaterialRoutes = require('./routes/studyMaterialRoutes');
const attendanceRoutes    = require('./routes/attendanceRoutes');
const examTypeRoutes      = require('./routes/examTypeRoutes');
const markGradeRoutes     = require('./routes/markGradeRoutes');
const examRoutes          = require('./routes/examRoutes');
const examAssignRoutes    = require('./routes/examAssignRoutes');
const examRoutineRoutes   = require('./routes/examRoutineRoutes');
const markRegisterRoutes  = require('./routes/markRegisterRoutes');
const admitCardRoutes     = require('./routes/admitCardRoutes');
const marksheetRoutes     = require('./routes/marksheetRoutes');
const feeGroupRoutes      = require('./routes/feeGroupRoutes');
const feeTypeRoutes       = require('./routes/feeTypeRoutes');
const feeMasterRoutes     = require('./routes/feeMasterRoutes');
const feeAssignRoutes     = require('./routes/feeAssignRoutes');
const feeCollectRoutes    = require('./routes/feeCollectRoutes');
const transactionRoutes   = require('./routes/transactionRoutes');
const assignmentRoutes    = require('./routes/assignmentRoutes');
const submissionRoutes    = require('./routes/submissionRoutes');
const bookCategoryRoutes  = require('./routes/bookCategoryRoutes');
const bookRoutes          = require('./routes/bookRoutes');
const libraryMemberRoutes = require('./routes/libraryMemberRoutes');
const bookIssueRoutes     = require('./routes/bookIssueRoutes');
const eventRoutes         = require('./routes/eventRoutes');
const notificationRoutes  = require('./routes/notificationRoutes');
const dashboardRoutes     = require('./routes/dashboardRoutes');
const quizRoutes          = require('./routes/quizRoutes');

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(mongoSanitize());
app.use(xssClean());
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/v1/auth', authLimiter);

// ─── General Middleware ────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const BASE = '/api/v1';

app.use(`${BASE}/auth`,            authRoutes);
app.use(`${BASE}/schools`,         schoolRoutes);
app.use(`${BASE}/sessions`,        sessionRoutes);
app.use(`${BASE}/roles`,           roleRoutes);
app.use(`${BASE}/permissions`,     permissionRoutes);
app.use(`${BASE}/users`,           userRoutes);
app.use(`${BASE}/students`,        studentRoutes);
app.use(`${BASE}/parents`,         parentRoutes);
app.use(`${BASE}/teachers`,        teacherRoutes);
app.use(`${BASE}/staff`,           staffRoutes);
app.use(`${BASE}/admissions`,      admissionRoutes);
app.use(`${BASE}/leaves`,          leaveRoutes);
app.use(`${BASE}/classes`,         classRoutes);
app.use(`${BASE}/sections`,        sectionRoutes);
app.use(`${BASE}/shifts`,          shiftRoutes);
app.use(`${BASE}/class-setups`,    classSetupRoutes);
app.use(`${BASE}/subjects`,        subjectRoutes);
app.use(`${BASE}/subject-assigns`, subjectAssignRoutes);
app.use(`${BASE}/class-routines`,  classRoutineRoutes);
app.use(`${BASE}/lesson-plans`,    lessonPlanRoutes);
app.use(`${BASE}/study-materials`, studyMaterialRoutes);
app.use(`${BASE}/attendance`,      attendanceRoutes);
app.use(`${BASE}/exam-types`,      examTypeRoutes);
app.use(`${BASE}/mark-grades`,     markGradeRoutes);
app.use(`${BASE}/exams`,           examRoutes);
app.use(`${BASE}/exam-assigns`,    examAssignRoutes);
app.use(`${BASE}/exam-routines`,   examRoutineRoutes);
app.use(`${BASE}/mark-registers`,  markRegisterRoutes);
app.use(`${BASE}/admit-cards`,     admitCardRoutes);
app.use(`${BASE}/marksheets`,      marksheetRoutes);
app.use(`${BASE}/fee-groups`,      feeGroupRoutes);
app.use(`${BASE}/fee-types`,       feeTypeRoutes);
app.use(`${BASE}/fee-masters`,     feeMasterRoutes);
app.use(`${BASE}/fee-assigns`,     feeAssignRoutes);
app.use(`${BASE}/fee-collects`,    feeCollectRoutes);
app.use(`${BASE}/transactions`,    transactionRoutes);
app.use(`${BASE}/assignments`,     assignmentRoutes);
app.use(`${BASE}/submissions`,     submissionRoutes);
app.use(`${BASE}/book-categories`, bookCategoryRoutes);
app.use(`${BASE}/books`,           bookRoutes);
app.use(`${BASE}/library-members`, libraryMemberRoutes);
app.use(`${BASE}/book-issues`,     bookIssueRoutes);
app.use(`${BASE}/events`,          eventRoutes);
app.use(`${BASE}/notifications`,   notificationRoutes);
app.use(`${BASE}/dashboard`,       dashboardRoutes);
app.use(`${BASE}/quizzes`,         quizRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;