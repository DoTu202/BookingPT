const Availability = require('../../models/AvailabilityModel');
const asyncHandler = require('express-async-handler');
const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(timezone);

const addAvailability = asyncHandler(async (req, res) => {
  const {startTime, endTime} = req.body;
  const ptId = req.user._id;

  // Check required fields
  if (!startTime || !endTime) {
    res.status(400);
    throw new Error('startTime and endTime are required as UTC ISO strings');
  }

  // Validate ISO 8601 format
  const startDateTime = dayjs(startTime);
  const endDateTime = dayjs(endTime);

  if (!startDateTime.isValid() || !endDateTime.isValid()) {
    res.status(400);
    throw new Error('Invalid ISO 8601 format for startTime or endTime');
  }

  // Check time logic
  if (endDateTime.isBefore(startDateTime)) {
    res.status(400);
    throw new Error('End time must be after start time');
  }

  if (startDateTime.isBefore(dayjs())) {
    res.status(400);
    throw new Error('Start time must be in the future');
  }

  // Convert to Date objects for MongoDB
  const _startTime = startDateTime.toDate();
  const _endTime = endDateTime.toDate();

  // Check for overlapping slots
  const overlappingAvailability = await Availability.findOne({
    pt: ptId,
    $or: [
      {startTime: {$lt: _endTime, $gte: _startTime}},
      {endTime: {$gt: _startTime, $lte: _endTime}},
      {startTime: {$lte: _startTime}, endTime: {$gte: _endTime}},
    ],
  });

  if (overlappingAvailability) {
    res.status(400);
    throw new Error('This time slot overlaps with an existing one');
  }

  // Create and save new slot
  const newAvailability = new Availability({
    pt: ptId,
    startTime: _startTime,
    endTime: _endTime,
  });

  await newAvailability.save();

  // Return the created slot
  res.status(201).json({
    success: true,
    data: newAvailability,
  });
});

const updateAvailability = asyncHandler(async (req, res) => {
  const {availabilityId} = req.params;
  const {startTime, endTime} = req.body;
  const ptId = req.user._id;

  // Check avaiblability exists
  const availability = await Availability.findOne({
    _id: availabilityId,
    pt: ptId,
  });

  if (!availability) {
    res.status(404);
    throw new Error('Availability slot not found');
  }

  // Check required fields
  if (!startTime || !endTime) {
    res.status(400);
    throw new Error('startTime and endTime are required');
  }

  const startDateTime = dayjs(startTime);
  const endDateTime = dayjs(endTime);

  if (!startDateTime.isValid() || !endDateTime.isValid()) {
    res.status(400);
    throw new Error('Invalid ISO 8601 format');
  }

  if (endDateTime.isBefore(startDateTime)) {
    res.status(400);
    throw new Error('End time must be after start time');
  }

  // Check for overlapping slots 
  const overlappingAvailability = await Availability.findOne({
    pt: ptId,
    _id: {$ne: availabilityId}, // Exclude current slot
    $or: [
      {startTime: {$lt: endDateTime.toDate(), $gte: startDateTime.toDate()}},
      {endTime: {$gt: startDateTime.toDate(), $lte: endDateTime.toDate()}},
      {
        startTime: {$lte: startDateTime.toDate()},
        endTime: {$gte: endDateTime.toDate()},
      },
    ],
  });

  if (overlappingAvailability) {
    res.status(400);
    throw new Error('Updated time slot overlaps with an existing one');
  }

  // Update availability
  availability.startTime = startDateTime.toDate();
  availability.endTime = endDateTime.toDate();

  await availability.save();

  res.status(200).json({
    success: true,
    data: availability,
  });
});


const getAvailabilitySlots = asyncHandler(async (req, res) => {
  const ptId = req.user._id;
  const {date} = req.query; 

  let query = {pt: ptId};

  // If date is provided, filter by startTime within that date
  if (date) {
    const timeZone = 'Asia/Ho_Chi_Minh';
    const startOfDay = dayjs.tz(date, timeZone).startOf('day').toDate();
    const endOfDay = dayjs.tz(date, timeZone).endOf('day').toDate();

    query.startTime = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
  }

  const availabilitySlots = await Availability.find(query)
    .sort({startTime: 1})
    .populate('pt', 'username email');

  res.status(200).json({
    success: true,
    data: availabilitySlots,
  });
});

const deletedAvailabilitySlot = asyncHandler(async (req, res) => {
  const {availabilityId} = req.params;
  const ptId = req.user._id;

  const availability = await Availability.findOne({
    _id: availabilityId,
    pt: ptId,
  });

  if (!availability) {
    res.status(404);
    throw new Error('Availability slot not found');
  }

  // Check if slot is booked
  if (availability.isBooked) {
    res.status(400);
    throw new Error('Cannot delete a booked time slot');
  }

  await Availability.findByIdAndDelete(availabilityId);

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
