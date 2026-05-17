// packages/lib/auth/middleware.js
import { verifyToken } from './jwt.js';

export function authMiddleware(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return { error: 'Invalid or expired token', status: 401 };
  }

  return { user: decoded, success: true };
}

export function requireAuth(handler) {
  return async (request) => {
    const authResult = authMiddleware(request);
    
    if (authResult.error) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    request.user = authResult.user;
    return handler(request);
  };
}

export function requireRole(...roles) {
  return (handler) => {
    return async (request) => {
      if (!request.user || !roles.includes(request.user.role)) {
        return Response.json(
          { success: false, error: 'Forbidden: insufficient permissions' },
          { status: 403 }
        );
      }
      return handler(request);
    };
  };
}
