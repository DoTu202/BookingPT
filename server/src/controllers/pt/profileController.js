const asyncHandler = require('express-async-handler');
const PTProfile = require('../../models/PTProfileModel');
const UserModel = require('../../models/userModel');

// Get profile of PT now
const getProfile = asyncHandler(async (req, res) => {
  const profile = await PTProfile.findOne({user: req.user._id}).populate(
    'user',
    'username email photoUrl dob role phoneNumber',
  );
  if (!profile) {
    return res.status(200).json({
      message: "PT has not created a detailed profile yet.",
      data: {
        user: {
          _id: req.user._id,
          username: req.user.username,
          email: req.user.email,
          photoUrl: req.user.photoUrl,
          dob: req.user.dob,
          phoneNumber: req.user.phoneNumber,
          role: req.user.role,
        }
      }
    });
  }
  res.status(200).json({
    data: profile,
    message: 'Get profile successfully',
  });
});



//Update or create profile of PT
const updatePtProfile = asyncHandler(async (req, res) => {
  const {bio, specializations, experienceYears, location, hourlyRate} =
    req.body;

  if (
    hourlyRate !== undefined &&
    (isNaN(parseFloat(hourlyRate)) || parseFloat(hourlyRate) < 0)
  ) {
    return res.status(400).json({
      message: 'Hourly rate is not valid',
    });
  }
  if (
    experienceYears !== undefined &&
    (isNaN(parseInt(experienceYears)) || parseInt(experienceYears) < 0)
  ) {
    return res.status(400).json({
      message: 'Experience years is not valid',
    });
  }

  const profileFields = {
    user: req.user._id, 
  };

  if (bio !== undefined) {
    profileFields.bio = bio;
  }
  if (specializations !== undefined) {
    if (!Array.isArray(specializations)) {
      return res.status(400).json({
        message: 'Specializations should be an array',
      });
    }
    profileFields.specializations = specializations;
  }
  if (experienceYears !== undefined)
    profileFields.experienceYears = parseInt(experienceYears);
  if (hourlyRate !== undefined)
    profileFields.hourlyRate = parseFloat(hourlyRate);
  if (location !== undefined) profileFields.location = location;

  let profile = await PTProfile.findOneAndUpdate(
    {user: req.user._id}, 
    {$set: profileFields}, 
    {new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true},
  ).populate('user', 'username email photoUrl');

  res.status(200).json({
    message: 'PT profile updated successfully',
    data: profile,
  });
});

module.exports = {
  getProfile,
  updatePtProfile,
};
