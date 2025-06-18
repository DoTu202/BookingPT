const Availability = require('../../models/AvailabilityModel');
const asyncHandler = require('express-async-handler');
const Booking = require('../../models/bookingModel');

const addAvailability = asyncHandler(async (req, res) => {
  const {date, startTime, endTime} = req.body;
  const ptId = req.user._id;

  if (!date || !startTime || !endTime) {
    return res.status(400).json({
      message: 'Date, start time and end time are required',
    });
  }

  // Combine date with time to create full Date objects
  const _startTime = new Date(`${date}T${startTime}:00`);
  const _endTime = new Date(`${date}T${endTime}:00`);

  if (_endTime <= _startTime) {
    return res.status(400).json({
      message: 'End time must be after start time',
    });
  }
  if (_startTime < new Date()) {
    return res.status(400).json({
      message: 'Start time must be in the future',
    });
  }

  // Check if the PT is already booked or unavailable during this time
  const overlappingAvailability = await Availability.findOne({
    pt: ptId,
    $or: [
      {
        startTime: {$lt: _endTime, $gte: _startTime},
      },
      {
        endTime: {$gt: _startTime, $lte: _endTime},
      },
      {
        startTime: {$lte: _startTime},
        endTime: {$gte: _endTime},
      },
    ],
  });
  if (overlappingAvailability) {
    return res.status(400).json({
      message: 'This time slot is already booked or unavailable',
    });
  }

  const newAvailability = new Availability({
    pt: ptId,
    startTime: _startTime,
    endTime: _endTime,
    status: 'available',
  });

  await newAvailability.save();
  res.status(201).json({
    message: 'Availability added successfully',
    data: newAvailability,
  });
});

//Update availability for PT
const updateAvailability = asyncHandler(async (req, res) => {
  const {availabilityId} = req.params;
  const {date, startTime, endTime, status} = req.body;
  const ptId = req.user._id;

  const availability = await Availability.findOne({
    _id: availabilityId,
    pt: ptId,
  });

  if (!availability) {
    res.status(404);
    throw new Error(
      'Can not find availability with this id or you are not the owner',
    );
  }

  if (availability.status === 'booked') {
    const booking = await Booking.findOne({
      availabilitySlot: availabilityId,
      status: {$in: ['pending', 'confirmed']},
    });
    if (booking) {
      res.status(400);
      throw new Error(
        'Cannot update availability that has pending or confirmed bookings. Please cancel related bookings first.',
      );
    }
  }

  let _startTime = availability.startTime;
  let _endTime = availability.endTime;

  // If date and time are provided, combine them
  if (date && startTime) {
    _startTime = new Date(`${date}T${startTime}:00`);
  } else if (startTime) {
    // If only time is provided, use existing date
    const existingDate = availability.startTime.toISOString().split('T')[0];
    _startTime = new Date(`${existingDate}T${startTime}:00`);
  }

  if (date && endTime) {
    _endTime = new Date(`${date}T${endTime}:00`);
  } else if (endTime) {
    // If only time is provided, use existing date
    const existingDate = availability.endTime.toISOString().split('T')[0];
    _endTime = new Date(`${existingDate}T${endTime}:00`);
  }

  if (_endTime <= _startTime) {
    res.status(400);
    throw new Error('End time must be after start time');
  }

  if (startTime || endTime) {
    if (_startTime < new Date() && availability.startTime >= new Date()) {
      res.status(400);
      throw new Error('Cannot update availability to a time in the past.');
    }
    const overlappingAvailability = await Availability.findOne({
      _id: {$ne: availabilityId}, // Exclude the current availability
      pt: ptId,
      $or: [
        {startTime: {$lt: _endTime, $gte: _startTime}},
        {endTime: {$gt: _startTime, $lte: _endTime}},
        {startTime: {$lte: _startTime}, endTime: {$gte: _endTime}},
      ],
    });
    if (overlappingAvailability) {
      res.status(400);
      throw new Error('This time slot is already booked or unavailable');
    }
    availability.startTime = _startTime;
    availability.endTime = _endTime;
  }

  if (status) {
    if (!['available', 'unavailable_by_pt'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status update for availability.');
    }
    availability.status = status;
  }

  const updatedAvailability = await availability.save();

  res.status(200).json({
    message: 'Availability updated successfully.',
    data: updatedAvailability,
  });
});

//Get availability for PT
const getAvailabilitySlots = asyncHandler(async (req, res) => {
  const {status, startDate, endDate} = req.query;
  const queryOptions = {pt: req.user._id};

  if (status) {
    if (!['available', 'unavailable_by_pt'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status filter');
    }
    queryOptions.status = status;
  }

  if (startDate) {
    queryOptions.startTime = {
      ...queryOptions.startTime,
      $gte: new Date(startDate),
    };
  }
  if (endDate) {
    let endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    queryOptions.endTime = {...queryOptions.endTime, $lte: endOfDay};
  }

  const slots = await Availability.find(queryOptions).sort({startTime: 'asc'});

  res.status(200).json({
    message: 'Availability fetched successfully',
    count: slots.length,
    data: slots,
  });
});

//delete availability
const deletedAvailabilitySlot = asyncHandler(async (req, res) => {
  const {availabilityId} = req.params;
  const ptId = req.user._id;

  const availability = await Availability.findOne({
    _id: availabilityId,
    pt: ptId,
  });

  if (!availability) {
    res.status(404);
    throw new Error('Availability not found or you are not the owner');
  }
  //not have booking

  if (availability.status === 'booked') {
    const booking = await Booking.findOne({
      availability: availabilityId,
      status: {$in: ['pending_confirmation', 'confirmed']},
    });
    if (booking) {
      res.status(400);
      throw new Error(
        'Cannot delete availability that has pending or confirmed bookings. Please cancel related bookings first.',
      );
    }
  }

  await availability.deleteOne();
  res.status(200).json({
    message: 'Availability deleted successfully',
  });
});

module.exports = {
  addAvailability,
  updateAvailability,
  getAvailabilitySlots,
  deletedAvailabilitySlot,
};
