// Two small, reusable middlewares that keep try/catch error
// handling out of every controller. server.js loads them last,
// after every route, so they catch whatever falls through.

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Something went wrong on the server' });
}

module.exports = { notFound, errorHandler };
