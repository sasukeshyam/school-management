const mongoose = require('mongoose');
const auditPlugin = require('../utils/baseSchema');
const {
  SUBMISSION_STATUS, MEMBER_TYPE, BOOK_ISSUE_STATUS,
  EVENT_AUDIENCE, NOTIFICATION_TARGET, ADMISSION_STATUS,
} = require('../constants/enums');

const S = mongoose.Schema.Types.ObjectId;

// ─── Assignment ───────────────────────────────────────────────────────────────
const assignmentSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School',    required: true, index: true },
  class_setup_id: { type: S, ref: 'ClassSetup',required: true, index: true },
  subject_id:     { type: S, ref: 'Subject',   required: true, index: true },
  teacher_id:     { type: S, ref: 'Teacher',   required: true },
  session_id:     { type: S, ref: 'Session',   required: true },
  title:          { type: String, required: true, trim: true },
  description:    { type: String, trim: true },
  due_date:       { type: Date, required: true },
  total_marks:    { type: Number, default: 100 },
  attachments:    [{ url: String, name: String, type: String }],
  is_active:      { type: Boolean, default: true },
});
assignmentSchema.plugin(auditPlugin);
const Assignment = mongoose.model('Assignment', assignmentSchema);

// ─── AssignmentSubmission ─────────────────────────────────────────────────────
const submissionSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School',     required: true, index: true },
  assignment_id:  { type: S, ref: 'Assignment', required: true, index: true },
  student_id:     { type: S, ref: 'Student',    required: true, index: true },
  files:          [{ url: String, name: String, type: String }],
  note:           { type: String, trim: true },
  submitted_at:   { type: Date, default: Date.now },
  marks_obtained: { type: Number },
  feedback:       { type: String, trim: true },
  graded_by:      { type: S, ref: 'User' },
  graded_at:      { type: Date },
  status:         { type: String, enum: SUBMISSION_STATUS, default: 'pending', index: true },
});
submissionSchema.index({ assignment_id: 1, student_id: 1 }, { unique: true });
submissionSchema.plugin(auditPlugin);
const Submission = mongoose.model('Submission', submissionSchema);

// ─── BookCategory ─────────────────────────────────────────────────────────────
const bookCategorySchema = new mongoose.Schema({
  school_id: { type: S, ref: 'School', required: true, index: true },
  name:      { type: String, required: true, trim: true },
  is_active: { type: Boolean, default: true },
});
bookCategorySchema.plugin(auditPlugin);
const BookCategory = mongoose.model('BookCategory', bookCategorySchema);

// ─── Book ─────────────────────────────────────────────────────────────────────
const bookSchema = new mongoose.Schema({
  school_id:        { type: S, ref: 'School',       required: true, index: true },
  category_id:      { type: S, ref: 'BookCategory', required: true, index: true },
  title:            { type: String, required: true, trim: true },
  author:           { type: String, trim: true },
  publisher:        { type: String, trim: true },
  isbn:             { type: String, trim: true },
  edition:          { type: String, trim: true },
  total_copies:     { type: Number, default: 1 },
  available_copies: { type: Number, default: 1 },
  shelf_location:   { type: String, trim: true },
  is_active:        { type: Boolean, default: true },
});
bookSchema.index({ isbn: 1, school_id: 1 }, { unique: true, sparse: true });
bookSchema.plugin(auditPlugin);
const Book = mongoose.model('Book', bookSchema);

// ─── LibraryMember ────────────────────────────────────────────────────────────
const libraryMemberSchema = new mongoose.Schema({
  school_id:   { type: S, ref: 'School', required: true, index: true },
  user_id:     { type: S, ref: 'User',   required: true, index: true },
  member_type: { type: String, enum: MEMBER_TYPE, required: true },
  member_no:   { type: String, trim: true },
  is_active:   { type: Boolean, default: true },
});
libraryMemberSchema.index({ member_no: 1, school_id: 1 }, { unique: true, sparse: true });
libraryMemberSchema.index({ user_id: 1, school_id: 1 }, { unique: true });
libraryMemberSchema.plugin(auditPlugin);
const LibraryMember = mongoose.model('LibraryMember', libraryMemberSchema);

// ─── BookIssue ────────────────────────────────────────────────────────────────
const bookIssueSchema = new mongoose.Schema({
  school_id:         { type: S, ref: 'School',        required: true, index: true },
  book_id:           { type: S, ref: 'Book',          required: true, index: true },
  library_member_id: { type: S, ref: 'LibraryMember', required: true, index: true },
  issue_date:        { type: Date, default: Date.now },
  due_date:          { type: Date, required: true },
  return_date:       { type: Date },
  status:            { type: String, enum: BOOK_ISSUE_STATUS, default: 'issued', index: true },
  fine:              { type: Number, default: 0 },
  fine_paid:         { type: Boolean, default: false },
  issued_by:         { type: S, ref: 'User' },
  returned_to:       { type: S, ref: 'User' },
});
bookIssueSchema.plugin(auditPlugin);

// Decrement available copies on issue
bookIssueSchema.post('save', async function (doc) {
  if (doc.status === 'issued') {
    await mongoose.model('Book').findByIdAndUpdate(doc.book_id, { $inc: { available_copies: -1 } });
  } else if (doc.status === 'returned') {
    await mongoose.model('Book').findByIdAndUpdate(doc.book_id, { $inc: { available_copies: 1 } });
  }
});

const BookIssue = mongoose.model('BookIssue', bookIssueSchema);

// ─── Event ────────────────────────────────────────────────────────────────────
const eventSchema = new mongoose.Schema({
  school_id:   { type: S, ref: 'School', required: true, index: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  event_date:  { type: Date, required: true, index: true },
  start_time:  { type: String },
  end_time:    { type: String },
  location:    { type: String, trim: true },
  audience:    { type: String, enum: EVENT_AUDIENCE, default: 'all' },
  image:       { type: String },
  is_active:   { type: Boolean, default: true },
});
eventSchema.plugin(auditPlugin);
const Event = mongoose.model('Event', eventSchema);

// ─── Notification ─────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  school_id:   { type: S, ref: 'School', required: true, index: true },
  sender_id:   { type: S, ref: 'User',   required: true },
  title:       { type: String, required: true, trim: true },
  message:     { type: String, required: true, trim: true },
  target_role: { type: String, enum: NOTIFICATION_TARGET, default: 'all' },
  target_users:[{ type: S, ref: 'User' }],
  is_broadcast:{ type: Boolean, default: false },
  image:       { type: String },
});
notificationSchema.plugin(auditPlugin);
const Notification = mongoose.model('Notification', notificationSchema);

// ─── NotificationRead ─────────────────────────────────────────────────────────
const notificationReadSchema = new mongoose.Schema({
  notification_id: { type: S, ref: 'Notification', required: true, index: true },
  user_id:         { type: S, ref: 'User',         required: true, index: true },
  is_read:         { type: Boolean, default: false },
  read_at:         { type: Date },
});
notificationReadSchema.index({ notification_id: 1, user_id: 1 }, { unique: true });
const NotificationRead = mongoose.model('NotificationRead', notificationReadSchema);

// ─── OnlineAdmission ──────────────────────────────────────────────────────────
const onlineAdmissionSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School', required: true, index: true },
  full_name:      { type: String, required: true, trim: true },
  email:          { type: String, lowercase: true, trim: true },
  phone:          { type: String, trim: true },
  dob:            { type: Date },
  gender:         { type: String },
  class_applying: { type: String, trim: true },
  guardian_name:  { type: String, trim: true },
  guardian_phone: { type: String, trim: true },
  guardian_relation: { type: String, trim: true },
  address:        { type: String, trim: true },
  documents:      [{ url: String, name: String }],
  status:         { type: String, enum: ADMISSION_STATUS, default: 'pending', index: true },
  reviewed_by:    { type: S, ref: 'User' },
  review_notes:   { type: String, trim: true },
});
onlineAdmissionSchema.plugin(auditPlugin);
const OnlineAdmission = mongoose.model('OnlineAdmission', onlineAdmissionSchema);

module.exports = {
  Assignment, Submission,
  BookCategory, Book, LibraryMember, BookIssue,
  Event,
  Notification, NotificationRead,
  OnlineAdmission,
};
