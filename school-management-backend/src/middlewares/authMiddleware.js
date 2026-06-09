const { verifyAccessToken, getCachedPermissions, cachePermissions } = require('../utils/jwt');
const User = require('../models/User');
const { UserRole } = require('../models/Role');
const { sendError } = require('../utils/response');

// ─── Authenticate ─────────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('+is_active');
    if (!user || !user.is_active) {
      return sendError(res, 'User not found or inactive', 401);
    }

    req.user = user;
    req.schoolId = user.school_id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return sendError(res, 'Token expired', 401);
    if (err.name === 'JsonWebTokenError')  return sendError(res, 'Invalid token', 401);
    next(err);
  }
};

// ─── Load Permissions ─────────────────────────────────────────────────────────
const loadPermissions = async (userId, schoolId) => {
  // Try cache first
  const cached = await getCachedPermissions(userId.toString());
  if (cached) return cached;

  // Load from DB
  const userRoles = await UserRole.find({ user_id: userId, school_id: schoolId })
    .populate({ path: 'role_id', populate: { path: 'permissions' } });

  const permissions = new Set();
  userRoles.forEach((ur) => {
    if (ur.role_id?.permissions) {
      ur.role_id.permissions.forEach((p) => permissions.add(p.slug));
    }
  });

  const permArray = Array.from(permissions);
  await cachePermissions(userId.toString(), permArray);
  return permArray;
};

// ─── Permission Guard ─────────────────────────────────────────────────────────
const permissionGuard = (...requiredPermissions) => async (req, res, next) => {
  try {
    const permissions = await loadPermissions(req.user._id, req.schoolId);
    req.permissions = permissions;

    // Super admin bypass
    if (permissions.includes('super_admin')) return next();

    const hasAll = requiredPermissions.every((p) => permissions.includes(p));
    if (!hasAll) {
      return sendError(res, 'Access denied: insufficient permissions', 403);
    }
    next();
  } catch (err) {
    next(err);
  }
};

// ─── Super Admin Only ─────────────────────────────────────────────────────────
const superAdminOnly = async (req, res, next) => {
  try {
    const permissions = await loadPermissions(req.user._id, req.schoolId);
    if (!permissions.includes('super_admin')) {
      return sendError(res, 'Super admin access required', 403);
    }
    next();
  } catch (err) {
    next(err);
  }
};

// ─── Same School Guard ────────────────────────────────────────────────────────
const sameSchool = (req, res, next) => {
  if (req.user.school_id.toString() !== req.params.schoolId) {
    return sendError(res, 'Access denied: cross-school operation', 403);
  }
  next();
};

module.exports = { authenticate, permissionGuard, superAdminOnly, sameSchool, loadPermissions };
