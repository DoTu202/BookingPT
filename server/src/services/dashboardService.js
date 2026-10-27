const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
const Availability = require('../models/AvailabilityModel');
const Review = require('../models/ReviewModel');
const PTProfile = require('../models/PTProfileModel');
const User = require('../models/userModel');
const {dayjs, APP_TIMEZONE} = require('../utils/helpers');

// Statistics for the PT dashboard. A period is a calendar week (Mon-Sun),
// month or year in Vietnam time; `offset` goes back that many periods.
// Sessions belong to the period their start time falls in; earnings are
// completed sessions' `priceAtBooking`.

const PERIODS = ['week', 'month', 'year'];
const MAX_OFFSET = 60;

const CANCELLED = ['cancelled_by_client', 'cancelled_by_pt'];
const BOOKING_STATUSES = Booking.schema.path('status').enumValues;

const periodRange = (period, offset, now) => {
  const local = dayjs(now).tz(APP_TIMEZONE);
  let start;
  if (period === 'week') {
    // dayjs weeks start on Sunday; ours start on Monday.
    start = local.startOf('day').subtract((local.day() + 6) % 7, 'day').subtract(offset, 'week');
  } else {
    start = local.startOf(period).subtract(offset, period);
  }
  const end = start.add(1, period);
  return {start, end};
};

// One bucket per day (week, month) or per month (year), keyed like
// $dateToString below.
const bucketKeys = (period, start, end) => {
  const unit = period === 'year' ? 'month' : 'day';
  const format = period === 'year' ? 'YYYY-MM' : 'YYYY-MM-DD';
  const keys = [];
  for (let cursor = start; cursor.isBefore(end); cursor = cursor.add(1, unit)) {
    keys.push(cursor.format(format));
  }
  return keys;
};

const rate = (part, total) => (total > 0 ? Math.round((part / total) * 1000) / 1000 : null);

const getPtDashboard = async (ptId, {period = 'month', offset = 0, now = new Date()} = {}) => {
  const pt = new mongoose.Types.ObjectId(String(ptId));
  const {start, end} = periodRange(period, offset, now);
  const previous = periodRange(period, offset + 1, now);
  const inRange = (from, to) => ({$gte: from.toDate(), $lt: to.toDate()});
  const sessionsIn = {pt, 'bookingTime.startTime': inRange(start, end)};
  const bucketFormat = period === 'year' ? '%Y-%m' : '%Y-%m-%d';

  const [
    byStatus,
    previousCompleted,
    series,
    weekdays,
    topClients,
    firstBookings,
    slots,
    reviewsInPeriod,
    ratingDistribution,
    profile,
    pending,
    toComplete,
  ] = await Promise.all([
    Booking.aggregate([
      {$match: sessionsIn},
      {
        $group: {
          _id: '$status',
          count: {$sum: 1},
          amount: {$sum: '$priceAtBooking'},
          minutes: {
            $sum: {
              $divide: [{$subtract: ['$bookingTime.endTime', '$bookingTime.startTime']}, 60000],
            },
          },
          clients: {$addToSet: '$client'},
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          pt,
          status: 'completed',
          'bookingTime.startTime': inRange(previous.start, previous.end),
        },
      },
      {$group: {_id: null, count: {$sum: 1}, amount: {$sum: '$priceAtBooking'}}},
    ]),
    Booking.aggregate([
      {$match: {...sessionsIn, status: 'completed'}},
      {
        $group: {
          _id: {
            $dateToString: {
              format: bucketFormat,
              date: '$bookingTime.startTime',
              timezone: APP_TIMEZONE,
            },
          },
          earnings: {$sum: '$priceAtBooking'},
          sessions: {$sum: 1},
        },
      },
    ]),
    // Sessions that happen (or will): when the PT is busiest.
    Booking.aggregate([
      {$match: {...sessionsIn, status: {$in: ['confirmed', 'completed']}}},
      {
        $group: {
          _id: {$isoDayOfWeek: {date: '$bookingTime.startTime', timezone: APP_TIMEZONE}},
          count: {$sum: 1},
        },
      },
    ]),
    Booking.aggregate([
      {$match: {...sessionsIn, status: 'completed'}},
      {$group: {_id: '$client', sessions: {$sum: 1}, earnings: {$sum: '$priceAtBooking'}}},
      {$sort: {sessions: -1, earnings: -1}},
      {$limit: 5},
    ]),
    // A client is new in the period their first real booking with this PT
    // falls in (requests that never happened don't count).
    Booking.aggregate([
      {$match: {pt, status: {$in: ['pending_confirmation', 'confirmed', 'completed']}}},
      {$group: {_id: '$client', first: {$min: '$bookingTime.startTime'}}},
      {$match: {first: inRange(start, end)}},
      {$count: 'count'},
    ]),
    Availability.aggregate([
      {$match: {pt, startTime: inRange(start, end)}},
      {$group: {_id: '$status', count: {$sum: 1}}},
    ]),
    Review.aggregate([
      {$match: {pt, createdAt: inRange(start, end)}},
      {$group: {_id: null, count: {$sum: 1}, average: {$avg: '$rating'}}},
    ]),
    Review.aggregate([{$match: {pt}}, {$group: {_id: '$rating', count: {$sum: 1}}}]),
    PTProfile.findOne({user: pt}).select('rating numReviews').lean(),
    // "Needs attention" is about now, not the selected period.
    Booking.countDocuments({pt, status: 'pending_confirmation'}),
    Booking.countDocuments({pt, status: 'confirmed', 'bookingTime.endTime': {$lte: now}}),
  ]);

  const status = Object.fromEntries(BOOKING_STATUSES.map(key => [key, 0]));
  const statusRow = key => byStatus.find(row => row._id === key);
  byStatus.forEach(row => {
    status[row._id] = row.count;
  });
  const completed = statusRow('completed');
  const confirmed = statusRow('confirmed');
  const cancelled = CANCELLED.reduce((sum, key) => sum + status[key], 0);
  const activeClients = new Set(
    [completed, confirmed].flatMap(row => row?.clients || []).map(String),
  );

  const seriesByKey = new Map(series.map(row => [row._id, row]));
  const slotCount = key => slots.find(row => row._id === key)?.count || 0;
  const bookedSlots = slotCount('booked');
  const openSlots = slotCount('available');

  const users = await User.find({_id: {$in: topClients.map(row => row._id)}})
    .select('username photoUrl')
    .lean();
  const userById = new Map(users.map(user => [String(user._id), user]));

  return {
    period,
    offset,
    range: {start: start.toDate(), end: end.toDate()},
    earnings: {
      total: completed?.amount || 0,
      previous: previousCompleted[0]?.amount || 0,
      // Confirmed sessions not completed yet: what the period can still add.
      expected: confirmed?.amount || 0,
    },
    sessions: {
      completed: status.completed,
      previous: previousCompleted[0]?.count || 0,
      upcoming: status.confirmed,
      hours: Math.round(((completed?.minutes || 0) / 60) * 10) / 10,
    },
    status,
    // Of the sessions that were agreed on, how many happened / were cancelled.
    completionRate: rate(status.completed, status.completed + cancelled),
    cancellationRate: rate(cancelled, status.completed + status.confirmed + cancelled),
    clients: {
      active: activeClients.size,
      new: firstBookings[0]?.count || 0,
    },
    slots: {
      total: bookedSlots + openSlots + slotCount('unavailable_by_pt'),
      booked: bookedSlots,
      available: openSlots,
      fillRate: rate(bookedSlots, bookedSlots + openSlots),
    },
    series: bucketKeys(period, start, end).map(key => ({
      key,
      earnings: seriesByKey.get(key)?.earnings || 0,
      sessions: seriesByKey.get(key)?.sessions || 0,
    })),
    // Monday first.
    weekdays: [1, 2, 3, 4, 5, 6, 7].map(day => weekdays.find(row => row._id === day)?.count || 0),
    topClients: topClients.map(row => {
      const user = userById.get(String(row._id));
      return {
        _id: row._id,
        username: user?.username || null,
        photoUrl: user?.photoUrl || null,
        sessions: row.sessions,
        earnings: row.earnings,
      };
    }),
    rating: {
      average: profile?.rating || 0,
      count: profile?.numReviews || 0,
      inPeriod: {
        count: reviewsInPeriod[0]?.count || 0,
        average: reviewsInPeriod[0] ? Math.round(reviewsInPeriod[0].average * 10) / 10 : null,
      },
      distribution: Object.fromEntries(
        [5, 4, 3, 2, 1].map(stars => [
          stars,
          ratingDistribution.find(row => row._id === stars)?.count || 0,
        ]),
      ),
    },
    attention: {pending, toComplete},
  };
};

module.exports = {getPtDashboard, PERIODS, MAX_OFFSET};
