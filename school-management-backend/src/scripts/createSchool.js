require('dotenv').config()
const mongoose  = require('mongoose')
const connectDB = require('../config/db')
const School    = require('../models/School')
const Session   = require('../models/Session')
const User      = require('../models/User')
const { Role, UserRole } = require('../models/Role')
const { Permission }     = require('../models/Role')
const logger    = require('../config/logger')

const createSchool = async ({
  schoolName,
  adminName,
  adminEmail,
  adminPassword,
  phone = '',
  address = '',
}) => {
  await connectDB()

  // 1. Create school
  const school = await School.create({
    name:         schoolName,
    phone,
    address,
    currency:     'INR',
    timezone:     'Asia/Kolkata',
    subscription: 'premium',
    is_active:    true,
  })
  logger.info(`School created: ${school.name} (${school._id})`)

  // 2. Create current session
  const year    = new Date().getFullYear()
  const session = await Session.create({
    school_id:  school._id,
    name:       `${year}-${year + 1}`,
    year,
    start_date: new Date(`${year}-04-01`),
    end_date:   new Date(`${year + 1}-03-31`),
    is_current: true,
  })
  logger.info(`Session created: ${session.name}`)

  // 3. Copy permissions and seed roles for this school
  const allPerms = await Permission.find()
  const permMap  = {}
  allPerms.forEach(p => { permMap[p.slug] = p._id })

  const ROLE_PERMS = {
    super_admin: ['super_admin'],
    admin: Object.keys(permMap).filter(s => s !== 'super_admin'),
    teacher: [
      'teacher.dashboard','students.view','attendance.view','attendance.mark',
      'class_routines.view','lesson_plans.view','lesson_plans.create','lesson_plans.edit','lesson_plans.delete',
      'study_materials.view','study_materials.create','study_materials.edit','study_materials.delete',
      'exams.view','results.view','results.enter','admitcard.generate',
      'assignments.view','assignments.create','assignments.edit','assignments.grade',
      'library.view','events.view','notifications.view','notifications.create','leaves.view',
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
    accountant: ['fees.view','fees.create','fees.edit','fees.collect','transactions.view','transactions.create','transactions.edit','students.view','admin.dashboard'],
    librarian:  ['library.view','library.issue','library.return','students.view','teachers.view','staff.view'],
  }

  const createdRoles = {}
  for (const [slug, slugs] of Object.entries(ROLE_PERMS)) {
    const permIds = slugs.map(s => permMap[s]).filter(Boolean)
    const role = await Role.findOneAndUpdate(
      { slug, school_id: school._id },
      { name: slug.charAt(0).toUpperCase() + slug.slice(1).replace('_',' '), slug, school_id: school._id, is_system: true, permissions: permIds },
      { upsert: true, new: true }
    )
    createdRoles[slug] = role
    logger.info(`Role seeded: ${slug} (${permIds.length} perms)`)
  }

  // 4. Create admin user
  const adminUser = await User.create({
    school_id:     school._id,
    name:          adminName,
    email:         adminEmail,
    password_hash: adminPassword,
    phone,
    is_active:     true,
  })

  await UserRole.create({
    school_id:   school._id,
    user_id:     adminUser._id,
    role_id:     createdRoles['admin']._id,
    assigned_by: adminUser._id,
  })

  logger.info(`Admin created: ${adminEmail}`)

  console.log('\n═══════════════════════════════════════════════════')
  console.log('  ✅  New School Created Successfully!')
  console.log('═══════════════════════════════════════════════════')
  console.log(`  School Name : ${school.name}`)
  console.log(`  School ID   : ${school._id}`)
  console.log(`  Session     : ${session.name}`)
  console.log(`  Admin Email : ${adminEmail}`)
  console.log(`  Password    : ${adminPassword}`)
  console.log('═══════════════════════════════════════════════════')
  console.log('  Share these credentials with the school admin.')
  console.log('  They must change the password after first login.')
  console.log('═══════════════════════════════════════════════════\n')

  process.exit(0)
}

// Read from command line args
const [,, name, adminName, email, password, phone, address] = process.argv

if (!name || !email || !password) {
  console.error('\n❌  Usage:')
  console.error('  node src/scripts/createSchool.js "School Name" "Admin Name" "admin@email.com" "Password@123" "9999999999" "City, State"\n')
  process.exit(1)
}

createSchool({
  schoolName:    name,
  adminName:     adminName || 'School Admin',
  adminEmail:    email,
  adminPassword: password,
  phone:         phone || '',
  address:       address || '',
}).catch(err => { console.error(err); process.exit(1) })