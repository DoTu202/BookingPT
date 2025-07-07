const Availability = require('../../models/AvailabilityModel');
const asyncHandler = require('express-async-handler');
const Booking = require('../../models/bookingModel');
const timeUtils = require('../../utils/timeUtils');

const addAvailability = asyncHandler(async (req, res) => {
  const {date, startTime, endTime} = req.body;
  const ptId = req.user._id;

  // Validate input
  if (!date || !startTime || !endTime) {
    return res.status(400).json({
      message: 'Date, start time and end time are required',
    });
  }

  // Validate time format using timeUtils
  if (!timeUtils.isValidTimeFormat(startTime) || !timeUtils.isValidTimeFormat(endTime)) {
    return res.status(400).json({
      message: 'Invalid time format. Expected HH:MM',
    });
  }

  // Parse date and time using timeUtils
  const startDateTime = timeUtils.parseDateTime(date, startTime);
  const endDateTime = timeUtils.parseDateTime(date, endTime);
  
  // Convert to Date objects for database
  const _startTime = startDateTime.toDate();
  const _endTime = endDateTime.toDate();
  
  // Validate parsed dates
  if (!startDateTime.isValid() || !endDateTime.isValid()) {
    return res.status(400).json({
      message: 'Invalid date or time format',
    });
  }

  // Check end time is after start time
  if (!endDateTime.isAfter(startDateTime)) {
    return res.status(400).json({
      message: 'End time must be after start time',
    });
  }

  // Check if start time is in the future (compare Vietnam times)
  const nowVietnam = timeUtils.now();
  if (startDateTime.isBefore(nowVietnam)) {
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
  
  // Format response data
  const formattedAvailability = {
    ...newAvailability.toObject(),
    startTime: timeUtils.formatDateTime(newAvailability.startTime, 'YYYY-MM-DD HH:mm'),
    endTime: timeUtils.formatDateTime(newAvailability.endTime, 'YYYY-MM-DD HH:mm'),
  };
  
  res.status(201).json({
    message: 'Availability added successfully',
    data: formattedAvailability,
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
  
  // If date and time are provided, combine them using timeUtils
  if (date && startTime) {
    // Validate time format
    if (!timeUtils.isValidTimeFormat(startTime)) {
      return res.status(400).json({
        message: 'Invalid start time format. Expected HH:MM',
      });
    }
    
    const startDateTime = timeUtils.parseDateTime(date, startTime);
    if (!startDateTime.isValid()) {
      return res.status(400).json({
        message: 'Invalid start date or time format',
      });
    }
    _startTime = startDateTime.toDate();
  } else if (startTime) {
    // If only time is provided, use existing date
    if (!timeUtils.isValidTimeFormat(startTime)) {
      return res.status(400).json({
        message: 'Invalid start time format. Expected HH:MM',
      });
    }
    
    const existingDate = timeUtils.formatDateTime(availability.startTime, 'YYYY-MM-DD');
    const startDateTime = timeUtils.parseDateTime(existingDate, startTime);
    if (!startDateTime.isValid()) {
      return res.status(400).json({
        message: 'Invalid start date or time format',
      });
    }
    _startTime = startDateTime.toDate();
  }

  if (date && endTime) {
    // Validate time format
    if (!timeUtils.isValidTimeFormat(endTime)) {
      return res.status(400).json({
        message: 'Invalid end time format. Expected HH:MM',
      });
    }
    
    const endDateTime = timeUtils.parseDateTime(date, endTime);
    if (!endDateTime.isValid()) {
      return res.status(400).json({
        message: 'Invalid end date or time format',
      });
    }
    _endTime = endDateTime.toDate();
  } else if (endTime) {
    // If only time is provided, use existing date
    if (!timeUtils.isValidTimeFormat(endTime)) {
      return res.status(400).json({
        message: 'Invalid end time format. Expected HH:MM',
      });
    }
    
    const existingDate = timeUtils.formatDateTime(availability.endTime, 'YYYY-MM-DD');
    const endDateTime = timeUtils.parseDateTime(existingDate, endTime);
    if (!endDateTime.isValid()) {
      return res.status(400).json({
        message: 'Invalid end date or time format',
      });
    }
    _endTime = endDateTime.toDate();
  }
  
  // Check end time is after start time
  if (timeUtils.compare(_endTime, _startTime) <= 0) {
    res.status(400);
    throw new Error('End time must be after start time');
  }

  // Check if updating to past time (only if changing from future to past)
  if (startTime || endTime) {
    if (timeUtils.isInPast(_startTime) && timeUtils.isInFuture(availability.startTime)) {
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

  // Format response data
  const formattedAvailability = {
    ...updatedAvailability.toObject(),
    startTime: timeUtils.formatDateTime(updatedAvailability.startTime, 'YYYY-MM-DD HH:mm'),
    endTime: timeUtils.formatDateTime(updatedAvailability.endTime, 'YYYY-MM-DD HH:mm'),
  };

  res.status(200).json({
    message: 'Availability updated successfully.',
    data: formattedAvailability,
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
    const { startOfDay, endOfDay } = timeUtils.getDateRange(date);
    queryOptions.startTime = {$gte: startOfDay, $lte: endOfDay};
  } else {
    // Handle date range
    if (startDate) {
      const startOfDay = timeUtils.getStartOfDay(startDate);
      queryOptions.startTime = {$gte: startOfDay};
    }
    
    if (endDate) {
      const endOfDay = timeUtils.getEndOfDay(endDate);
      if (queryOptions.startTime) {
        queryOptions.startTime = {...queryOptions.startTime, $lte: endOfDay};
      } else {
        queryOptions.startTime = {$lte: endOfDay};
      }
    }
  }

  const slots = await Availability.find(queryOptions).sort({startTime: 'asc'});

  // Format times for consistent display
  const formattedSlots = slots.map(slot => ({
    ...slot.toObject(),
    startTime: timeUtils.formatDateTime(slot.startTime, 'YYYY-MM-DD HH:mm'),
    endTime: timeUtils.formatDateTime(slot.endTime, 'YYYY-MM-DD HH:mm'),
  }));

  res.status(200).json({
    message: 'Availability fetched successfully',
    count: formattedSlots.length,
    data: formattedSlots,
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
