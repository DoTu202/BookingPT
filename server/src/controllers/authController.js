const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const getJsonWebToken = (email, id) => {
  const payload = {
    email,
    id,
  };
  const token = jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: '1d',
  });
  return token;
};

const register = asyncHandler(async (req, res) => {
  const {username, email, password, dob, phoneNumber} = req.body;

  if (!username || !email || !password || !dob || !phoneNumber) {
    return res.status(400).json({message: 'All fields are required'});
  }

  //Check if user already exists
  const existingUser = await User.findOne({email});
  if (existingUser) {
    return res.status(400).json({message: 'User already exists'});
  }

  //Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  //Create new user
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    dob,
    phoneNumber,
  });

  await newUser.save();

  res.status(200).json({
    message: 'User registered successfully',
    data: {
      email: newUser.email,
      id: newUser._id,
      accesstoken: getJsonWebToken(newUser.email, newUser._id),
    },
  });
});

//Login
const login = asyncHandler(async (req, res) => {
  const {email, password} = req.body;

  //Check require fields
  if (!email || !password) {
    return res.status(400).json({message: 'All fields are required'});
  }

  //Check if user exists
  const existingUser = await User.findOne({email});
  if (!existingUser) {
    return res.status(400).json({message: 'Invalid credentials'});
  }
  //Validate password
  const isMatch = await bcrypt.compare(password, existingUser.password);
  if (!isMatch) {
    return res.status(400).json({message: 'Invalid eamil or password'});
  }
  res.status(200).json({
    message: 'Login successful',
    data: {
      id: existingUser._id,
      email: existingUser.email,
      name: existingUser.username,
      accesstoken: getJsonWebToken(existingUser.email, existingUser._id),
      fcmTokens: existingUser.fcmTokens ?? [],
      photo: existingUser.photoUrl ?? '',
      name: existingUser.name ?? '',
    },
  });
});

module.exports = {
  register,
  login,
  getJsonWebToken,
};
