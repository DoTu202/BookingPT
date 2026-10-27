const asyncHandler = require('express-async-handler');
const {getPtDashboard, PERIODS, MAX_OFFSET} = require('../../services/dashboardService');
const {badRequest} = require('../../utils/httpError');

// GET /api/pt/dashboard?period=week|month|year&offset=0
const getDashboard = asyncHandler(async (req, res) => {
  const period = req.query.period || 'month';
  if (!PERIODS.includes(period)) {
    throw badRequest('period must be week, month or year.');
  }
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!Number.isInteger(offset) || offset < 0 || offset > MAX_OFFSET) {
    throw badRequest(`offset must be a whole number from 0 to ${MAX_OFFSET}.`);
  }

  const data = await getPtDashboard(req.user._id, {period, offset});
  res.status(200).json({success: true, data});
});

module.exports = {getDashboard};
