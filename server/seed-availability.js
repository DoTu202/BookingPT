const mongoose = require('mongoose');
const moment = require('moment');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fitnessApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Import models
const User = require('./src/models/userModel');

// Define Availability Schema inline (since we don't have the model file)
const availabilitySchema = new mongoose.Schema({
  ptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  isBooked: {
    type: Boolean,
    default: false,
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null,
  },
}, {
  timestamps: true,
});

const Availability = mongoose.model('Availability', availabilitySchema);

const seedAvailability = async () => {
  try {
    console.log('Connecting to database...');
    
    // Get all PTs
    const pts = await User.find({ role: 'pt' });
    console.log(`Found ${pts.length} PTs`);

    // Clear existing availability
    await Availability.deleteMany({});
    console.log('Cleared existing availability data');

    const availabilityData = [];

    // Create availability for next 7 days for each PT
    for (const pt of pts) {
      console.log(`Creating availability for PT: ${pt.username}`);
      
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = moment().add(dayOffset, 'days');
        
        // Create multiple time slots per day (8 AM to 8 PM, 2-hour slots)
        const timeSlots = [
          { start: '08:00', end: '10:00' },
          { start: '10:00', end: '12:00' },
          { start: '14:00', end: '16:00' },
          { start: '16:00', end: '18:00' },
          { start: '18:00', end: '20:00' },
        ];

        for (const slot of timeSlots) {
          const startTime = moment(date).set({
            hour: parseInt(slot.start.split(':')[0]),
            minute: parseInt(slot.start.split(':')[1]),
            second: 0,
            millisecond: 0
          });

          const endTime = moment(date).set({
            hour: parseInt(slot.end.split(':')[0]),
            minute: parseInt(slot.end.split(':')[1]),
            second: 0,
            millisecond: 0
          });

          availabilityData.push({
            ptId: pt._id,
            date: date.toDate(),
            startTime: startTime.toDate(),
            endTime: endTime.toDate(),
            isBooked: false,
          });
        }
      }
    }

    // Insert all availability data
    await Availability.insertMany(availabilityData);
    console.log(`Created ${availabilityData.length} availability slots`);

    // Show some sample data
    const sampleAvailability = await Availability.find()
      .populate('ptId', 'username')
      .limit(10);
    
    console.log('\nSample availability data:');
    sampleAvailability.forEach(slot => {
      console.log(`PT: ${slot.ptId.username}, Date: ${moment(slot.date).format('YYYY-MM-DD')}, Time: ${moment(slot.startTime).format('HH:mm')}-${moment(slot.endTime).format('HH:mm')}`);
    });

    console.log('\nAvailability seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding availability:', error);
    process.exit(1);
  }
};

seedAvailability();
