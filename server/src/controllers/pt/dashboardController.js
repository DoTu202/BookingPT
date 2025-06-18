const Booking = require('../../models/bookingModel');
const PTProfile = require('../../models/PTProfileModel');
const User = require('../../models/userModel');

const getDashboardStats = async (req, res) => {
  try {
    const ptId = req.user.id;

    // Get PT profile
    const ptProfile = await PTProfile.findOne({ user: ptId }).populate('user');
    if (!ptProfile) {
      // Return empty stats for users without profile
      return res.status(200).json({
        success: true,
        data: {
          hasProfile: false,
          todayBookings: 0,
          monthlyBookings: 0,
          monthlyEarnings: 0,
          totalClients: 0,
          weeklyBookings: 0,
          recentBookings: [],
          ptProfile: null,
        },
        message: 'Profile not set up yet',
      });
    }

    // Get all bookings for this PT
    const bookings = await Booking.find({ pt: ptId }).populate('client', 'fullname email');

    // Today's stats
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todayBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= todayStart && bookingDate < todayEnd && booking.status === 'confirmed';
    }).length;

    // Monthly stats
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    const monthlyBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.getMonth() === thisMonth &&
             bookingDate.getFullYear() === thisYear &&
             booking.status === 'completed';
    });

    const monthlyEarnings = monthlyBookings.reduce((total, booking) => {
      return total + (booking.price || 0);
    }, 0);

    // Total unique clients
    const uniqueClients = new Set(
      bookings.map(booking => booking.client?._id?.toString() || booking.client)
    ).size;

    // Weekly stats
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= startOfWeek && bookingDate <= endOfWeek;
    });

    const weeklyStats = {
      completedSessions: weeklyBookings.filter(b => b.status === 'completed').length,
      totalHours: weeklyBookings
        .filter(b => b.status === 'completed')
        .reduce((total, booking) => {
          // Calculate hours from start and end time
          const start = new Date(`1970-01-01T${booking.startTime}:00`);
          const end = new Date(`1970-01-01T${booking.endTime}:00`);
          const diff = (end - start) / (1000 * 60 * 60); // hours
          return total + (diff > 0 ? diff : 1); // default 1 hour if invalid
        }, 0),
      newClients: new Set(
        weeklyBookings
          .filter(b => {
            // Check if this is the first booking for this client with this PT
            const clientBookings = bookings.filter(booking => 
              booking.client?._id?.toString() === b.client?._id?.toString()
            );
            const firstBooking = clientBookings.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
            return firstBooking?._id?.toString() === b._id?.toString();
          })
          .map(b => b.client?._id?.toString())
      ).size,
      cancelledSessions: weeklyBookings.filter(b => b.status === 'cancelled').length
    };

    // Calculate rating from PT profile
    const rating = ptProfile.rating || 0;

    // Mock monthly revenue data (in real app, you'd calculate from historical data)
    const monthlyRevenue = [
      Math.round(monthlyEarnings * 0.6),
      Math.round(monthlyEarnings * 0.8),
      Math.round(monthlyEarnings * 0.9),
      monthlyEarnings
    ];

    const stats = {
      hasProfile: true,
      todayBookings,
      monthlyEarnings,
      totalClients: uniqueClients,
      rating,
      weeklyStats,
      monthlyRevenue,
      ptProfile: {
        name: ptProfile.user?.fullname,
        specialization: ptProfile.specialization,
        experience: ptProfile.experience,
        rating: ptProfile.rating
      }
    };

    res.status(200).json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting dashboard stats',
      error: error.message,
    });
  }
};

const getTodayBookings = async (req, res) => {
  try {
    const ptId = req.user.id;

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todayBookings = await Booking.find({
      pt: ptId,
      date: {
        $gte: todayStart,
        $lt: todayEnd
      }
    })
    .populate('client', 'fullname email')
    .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: todayBookings,
    });

  } catch (error) {
    console.error('Error getting today bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting today bookings',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getTodayBookings,
};
