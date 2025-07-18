const Booking = require('../../models/bookingModel');
const asyncHandler = require('express-async-handler');
const Availability = require('../../models/AvailabilityModel');
const { createNotification } = require('../notificationController');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);


const getPtBookings = asyncHandler(async (req, res) => {
    const { status, date } = req.query;
    const queryOptions = { pt: req.user._id };

    if (status) {
        queryOptions.status = status;
    }
    if (date) {
        // Convert date from Vietnam timezone to UTC for database query
        const startOfDay = dayjs.tz(date, 'Asia/Ho_Chi_Minh').startOf('day').utc().toDate();
        const endOfDay = dayjs.tz(date, 'Asia/Ho_Chi_Minh').endOf('day').utc().toDate();
        queryOptions['bookingTime.startTime'] = { $gte: startOfDay, $lte: endOfDay };
    }

    const bookings = await Booking.find(queryOptions)
        .populate('client', 'username email photoUrl')
        .populate('availabilitySlot', 'startTime endTime') 
        .sort({ 'bookingTime.startTime': 'desc' });

    res.status(200).json({ 
        message: 'PT bookings retrieved successfully.', 
        count: bookings.length, 
        data: bookings 
    });
});


const confirmBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        res.status(404); throw new Error('Booking not found.');
    }
    if (booking.pt.toString() !== req.user._id.toString()) {
        res.status(403); throw new Error('You are not authorized to modify this booking.');
    }
    if (booking.status !== 'pending_confirmation') {
        res.status(400); throw new Error(`Booking is currently in "${booking.status}" status, cannot confirm.`);
    }
    booking.status = 'confirmed';


    const slot = await Availability.findById(booking.availabilitySlot);
    if (slot && slot.status !== 'booked') { // Only update the slot if it is not already booked
        slot.status = 'booked';
        await slot.save();
    } else if (!slot) {
        console.warn(`Slot ${booking.availabilitySlot} for booking ${bookingId} not found when confirming.`);
    }
    const updatedBooking = await booking.save();
    
    // Send notification to client
    try {
        await createNotification({
            recipient: booking.client,
            sender: req.user._id,
            type: 'booking_confirmed',
            message: `Your booking has been confirmed by ${req.user.username}`,
            relatedBooking: booking._id
        });
    } catch (error) {
        console.error('Error sending confirmation notification:', error);
    }
    
    res.status(200).json({ message: 'Booking confirmed successfully.', data: updatedBooking });
});


const rejectBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        res.status(404); throw new Error('Booking not found.');
    }
    if (booking.pt.toString() !== req.user._id.toString()) {
        res.status(403); throw new Error('You are not authorized to modify this booking.');
    }

    if (booking.status !== 'pending_confirmation') {
        res.status(400); throw new Error(`Booking is currently in "${booking.status}" status, cannot reject.`);
    }
    booking.status = 'rejected_by_pt';
    const slot = await Availability.findById(booking.availabilitySlot);
    if (slot && slot.status === 'booked') { // Only free the slot if it is currently booked by this booking
        slot.status = 'available';
        await slot.save();
    }

    const updatedBooking = await booking.save();
    
    // Send notification to client
    try {
        await createNotification({
            recipient: booking.client,
            sender: req.user._id,
            type: 'booking_rejected',
            message: `Your booking has been rejected by ${req.user.username}`,
            relatedBooking: booking._id
        });
    } catch (error) {
        console.error('Error sending rejection notification:', error);
    }
    
    res.status(200).json({ message: 'Booking rejected successfully.', data: updatedBooking });
});


const markBookingAsCompleted = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        res.status(404); throw new Error('Booking not found.');
    }
    if (booking.pt.toString() !== req.user._id.toString()) {
        res.status(403); throw new Error('You do not have permission to access this booking.');
    }
    if (booking.status !== 'confirmed') {
        res.status(400); throw new Error(`Only confirmed bookings can be marked as completed. Current status: "${booking.status}".`);
    }
    if (dayjs(booking.bookingTime.endTime).isAfter(dayjs())) {
        res.status(400); throw new Error('Cannot mark session as completed before it ends.');
    }

    booking.status = 'completed';
    const updatedBooking = await booking.save();
    
    // Send notification to client
    try {
        await createNotification({
            recipient: booking.client,
            sender: req.user._id,
            type: 'booking_completed_pt',
            message: `Your session with ${req.user.username} has been completed. Please leave a review!`,
            relatedBooking: booking._id
        });
    } catch (error) {
        console.error('Error sending completion notification:', error);
    }
    
    res.status(200).json({ message: 'Session marked as completed successfully.', data: updatedBooking });
});

module.exports = {
    getPtBookings,
    confirmBooking,
    rejectBooking,
    markBookingAsCompleted,
};