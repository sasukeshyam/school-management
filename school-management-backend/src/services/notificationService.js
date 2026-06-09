const { Notification, NotificationRead } = require('../models/Content');
const User = require('../models/User');
const { UserRole } = require('../models/Role');
const { paginate } = require('../utils/pagination');

const send = async (data, schoolId, senderId, io) => {
  const notification = await Notification.create({
    ...data,
    school_id:  schoolId,
    sender_id:  senderId,
    created_by: senderId,
  });

  // Determine target users
  let targetUsers = [];
  if (data.is_broadcast) {
    targetUsers = await User.find({ school_id: schoolId, is_active: true }).select('_id');
  } else if (data.target_users?.length) {
    targetUsers = data.target_users.map((id) => ({ _id: id }));
  } else if (data.target_role && data.target_role !== 'all') {
    const { Role } = require('../models/Role');
    const role = await Role.findOne({ slug: data.target_role, school_id: schoolId });
    if (role) {
      const userRoles = await UserRole.find({ role_id: role._id, school_id: schoolId }).select('user_id');
      targetUsers = userRoles.map((ur) => ({ _id: ur.user_id }));
    }
  } else {
    targetUsers = await User.find({ school_id: schoolId, is_active: true }).select('_id');
  }

  // Create read records
  if (targetUsers.length > 0) {
    const reads = targetUsers.map((u) => ({
      notification_id: notification._id,
      user_id:         u._id,
      is_read:         false,
    }));
    await NotificationRead.insertMany(reads, { ordered: false });
  }

  // Emit via Socket.IO
  if (io) {
    const payload = { type: 'notification', ...notification.toObject() };
    if (data.is_broadcast) {
      io.to(schoolId.toString()).emit('notification', payload);
    } else {
      targetUsers.forEach((u) => io.to(u._id.toString()).emit('notification', payload));
    }
  }

  return { notification, sent_to: targetUsers.length };
};

const getMyNotifications = async (userId, schoolId, query) => {
  const { page, limit, skip } = paginate(query);
  const filter = { user_id: userId };
  if (query.is_read !== undefined) filter.is_read = query.is_read === 'true';

  const [reads, total] = await Promise.all([
    NotificationRead.find(filter)
      .populate({ path: 'notification_id', match: { school_id: schoolId } })
      .sort('-created_at').skip(skip).limit(limit),
    NotificationRead.countDocuments(filter),
  ]);

  const unreadCount = await NotificationRead.countDocuments({ user_id: userId, is_read: false });
  return { data: reads.filter((r) => r.notification_id), total, page, limit, unread_count: unreadCount };
};

const markRead = async (notificationId, userId) => {
  return NotificationRead.findOneAndUpdate(
    { notification_id: notificationId, user_id: userId },
    { is_read: true, read_at: new Date() },
    { new: true }
  );
};

const markAllRead = async (userId) => {
  await NotificationRead.updateMany(
    { user_id: userId, is_read: false },
    { is_read: true, read_at: new Date() }
  );
  return { message: 'All notifications marked as read' };
};

module.exports = { send, getMyNotifications, markRead, markAllRead };
