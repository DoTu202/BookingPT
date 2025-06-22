const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    pt: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    client: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    booking: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

reviewSchema.index({ booking: 1, client: 1 }, { unique: true }); 
reviewSchema.index({ pt: 1, createdAt: -1 });





reviewSchema.statics.calculateAverages = async function(ptUserId) {
    try {
        const PTProfileModel = mongoose.model('PTProfile');

        const stats = await this.aggregate([
            { $match: { pt: ptUserId } },
            {
                $group: {
                    _id: '$pt',
                    numReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' }
                }
            }
        ]);

        if (stats.length > 0) {
            await PTProfileModel.findOneAndUpdate(
                { user: ptUserId },
                {
                    averageRating: parseFloat(stats[0].averageRating.toFixed(1)),
                    numReviews: stats[0].numReviews
                }
            );
        } else {
            await PTProfileModel.findOneAndUpdate(
                { user: ptUserId },
                { averageRating: 0, numReviews: 0 }
            );
        }
    } catch (err) {
        console.error(`Error calculating average rating for PT ${ptUserId}:`, err);
    }
};

reviewSchema.post('save', async function() {
    await this.constructor.calculateAverages(this.pt);
});

reviewSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
    if (doc) { 
        await doc.constructor.calculateAverages(doc.pt);
    }
});


module.exports = mongoose.model('Review', reviewSchema);