const jwt = require('jsonwebtoken');
const { getRedis } = require('../config/redis');

const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);

const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// Store refresh token in Redis with TTL
const storeRefreshToken = async (userId, token) => {
  const redis = getRedis();
  const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
  await redis.setex(`refresh:${userId}`, ttl, token);
};

// Validate refresh token from Redis
const validateRefreshToken = async (userId, token) => {
  const redis = getRedis();
  const stored = await redis.get(`refresh:${userId}`);
  return stored === token;
};

// Blacklist refresh token (on logout)
const revokeRefreshToken = async (userId) => {
  const redis = getRedis();
  await redis.del(`refresh:${userId}`);
};

// Cache user permissions to avoid repeated DB lookups
const cachePermissions = async (userId, permissions) => {
  const redis = getRedis();
  await redis.setex(`perms:${userId}`, 15 * 60, JSON.stringify(permissions)); // 15 min TTL
};

const getCachedPermissions = async (userId) => {
  const redis = getRedis();
  const data = await redis.get(`perms:${userId}`);
  return data ? JSON.parse(data) : null;
};

const clearPermissionCache = async (userId) => {
  const redis = getRedis();
  await redis.del(`perms:${userId}`);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  cachePermissions,
  getCachedPermissions,
  clearPermissionCache,
};
