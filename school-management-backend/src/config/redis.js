const Redis = require('ioredis');
const logger = require('./logger');

let client;

const connectRedis = async () => {
  client = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.error('Redis error:', err));
  client.on('reconnecting', () => logger.warn('Redis reconnecting'));

  await client.ping();
};

const getRedis = () => {
  if (!client) throw new Error('Redis not initialized');
  return client;
};

module.exports = connectRedis;
module.exports.getRedis = getRedis;
