const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: true,
  });
  logger.info(`MongoDB connected: ${conn.connection.host}`);

  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
};

module.exports = connectDB;
