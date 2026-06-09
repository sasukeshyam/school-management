const User = require('../models/User');
const { UserRole, Role } = require('../models/Role');
const {
  generateAccessToken, generateRefreshToken,
  verifyRefreshToken, storeRefreshToken,
  validateRefreshToken, revokeRefreshToken,
  clearPermissionCache,
} = require('../utils/jwt');

const login = async ({ email, password, school_id }) => {
  const user = await User.findOne({ email, school_id, is_deleted: false })
    .select('+password_hash +refresh_token');

  if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  if (!user.is_active) throw Object.assign(new Error('Account is inactive'), { statusCode: 403 });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  // Load roles for token payload
  const userRoles = await UserRole.find({ user_id: user._id, school_id })
    .populate('role_id', 'name slug');
  const roles = userRoles.map((ur) => ur.role_id?.slug).filter(Boolean);

  const payload = {
    id:        user._id,
    school_id: user.school_id,
    email:     user.email,
    roles,
  };

  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await storeRefreshToken(user._id.toString(), refreshToken);

  user.last_login    = new Date();
  user.refresh_token = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken, roles };
};

const refreshTokens = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }

  const isValid = await validateRefreshToken(decoded.id, token);
  if (!isValid) throw Object.assign(new Error('Refresh token mismatch'), { statusCode: 401 });

  const user = await User.findById(decoded.id);
  if (!user || !user.is_active) throw Object.assign(new Error('User not found'), { statusCode: 401 });

  const userRoles = await UserRole.find({ user_id: user._id, school_id: user.school_id })
    .populate('role_id', 'name slug');
  const roles = userRoles.map((ur) => ur.role_id?.slug).filter(Boolean);

  const payload = { id: user._id, school_id: user.school_id, email: user.email, roles };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await storeRefreshToken(user._id.toString(), refreshToken);

  return { accessToken, refreshToken };
};

const logout = async (userId) => {
  await revokeRefreshToken(userId.toString());
  await clearPermissionCache(userId.toString());
  await User.findByIdAndUpdate(userId, { refresh_token: null });
};

const changePassword = async (userId, { current_password, new_password }) => {
  const user = await User.findById(userId).select('+password_hash');
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  const isMatch = await user.comparePassword(current_password);
  if (!isMatch) throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });

  user.password_hash = new_password;
  await user.save();
};

module.exports = { login, refreshTokens, logout, changePassword };
