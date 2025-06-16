const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
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
    throw new Error('Không tìm thấy Personal Trainer này.');
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
    throw new Error('Vui lòng cung cấp ID của PT và ID của khung giờ rảnh.');
  }

  const ptUser = await User.findById(ptId);
  if (!ptUser || ptUser.role !== 'pt') {
    res.status(404);
    throw new Error('Không tìm thấy Personal Trainer này.');
  }

  const ptProfile = await PTProfile.findOne({user: ptId});
  if (!ptProfile || typeof ptProfile.hourlyRate !== 'number') {
    res.status(400);
    throw new Error(
      'PT này chưa cập nhật thông tin giá hoặc hồ sơ không đầy đủ.',
    );
  }

  const slot = await Availability.findById(availabilitySlotId);
  if (!slot) {
    res.status(404);
    throw new Error('Khung giờ bạn chọn không tồn tại.');
  }
  if (slot.pt.toString() !== ptId) {
    res.status(400);

  }
  if (slot.status !== 'available') {
    res.status(400);
    throw new Error(

    );
  }
  if (new Date(slot.startTime) < new Date()) {
    res.status(400);
  
  }

  // Kiểm tra xem client có đặt trùng lịch của chính mình không
  const existingClientBooking = await Booking.findOne({
    client: clientId,
    status: {$in: ['pending_confirmation', 'confirmed']},
    'bookingTime.startTime': {$lt: slot.endTime},
    'bookingTime.endTime': {$gt: slot.startTime},
  });

  if (existingClientBooking) {
    res.status(400);
    throw new Error(
      'Bạn đã có một lịch đặt khác trùng với khoảng thời gian này.',
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
    throw new Error('Không tìm thấy lịch đặt.');
  }
  if (booking.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Bạn không có quyền hủy lịch đặt này.');
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
      `Không thể hủy lịch đặt này vì đã quá gần giờ hẹn (phải hủy trước ${hoursBeforeAllowedToCancel} tiếng).`,
    );
  }

  if (!['pending_confirmation', 'confirmed'].includes(booking.status)) {
    res.status(400);
    throw new Error(
      `Không thể hủy lịch đặt đang ở trạng thái "${booking.status}".`,
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

// Client Profile Management APIs

// Get client profile
const getClientProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'Successfully retrieved client profile',
      data: user
    });
  } catch (error) {
    console.error('Error getting client profile:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

// Update client profile
const updateClientProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, phoneNumber, dob } = req.body;
    
    // Validate email uniqueness if changed
    if (email) {
      const existingUser = await User.findOne({ 
        email: email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Email already exists' 
        });
      }
    }
    
    // Validate username uniqueness if changed
    if (username) {
      const existingUser = await User.findOne({ 
        username: username, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Username already exists' 
        });
      }
    }
    
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (dob) updateData.dob = new Date(dob);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating client profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters long' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        message: 'Current password is incorrect' 
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await User.findByIdAndUpdate(userId, { 
      password: hashedNewPassword 
    });
    
    res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Upload profile photo
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { photoUrl } = req.body;
    
    if (!photoUrl) {
      return res.status(400).json({ 
        message: 'Photo URL is required' 
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { photo: photoUrl },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'Profile photo updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ message: 'Failed to upload photo' });
  }
});

// Delete account
const deleteAccount = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        message: 'Password is required to delete account' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        message: 'Password is incorrect' 
      });
    }
    
    // Check for active bookings
    const activeBookings = await Booking.find({
      client: userId,
      status: { $in: ['pending_confirmation', 'confirmed'] }
    });
    
    if (activeBookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete account with active bookings. Please cancel all bookings first.' 
      });
    }
    
    // Delete user account
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

module.exports = {
  searchPTs,
  viewPTProfile,
  getPTAvailabilityForClient,
  createBookingRequest,
  getClientBookings,
  cancelBookingByClient,
  getClientProfile,
  updateClientProfile,
  changePassword,
  uploadProfilePhoto,
  deleteAccount,
  // reviewPT (nếu bạn triển khai)
};
