require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('./db');
const { Permission, Role, UserRole } = require('../models/Role');
const User = require('../models/User');
const School = require('../models/School');
const Session = require('../models/Session');
const logger = require('./logger');

// ─── All Permissions ──────────────────────────────────────────────────────────
const PERMISSIONS = [
  // Super Admin
  { name: 'Super Admin', slug: 'super_admin', module: 'system', action: 'all' },

  // Dashboard
  { name: 'Admin Dashboard',   slug: 'admin.dashboard',   module: 'dashboard', action: 'view' },
  { name: 'Teacher Dashboard', slug: 'teacher.dashboard', module: 'dashboard', action: 'view' },
  { name: 'Student Dashboard', slug: 'student.dashboard', module: 'dashboard', action: 'view' },
  { name: 'Parent Dashboard',  slug: 'parent.dashboard',  module: 'dashboard', action: 'view' },

  // Users
  { name: 'View Users',   slug: 'users.view',   module: 'users', action: 'view'   },
  { name: 'Create Users', slug: 'users.create', module: 'users', action: 'create' },
  { name: 'Edit Users',   slug: 'users.edit',   module: 'users', action: 'edit'   },
  { name: 'Delete Users', slug: 'users.delete', module: 'users', action: 'delete' },

  // Roles
  { name: 'View Roles',   slug: 'roles.view',   module: 'roles', action: 'view'   },
  { name: 'Create Roles', slug: 'roles.create', module: 'roles', action: 'create' },
  { name: 'Edit Roles',   slug: 'roles.edit',   module: 'roles', action: 'edit'   },
  { name: 'Delete Roles', slug: 'roles.delete', module: 'roles', action: 'delete' },

  // Sessions
  { name: 'View Sessions',   slug: 'sessions.view',   module: 'sessions', action: 'view'   },
  { name: 'Create Sessions', slug: 'sessions.create', module: 'sessions', action: 'create' },
  { name: 'Edit Sessions',   slug: 'sessions.edit',   module: 'sessions', action: 'edit'   },
  { name: 'Delete Sessions', slug: 'sessions.delete', module: 'sessions', action: 'delete' },

  // Students
  { name: 'View Students',   slug: 'students.view',   module: 'students', action: 'view'   },
  { name: 'Create Students', slug: 'students.create', module: 'students', action: 'create' },
  { name: 'Edit Students',   slug: 'students.edit',   module: 'students', action: 'edit'   },
  { name: 'Delete Students', slug: 'students.delete', module: 'students', action: 'delete' },

  // Parents
  { name: 'View Parents',   slug: 'parents.view',   module: 'parents', action: 'view'   },
  { name: 'Create Parents', slug: 'parents.create', module: 'parents', action: 'create' },
  { name: 'Edit Parents',   slug: 'parents.edit',   module: 'parents', action: 'edit'   },
  { name: 'Delete Parents', slug: 'parents.delete', module: 'parents', action: 'delete' },

  // Teachers
  { name: 'View Teachers',   slug: 'teachers.view',   module: 'teachers', action: 'view'   },
  { name: 'Create Teachers', slug: 'teachers.create', module: 'teachers', action: 'create' },
  { name: 'Edit Teachers',   slug: 'teachers.edit',   module: 'teachers', action: 'edit'   },
  { name: 'Delete Teachers', slug: 'teachers.delete', module: 'teachers', action: 'delete' },

  // Staff
  { name: 'View Staff',   slug: 'staff.view',   module: 'staff', action: 'view'   },
  { name: 'Create Staff', slug: 'staff.create', module: 'staff', action: 'create' },
  { name: 'Edit Staff',   slug: 'staff.edit',   module: 'staff', action: 'edit'   },
  { name: 'Delete Staff', slug: 'staff.delete', module: 'staff', action: 'delete' },

  // Classes
  { name: 'View Classes',   slug: 'classes.view',   module: 'classes', action: 'view'   },
  { name: 'Create Classes', slug: 'classes.create', module: 'classes', action: 'create' },
  { name: 'Edit Classes',   slug: 'classes.edit',   module: 'classes', action: 'edit'   },
  { name: 'Delete Classes', slug: 'classes.delete', module: 'classes', action: 'delete' },

  // Subjects
  { name: 'View Subjects',   slug: 'subjects.view',   module: 'subjects', action: 'view'   },
  { name: 'Create Subjects', slug: 'subjects.create', module: 'subjects', action: 'create' },
  { name: 'Edit Subjects',   slug: 'subjects.edit',   module: 'subjects', action: 'edit'   },
  { name: 'Delete Subjects', slug: 'subjects.delete', module: 'subjects', action: 'delete' },

  // Sections
  { name: 'View Sections',   slug: 'sections.view',   module: 'sections', action: 'view'   },
  { name: 'Create Sections', slug: 'sections.create', module: 'sections', action: 'create' },
  { name: 'Edit Sections',   slug: 'sections.edit',   module: 'sections', action: 'edit'   },
  { name: 'Delete Sections', slug: 'sections.delete', module: 'sections', action: 'delete' },

  // Shifts
  { name: 'View Shifts',   slug: 'shifts.view',   module: 'shifts', action: 'view'   },
  { name: 'Create Shifts', slug: 'shifts.create', module: 'shifts', action: 'create' },
  { name: 'Edit Shifts',   slug: 'shifts.edit',   module: 'shifts', action: 'edit'   },
  { name: 'Delete Shifts', slug: 'shifts.delete', module: 'shifts', action: 'delete' },

  // Attendance
  { name: 'View Attendance', slug: 'attendance.view', module: 'attendance', action: 'view' },
  { name: 'Mark Attendance', slug: 'attendance.mark', module: 'attendance', action: 'mark' },

  // Class Routines
  { name: 'View Class Routines',   slug: 'class_routines.view',   module: 'class_routines', action: 'view'   },
  { name: 'Create Class Routines', slug: 'class_routines.create', module: 'class_routines', action: 'create' },
  { name: 'Edit Class Routines',   slug: 'class_routines.edit',   module: 'class_routines', action: 'edit'   },
  { name: 'Delete Class Routines', slug: 'class_routines.delete', module: 'class_routines', action: 'delete' },

  // Lesson Plans
  { name: 'View Lesson Plans',   slug: 'lesson_plans.view',   module: 'lesson_plans', action: 'view'   },
  { name: 'Create Lesson Plans', slug: 'lesson_plans.create', module: 'lesson_plans', action: 'create' },
  { name: 'Edit Lesson Plans',   slug: 'lesson_plans.edit',   module: 'lesson_plans', action: 'edit'   },
  { name: 'Delete Lesson Plans', slug: 'lesson_plans.delete', module: 'lesson_plans', action: 'delete' },

  // Study Materials
  { name: 'View Study Materials',   slug: 'study_materials.view',   module: 'study_materials', action: 'view'   },
  { name: 'Create Study Materials', slug: 'study_materials.create', module: 'study_materials', action: 'create' },
  { name: 'Edit Study Materials',   slug: 'study_materials.edit',   module: 'study_materials', action: 'edit'   },
  { name: 'Delete Study Materials', slug: 'study_materials.delete', module: 'study_materials', action: 'delete' },

  // Exam Types
  { name: 'View Exam Types',   slug: 'exam_types.view',   module: 'exam_types', action: 'view'   },
  { name: 'Create Exam Types', slug: 'exam_types.create', module: 'exam_types', action: 'create' },
  { name: 'Edit Exam Types',   slug: 'exam_types.edit',   module: 'exam_types', action: 'edit'   },
  { name: 'Delete Exam Types', slug: 'exam_types.delete', module: 'exam_types', action: 'delete' },

  // Mark Grades
  { name: 'View Mark Grades',   slug: 'mark_grades.view',   module: 'mark_grades', action: 'view'   },
  { name: 'Create Mark Grades', slug: 'mark_grades.create', module: 'mark_grades', action: 'create' },
  { name: 'Edit Mark Grades',   slug: 'mark_grades.edit',   module: 'mark_grades', action: 'edit'   },
  { name: 'Delete Mark Grades', slug: 'mark_grades.delete', module: 'mark_grades', action: 'delete' },

  // Exams
  { name: 'View Exams',   slug: 'exams.view',   module: 'exams', action: 'view'   },
  { name: 'Create Exams', slug: 'exams.create', module: 'exams', action: 'create' },
  { name: 'Edit Exams',   slug: 'exams.edit',   module: 'exams', action: 'edit'   },
  { name: 'Delete Exams', slug: 'exams.delete', module: 'exams', action: 'delete' },

  // Results
  { name: 'View Results',    slug: 'results.view',    module: 'results', action: 'view'    },
  { name: 'Enter Results',   slug: 'results.enter',   module: 'results', action: 'enter'   },
  { name: 'Approve Results', slug: 'results.approve', module: 'results', action: 'approve' },
  { name: 'Publish Results', slug: 'results.publish', module: 'results', action: 'publish' },

  // Admit Cards
  { name: 'Generate Admit Cards', slug: 'admitcard.generate', module: 'admitcard', action: 'generate' },
  { name: 'Approve Admit Cards',  slug: 'admitcard.approve',  module: 'admitcard', action: 'approve'  },
  { name: 'Issue Admit Cards',    slug: 'admitcard.issue',    module: 'admitcard', action: 'issue'    },

  // Fees
  { name: 'View Fees',    slug: 'fees.view',    module: 'fees', action: 'view'    },
  { name: 'Create Fees',  slug: 'fees.create',  module: 'fees', action: 'create'  },
  { name: 'Edit Fees',    slug: 'fees.edit',    module: 'fees', action: 'edit'    },
  { name: 'Delete Fees',  slug: 'fees.delete',  module: 'fees', action: 'delete'  },
  { name: 'Collect Fees', slug: 'fees.collect', module: 'fees', action: 'collect' },
  { name: 'Refund Fees',  slug: 'fees.refund',  module: 'fees', action: 'refund'  },

  // Transactions
  { name: 'View Transactions',   slug: 'transactions.view',   module: 'transactions', action: 'view'   },
  { name: 'Create Transactions', slug: 'transactions.create', module: 'transactions', action: 'create' },
  { name: 'Edit Transactions',   slug: 'transactions.edit',   module: 'transactions', action: 'edit'   },
  { name: 'Delete Transactions', slug: 'transactions.delete', module: 'transactions', action: 'delete' },

  // Assignments
  { name: 'View Assignments',   slug: 'assignments.view',   module: 'assignments', action: 'view'   },
  { name: 'Create Assignments', slug: 'assignments.create', module: 'assignments', action: 'create' },
  { name: 'Edit Assignments',   slug: 'assignments.edit',   module: 'assignments', action: 'edit'   },
  { name: 'Delete Assignments', slug: 'assignments.delete', module: 'assignments', action: 'delete' },
  { name: 'Grade Assignments',  slug: 'assignments.grade',  module: 'assignments', action: 'grade'  },

  // Library
  { name: 'View Library',   slug: 'library.view',   module: 'library', action: 'view'   },
  { name: 'Issue Books',    slug: 'library.issue',  module: 'library', action: 'issue'  },
  { name: 'Return Books',   slug: 'library.return', module: 'library', action: 'return' },

  // Events
  { name: 'View Events',   slug: 'events.view',   module: 'events', action: 'view'   },
  { name: 'Create Events', slug: 'events.create', module: 'events', action: 'create' },
  { name: 'Edit Events',   slug: 'events.edit',   module: 'events', action: 'edit'   },
  { name: 'Delete Events', slug: 'events.delete', module: 'events', action: 'delete' },

  // Notifications
  { name: 'View Notifications',   slug: 'notifications.view',   module: 'notifications', action: 'view'   },
  { name: 'Create Notifications', slug: 'notifications.create', module: 'notifications', action: 'create' },

  // Admissions
  { name: 'View Admissions',   slug: 'admissions.view',   module: 'admissions', action: 'view'   },
  { name: 'Review Admissions', slug: 'admissions.review', module: 'admissions', action: 'review' },
  { name: 'Delete Admissions', slug: 'admissions.delete', module: 'admissions', action: 'delete' },

  // Leaves
  { name: 'View Leaves',   slug: 'leaves.view',   module: 'leaves', action: 'view'   },
  { name: 'Create Leaves', slug: 'leaves.create', module: 'leaves', action: 'create' },
  { name: 'Edit Leaves',   slug: 'leaves.edit',   module: 'leaves', action: 'edit'   },
  { name: 'Delete Leaves', slug: 'leaves.delete', module: 'leaves', action: 'delete' },

  // Exam Routines
  { name: 'View Exam Routines',   slug: 'exam_routines.view',   module: 'exam_routines', action: 'view'   },
  { name: 'Create Exam Routines', slug: 'exam_routines.create', module: 'exam_routines', action: 'create' },
  { name: 'Edit Exam Routines',   slug: 'exam_routines.edit',   module: 'exam_routines', action: 'edit'   },
  { name: 'Delete Exam Routines', slug: 'exam_routines.delete', module: 'exam_routines', action: 'delete' },
];

// ─── System Role Permissions ──────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  super_admin: ['super_admin'],

  admin: [
    'admin.dashboard',
    'users.view','users.create','users.edit','users.delete',
    'roles.view',
    'sessions.view','sessions.create','sessions.edit','sessions.delete',
    'students.view','students.create','students.edit','students.delete',
    'parents.view','parents.create','parents.edit','parents.delete',
    'teachers.view','teachers.create','teachers.edit','teachers.delete',
    'staff.view','staff.create','staff.edit','staff.delete',
    'classes.view','classes.create','classes.edit','classes.delete',
    'sections.view','sections.create','sections.edit','sections.delete',
    'shifts.view','shifts.create','shifts.edit','shifts.delete',
    'subjects.view','subjects.create','subjects.edit','subjects.delete',
    'attendance.view','attendance.mark',
    'class_routines.view','class_routines.create','class_routines.edit','class_routines.delete',
    'lesson_plans.view',
    'study_materials.view',
    'exam_types.view','exam_types.create','exam_types.edit','exam_types.delete',
    'mark_grades.view','mark_grades.create','mark_grades.edit','mark_grades.delete',
    'exams.view','exams.create','exams.edit','exams.delete',
    'results.view','results.enter','results.approve','results.publish',
    'admitcard.generate','admitcard.approve','admitcard.issue',
    'fees.view','fees.create','fees.edit','fees.delete','fees.collect',
    'transactions.view','transactions.create','transactions.edit',
    'assignments.view','assignments.create','assignments.edit','assignments.grade',
    'library.view','library.issue','library.return',
    'events.view','events.create','events.edit','events.delete',
    'notifications.view','notifications.create',
    'admissions.view','admissions.review','admissions.delete',
    'leaves.view','leaves.edit',
    'exam_routines.view','exam_routines.create','exam_routines.edit','exam_routines.delete',
  ],

  teacher: [
    'teacher.dashboard',
    'students.view',
    'attendance.view','attendance.mark',
    'class_routines.view',
    'lesson_plans.view','lesson_plans.create','lesson_plans.edit','lesson_plans.delete',
    'study_materials.view','study_materials.create','study_materials.edit','study_materials.delete',
    'exams.view',
    'results.view','results.enter',
    'admitcard.generate',
    'assignments.view','assignments.create','assignments.edit','assignments.grade',
    'library.view',
    'events.view',
    'notifications.view','notifications.create',
    'leaves.view',
    'exam_routines.view',
  ],

  student: [
    'student.dashboard',
    'subjects.view',
    'class_routines.view',
    'attendance.view',
    'study_materials.view',
    'exams.view',
    'results.view',
    'admitcard.issue',
    'fees.view',
    'assignments.view',
    'library.view',
    'events.view',
    'notifications.view',
    'leaves.create','leaves.view',
  ],

  parent: [
    'parent.dashboard',
    'students.view',
    'attendance.view',
    'results.view',
    'fees.view',
    'events.view',
    'notifications.view',
    'leaves.view','leaves.create',
    'admitcard.issue',
  ],

  accountant: [
    'fees.view','fees.create','fees.edit','fees.collect',
    'transactions.view','transactions.create','transactions.edit',
    'students.view',
    'admin.dashboard',
  ],

  librarian: [
    'library.view','library.issue','library.return',
    'students.view','teachers.view','staff.view',
  ],
};

// ─── Seed Function ────────────────────────────────────────────────────────────
const seed = async () => {
  await connectDB();
  logger.info('Starting database seed...');

  // 1. Upsert all permissions
  logger.info(`Seeding ${PERMISSIONS.length} permissions...`);
  for (const perm of PERMISSIONS) {
    await Permission.findOneAndUpdate(
      { slug: perm.slug },
      perm,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  logger.info('Permissions seeded ✓');

  // 2. Create default school
  let school = await School.findOne({ name: 'Demo School' });
  if (!school) {
    school = await School.create({
      name: 'Demo School',
      address: 'Ranchi, Jharkhand',
      phone: '+91-9999999999',
      email: 'admin@demoschool.com',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      subscription: 'premium',
    });
    logger.info(`School created: ${school.name} (${school._id}) ✓`);
  } else {
    logger.info(`School exists: ${school.name} ✓`);
  }

  // 3. Create current session
  let session = await Session.findOne({ school_id: school._id, is_current: true });
  if (!session) {
    session = await Session.create({
      school_id:  school._id,
      name:       '2025-2026',
      year:       2025,
      start_date: new Date('2025-04-01'),
      end_date:   new Date('2026-03-31'),
      is_current: true,
    });
    logger.info(`Session created: ${session.name} ✓`);
  }

  // 4. Seed system roles with permissions
  const allPerms = await Permission.find();
  const permMap = {};
  allPerms.forEach((p) => { permMap[p.slug] = p._id; });

  for (const [roleSlug, permSlugs] of Object.entries(ROLE_PERMISSIONS)) {
    const permIds = permSlugs.map((s) => permMap[s]).filter(Boolean);
    await Role.findOneAndUpdate(
      { slug: roleSlug, school_id: school._id },
      {
        name:        roleSlug.charAt(0).toUpperCase() + roleSlug.slice(1).replace('_', ' '),
        slug:        roleSlug,
        school_id:   school._id,
        is_system:   true,
        permissions: permIds,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logger.info(`Role seeded: ${roleSlug} (${permIds.length} permissions) ✓`);
  }

  // 5. Create Super Admin user
  const superAdminRole = await Role.findOne({ slug: 'super_admin', school_id: school._id });

  let superAdmin = await User.findOne({ email: 'superadmin@demoschool.com', school_id: school._id });
  if (!superAdmin) {
    superAdmin = await User.create({
      school_id:     school._id,
      name:          'Super Admin',
      email:         'superadmin@demoschool.com',
      password_hash: 'Admin@123456',
      phone:         '+91-9999999990',
      is_active:     true,
    });

    await UserRole.create({
      school_id:   school._id,
      user_id:     superAdmin._id,
      role_id:     superAdminRole._id,
      assigned_by: superAdmin._id,
    });

    logger.info(`Super Admin created: superadmin@demoschool.com / Admin@123456 ✓`);
  } else {
    logger.info('Super Admin exists ✓');
  }

  // 6. Create sample Admin user
  const adminRole = await Role.findOne({ slug: 'admin', school_id: school._id });
  let adminUser = await User.findOne({ email: 'admin@demoschool.com', school_id: school._id });
  if (!adminUser) {
    adminUser = await User.create({
      school_id:     school._id,
      name:          'School Admin',
      email:         'admin@demoschool.com',
      password_hash: 'Admin@123456',
      phone:         '+91-9999999991',
      is_active:     true,
    });
    await UserRole.create({
      school_id:   school._id,
      user_id:     adminUser._id,
      role_id:     adminRole._id,
      assigned_by: superAdmin._id,
    });
    logger.info(`Admin created: admin@demoschool.com / Admin@123456 ✓`);
  }

  logger.info('\n═══════════════════════════════════════');
  logger.info('  Database seeded successfully!');
  logger.info('═══════════════════════════════════════');
  logger.info(`  School ID:   ${school._id}`);
  logger.info(`  Session ID:  ${session._id}`);
  logger.info(`  Super Admin: superadmin@demoschool.com`);
  logger.info(`  Admin:       admin@demoschool.com`);
  logger.info(`  Password:    Admin@123456`);
  logger.info('═══════════════════════════════════════\n');

  process.exit(0);
};

seed().catch((err) => {
  logger.error('Seeder failed:', err);
  process.exit(1);
});
