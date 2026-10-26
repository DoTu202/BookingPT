const multer = require('multer');
const {isProduction} = require('../configs/env');

const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not found - ${req.originalUrl}`));
};

// Central error handler. Controllers throw (via express-async-handler) after
// optionally setting res.status(); everything ends up here.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message;

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for '${err.path}'.`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map(val => val.message);
    message = `Invalid data: ${messages.join('. ')}`;
  } else if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Value for field '${field}' already exists. Please choose a different value.`;
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5MB).' : err.message;
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON body.';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large.';
  }

  if (statusCode >= 500) {
    console.error(err);
    // Never leak internal error details to clients in production.
    if (isProduction) {
      message = 'Internal server error';
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : {stack: err.stack}),
  });
};

module.exports = {notFound, errorHandler};
