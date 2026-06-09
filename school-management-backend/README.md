# School Management System — Backend API

Production-grade MERN backend built to match Onest Schooled feature set.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (Access + Refresh Tokens) |
| Cache / Token Store | Redis (ioredis) |
| Real-time | Socket.IO |
| File Uploads | Cloudinary + Multer |
| Email | Nodemailer |
| Logging | Winston |
| Security | Helmet, CORS, Rate Limiting, XSS Clean, HPP, Mongo Sanitize |

---

## Quick Start

```bash
# 1. Clone and install
cd school-management-backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, Redis, Cloudinary, SMTP credentials

# 3. Seed the database (creates school, roles, permissions, super admin)
npm run seed

# 4. Start development server
npm run dev
```

---

## Default Login Credentials (after seed)

| Role        | Email                          | Password      |
|-------------|--------------------------------|---------------|
| Super Admin | superadmin@demoschool.com      | Admin@123456  |
| Admin       | admin@demoschool.com           | Admin@123456  |

> ⚠️ Change passwords immediately after first login.

---

## Project Structure

```
src/
├── app.js                  # Express app + all routes wired
├── config/
│   ├── db.js               # MongoDB connection
│   ├── redis.js            # Redis connection
│   ├── logger.js           # Winston logger
│   ├── cloudinary.js       # File upload config
│   ├── socket.js           # Socket.IO setup
│   └── seeder.js           # DB seed (permissions, roles, admin)
├── constants/
│   └── enums.js            # All enum definitions
├── models/
│   ├── School.js           # School (multi-school support)
│   ├── User.js             # Users (all roles share one table)
│   ├── Role.js             # Role + Permission + UserRole
│   ├── Session.js          # Academic sessions
│   ├── Student.js          # Student + Parent + StudentParent (junction)
│   ├── Teacher.js          # Teacher + Staff
│   ├── Academic.js         # Class, Section, Shift, ClassSetup,
│   │                       # Subject, SubjectAssign, ClassRoutine,
│   │                       # LessonPlan, StudyMaterial
│   ├── Exam.js             # Attendance, StudentLeave, ExamType,
│   │                       # MarkGrade, Exam, ExamAssign, ExamRoutine,
│   │                       # MarkRegister, AdmitCard, Marksheet
│   ├── Fee.js              # FeeGroup, FeeType, FeeMaster, FeeAssign,
│   │                       # FeeCollect, Transaction
│   └── Content.js          # Assignment, Submission, BookCategory,
│                           # Book, LibraryMember, BookIssue,
│                           # Event, Notification, NotificationRead,
│                           # OnlineAdmission
├── middlewares/
│   ├── authMiddleware.js   # JWT verify + RBAC permission guard
│   └── errorMiddleware.js  # Global error handler + 404
├── utils/
│   ├── baseSchema.js       # Audit plugin (created_at, soft delete)
│   ├── jwt.js              # Token helpers + Redis cache
│   ├── response.js         # Standardized API responses
│   ├── email.js            # Nodemailer email templates
│   └── pagination.js       # Pagination + filter helpers
├── services/               # Business logic layer
│   ├── authService.js
│   ├── crudService.js      # Reusable CRUD factory
│   ├── roleService.js
│   ├── studentService.js   # + bulk import
│   ├── attendanceService.js# bulk mark + reports
│   ├── examService.js      # admit cards + marksheets + grading
│   ├── assignmentService.js# auto class-distribution
│   ├── feeService.js       # bulk assign + collection
│   ├── notificationService.js # real-time Socket.IO
│   └── dashboardService.js # role-based dashboard data
├── controllers/            # Request handlers
└── routes/                 # Express routers (55 route files)
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login (returns access + refresh token) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout (revoke refresh token) |
| PUT  | `/api/v1/auth/change-password` | Change password |
| GET  | `/api/v1/auth/me` | Get current user profile |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard` | Smart dashboard (auto-detects role) |
| GET | `/api/v1/dashboard/admin` | Admin dashboard |
| GET | `/api/v1/dashboard/teacher` | Teacher dashboard |
| GET | `/api/v1/dashboard/student` | Student dashboard |
| GET | `/api/v1/dashboard/parent` | Parent dashboard |

### People
| Prefix | Resource |
|--------|----------|
| `/api/v1/students` | Students (+ bulk-import) |
| `/api/v1/parents` | Parents |
| `/api/v1/teachers` | Teachers |
| `/api/v1/staff` | Staff |
| `/api/v1/admissions` | Online admissions (public POST /apply) |
| `/api/v1/leaves` | Student leaves |

### Academic
| Prefix | Resource |
|--------|----------|
| `/api/v1/sessions` | Academic sessions |
| `/api/v1/classes` | Classes |
| `/api/v1/sections` | Sections |
| `/api/v1/shifts` | Shifts |
| `/api/v1/class-setups` | Class + Section + Shift combos |
| `/api/v1/subjects` | Subjects |
| `/api/v1/subject-assigns` | Teacher → Subject assignments |
| `/api/v1/class-routines` | Class timetable |
| `/api/v1/lesson-plans` | Lesson plans |
| `/api/v1/study-materials` | Study materials |

### Attendance
| Method | Endpoint |
|--------|----------|
| POST | `/api/v1/attendance/mark` |
| GET  | `/api/v1/attendance/class?class_setup_id=&date=` |
| GET  | `/api/v1/attendance/student/:id/report` |
| GET  | `/api/v1/attendance/class/:id/report` |

### Exams & Results
| Prefix | Resource |
|--------|----------|
| `/api/v1/exam-types` | Exam types |
| `/api/v1/mark-grades` | Grade configuration |
| `/api/v1/exams` | Exams (+ admit cards + marksheets) |
| `/api/v1/exam-assigns` | Exam → Subject assignments |
| `/api/v1/exam-routines` | Exam timetable |
| `/api/v1/mark-registers` | Mark entry |
| `/api/v1/admit-cards` | Admit cards |
| `/api/v1/marksheets` | Marksheets |

### Key Exam Actions
```
POST   /api/v1/exams/:id/admit-cards/generate   → Auto-generate for all students
PATCH  /api/v1/exams/:id/admit-cards/:cardId/approve
POST   /api/v1/exams/assigns/:assignId/marks    → Bulk mark entry
POST   /api/v1/exams/:id/marksheets/generate    → Auto-generate marksheets
PATCH  /api/v1/exams/:id/marksheets/approve
PATCH  /api/v1/exams/:id/marksheets/publish
```

### Fees
| Prefix | Resource |
|--------|----------|
| `/api/v1/fee-groups` | Fee groups |
| `/api/v1/fee-types` | Fee types |
| `/api/v1/fee-masters` | Fee master templates |
| `/api/v1/fee-assigns` | Fee → Student assignments |
| `/api/v1/fee-collects` | Fee collection |
| `/api/v1/transactions` | Transaction log |

### Key Fee Actions
```
POST  /api/v1/fee-collects/bulk-assign              → Assign to whole class
POST  /api/v1/fee-collects/assign/:assignId/collect → Collect payment
GET   /api/v1/fee-collects/student/:id              → Student fee ledger
GET   /api/v1/fee-collects/report                   → Fee analytics
```

### Assignments
```
GET   /api/v1/assignments           → All assignments (teacher view)
POST  /api/v1/assignments           → Create + auto-distribute to class
GET   /api/v1/assignments/my        → Student's assignments
POST  /api/v1/assignments/:id/submit
PATCH /api/v1/assignments/:id/submissions/:subId/grade
```

### Library
| Prefix | Resource |
|--------|----------|
| `/api/v1/book-categories` | Book categories |
| `/api/v1/books` | Books |
| `/api/v1/library-members` | Library members |
| `/api/v1/book-issues` | Issue / return books |

### Communication
| Prefix | Resource |
|--------|----------|
| `/api/v1/notifications` | Notifications (real-time via Socket.IO) |
| `/api/v1/events` | School events |

### RBAC
```
GET   /api/v1/roles                      → List all roles
POST  /api/v1/roles                      → Create role (super admin)
PUT   /api/v1/roles/:id/permissions      → Assign permissions to role
POST  /api/v1/roles/assign               → Assign role to user
POST  /api/v1/roles/revoke               → Revoke role from user
GET   /api/v1/permissions                → All available permissions
```

---

## Authentication

All protected routes require:
```
Authorization: Bearer <access_token>
```

Refresh token is stored as httpOnly cookie and also returned in response body.

---

## Socket.IO Events

```javascript
// Client connects and joins their room
socket.emit('join', userId);

// Client listens for notifications
socket.on('notification', (data) => {
  console.log(data); // { type, title, message, ... }
});
```

---

## Design Decisions

| Decision | Reason |
|----------|--------|
| Single USERS table for all roles | Simpler auth, role switching supported |
| STUDENT_PARENTS junction table | One student → many guardians, one parent → many children |
| subject_id in ATTENDANCE | Subject-wise attendance for college-level tracking |
| student_id removed from FEE_COLLECTS | Avoids inconsistency — derive via fee_assign_id |
| library_member_id in BOOK_ISSUES | Clear FK reference to LibraryMember not raw User |
| Soft delete on all collections | Data recovery, audit trail |
| school_id on every collection | Multi-school (SaaS) support |
| Permission cache in Redis | Avoids DB hit on every request |
| CRUD factory pattern | Reduces boilerplate across 35 collections |
