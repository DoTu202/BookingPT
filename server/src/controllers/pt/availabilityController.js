const Availability = require('../../models/AvailabilityModel');
const asyncHandler = require('express-async-handler');
const {dayjs, dayRange, assertValidId} = require('../../utils/helpers');

const MAX_SLOT_HOURS = 12;

// Validates a start/end pair sent as ISO 8601 strings and returns Dates.
const parseSlotTimes = (res, startTime, endTime) => {
  if (!startTime || !endTime) {
    res.status(400);
    throw new Error('startTime and endTime are required as UTC ISO strings');
  }

  const start = dayjs(startTime);
  const end = dayjs(endTime);
  if (!start.isValid() || !end.isValid()) {
    res.status(400);
    throw new Error('Invalid ISO 8601 format for startTime or endTime');
  }
  if (!end.isAfter(start)) {
    res.status(400);
    throw new Error('End time must be after start time');
  }
  if (end.diff(start, 'hour', true) > MAX_SLOT_HOURS) {
    res.status(400);
    throw new Error(`A slot cannot be longer than ${MAX_SLOT_HOURS} hours`);
  }
  if (start.isBefore(dayjs())) {
    res.status(400);
    throw new Error('Start time must be in the future');
  }
  return {start: start.toDate(), end: end.toDate()};
};

// Two intervals overlap when each starts before the other ends.
const findOverlap = (ptId, start, end, excludeId) =>
  Availability.findOne({
    pt: ptId,
    ...(excludeId ? {_id: {$ne: excludeId}} : {}),
    startTime: {$lt: end},
    endTime: {$gt: start},
  });

const addAvailability = asyncHandler(async (req, res) => {
  const ptId = req.user._id;
  const {start, end} = parseSlotTimes(res, req.body.startTime, req.body.endTime);

  if (await findOverlap(ptId, start, end)) {
    res.status(400);
    throw new Error('This time slot overlaps with an existing one');
  }

  const newAvailability = await Availability.create({
    pt: ptId,
    startTime: start,
    endTime: end,
  });

  res.status(201).json({
    success: true,
    data: newAvailability,
  });
});

const updateAvailability = asyncHandler(async (req, res) => {
  const {availabilityId} = req.params;
  const ptId = req.user._id;
  assertValidId(res, availabilityId, 'availability id');

  const availability = await Availability.findOne({_id: availabilityId, pt: ptId});
  if (!availability) {
    res.status(404);
    throw new Error('Availability slot not found');
  }
  // A booked slot is referenced by a booking that copied its times; moving it
  // would silently desynchronise the two.
  if (availability.status === 'booked') {
    res.status(400);
    throw new Error('Cannot change a slot that already has a booking');
  }

  const {start, end} = parseSlotTimes(res, req.body.startTime, req.body.endTime);

  if (await findOverlap(ptId, start, end, availabilityId)) {
    res.status(400);
    throw new Error('Updated time slot overlaps with an existing one');
  }

  availability.startTime = start;
  availability.endTime = end;
  await availability.save();

  res.status(200).json({
    success: true,
    data: availability,
  });
});

const getAvailabilitySlots = asyncHandler(async (req, res) => {
  const query = {pt: req.user._id};

  if (req.query.date) {
    const range = dayRange(req.query.date);
    if (!range) {
      res.status(400);
      throw new Error('date is not a valid date');
    }
    query.startTime = {$gte: range.start, $lte: range.end};
  }

  const availabilitySlots = await Availability.find(query)
    .sort({startTime: 1})
    .limit(500)
    .populate('pt', 'username email');

  res.status(200).json({
    success: true,
    data: availabilitySlots,
  });
});

const deletedAvailabilitySlot = asyncHandler(async (req, res) => {
  const {availabilityId} = req.params;
  assertValidId(res, availabilityId, 'availability id');

  const availability = await Availability.findOne({
    _id: availabilityId,
    pt: req.user._id,
  });

  if (!availability) {
    res.status(404);
    throw new Error('Availability slot not found');
  }

  // Previously this checked a non-existent `isBooked` field, so booked slots
  // could be deleted out from under a booking.
  if (availability.status === 'booked') {
    res.status(400);
    throw new Error('Cannot delete a booked time slot');
  }

  await availability.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Availability slot deleted successfully',
  });
});

module.exports = {
  addAvailability,
  updateAvailability,
  getAvailabilitySlots,
  deletedAvailabilitySlot,
};
