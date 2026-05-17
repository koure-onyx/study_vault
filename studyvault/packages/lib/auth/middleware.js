const { verifyToken } = require('./jwt');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  req.user = decoded;
  next();
}

function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  next();
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
};
