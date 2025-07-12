const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    client: { 
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    pt: { 
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    availabilitySlot: { 
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Availability'
    },
    bookingTime: { 
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true }
    },
    status: {
        type: String,
        enum: [
            'pending_confirmation',
            'confirmed',
            'cancelled_by_client',
            'cancelled_by_pt',
            'completed',
            'rejected_by_pt',
            'rejected_by_system'
        ],
        default: 'pending_confirmation',
        required: true
    },
    notesFromClient: {
        type: String,
        default: '',
        trim: true
    },
    priceAtBooking: { 
        type: Number,
        required: true
    },
    paymentStatus: { 
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
}, {
    timestamps: true
});

bookingSchema.pre('save', function(next) {
    if (this.bookingTime.endTime <= this.bookingTime.startTime) {
        return next(new Error('End time must be after start time'));
    }
    next();
});


bookingSchema.index({ client: 1, "bookingTime.startTime": -1 });
bookingSchema.index({ pt: 1, "bookingTime.startTime": -1 });
bookingSchema.index({ availabilitySlot: 1 });
bookingSchema.index({ status: 1, "bookingTime.startTime": 1 });

module.exports = mongoose.model('Booking', bookingSchema);