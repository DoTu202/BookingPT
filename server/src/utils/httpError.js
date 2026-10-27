// Errors with an HTTP status. errorHandler reads `statusCode`, so services and
// controllers can simply `throw notFound('...')` without touching `res`.
class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

const badRequest = message => new HttpError(400, message);
const unauthorized = (message = 'Unauthorized') => new HttpError(401, message);
const forbidden = (message = 'Forbidden') => new HttpError(403, message);
const notFound = message => new HttpError(404, message);
const conflict = message => new HttpError(409, message);
const tooManyRequests = message => new HttpError(429, message);

module.exports = {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
};
