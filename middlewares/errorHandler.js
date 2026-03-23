function errorHandler(err, request, response, next) {
  if (response.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return response.status(statusCode).json({
    error: message,
  });
}

module.exports = errorHandler;
