const { Attendance } = require('../models/Exam');
const { Student } = require('../models/Student');

// Mark attendance for a whole class in one request
const markBulk = async (records, classSetupId, date, schoolId, markedBy) => {
  const ops = records.map((r) => ({
    updateOne: {
      filter: {
        student_id: r.student_id,
        class_setup_id: classSetupId,
        date: new Date(date),
        school_id: schoolId,
        ...(r.subject_id && { subject_id: r.subject_id }),
      },
      update: {
        $set: {
          status:     r.status,
          note:       r.note || '',
          is_holiday: r.is_holiday || false,
          marked_by:  markedBy,
          school_id:  schoolId,
        },
      },
      upsert: true,
    },
  }));

  const result = await Attendance.bulkWrite(ops);
  return result;
};

const getByClass = async (classSetupId, date, schoolId, subjectId) => {
  const filter = { class_setup_id: classSetupId, school_id: schoolId };
  if (date) filter.date = new Date(date);
  if (subjectId) filter.subject_id = subjectId;

  return Attendance.find(filter)
    .populate({ path: 'student_id', populate: { path: 'user_id', select: 'name avatar' } })
    .sort('created_at');
};

const getStudentReport = async (studentId, schoolId, query) => {
  const filter = { student_id: studentId, school_id: schoolId };
  if (query.from) filter.date = { $gte: new Date(query.from) };
  if (query.to)   filter.date = { ...filter.date, $lte: new Date(query.to) };
  if (query.subject_id) filter.subject_id = query.subject_id;

  const records = await Attendance.find(filter).sort('date');

  const summary = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    acc.total++;
    return acc;
  }, { total: 0, present: 0, absent: 0, late: 0, half_day: 0, holiday: 0 });

  summary.percentage = summary.total
    ? ((summary.present + summary.late * 0.5) / summary.total * 100).toFixed(2)
    : 0;

  return { records, summary };
};

const getClassReport = async (classSetupId, schoolId, query) => {
  const filter = { class_setup_id: classSetupId, school_id: schoolId };
  if (query.from) filter.date = { $gte: new Date(query.from) };
  if (query.to)   filter.date = { ...filter.date, $lte: new Date(query.to) };

  const pipeline = [
    { $match: filter },
    { $group: {
      _id: '$student_id',
      present:  { $sum: { $cond: [{ $eq: ['$status','present'] }, 1, 0] } },
      absent:   { $sum: { $cond: [{ $eq: ['$status','absent'] }, 1, 0] } },
      late:     { $sum: { $cond: [{ $eq: ['$status','late'] }, 1, 0] } },
      half_day: { $sum: { $cond: [{ $eq: ['$status','half_day'] }, 1, 0] } },
      total:    { $sum: 1 },
    }},
    { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
    { $unwind: '$student' },
    { $sort: { 'student.roll_number': 1 } },
  ];

  return Attendance.aggregate(pipeline);
};

module.exports = { markBulk, getByClass, getStudentReport, getClassReport };
