// ─── Auth ─────────────────────────────────────────────────────────────────────
const GENDER = ['male', 'female', 'other'];
const STATUS_ACTIVE = ['active', 'inactive'];
const USER_STATUS = ['active', 'inactive', 'suspended'];

// ─── Student ──────────────────────────────────────────────────────────────────
const STUDENT_STATUS = ['active', 'inactive', 'transferred', 'graduated', 'expelled'];
const BLOOD_GROUP = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GUARDIAN_RELATION = ['father', 'mother', 'guardian', 'grandfather', 'grandmother', 'uncle', 'aunt', 'sibling', 'other'];

// ─── Academic ─────────────────────────────────────────────────────────────────
const SUBJECT_TYPE = ['theory', 'practical', 'both'];
const DAY_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// ─── Attendance ───────────────────────────────────────────────────────────────
const ATTENDANCE_STATUS = ['present', 'absent', 'late', 'half_day', 'holiday', 'excused'];

// ─── Exam ─────────────────────────────────────────────────────────────────────
const EXAM_STATUS = ['draft', 'published', 'ongoing', 'completed', 'cancelled'];
const ADMIT_CARD_STATUS = ['draft', 'approved', 'issued', 'cancelled'];
const MARKSHEET_STATUS = ['draft', 'pending_approval', 'approved', 'published', 'rejected'];
const MARK_DISTRIBUTION = ['written', 'practical', 'oral', 'assignment', 'project'];

// ─── Fees ─────────────────────────────────────────────────────────────────────
const FEE_STATUS = ['unpaid', 'partial', 'paid', 'overdue', 'waived'];
const PAYMENT_METHOD = ['cash', 'bank_transfer', 'cheque', 'online', 'upi', 'card'];
const TRANSACTION_TYPE = ['income', 'expense', 'refund', 'adjustment'];

// ─── Leave ────────────────────────────────────────────────────────────────────
const LEAVE_STATUS = ['pending', 'approved', 'rejected', 'cancelled'];

// ─── Library ──────────────────────────────────────────────────────────────────
const MEMBER_TYPE = ['student', 'teacher', 'staff'];
const BOOK_ISSUE_STATUS = ['issued', 'returned', 'overdue', 'lost'];

// ─── Assignment ───────────────────────────────────────────────────────────────
const SUBMISSION_STATUS = ['pending', 'submitted', 'late', 'graded', 'resubmit'];

// ─── Event ────────────────────────────────────────────────────────────────────
const EVENT_AUDIENCE = ['all', 'students', 'parents', 'teachers', 'staff', 'admin'];

// ─── Notification ─────────────────────────────────────────────────────────────
const NOTIFICATION_TARGET = ['all', 'students', 'parents', 'teachers', 'staff', 'admin', 'specific'];

// ─── Admission ────────────────────────────────────────────────────────────────
const ADMISSION_STATUS = ['pending', 'under_review', 'approved', 'rejected', 'enrolled'];

module.exports = {
  GENDER, STATUS_ACTIVE, USER_STATUS,
  STUDENT_STATUS, BLOOD_GROUP, GUARDIAN_RELATION,
  SUBJECT_TYPE, DAY_OF_WEEK,
  ATTENDANCE_STATUS,
  EXAM_STATUS, ADMIT_CARD_STATUS, MARKSHEET_STATUS, MARK_DISTRIBUTION,
  FEE_STATUS, PAYMENT_METHOD, TRANSACTION_TYPE,
  LEAVE_STATUS,
  MEMBER_TYPE, BOOK_ISSUE_STATUS,
  SUBMISSION_STATUS,
  EVENT_AUDIENCE,
  NOTIFICATION_TARGET,
  ADMISSION_STATUS,
};
