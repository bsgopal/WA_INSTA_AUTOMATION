let app = null;
let loadError = null;

try {
  app = require('../server');
} catch (err) {
  loadError = err;
  console.error('SERVERLESS BOOT ERROR (backend/api):', err);
}

module.exports = (req, res) => {
  if (loadError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'SERVERLESS_BOOT_ERROR_BACKEND_API',
      message: loadError.message,
      stack: loadError.stack,
      code: loadError.code
    }, null, 2));
  }

  try {
    return app(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'SERVERLESS_REQUEST_ERROR',
      message: err.message,
      stack: err.stack
    }, null, 2));
  }
};
