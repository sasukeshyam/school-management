const { FeeMaster, FeeAssign, FeeCollect, Transaction } = require('../models/Fee');
const { Student } = require('../models/Student');
const { paginate } = require('../utils/pagination');
const { v4: uuidv4 } = require('uuid');

// Bulk assign fee master to all students in a class or specific students
const bulkAssign = async (feeMasterId, schoolId, createdBy, studentIds = null) => {
  const master = await FeeMaster.findOne({ _id: feeMasterId, school_id: schoolId });
  if (!master) throw Object.assign(new Error('Fee master not found'), { statusCode: 404 });

  let students;
  if (studentIds?.length) {
    students = await Student.find({ _id: { $in: studentIds }, school_id: schoolId });
  } else if (master.class_setup_id) {
    students = await Student.find({ class_setup_id: master.class_setup_id, school_id: schoolId, status: 'active' });
  } else {
    students = await Student.find({ school_id: schoolId, status: 'active' });
  }

  const ops = students.map((s) => ({
    updateOne: {
      filter: { fee_master_id: feeMasterId, student_id: s._id, school_id: schoolId },
      update: {
        $setOnInsert: {
          fee_master_id: feeMasterId,
          student_id:    s._id,
          school_id:     schoolId,
          amount:        master.amount,
          due_date:      master.due_date,
          status:        'unpaid',
          created_by:    createdBy,
        },
      },
      upsert: true,
    },
  }));

  await FeeAssign.bulkWrite(ops);
  return { assigned: students.length };
};

// Collect fee payment
const collectFee = async (feeAssignId, paymentData, schoolId, collectedBy) => {
  const assign = await FeeAssign.findOne({ _id: feeAssignId, school_id: schoolId });
  if (!assign) throw Object.assign(new Error('Fee assignment not found'), { statusCode: 404 });
  if (assign.status === 'paid') throw Object.assign(new Error('Fee already fully paid'), { statusCode: 400 });

  const receiptNo = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  const collection = await FeeCollect.create({
    school_id:      schoolId,
    fee_assign_id:  feeAssignId,
    amount_paid:    paymentData.amount_paid,
    paid_date:      paymentData.paid_date || new Date(),
    payment_method: paymentData.payment_method || 'cash',
    transaction_id: paymentData.transaction_id || uuidv4(),
    receipt_no:     receiptNo,
    note:           paymentData.note,
    collected_by:   collectedBy,
    created_by:     collectedBy,
  });

  // Log in transactions table
  await Transaction.create({
    school_id:   schoolId,
    type:        'income',
    description: `Fee collection - Receipt ${receiptNo}`,
    amount:      paymentData.amount_paid,
    date:        paymentData.paid_date || new Date(),
    reference:   receiptNo,
    created_by:  collectedBy,
  });

  return collection;
};

const getStudentFees = async (studentId, schoolId, query) => {
  const { page, limit, skip } = paginate(query);
  const filter = { student_id: studentId, school_id: schoolId };
  if (query.status) filter.status = query.status;

  const [assigns, total] = await Promise.all([
    FeeAssign.find(filter)
      .populate({ path: 'fee_master_id', populate: ['fee_group_id', 'fee_type_id'] })
      .sort('-created_at').skip(skip).limit(limit),
    FeeAssign.countDocuments(filter),
  ]);

  // Attach payment history to each assign
  const data = await Promise.all(assigns.map(async (a) => {
    const payments = await FeeCollect.find({ fee_assign_id: a._id });
    const paid = payments.reduce((s, p) => s + p.amount_paid, 0);
    return { ...a.toObject(), payments, total_paid: paid, balance: a.amount - paid };
  }));

  return { data, total, page, limit };
};

const getFeeReport = async (schoolId, query) => {
  const mongoose = require('mongoose');
  const schoolObjId = new mongoose.Types.ObjectId(schoolId);

  const summary = await FeeAssign.aggregate([
    { $match: { school_id: schoolObjId } },
    { $group: {
      _id:          '$status',
      count:        { $sum: 1 },
      total_amount: { $sum: '$amount' },
    }},
  ]);

  const monthlyCollection = await FeeCollect.aggregate([
    { $match: { school_id: schoolObjId } },
    { $group: {
      _id:   { $month: '$paid_date' },
      total: { $sum: '$amount_paid' },
      count: { $sum: 1 },
    }},
    { $sort: { '_id': 1 } },
  ]);

  return { summary, monthlyCollection };
};

  

module.exports = { bulkAssign, collectFee, getStudentFees, getFeeReport };
