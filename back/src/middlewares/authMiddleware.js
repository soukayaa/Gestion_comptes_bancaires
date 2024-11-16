const authenticateMiddleware = (req, res, next) => {
  const publicRoutes = ['/login', '/register', '/api/login', '/api/signup'];

  if (publicRoutes.includes(req.path)) {
    return next();
  }

  // Check session
  if (!req.session || !req.session.userId) {
    // API request returns 401 status code
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({
        success: false,
        message: 'Session expired, please login again'
      });
    }
    // Page request redirected to login page
    return res.redirect('/login');
  }

  next();
};

const apiAuthMiddleware = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: "Unauthorized. Please login."
    });
  }
  next();
};

module.exports = {
  authenticateMiddleware,
  apiAuthMiddleware
};