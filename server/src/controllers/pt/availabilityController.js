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


  console.log('Received data:', { date, startTime, endTime });
  
  // Ensure time format is HH:MM
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return res.status(400).json({
      message: 'Invalid time format. Expected HH:MM',
    });
  }

  // Combine date with time to create full Date objects
  const startDateTime = `${date}T${startTime}:00.000Z`;
  const endDateTime = `${date}T${endTime}:00.000Z`;
  
  console.log('DateTime strings:', { startDateTime, endDateTime });
  
  const _startTime = new Date(startDateTime);
  const _endTime = new Date(endDateTime);
  
  console.log('Parsed dates:', { _startTime, _endTime });
  
  // Check if dates are valid
  if (isNaN(_startTime.getTime()) || isNaN(_endTime.getTime())) {
    return res.status(400).json({
      message: 'Invalid date or time format',
    });
  }

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
  console.log('Checking for overlapping slots...');
  
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
  
  console.log('Overlapping availability found:', overlappingAvailability);
  
  if (overlappingAvailability) {
    console.log('Blocking creation due to overlap');
    return res.status(400).json({
      message: 'This time slot is already booked or unavailable',
    });
  }

  console.log('No overlap found, creating new availability...');
  
  const newAvailability = new Availability({
    pt: ptId,
    startTime: _startTime,
    endTime: _endTime,
    status: 'available',
  });

  console.log('Saving new availability:', newAvailability);
  await newAvailability.save();
  console.log('Successfully saved availability with ID:', newAvailability._id);
  
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

  console.log('=== UPDATE AVAILABILITY DEBUG ===');
  console.log('Received data:', { date, startTime, endTime, status });
  
  // If date and time are provided, combine them
  if (date && startTime) {
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      return res.status(400).json({
        message: 'Invalid start time format. Expected HH:MM',
      });
    }
    const startDateTime = `${date}T${startTime}:00.000Z`;
    _startTime = new Date(startDateTime);
    if (isNaN(_startTime.getTime())) {
      return res.status(400).json({
        message: 'Invalid start date or time format',
      });
    }
  } else if (startTime) {
    // If only time is provided, use existing date
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      return res.status(400).json({
        message: 'Invalid start time format. Expected HH:MM',
      });
    }
    const existingDate = availability.startTime.toISOString().split('T')[0];
    const startDateTime = `${existingDate}T${startTime}:00.000Z`;
    _startTime = new Date(startDateTime);
    if (isNaN(_startTime.getTime())) {
      return res.status(400).json({
        message: 'Invalid start date or time format',
      });
    }
  }

  if (date && endTime) {
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(endTime)) {
      return res.status(400).json({
        message: 'Invalid end time format. Expected HH:MM',
      });
    }
    const endDateTime = `${date}T${endTime}:00.000Z`;
    _endTime = new Date(endDateTime);
    if (isNaN(_endTime.getTime())) {
      return res.status(400).json({
        message: 'Invalid end date or time format',
      });
    }
  } else if (endTime) {
    // If only time is provided, use existing date
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(endTime)) {
      return res.status(400).json({
        message: 'Invalid end time format. Expected HH:MM',
      });
    }
    const existingDate = availability.endTime.toISOString().split('T')[0];
    const endDateTime = `${existingDate}T${endTime}:00.000Z`;
    _endTime = new Date(endDateTime);
    if (isNaN(_endTime.getTime())) {
      return res.status(400).json({
        message: 'Invalid end date or time format',
      });
    }
  }
  
  console.log('Parsed dates:', { _startTime, _endTime });

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
  const {status, startDate, endDate, date} = req.query;
  const queryOptions = {pt: req.user._id};

  if (status) {
    if (!['available', 'unavailable_by_pt'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status filter');
    }
    queryOptions.status = status;
  }

  // Handle single date parameter (for backward compatibility)
  if (date && !startDate && !endDate) {
    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(date + 'T23:59:59.999Z');
    queryOptions.startTime = {$gte: start, $lte: end};
  } else {
    // Handle date range
    if (startDate) {
      const start = new Date(startDate + 'T00:00:00.000Z');
      queryOptions.startTime = {$gte: start};
    }
    
    if (endDate) {
      const end = new Date(endDate + 'T23:59:59.999Z');
      if (queryOptions.startTime) {
        queryOptions.startTime = {...queryOptions.startTime, $lte: end};
      } else {
        queryOptions.startTime = {$lte: end};
      }
    }
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
