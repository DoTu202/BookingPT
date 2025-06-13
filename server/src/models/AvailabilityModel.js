const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    pt: { 
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'booked', 'unavailable_by_pt'],
        default: 'available',
        required: true
    },
}, {
    timestamps: true
});

availabilitySchema.pre('save', function (next) {
  if (this.endTime <= this.startTime) {    
    return next(new Error('Thời gian kết thúc phải sau thời gian bắt đầu.'));
  }
  next();
});

availabilitySchema.index({ pt: 1, startTime: 1 });
availabilitySchema.index({ pt: 1, status: 1, startTime: 1 });

module.exports = mongoose.model('Availability', availabilitySchema);