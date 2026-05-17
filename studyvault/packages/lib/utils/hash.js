import crypto from 'crypto';

export function computeHash(text) {
  return crypto.createHash('sha256').update(text || '').digest('hex');
}

export function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
