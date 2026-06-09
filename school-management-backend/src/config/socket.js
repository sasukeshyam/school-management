const logger = require('./logger');

const onlineUsers = new Map();

const initSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      logger.info(`User ${userId} joined room`);
    });

    socket.on('disconnect', () => {
      for (const [userId, sid] of onlineUsers.entries()) {
        if (sid === socket.id) { onlineUsers.delete(userId); break; }
      }
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

const sendNotification = (io, userId, data) => {
  io.to(userId).emit('notification', data);
};

const broadcastNotification = (io, data) => {
  io.emit('notification', data);
};

module.exports = { initSocket, sendNotification, broadcastNotification, onlineUsers };
