const Booking = require('../../models/bookingModel');
const asyncHandler = require('express-async-handler');
const Availability = require('../../models/AvailabilityModel');


const getPtBookings = asyncHandler(async (req, res) => {
    const { status, date } = req.query;
    const queryOptions = { pt: req.user._id };

    if (status) {
        queryOptions.status = status;
    }
    if (date) {
        const searchDate = new Date(date);
        const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
        queryOptions['bookingTime.startTime'] = { $gte: startOfDay, $lte: endOfDay };
    }

    const bookings = await Booking.find(queryOptions)
        .populate('client', 'username email photoUrl')
        .populate('availabilitySlot', 'startTime endTime') // Có thể không cần nếu bookingTime đã đủ
        .sort({ 'bookingTime.startTime': 'desc' });
    res.status(200).json({ message: 'Lấy danh sách lịch đặt của PT thành công.', count: bookings.length, data: bookings });
});

// @desc    PT xác nhận một lịch đặt từ client
// @route   POST /api/pts/bookings/:bookingId/confirm
// @access  Private (PT only)
const confirmBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        res.status(404); throw new Error('Không tìm thấy lịch đặt.');
    }
    if (booking.pt.toString() !== req.user._id.toString()) {
        res.status(403); throw new Error('Bạn không có quyền thao tác với lịch đặt này.');
    }
    if (booking.status !== 'pending_confirmation') {
        res.status(400); throw new Error(`Lịch đặt đang ở trạng thái "${booking.status}", không thể xác nhận.`);
    }

    booking.status = 'confirmed';


    const slot = await Availability.findById(booking.availabilitySlot);
    if (slot && slot.status !== 'booked') { // Đảm bảo slot vẫn đang bị chiếm bởi booking này
        slot.status = 'booked';
        await slot.save();
    } else if (!slot) {
        console.warn(`Slot ${booking.availabilitySlot} cho booking ${bookingId} không tìm thấy khi xác nhận.`);
        // Cân nhắc: Nếu slot không còn, booking này có nên được confirm không?
        // Hoặc có thể tạo lại 1 slot 'booked' tương ứng với bookingTime?
        // Hiện tại, chỉ log warning.
    }
    const updatedBooking = await booking.save();
    // TODO: Gửi thông báo cho Client
    res.status(200).json({ message: 'Lịch đặt đã được xác nhận.', data: updatedBooking });
});

// @desc    PT từ chối một lịch đặt từ client
// @route   POST /api/pts/bookings/:bookingId/reject
// @access  Private (PT only)
const rejectBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        res.status(404); throw new Error('Không tìm thấy lịch đặt.');
    }
    if (booking.pt.toString() !== req.user._id.toString()) {
        res.status(403); throw new Error('Bạn không có quyền thao tác với lịch đặt này.');
    }

    if (booking.status !== 'pending_confirmation') {
        res.status(400); throw new Error(`Lịch đặt đang ở trạng thái "${booking.status}", không thể từ chối.`);
    }
    booking.status = 'rejected_by_pt';
    const slot = await Availability.findById(booking.availabilitySlot);
    if (slot && slot.status === 'booked') { // Chỉ giải phóng slot nếu nó đang bị booking này chiếm
        slot.status = 'available';
        await slot.save();
    }

    const updatedBooking = await booking.save();
    // TODO: Gửi thông báo cho Client
    res.status(200).json({ message: 'Lịch đặt đã bị từ chối.', data: updatedBooking });
});

// @desc    PT đánh dấu một buổi tập đã hoàn thành
// @route   POST /api/pts/bookings/:bookingId/complete
// @access  Private (PT only)
const markBookingAsCompleted = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        res.status(404); throw new Error('Không tìm thấy lịch đặt.');
    }
    if (booking.pt.toString() !== req.user._id.toString()) {
        res.status(403); throw new Error('Bạn không có quyền thao tác với lịch đặt này.');
    }
    if (booking.status !== 'confirmed') {
        res.status(400); throw new Error(`Chỉ có thể hoàn thành lịch đặt đã được xác nhận. Trạng thái hiện tại: "${booking.status}".`);
    }
    if (new Date(booking.bookingTime.endTime) > new Date()) {
        res.status(400); throw new Error('Không thể đánh dấu hoàn thành cho buổi tập chưa kết thúc.');
    }

    booking.status = 'completed';
    const updatedBooking = await booking.save();
    // TODO: Gửi thông báo cho client, có thể yêu cầu đánh giá (review)
    res.status(200).json({ message: 'Buổi tập đã được đánh dấu hoàn thành.', data: updatedBooking });
});

module.exports = {
    getPtBookings,
    confirmBooking,
    rejectBooking,
    markBookingAsCompleted,
};