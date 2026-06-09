const roleService = require('../services/roleService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

const getAllRoles = async (req, res, next) => {
  try {
    const result = await roleService.getAllRoles(req.schoolId, req.query);
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) { next(err); }
};

const getRoleById = async (req, res, next) => {
  try {
    const role = await roleService.getRoleById(req.params.id, req.schoolId);
    sendSuccess(res, role);
  } catch (err) { next(err); }
};

const createRole = async (req, res, next) => {
  try {
    const role = await roleService.createRole(req.body, req.schoolId, req.user._id);
    sendSuccess(res, role, 'Role created', 201);
  } catch (err) { next(err); }
};

const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.updateRole(req.params.id, req.body, req.schoolId);
    sendSuccess(res, role, 'Role updated');
  } catch (err) { next(err); }
};

const deleteRole = async (req, res, next) => {
  try {
    await roleService.deleteRole(req.params.id, req.schoolId, req.user._id);
    sendSuccess(res, {}, 'Role deleted');
  } catch (err) { next(err); }
};

const assignPermissions = async (req, res, next) => {
  try {
    const { permission_ids } = req.body;
    if (!Array.isArray(permission_ids)) return sendError(res, 'permission_ids must be an array', 400);
    const role = await roleService.assignPermissions(req.params.id, permission_ids, req.schoolId);
    sendSuccess(res, role, 'Permissions updated');
  } catch (err) { next(err); }
};

const assignRoleToUser = async (req, res, next) => {
  try {
    const { user_id, role_id } = req.body;
    const result = await roleService.assignRoleToUser(user_id, role_id, req.schoolId, req.user._id);
    sendSuccess(res, result, 'Role assigned', 201);
  } catch (err) { next(err); }
};

const revokeRoleFromUser = async (req, res, next) => {
  try {
    const { user_id, role_id } = req.body;
    await roleService.revokeRoleFromUser(user_id, role_id, req.schoolId);
    sendSuccess(res, {}, 'Role revoked');
  } catch (err) { next(err); }
};

const getUserRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getUserRoles(req.params.userId, req.schoolId);
    sendSuccess(res, roles);
  } catch (err) { next(err); }
};

const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await roleService.getAllPermissions();
    sendSuccess(res, permissions);
  } catch (err) { next(err); }
};

module.exports = {
  getAllRoles, getRoleById, createRole, updateRole, deleteRole,
  assignPermissions, assignRoleToUser, revokeRoleFromUser,
  getUserRoles, getAllPermissions,
};
