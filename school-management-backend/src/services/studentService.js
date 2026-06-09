const { Student, Parent, StudentParent } = require('../models/Student');
const User = require('../models/User');
const { UserRole } = require('../models/Role');
const { welcomeEmail } = require('../utils/email');
const { paginate } = require('../utils/pagination');
const crypto = require('crypto');

const getAll = async (filter, query) => {
  const { page, limit, skip, sort } = paginate(query);
  const search = query.search ? {
    $or: [
      { 'user_id.name': { $regex: query.search, $options: 'i' } },
      { roll_number: { $regex: query.search, $options: 'i' } },
      { admission_no: { $regex: query.search, $options: 'i' } },
    ],
  } : {};

  const [data, total] = await Promise.all([
    Student.find({ ...filter, ...search })
      .populate({ path: 'user_id', select: 'name email phone avatar' })
      .populate({ path: 'class_setup_id', populate: ['class_id', 'section_id'] })
      .sort(sort).skip(skip).limit(limit),
    Student.countDocuments({ ...filter, ...search }),
  ]);
  return { data, total, page, limit };
};

const getById = async (id, filter) => {
  const student = await Student.findOne({ _id: id, ...filter })
    .populate({ path: 'user_id', select: '-password_hash' })
    .populate({ path: 'class_setup_id', populate: ['class_id', 'section_id', 'shift_id'] })
    .populate('session_id');

  if (!student) throw Object.assign(new Error('Student not found'), { statusCode: 404 });

  const parents = await StudentParent.find({ student_id: id })
    .populate({ path: 'parent_id', populate: { path: 'user_id', select: 'name email phone' } });

  return { ...student.toObject(), parents };
};

const create = async (data, schoolId, createdBy) => {
  // its for random password
  // const tempPassword = crypto.randomBytes(4).toString('hex');
  const tempPassword = 'Student@123456'

  // Create user account
  const user = await User.create({
    school_id:     schoolId,
    name:          data.name,
    email:         data.email,
    password_hash: tempPassword,
    phone:         data.phone,
    avatar:        data.avatar,
    created_by:    createdBy,
  });

  // Assign student role
  const { Role } = require('../models/Role');
  const studentRole = await Role.findOne({ slug: 'student', school_id: schoolId });
  if (studentRole) {
    await UserRole.create({ school_id: schoolId, user_id: user._id, role_id: studentRole._id, assigned_by: createdBy });
  }

  // Create student profile
  const student = await Student.create({
    ...data,
    school_id:  schoolId,
    user_id:    user._id,
    created_by: createdBy,
  });

  // Link parents if provided
  if (data.parents?.length) {
    const parentLinks = data.parents.map((p) => ({
      school_id:  schoolId,
      student_id: student._id,
      parent_id:  p.parent_id,
      relation:   p.relation,
      is_primary: p.is_primary || false,
      created_by: createdBy,
    }));
    await StudentParent.insertMany(parentLinks);
  }

  // Send welcome email
  try { await welcomeEmail(data.email, data.name, tempPassword); } catch (_) {}

  return student;
};

const update = async (id, data, filter) => {
  const student = await Student.findOneAndUpdate(
    { _id: id, ...filter },
    data,
    { new: true, runValidators: true }
  ).populate('user_id');
  if (!student) throw Object.assign(new Error('Student not found'), { statusCode: 404 });

  // Update user profile fields if provided
  if (data.name || data.phone || data.avatar) {
    await User.findByIdAndUpdate(student.user_id, {
      ...(data.name && { name: data.name }),
      ...(data.phone && { phone: data.phone }),
      ...(data.avatar && { avatar: data.avatar }),
    });
  }
  return student;
};

const softDelete = async (id, userId, filter) => {
  const student = await Student.findOne({ _id: id, ...filter });
  if (!student) throw Object.assign(new Error('Student not found'), { statusCode: 404 });
  await student.softDelete(userId);
  await User.findByIdAndUpdate(student.user_id, { is_active: false });
};

const bulkImport = async (rows, schoolId, sessionId, createdBy) => {
  const results = { success: 0, failed: 0, errors: [] };
  for (const [i, row] of rows.entries()) {
    try {
      await create({ ...row, session_id: sessionId }, schoolId, createdBy);
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ row: i + 1, error: err.message });
    }
  }
  return results;
};

module.exports = { getAll, getById, create, update, softDelete, bulkImport };



