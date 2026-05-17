// packages/lib/utils/hash.js
import crypto from 'crypto';

export function computeHash(text) {
  if (!text) return '';
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function compareHash(text, hash) {
  return computeHash(text) === hash;
}

export function generateShortHash(text, length = 8) {
  return computeHash(text).substring(0, length);
}

export function generateRandomToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}
