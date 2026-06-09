const { Exam, ExamAssign, MarkRegister, AdmitCard, Marksheet, MarkGrade } = require('../models/Exam');
const { Student } = require('../models/Student');
const { paginate } = require('../utils/pagination');

// ─── Exam CRUD ────────────────────────────────────────────────────────────────
const createExam = async (data) => Exam.create(data);

const getExams = async (filter, query) => {
  const { page, limit, skip, sort } = paginate(query);
  const [data, total] = await Promise.all([
    Exam.find(filter)
      .populate('exam_type_id', 'name code')
      .populate({ path: 'class_setup_id', populate: ['class_id','section_id'] })
      .sort(sort).skip(skip).limit(limit),
    Exam.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

const updateExamStatus = async (id, status, schoolId) => {
  const exam = await Exam.findOneAndUpdate(
    { _id: id, school_id: schoolId },
    { status },
    { new: true }
  );
  if (!exam) throw Object.assign(new Error('Exam not found'), { statusCode: 404 });
  return exam;
};

// ─── Admit Cards ──────────────────────────────────────────────────────────────
const generateAdmitCards = async (examId, schoolId, generatedBy) => {
  const exam = await Exam.findOne({ _id: examId, school_id: schoolId });
  if (!exam) throw Object.assign(new Error('Exam not found'), { statusCode: 404 });

  const students = await Student.find({
    class_setup_id: exam.class_setup_id,
    school_id: schoolId,
    status: 'active',
  });

  const ops = students.map((s, i) => ({
    updateOne: {
      filter: { student_id: s._id, exam_id: examId, school_id: schoolId },
      update: {
        $setOnInsert: {
          student_id:  s._id,
          exam_id:     examId,
          school_id:   schoolId,
          seat_number: `${String(i + 1).padStart(3, '0')}`,
          status:      'draft',
          created_by:  generatedBy,
        },
      },
      upsert: true,
    },
  }));

  await AdmitCard.bulkWrite(ops);
  return { generated: students.length };
};

const approveAdmitCard = async (id, schoolId, approvedBy) => {
  return AdmitCard.findOneAndUpdate(
    { _id: id, school_id: schoolId },
    { status: 'approved', approved_by: approvedBy, issued_at: new Date() },
    { new: true }
  );
};

// ─── Mark Entry ───────────────────────────────────────────────────────────────
const enterMarks = async (examAssignId, marks, schoolId, enteredBy) => {
  const ops = marks.map((m) => ({
    updateOne: {
      filter: { exam_assign_id: examAssignId, student_id: m.student_id, school_id: schoolId },
      update: {
        $set: {
          marks_obtained: m.marks,
          is_absent:      m.is_absent || false,
          remarks:        m.remarks || '',
          entered_by:     enteredBy,
          school_id:      schoolId,
        },
      },
      upsert: true,
    },
  }));
  await MarkRegister.bulkWrite(ops);

  // Auto-assign grades
  await assignGrades(schoolId);
  return { updated: marks.length };
};

const assignGrades = async (schoolId) => {
  const grades = await MarkGrade.find({ school_id: schoolId, is_active: true }).sort('min_mark');
  const ungraded = await MarkRegister.find({ school_id: schoolId, grade_id: null, is_absent: false });

  for (const reg of ungraded) {
    const grade = grades.find(
      (g) => reg.marks_obtained >= g.min_mark && reg.marks_obtained <= g.max_mark
    );
    if (grade) {
      reg.grade_id = grade._id;
      reg.is_pass  = reg.marks_obtained >= (await ExamAssign.findById(reg.exam_assign_id))?.passing_marks || 33;
      await reg.save();
    }
  }
};

// ─── Marksheet ────────────────────────────────────────────────────────────────
const generateMarksheets = async (examId, schoolId, generatedBy) => {
  const exam = await Exam.findOne({ _id: examId, school_id: schoolId });
  if (!exam) throw Object.assign(new Error('Exam not found'), { statusCode: 404 });

  const assigns = await ExamAssign.find({ exam_id: examId, school_id: schoolId });
  const students = await Student.find({ class_setup_id: exam.class_setup_id, school_id: schoolId, status: 'active' });

  for (const student of students) {
    let totalObtained = 0, totalMarks = 0, allPass = true;

    for (const assign of assigns) {
      const reg = await MarkRegister.findOne({
        exam_assign_id: assign._id,
        student_id: student._id,
      });
      totalMarks += assign.total_marks;
      if (reg && !reg.is_absent) {
        totalObtained += reg.marks_obtained;
        if (!reg.is_pass) allPass = false;
      } else {
        allPass = false;
      }
    }

    const percentage = totalMarks > 0 ? (totalObtained / totalMarks) * 100 : 0;
    const grades = await MarkGrade.find({ school_id: schoolId }).sort('min_mark');
    const finalGrade = grades.find(
      (g) => percentage >= g.min_mark && percentage <= g.max_mark
    );

    await Marksheet.findOneAndUpdate(
      { student_id: student._id, exam_id: examId, school_id: schoolId },
      {
        total_obtained: totalObtained,
        total_marks:    totalMarks,
        percentage:     parseFloat(percentage.toFixed(2)),
        final_grade:    finalGrade?.grade || 'F',
        final_point:    finalGrade?.point || '0',
        is_pass:        allPass,
        status:         'draft',
        created_by:     generatedBy,
        school_id:      schoolId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  // Assign ranks
  const sheets = await Marksheet.find({ exam_id: examId, school_id: schoolId }).sort('-percentage');
  for (let i = 0; i < sheets.length; i++) {
    sheets[i].rank = i + 1;
    await sheets[i].save();
  }

  return { generated: students.length };
};

const approveMarksheet = async (examId, schoolId, approvedBy) => {
  await Marksheet.updateMany(
    { exam_id: examId, school_id: schoolId, status: 'draft' },
    { status: 'pending_approval', approved_by: approvedBy }
  );
  return { message: 'Sent for approval' };
};

const publishMarksheets = async (examId, schoolId, publishedBy) => {
  await Marksheet.updateMany(
    { exam_id: examId, school_id: schoolId, status: 'pending_approval' },
    { status: 'published', published_at: new Date(), approved_by: publishedBy }
  );
  return { message: 'Marksheets published' };
};

module.exports = {
  createExam, getExams, updateExamStatus,
  generateAdmitCards, approveAdmitCard,
  enterMarks,
  generateMarksheets, approveMarksheet, publishMarksheets,
};
