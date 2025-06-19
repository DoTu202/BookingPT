const mongoose = require('mongoose');
const Booking = require('./src/models/bookingModel');

const checkBookings = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/fitness-app');
    console.log('✅ Connected to MongoDB');

    const bookings = await Booking.find()
      .populate('client', 'username email')
      .populate('pt', 'username')
      .sort({ createdAt: -1 });

    console.log(`\n📊 Total bookings found: ${bookings.length}\n`);

    if (bookings.length > 0) {
      console.log('🔍 Recent bookings:');
      bookings.slice(0, 10).forEach((booking, index) => {
        console.log(`${index + 1}. Booking ID: ${booking._id}`);
        console.log(`   Client: ${booking.client?.username || 'Unknown'} (${booking.client?.email || 'N/A'})`);
        console.log(`   PT: ${booking.pt?.username || 'Unknown'}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Start Time: ${booking.bookingTime?.startTime}`);
        console.log(`   End Time: ${booking.bookingTime?.endTime}`);
        console.log(`   Price: ${booking.priceAtBooking || 0} VND`);
        console.log(`   Created: ${booking.createdAt}`);
        console.log('   ---');
      });

      // Check booking status distribution
      const statusCounts = {};
      bookings.forEach(booking => {
        statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
      });

      console.log('\n📈 Booking Status Distribution:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    } else {
      console.log('❌ No bookings found in database');
    }

  } catch (error) {
    console.error('💥 Error checking bookings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

checkBookings();
