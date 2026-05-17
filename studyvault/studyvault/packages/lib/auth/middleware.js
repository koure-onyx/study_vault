import { verifyToken } from './jwt.js';

/**
 * Extract token from Authorization header or cookies
 * @param {Request} request - Next.js request object
 * @returns {string|null} Token or null
 */
export function extractToken(request) {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const cookies = request.headers.get('cookie');
  if (cookies) {
    const match = cookies.match(/(?:^|;\s*)token=([^;]+)/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Middleware to protect routes - requires authentication
 * @param {Request} request - Next.js request object
 * @returns {Object|null} Decoded token or null if unauthorized
 */
export function requireAuth(request) {
  const token = extractToken(request);
  
  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  return decoded;
}

/**
 * Middleware to check user role
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @param {Object} user - Decoded JWT token
 * @returns {boolean} True if user has allowed role
 */
export function requireRole(allowedRoles, user) {
  if (!user || !user.role) {
    return false;
  }
  
  return allowedRoles.includes(user.role);
}

/**
 * Middleware to check if user is admin
 * @param {Object} user - Decoded JWT token
 * @returns {boolean} True if user is admin or superadmin
 */
export function requireAdmin(user) {
  return requireRole(['admin', 'superadmin'], user);
}
