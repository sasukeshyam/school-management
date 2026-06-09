const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/response');

const getDashboard = async (req, res, next) => {
  try {
    const permissions = req.permissions || [];
    let data;

    if (permissions.includes('super_admin') || permissions.includes('admin.dashboard')) {
      data = await dashboardService.getAdminDashboard(req.schoolId);
    } else if (permissions.includes('teacher.dashboard')) {
      data = await dashboardService.getTeacherDashboard(req.user._id, req.schoolId);
    } else if (permissions.includes('parent.dashboard')) {
      data = await dashboardService.getParentDashboard(req.user._id, req.schoolId);
    } else {
      data = await dashboardService.getStudentDashboard(req.user._id, req.schoolId);
    }

    sendSuccess(res, data, 'Dashboard loaded');
  } catch (err) { next(err); }
};

const getAdminDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getAdminDashboard(req.schoolId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const getStudentDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getStudentDashboard(req.user._id, req.schoolId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const getTeacherDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getTeacherDashboard(req.user._id, req.schoolId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const getParentDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getParentDashboard(req.user._id, req.schoolId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

module.exports = {
  getDashboard,
  getAdminDashboard,
  getStudentDashboard,
  getTeacherDashboard,
  getParentDashboard,
};
