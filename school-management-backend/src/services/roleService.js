const { Role, Permission, UserRole } = require('../models/Role');
const { clearPermissionCache } = require('../utils/jwt');
const { paginate } = require('../utils/pagination');

const getAllRoles = async (schoolId, query) => {
  const { page, limit, skip, sort } = paginate(query);
  const [data, total] = await Promise.all([
    Role.find({ school_id: schoolId }).populate('permissions').sort(sort).skip(skip).limit(limit),
    Role.countDocuments({ school_id: schoolId }),
  ]);
  return { data, total, page, limit };
};

const getRoleById = async (id, schoolId) => {
  const role = await Role.findOne({ _id: id, school_id: schoolId }).populate('permissions');
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  return role;
};

const createRole = async (data, schoolId, createdBy) => {
  const role = await Role.create({ ...data, school_id: schoolId, created_by: createdBy });
  return role;
};

const updateRole = async (id, data, schoolId) => {
  const role = await Role.findOne({ _id: id, school_id: schoolId });
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  if (role.is_system && data.slug) throw Object.assign(new Error('Cannot change slug of system role'), { statusCode: 400 });
  Object.assign(role, data);
  await role.save();
  return role;
};

const deleteRole = async (id, schoolId, deletedBy) => {
  const role = await Role.findOne({ _id: id, school_id: schoolId });
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  if (role.is_system) throw Object.assign(new Error('Cannot delete system role'), { statusCode: 400 });
  const usersWithRole = await UserRole.countDocuments({ role_id: id });
  if (usersWithRole > 0) throw Object.assign(new Error(`Cannot delete: ${usersWithRole} users have this role`), { statusCode: 400 });
  await role.softDelete(deletedBy);
  return { message: 'Role deleted' };
};

const assignPermissions = async (roleId, permissionIds, schoolId) => {
  const role = await Role.findOne({ _id: roleId, school_id: schoolId });
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  role.permissions = permissionIds;
  await role.save();

  // Clear permission cache for all users with this role
  const userRoles = await UserRole.find({ role_id: roleId }).select('user_id');
  await Promise.all(userRoles.map((ur) => clearPermissionCache(ur.user_id.toString())));

  return role.populate('permissions');
};

const assignRoleToUser = async (userId, roleId, schoolId, assignedBy) => {
  const role = await Role.findOne({ _id: roleId, school_id: schoolId });
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });

  const existing = await UserRole.findOne({ user_id: userId, role_id: roleId, school_id: schoolId });
  if (existing) throw Object.assign(new Error('User already has this role'), { statusCode: 409 });

  const userRole = await UserRole.create({
    user_id:     userId,
    role_id:     roleId,
    school_id:   schoolId,
    assigned_by: assignedBy,
  });

  await clearPermissionCache(userId.toString());
  return userRole;
};

const revokeRoleFromUser = async (userId, roleId, schoolId) => {
  const userRole = await UserRole.findOneAndDelete({ user_id: userId, role_id: roleId, school_id: schoolId });
  if (!userRole) throw Object.assign(new Error('User role not found'), { statusCode: 404 });
  await clearPermissionCache(userId.toString());
  return { message: 'Role revoked' };
};

const getUserRoles = async (userId, schoolId) => {
  return UserRole.find({ user_id: userId, school_id: schoolId }).populate('role_id');
};

const getAllPermissions = async () => {
  return Permission.find().sort('module action');
};

module.exports = {
  getAllRoles, getRoleById, createRole, updateRole, deleteRole,
  assignPermissions, assignRoleToUser, revokeRoleFromUser,
  getUserRoles, getAllPermissions,
};
