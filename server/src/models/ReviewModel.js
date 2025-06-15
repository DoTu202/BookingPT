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

reviewSchema.index({ booking: 1, client: 1 }, { unique: true }); // Một client chỉ review 1 booking 1 lần
reviewSchema.index({ pt: 1, createdAt: -1 });



reviewSchema.statics.calculateAverages = async function(ptUserId) {
    try {
        // Cần truy cập model PTProfile ở đây. Để tránh lỗi circular dependency
        // nếu PTProfileModel import ReviewModel (hiện tại không có),
        // cách an toàn là dùng mongoose.model('PTProfile') trực tiếp.
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

// Gọi calculateAverages sau khi một review được lưu hoặc xóa
reviewSchema.post('save', async function() {
    await this.constructor.calculateAverages(this.pt);
});

// Hook cho việc xóa. `this` trong query middleware là query, không phải document.
// Vì vậy, để lấy document đã bị xóa, chúng ta cần xử lý khác đi.
// Cách đơn giản là thực hiện việc này trong controller sau khi xóa.
// Hoặc nếu dùng document.deleteOne(), hook 'deleteOne' { document: true } sẽ hoạt động.

// Ví dụ nếu bạn dùng document.deleteOne() trong controller:
reviewSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
    if (doc) { // doc là document đã bị xóa
        await doc.constructor.calculateAverages(doc.pt);
    }
});
// Nếu bạn dùng Model.findByIdAndDelete() hoặc Model.findOneAndDelete(),
// bạn cần lấy document trước khi xóa để có ptId, hoặc query lại ptId sau khi xóa
// (hoặc tốt nhất là gọi hàm calculateAverages từ controller sau khi xóa).


module.exports = mongoose.model('Review', reviewSchema);