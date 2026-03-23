function requireRole(...allowedRoles) {
  return function (request, response, next) {
    if (!request.user) {
      return response.status(401).json({
        error: 'Unauthorized',
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return response.status(403).json({
        error: 'Forbidden',
      });
    }

    return next();
  };
}

module.exports = requireRole;
