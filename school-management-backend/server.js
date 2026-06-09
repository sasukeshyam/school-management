const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const connectRedis = require('./src/config/redis');
const logger = require('./src/config/logger');
const { initSocket } = require('./src/config/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
initSocket(io);
app.set('io', io);

// Boot
const start = async () => {
  try {
    await connectDB();
    await connectRedis();
    server.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => process.exit(0));
});

start();
