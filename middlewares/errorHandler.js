function errorHandler(err, request, response, next) {
  if (response.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (statusCode >= 500) {
    console.error('Error stack:', err.stack);
  }

  return response.status(statusCode).json({
    error: message,
  });
}

module.exports = errorHandler;
