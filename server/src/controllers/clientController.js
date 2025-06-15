const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const PTProfile = require('../models/PTProfileModel'); // Hoặc tên model PTProfile của bạn
const Availability = require('../models/AvailabilityModel'); // Hoặc tên model Availability của bạn
const Booking = require('../models/bookingModel');

// @desc    Client tìm kiếm PTs
// @route   GET /api/clients/pts
// @access  Private (Authenticated users - bất kỳ ai đăng nhập cũng có thể tìm)
const searchPTs = asyncHandler(async (req, res) => {
  const {
    specialization,
    name,
    location,
    availableDate,
    minRate,
    maxRate,
    sortBy,
    order = 'asc',
  } = req.query;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const page = parseInt(req.query.pageNumber) || 1;

  // --- Xây dựng điều kiện tìm kiếm cho PTProfile ---
  const profileQueryConditions = {};

  if (specialization) {
    profileQueryConditions.specializations = {
      $regex: specialization,
      $options: 'i',
    };
  }
  if (location) {
    profileQueryConditions.location = {$regex: location, $options: 'i'};
  }
  if (minRate) {
    profileQueryConditions.hourlyRate = {
      ...profileQueryConditions.hourlyRate,
      $gte: parseFloat(minRate),
    };
  }
  if (maxRate) {
    profileQueryConditions.hourlyRate = {
      ...profileQueryConditions.hourlyRate,
      $lte: parseFloat(maxRate),
    };
  }

  // --- Lọc User có vai trò 'pt' và khớp tên (nếu có) ---
  const userQueryConditions = {role: 'pt'};
  if (name) {
    userQueryConditions.username = {$regex: name, $options: 'i'};
  }

  // Lấy danh sách ID của các User PT khớp điều kiện tên (nếu có)
  let ptUserIds = (await User.find(userQueryConditions).select('_id')).map(
    user => user._id,
  );

  // Nếu tìm theo tên mà không có PT nào, thì không cần tìm profile nữa
  if (name && ptUserIds.length === 0) {
    return res
      .status(200)
      .json({
        data: [],
        page,
        pages: 0,
        count: 0,
        message: 'Can not find any PTs matching the name filter.',
      });
  }

  // Áp dụng filter user ID vào profileQuery (nếu có user IDs từ filter tên)
  if (ptUserIds.length > 0) {
    profileQueryConditions.user = {$in: ptUserIds};
  }

  // --- Lọc PTs dựa trên ngày rảnh (availableDate) ---
  if (availableDate) {
    const searchDate = new Date(availableDate);
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

    const ptIdsCurrentlyInQuery = profileQueryConditions.user
      ? profileQueryConditions.user.$in
      : null;

    const availabilityQuery = {
      status: 'available',
      startTime: {$lte: endOfDay},
      endTime: {$gte: startOfDay},
    };
    // Nếu đã có danh sách PT ID từ các filter khác, chỉ tìm availability của các PT đó
    if (ptIdsCurrentlyInQuery && ptIdsCurrentlyInQuery.length > 0) {
      availabilityQuery.pt = {$in: ptIdsCurrentlyInQuery};
    }

    const availablePTsFromSlots = await Availability.find(
      availabilityQuery,
    ).distinct('pt');

    if (availablePTsFromSlots.length === 0) {
      return res
        .status(200)
        .json({
          data: [],
          page,
          pages: 0,
          count: 0,
          message: 'Don not find any PTs available on the selected date.',
        });
    }
    // Cập nhật lại điều kiện user cho profileQuery
    profileQueryConditions.user = {$in: availablePTsFromSlots};
  }

  const count = await PTProfile.countDocuments(profileQueryConditions);
  if (count === 0) {
    return res
      .status(200)
      .json({
        data: [],
        page,
        pages: 0,
        count: 0,
        message: 'Can not find any PTs matching the criteria.',
      });
  }

  let sortOptions = {averageRating: -1}; // Mặc định sắp xếp theo đánh giá giảm dần
  if (sortBy === 'hourlyRate') {
    sortOptions = {hourlyRate: order === 'desc' ? -1 : 1};
  } else if (sortBy === 'experienceYears') {
    sortOptions = {experienceYears: order === 'desc' ? -1 : 1};
  }

  const ptProfiles = await PTProfile.find(profileQueryConditions)
    .populate('user', 'username email photoUrl') // Chỉ populate thông tin User cần thiết
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort(sortOptions);

  res.status(200).json({
    message: 'Successfully get PT profiles.',
    data: ptProfiles,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  });
});

// @desc    Client xem hồ sơ chi tiết của một PT
// @route   GET /api/clients/pts/:ptId/profile
// @access  Private (Authenticated users)
const viewPTProfile = asyncHandler(async (req, res) => {
  const {ptId} = req.params;

  const ptUser = await User.findOne({_id: ptId, role: 'pt'});
  if (!ptUser) {
    res.status(404);
    throw new Error('Can not find this Personal Trainer.');
  }

  const profile = await PTProfile.findOne({user: ptId}).populate(
    'user',
    'username email photoUrl phoneNumber dob role imageGallery',
  ); // Populate imageGallery
  // .populate('reviews.client', 'username photoUrl'); // Nếu bạn nhúng reviews và muốn populate client của review

  if (!profile) {
    return res.status(200).json({
      user: {
        _id: ptUser._id,
        username: ptUser.username,
        email: ptUser.email,
        photoUrl: ptUser.photoUrl,
        role: ptUser.role,
      },
      message: 'PT này chưa cập nhật hồ sơ chi tiết.',
    });
  }
  res.status(200).json(profile);
});

// @desc    Client xem các khung giờ rảnh của một PT cụ thể
// @route   GET /api/clients/pts/:ptId/availability
// @access  Private (Authenticated users)
const getPTAvailabilityForClient = asyncHandler(async (req, res) => {
  const {ptId} = req.params;
  const {startDate, endDate} = req.query;

  const ptUser = await User.findOne({_id: ptId, role: 'pt'});
  if (!ptUser) {
    res.status(404);
    throw new Error('Personal Trainer not found.');
  }

  const queryOptions = {
    pt: ptId,
    status: 'available',
    startTime: {$gte: new Date()}, // Chỉ lấy các slot trong tương lai
  };

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    queryOptions.startTime = {...queryOptions.startTime, $gte: start};
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    // startTime phải nhỏ hơn hoặc bằng endDate để slot có ý nghĩa
    queryOptions.startTime = {...queryOptions.startTime, $lte: end};
    // endTime có thể được dùng để giới hạn các slot kết thúc trong khoảng này
    queryOptions.endTime = {...queryOptions.endTime, $lte: end};
  }

  const slots = await Availability.find(queryOptions).sort({startTime: 'asc'});

  res.status(200).json({
    message: 'Lấy lịch rảnh của PT thành công.',
    count: slots.length,
    data: slots,
  });
});

// @desc    Client tạo một yêu cầu đặt lịch với PT
// @route   POST /api/clients/bookings
// @access  Private (Client only)
const createBookingRequest = asyncHandler(async (req, res) => {
  const {ptId, availabilitySlotId, notesFromClient} = req.body;
  const clientId = req.user._id;

  if (!ptId || !availabilitySlotId) {
    res.status(400);
    throw new Error('Please provide PT ID and availability slot ID.');
  }

  const ptUser = await User.findById(ptId);
  if (!ptUser || ptUser.role !== 'pt') {
    res.status(404);
    throw new Error('Personal Trainer not found.');
  }

  const ptProfile = await PTProfile.findOne({user: ptId});
  if (!ptProfile || typeof ptProfile.hourlyRate !== 'number') {
    res.status(400);
    throw new Error(
      'PT has not updated pricing information or profile is incomplete.',
    );
  }

  const slot = await Availability.findById(availabilitySlotId);
  if (!slot) {
    res.status(404);
    throw new Error('Time slot not found.');
  }
  if (slot.pt.toString() !== ptId) {
    res.status(400);
    throw new Error('This time slot does not belong to the selected PT.');
  }
  if (slot.status !== 'available') {
    res.status(400);
    throw new Error(
      `This time slot is not available (status: ${slot.status}).`,
    );
  }
  if (new Date(slot.startTime) < new Date()) {
    res.status(400);
    throw new Error('Cannot book a time slot in the past.');
  }

  // Kiểm tra xem client có đặt trùng lịch của chính mình không (với bất kỳ PT nào)
  const existingClientBooking = await Booking.findOne({
    client: clientId,
    status: {$in: ['pending_confirmation', 'confirmed']},
    'bookingTime.startTime': {$lt: slot.endTime},
    'bookingTime.endTime': {$gt: slot.startTime},
  });

  if (existingClientBooking) {
    res.status(400);
    throw new Error(
      'You already have a booking that conflicts with this time slot.',
    );
  }

  const newBooking = new Booking({
    client: clientId,
    pt: ptId,
    availabilitySlot: availabilitySlotId,
    bookingTime: {
      startTime: slot.startTime,
      endTime: slot.endTime,
    },
    status: 'pending_confirmation',
    notesFromClient: notesFromClient || '',
    priceAtBooking: ptProfile.hourlyRate,
  });

  const createdBooking = await newBooking.save();
  
  // slot.status = 'booked';
  // await slot.save();
  // TODO: Gửi thông báo cho PT về yêu cầu đặt lịch mới
  res.status(201).json({
    message:
      'Yêu cầu đặt lịch của bạn đã được gửi thành công và đang chờ PT xác nhận.',
    data: createdBooking,
  });
});

// @desc    Client xem danh sách các lịch đã đặt của mình
// @route   GET /api/clients/my-bookings
// @access  Private (Client only)
const getClientBookings = asyncHandler(async (req, res) => {
  const {status, upcoming} = req.query; // Filter theo trạng thái hoặc sắp tới
  const pageSize = parseInt(req.query.pageSize) || 10;
  const page = parseInt(req.query.pageNumber) || 1;

  console.log('=== Debug getClientBookings ===');
  console.log('User ID:', req.user._id);
  console.log('Query params:', req.query);

  const queryOptions = {client: req.user._id};

  if (status) {
    queryOptions.status = status;
  }
  if (upcoming === 'true') {
    queryOptions['bookingTime.startTime'] = {$gte: new Date()};
    if (!status) {
      // Nếu chỉ lọc upcoming, thì lấy cả pending và confirmed
      queryOptions.status = {$in: ['pending_confirmation', 'confirmed']};
    }
  }

  console.log('Query options:', queryOptions);
  
  if (upcoming === 'false') {
    queryOptions['bookingTime.startTime'] = {$lt: new Date()};
  }

  const count = await Booking.countDocuments(queryOptions);
  console.log('Count found:', count);
  
  // Get bookings với populate đơn giản
  const bookings = await Booking.find(queryOptions)
    .populate('pt', 'username email photoUrl')
    .populate('availabilitySlot', 'startTime endTime')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({'bookingTime.startTime': upcoming === 'true' ? 'asc' : 'desc'});

  console.log('Bookings found:', bookings.length);
  console.log('First booking:', bookings[0]);

  // Sau đó query riêng PTProfile cho mỗi PT trong bookings
  const enrichedBookings = await Promise.all(
    bookings.map(async (booking) => {
      if (booking.pt && booking.pt._id) {
        const ptProfile = await PTProfile.findOne({ user: booking.pt._id })
          .select('hourlyRate specializations location');
        
        return {
          ...booking.toObject(),
          pt: {
            ...booking.pt.toObject(),
            ptProfile: ptProfile || null
          }
        };
      }
      return booking.toObject();
    })
  );

  // Để populate ptProfile, bạn cần đảm bảo có một cách liên kết từ User (PT) đến PTProfile.
  // Nếu bạn có 1 virtual populate trong UserModel để trỏ đến PTProfile, cách trên sẽ dễ hơn.
  // Cách khác là query riêng PTProfile sau khi lấy booking nếu cần nhiều thông tin hơn.
  // Ví dụ đơn giản hơn:
  // const bookings = await Booking.find(queryOptions)
  //     .populate('pt', 'username email photoUrl')
  //     .sort({ 'bookingTime.startTime': upcoming === 'true' ? 'asc' : 'desc' })
  //     .limit(pageSize)
  //     .skip(pageSize * (page - 1));

  res.status(200).json({
    message: 'Lấy danh sách lịch đặt của bạn thành công.',
    data: enrichedBookings,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  });
});

// @desc    Client hủy một lịch đặt của mình
// @route   POST /api/clients/bookings/:bookingId/cancel
// @access  Private (Client only)
const cancelBookingByClient = asyncHandler(async (req, res) => {
  const {bookingId} = req.params;
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found.');
  }
  if (booking.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You do not have permission to cancel this booking.');
  }

  const now = new Date();
  const bookingStartTime = new Date(booking.bookingTime.startTime);
  const hoursBeforeAllowedToCancel = 24; // Ví dụ: PT có thể cấu hình điều này

  if (
    booking.status === 'confirmed' &&
    bookingStartTime.getTime() - now.getTime() <
      hoursBeforeAllowedToCancel * 60 * 60 * 1000
  ) {
    res.status(400);
    throw new Error(
      `Cannot cancel this booking as it's too close to the appointment time (must cancel at least ${hoursBeforeAllowedToCancel} hours in advance).`,
    );
  }

  if (!['pending_confirmation', 'confirmed'].includes(booking.status)) {
    res.status(400);
    throw new Error(
      `Cannot cancel booking with status "${booking.status}".`,
    );
  }

  const originalStatus = booking.status;
  booking.status = 'cancelled_by_client';

  // Giải phóng lại slot availability nếu booking đó đã chiếm slot
  if (
    originalStatus === 'pending_confirmation' ||
    originalStatus === 'confirmed'
  ) {
    const slot = await Availability.findById(booking.availabilitySlot);
    // Chỉ giải phóng nếu slot đó vẫn đang 'booked' bởi booking này
    // và không có booking nào khác (pending/confirmed) cho slot này (hiếm khi xảy ra nếu logic đúng)
    if (slot && slot.status === 'booked') {
      const otherBookingsForSlot = await Booking.findOne({
        availabilitySlot: slot._id,
        _id: {$ne: booking._id}, // Các booking khác cho slot này
        status: {$in: ['pending_confirmation', 'confirmed']},
      });
      if (!otherBookingsForSlot) {
        // Nếu không có booking nào khác đang active cho slot này
        slot.status = 'available';
        await slot.save();
      }
    }
  }

  const updatedBooking = await booking.save();
  // TODO: Gửi thông báo cho PT về việc client hủy lịch
  res
    .status(200)
    .json({message: 'Lịch đặt đã được hủy thành công.', data: updatedBooking});
});

module.exports = {
  searchPTs,
  viewPTProfile,
  getPTAvailabilityForClient,
  createBookingRequest,
  getClientBookings,
  cancelBookingByClient,
  // reviewPT (nếu bạn triển khai)
};
