const mongoose = require('mongoose');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const {badRequest} = require('./httpError');

dayjs.extend(utc);
dayjs.extend(timezone);

// All dates are stored in UTC; "a day" in filters means a calendar day in Vietnam.
const APP_TIMEZONE = 'Asia/Ho_Chi_Minh';

const dayRange = date => {
  // dayjs.tz throws (RangeError) on unparseable input instead of returning an
  // invalid date, which turned `?date=nope` into a 500.
  if (typeof date !== 'string' || !dayjs(date).isValid()) {
    return null;
  }
  const day = dayjs.tz(date, APP_TIMEZONE);
  if (!day.isValid()) {
    return null;
  }
  return {
    start: day.startOf('day').utc().toDate(),
    end: day.endOf('day').utc().toDate(),
  };
};

// Escapes user input before using it in a $regex, which prevents both regex
// injection and catastrophic backtracking (ReDoS).
const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isValidId = value =>
  typeof value === 'string' && mongoose.Types.ObjectId.isValid(value) && /^[a-f\d]{24}$/i.test(value);

// Clamps page/size query params so a client cannot request huge pages.
const parsePagination = (query, {pageKey = 'pageNumber', sizeKey = 'pageSize', defaultSize = 10} = {}) => {
  const page = Math.max(parseInt(query[pageKey], 10) || 1, 1);
  const size = Math.min(Math.max(parseInt(query[sizeKey], 10) || defaultSize, 1), 50);
  return {page, size, skip: (page - 1) * size};
};

// Throws a 400 error (handled by errorHandler) when an id param is malformed.
const assertValidId = (value, name = 'id') => {
  if (!isValidId(value)) {
    throw badRequest(`Invalid ${name}.`);
  }
};

module.exports = {
  dayjs,
  APP_TIMEZONE,
  dayRange,
  escapeRegex,
  isValidId,
  assertValidId,
  parsePagination,
};
