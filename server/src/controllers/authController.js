const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.USERNAME_EMAIL,
    pass: process.env.USERNAME_PASSWORD,
  },
});

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

const handleSendMail = async (val, email) => {
  console.log(verification);
  try {
    await transporter.sendMail({
      from: `Support FitnessApp <${process.env.USERNAME_EMAIL}>`, // sender address
      to: email,
      subject: 'Verification email code',
      text: 'Your code to verification email', // plain‑text body
      html: `<h1>${val}</h1>`, // HTML body
    });
    return 'OK';
  } catch (error) {
    return error;
  }
};

const verification = asyncHandler(async (req, res) => {
  const {email} = req.body;

  const verificationCode = Math.round(1000 + Math.random() * 9000);
  await handleSendMail('', email);

  try {
    await handleSendMail(verificationCode, email);
    res.status(200).json({
      message: 'Verification code sent successfully',
      data: {
        verificationCode,
      },
    });
  } catch (error) {
    res.status(401);
    throw new Error('Error sending email, Can not send email verification');
  }
});

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
  verification,
};
