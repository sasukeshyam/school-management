const notificationService = require('../services/notificationService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const send = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const result = await notificationService.send(req.body, req.schoolId, req.user._id, io);
    sendSuccess(res, result, `Notification sent to ${result.sent_to} users`, 201);
  } catch (err) { next(err); }
};

const getMyNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getMyNotifications(req.user._id, req.schoolId, req.query);
    sendPaginated(res, result.data, result.total, result.page, result.limit, 'Notifications fetched');
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    await notificationService.markRead(req.params.id, req.user._id);
    sendSuccess(res, {}, 'Marked as read');
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllRead(req.user._id);
    sendSuccess(res, {}, 'All notifications marked as read');
  } catch (err) { next(err); }
};

module.exports = { send, getMyNotifications, markRead, markAllRead };
