const Review = require('../models/ReviewModel');
const PTProfile = require('../models/PTProfileModel');

// Recomputes the PT's average from all reviews so the stored rating can never
// drift from the reviews themselves.
const refreshPtRating = async ptId => {
  const [stats] = await Review.aggregate([
    {$match: {pt: ptId}},
    {$group: {_id: null, avg: {$avg: '$rating'}, count: {$sum: 1}}},
  ]);
  await PTProfile.updateOne(
    {user: ptId},
    {
      rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
      numReviews: stats ? stats.count : 0,
    },
  );
};

module.exports = {refreshPtRating};
