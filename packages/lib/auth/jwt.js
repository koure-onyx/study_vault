import jwt from 'jsonwebtoken';

function getSecret() {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.MONGODB_JWT_SECRET;
  if (!secret) {
    console.warn('WARNING: No JWT secret found (tried JWT_SECRET, NEXTAUTH_SECRET, MONGODB_JWT_SECRET). Using fallback.');
    return 'fallback-secret-do-not-use-in-production';
  }
  return secret;
}

export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}
