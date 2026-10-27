const asyncHandler = require('express-async-handler');
const PTProfile = require('../../models/PTProfileModel');
const {badRequest} = require('../../utils/httpError');

const SPECIALIZATIONS = PTProfile.schema.path('specializations').caster.enumValues;
const BIO_MAX_LENGTH = 500;

// The signed-in PT's own profile (with private fields).
const getProfile = asyncHandler(async (req, res) => {
  const profile = await PTProfile.findOne({user: req.user._id}).populate(
    'user',
    'username email photoUrl dob role phoneNumber',
  );

  if (profile) {
    return res.status(200).json({
      success: true,
      data: profile,
      message: 'Get profile successfully',
    });
  }
  return res.status(200).json({
    success: true,
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

// Accepts numbers or numeric strings (form inputs); anything else is NaN.
const toNumber = value =>
  typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')
    ? Number(value)
    : NaN;

// Update or create the PT's profile. Only whitelisted fields are copied.
const updatePtProfile = asyncHandler(async (req, res) => {
  const {bio, specializations, experienceYears, location, hourlyRate} = req.body;
  const profileFields = {user: req.user._id};

  if (hourlyRate !== undefined) {
    const rate = toNumber(hourlyRate);
    if (!Number.isFinite(rate) || rate < 10000) {
      throw badRequest('Hourly rate must be at least 10,000 VND');
    }
    profileFields.hourlyRate = rate;
  }
  if (experienceYears !== undefined) {
    const years = toNumber(experienceYears);
    if (!Number.isInteger(years) || years < 0) {
      throw badRequest('Experience years must be a positive number');
    }
    profileFields.experienceYears = years;
  }
  if (bio !== undefined) {
    if (typeof bio !== 'string' || bio.trim().length > BIO_MAX_LENGTH) {
      throw badRequest(`Bio must be text of at most ${BIO_MAX_LENGTH} characters`);
    }
    profileFields.bio = bio.trim();
  }
  if (specializations !== undefined) {
    if (!Array.isArray(specializations)) {
      throw badRequest('Specializations should be an array');
    }
    const unknown = specializations.filter(item => !SPECIALIZATIONS.includes(item));
    if (unknown.length > 0) {
      throw badRequest(`Unknown specializations: ${unknown.map(String).join(', ')}`);
    }
    profileFields.specializations = [...new Set(specializations)];
  }
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

  // Schema validation errors (e.g. hourlyRate above the max) become 400s in
  // errorHandler.
  const profile = await PTProfile.findOneAndUpdate(
    {user: req.user._id},
    {$set: profileFields},
    {new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true},
  ).populate('user', 'username email photoUrl');

  res.status(200).json({
    message: 'PT profile updated successfully',
    data: profile,
    success: true,
  });
});

module.exports = {
  getProfile,
  updatePtProfile,
};
