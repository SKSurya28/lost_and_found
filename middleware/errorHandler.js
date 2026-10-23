// Wraps async route handlers so thrown errors reach the error handler
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// 404 for unknown API routes
function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central error handler: turns Mongoose errors into clear 400 responses
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join('. ');
    return res.status(400).json({ message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }
  const status = err.statusCode || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: err.message || 'Something went wrong on the server' });
}

module.exports = { asyncHandler, notFound, errorHandler };
