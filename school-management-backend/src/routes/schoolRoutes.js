const express = require('express')
const router  = express.Router()
const School  = require('../models/School')
const { authenticate, superAdminOnly } = require('../middlewares/authMiddleware')
const { sendSuccess, sendPaginated } = require('../utils/response')
const { paginate } = require('../utils/pagination')

router.use(authenticate, superAdminOnly)

// Get ALL schools — no school_id filter
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = paginate(req.query)
    const filter = { is_deleted: false }
    if (req.query.search) {
      filter.$or = [
        { name:    { $regex: req.query.search, $options: 'i' } },
        { email:   { $regex: req.query.search, $options: 'i' } },
        { address: { $regex: req.query.search, $options: 'i' } },
      ]
    }
    const [data, total] = await Promise.all([
      School.find(filter).sort(sort).skip(skip).limit(limit),
      School.countDocuments(filter),
    ])
    sendPaginated(res, data, total, page, limit)
  } catch (err) { next(err) }
})

// Get one school by ID
router.get('/:id', async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id)
    if (!school) return res.status(404).json({ success: false, message: 'School not found' })
    sendSuccess(res, school)
  } catch (err) { next(err) }
})

// Create school
router.post('/', async (req, res, next) => {
  try {
    const school = await School.create({ ...req.body, created_by: req.user._id })
    sendSuccess(res, school, 'School created', 201)
  } catch (err) { next(err) }
})

// Update school
router.put('/:id', async (req, res, next) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!school) return res.status(404).json({ success: false, message: 'School not found' })
    sendSuccess(res, school, 'School updated')
  } catch (err) { next(err) }
})

// Delete school
router.delete('/:id', async (req, res, next) => {
  try {
    await School.findByIdAndUpdate(req.params.id, { is_deleted: true, deleted_at: new Date() })
    sendSuccess(res, {}, 'School deleted')
  } catch (err) { next(err) }
})

// Seed roles for a specific school — called when creating school from Master UI
router.post('/:id/seed-roles', async (req, res, next) => {
  try {
    const { Permission, Role } = require('../models/Role')
    const schoolId = req.params.id

    const allPerms = await Permission.find()
    const permMap  = {}
    allPerms.forEach(p => { permMap[p.slug] = p._id })

    const ROLE_PERMS = {
      super_admin: ['super_admin'],
      admin: allPerms.map(p => p.slug),
      teacher: [
        'teacher.dashboard','students.view','attendance.view','attendance.mark',
        'class_routines.view','lesson_plans.view','lesson_plans.create','lesson_plans.edit','lesson_plans.delete',
        'study_materials.view','study_materials.create','study_materials.edit','study_materials.delete',
        'exams.view','results.view','results.enter','admitcard.generate',
        'assignments.view','assignments.create','assignments.edit','assignments.grade',
        'library.view','events.view','notifications.view','notifications.create','leaves.view',
        'exam_types.view','mark_grades.view','exam_routines.view','sections.view','shifts.view',
        'subjects.view','classes.view',
      ],
      student: [
        'student.dashboard','subjects.view','class_routines.view','attendance.view',
        'study_materials.view','exams.view','results.view','admitcard.issue',
        'fees.view','assignments.view','library.view','events.view',
        'notifications.view','leaves.create','leaves.view',
      ],
      parent: [
        'parent.dashboard','students.view','attendance.view','results.view',
        'fees.view','events.view','notifications.view','leaves.view','leaves.create','admitcard.issue',
      ],
      accountant: [
        'fees.view','fees.create','fees.edit','fees.collect',
        'transactions.view','transactions.create','transactions.edit',
        'students.view','admin.dashboard',
      ],
      librarian: [
        'library.view','library.issue','library.return',
        'students.view','teachers.view','staff.view',
      ],
    }

    for (const [slug, slugs] of Object.entries(ROLE_PERMS)) {
      const permIds = slugs.map(s => permMap[s]).filter(Boolean)
      await Role.findOneAndUpdate(
        { slug, school_id: schoolId },
        {
          name:        slug.charAt(0).toUpperCase() + slug.slice(1).replace('_', ' '),
          slug,
          school_id:   schoolId,
          is_system:   true,
          permissions: permIds,
        },
        { upsert: true, new: true }
      )
    }

    res.json({ success: true, message: 'Roles seeded for school' })
  } catch (err) { next(err) }
})

module.exports = router