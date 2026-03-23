const jwt = require('jsonwebtoken');
const { JWT_KEY } = require('../env');

function authenticate(request, response, next) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).json({
      error: 'Missing or invalid authorization header',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_KEY);

    request.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (err) {
    return response.status(401).json({
      error: 'Invalid or expired token',
    });
  }
}

module.exports = authenticate;
