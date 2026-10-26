const asyncHandler = require('express-async-handler');
const PTProfile = require('../../models/PTProfileModel');
const UserModel = require('../../models/userModel');

// Get profile of PT now
const getProfile = asyncHandler(async (req, res) => {
  const profile = await PTProfile.findOne({user: req.user._id}).populate(
    'user',
    'username email photoUrl dob role phoneNumber',
  );

  // If found profile, return it
  if (profile) {
    return res.status(200).json({
      data: profile,
      message: 'Get profile successfully',
    });
  }
  return res.status(200).json({
    message: 'PT has not created a detailed profile yet.',
    data: {
      user: req.user,
      _id: null,
      username: req.user.username,
      bio: '',
      specializations: [],
      experienceYears: 0,
      hourlyRate: 0,
      location: null,
    },
  });
});

//Update or create profile of PT
const updatePtProfile = asyncHandler(async (req, res) => {
  const {bio, specializations, experienceYears, location, hourlyRate} =
    req.body;

  if (
    hourlyRate !== undefined &&
    (isNaN(parseFloat(hourlyRate)) || parseFloat(hourlyRate) < 10000)
  ) {
    return res.status(400).json({
      message: 'Hourly rate must be at least 10,000 VND',
    });
  }
  if (
    experienceYears !== undefined &&
    (isNaN(parseInt(experienceYears)) || parseInt(experienceYears) < 0)
  ) {
    return res.status(400).json({
      message: 'Experience years must be a positive number',
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
  if (location !== undefined) {
    // Only copy known string fields so arbitrary objects are never stored.
    const pick = value => (typeof value === 'string' ? value.trim().slice(0, 100) : '');
    profileFields.location = {
      city: pick(location?.city),
      district: pick(location?.district),
    };
  }
  if (typeof req.body.isAcceptingClients === 'boolean') {
    profileFields.isAcceptingClients = req.body.isAcceptingClients;
  }

  try {
    let profile = await PTProfile.findOneAndUpdate(
      {user: req.user._id},
      {$set: profileFields},
      {new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true},
    ).populate('user', 'username email photoUrl');

    res.status(200).json({
      message: 'PT profile updated successfully',
      data: profile,
      success: true,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message:
          'Validation failed: ' +
          Object.values(error.errors)
            .map(e => e.message)
            .join(', '),
      });
    }
    throw error;
  }
});

module.exports = {
  getProfile,
  updatePtProfile,
};
