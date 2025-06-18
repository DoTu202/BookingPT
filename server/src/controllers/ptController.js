const PTProfile = require('../models/PTProfileModel');
const User = require('../models/userModel');
const { validationResult } = require('express-validator');

// Get PT Profile
const getPtProfile = async (req, res) => {
  try {
    const ptId = req.user.id;

    const ptProfile = await PTProfile.findOne({ user: ptId }).populate('user', 'fullname email');

    if (!ptProfile) {
      return res.status(404).json({
        success: false,
        message: 'PT profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: ptProfile,
    });
  } catch (error) {
    console.error('Error getting PT profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting PT profile',
      error: error.message,
    });
  }
};

// Create or Update PT Profile
const updatePtProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const ptId = req.user.id;
    const {
      specialization,
      experience,
      description,
      hourlyRate,
      location,
      certifications,
      languages,
      workingHours,
    } = req.body;

    console.log('=== BACKEND DEBUG ===');
    console.log('Received data:', req.body);
    console.log('specialization:', specialization);
    console.log('experience:', experience);

    // Check if profile exists
    let ptProfile = await PTProfile.findOne({ user: ptId });

    if (ptProfile) {
      // Update existing profile
      ptProfile.specializations = specialization !== undefined ? specialization : ptProfile.specializations;
      ptProfile.experienceYears = experience !== undefined ? experience : ptProfile.experienceYears;
      ptProfile.bio = description !== undefined ? description : ptProfile.bio;
      ptProfile.hourlyRate = hourlyRate !== undefined ? hourlyRate : ptProfile.hourlyRate;
      ptProfile.location = location !== undefined ? location : ptProfile.location;
      ptProfile.certifications = certifications !== undefined ? certifications : ptProfile.certifications;
      ptProfile.languages = languages !== undefined ? languages : ptProfile.languages;
      ptProfile.workingHours = workingHours !== undefined ? workingHours : ptProfile.workingHours;
      ptProfile.updatedAt = new Date();

      await ptProfile.save();
    } else {
      // Create new profile
      console.log('Creating new profile with specializations:', specialization);
      ptProfile = new PTProfile({
        user: ptId,
        specializations: specialization !== undefined ? specialization : [],
        experienceYears: experience !== undefined ? experience : 0,
        bio: description !== undefined ? description : '',
        hourlyRate: hourlyRate || 50,
        location: location || { city: '', district: '' },
        certifications: certifications || [],
        languages: languages || ['English'],
        workingHours: workingHours || {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: '09:00', end: '12:00', available: true },
          sunday: { start: '09:00', end: '12:00', available: false },
        },
        rating: 0,
        totalSessions: 0, // Fix: totalSessions
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await ptProfile.save();
    }

    // Populate user data before sending response
    await ptProfile.populate('user', 'fullname email');

    res.status(200).json({
      success: true,
      data: ptProfile,
      message: ptProfile.isNew ? 'Profile created successfully' : 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating PT profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating PT profile',
      error: error.message,
    });
  }
};

// Delete PT Profile
const deletePtProfile = async (req, res) => {
  try {
    const ptId = req.user.id;

    const ptProfile = await PTProfile.findOneAndDelete({ user: ptId });

    if (!ptProfile) {
      return res.status(404).json({
        success: false,
        message: 'PT profile not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'PT profile deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting PT profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting PT profile',
      error: error.message,
    });
  }
};

module.exports = {
  getPtProfile,
  updatePtProfile,
  deletePtProfile,
};
