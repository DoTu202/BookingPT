const Booking = require('../../models/bookingModel');
const PTProfile = require('../../models/PTProfileModel');

const getEarningsData = async (req, res) => {
  try {
    const ptId = req.user.id;
    const { period = 'monthly' } = req.query; // monthly, weekly, yearly

    // Get PT profile
    const ptProfile = await PTProfile.findOne({ user: ptId });
    if (!ptProfile) {
      return res.status(404).json({
        success: false,
        message: 'PT profile not found',
      });
    }

    // Get all completed bookings for this PT
    const completedBookings = await Booking.find({ 
      pt: ptId, 
      status: 'completed' 
    }).populate('client', 'fullname email').sort({ date: -1 });

    // Calculate total earnings
    const totalEarnings = completedBookings.reduce((total, booking) => {
      return total + (booking.priceAtBooking || 0);
    }, 0);

    // Calculate total sessions
    const totalSessions = completedBookings.length;

    // Calculate average per session
    const averagePerSession = totalSessions > 0 ? Math.round(totalEarnings / totalSessions) : 0;

    // Count unique clients
    const uniqueClients = new Set(
      completedBookings.map(booking => booking.client?._id?.toString())
    ).size;

    // Create simple chart data (last 7 days)
    const today = new Date();
    const chartData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      // Find bookings for this day
      const dayBookings = completedBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= date && bookingDate < nextDate;
      });
      
      const dayEarnings = dayBookings.reduce((sum, booking) => sum + (booking.priceAtBooking || 0), 0);
      
      chartData.push({
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: dayEarnings,
        sessions: dayBookings.length,
        date: date.toISOString().split('T')[0]
      });
    }

    // Get recent transactions (last 5)
    const recentTransactions = completedBookings.slice(0, 5).map(booking => ({
      id: booking._id,
      clientName: booking.client?.fullname || 'Unknown Client',
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      amount: booking.priceAtBooking || 0,
      status: booking.status
    }));

    // Simple response data
    const earningsData = {
      period,
      totalEarnings,
      totalSessions,
      averagePerSession,
      uniqueClients,
      chartData,
      recentTransactions,
      hasData: completedBookings.length > 0
    };

    res.status(200).json({
      success: true,
      data: earningsData,
    });

  } catch (error) {
    console.error('Error getting earnings data:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting earnings data',
      error: error.message,
    });
  }
};

module.exports = {
  getEarningsData,
};
