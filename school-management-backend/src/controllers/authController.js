const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { email, password, school_id } = req.body;
    if (!email || !password || !school_id) {
      return sendError(res, 'Email, password and school_id are required', 400);
    }
    const result = await authService.login({ email, password, school_id });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, {
      user:         result.user,
      roles:        result.roles,
      access_token: result.accessToken,
    }, 'Login successful');
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refresh_token;
    if (!token) return sendError(res, 'Refresh token required', 401);

    const tokens = await authService.refreshTokens(token);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, { access_token: tokens.accessToken }, 'Token refreshed');
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user._id);
    res.clearCookie('refreshToken');
    sendSuccess(res, {}, 'Logged out successfully');
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user._id, req.body);
    sendSuccess(res, {}, 'Password changed successfully');
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    sendSuccess(res, { user: req.user }, 'Profile fetched');
  } catch (err) { next(err); }
};

module.exports = { login, refresh, logout, changePassword, me };
