function authMiddleware(req, res, next) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Non autorisé. Veuillez vous connecter." });
    }
    next();
  }
  
  module.exports = authMiddleware;
  