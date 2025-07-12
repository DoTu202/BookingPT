const UserModal = require('../models/userModel');
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

// Function to generate JSON Web Token
const getJsonWebToken = (email, id, role, username, photoUrl) => {
  const payload = {
    email,
    id,
    role,
    username,
    photoUrl
  };
  const token = jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: '1d',
  });
  return token;
};

const handleSendMail = async val => {
  try {
    await transporter.sendMail(val);
    return 'OK';
  } catch (error) {
    return error;
  }
};

const verification = asyncHandler(async (req, res) => {
  const {email} = req.body;

  // Check if user already exists before sending verification
  const existingUser = await UserModal.findOne({email});
  if (existingUser) {
    return res.status(400).json({message: 'User already exists'});
  }

  const verificationCode = Math.round(1000 + Math.random() * 9000);

  try {
    const data = {
      from: `Support FitnessApp <${process.env.USERNAME_EMAIL}>`, // sender address
      to: email,
      subject: 'Verification email code',
      text: 'Your code to verification email', // plain‑text body
      html: `<h1>${verificationCode}</h1>`, // HTML body
    };

    await handleSendMail(data);

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
  const {username, email, password, dob, phoneNumber, role='client'} = req.body;

  if (!username || !email || !password || !dob || !phoneNumber) {
    return res.status(400).json({message: 'All fields are required'});
  }

  //Check role send from client
  if(!['client', 'pt'].includes(role)){
    return res.status(400).json({message: 'Role is not valid'});
  }

  //Check if user already exists
  const existingUser = await UserModal.findOne({email});
  if (existingUser) {
    return res.status(400).json({message: 'User already exists'});
  }

  //Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  //Create new user
  const newUser = new UserModal({
    username,
    email,
    password: hashedPassword,
    dob,
    phoneNumber,
    role,
    photoUrl: '',
  });

  await newUser.save();

  res.status(200).json({
    message: 'User registered successfully',
    data: {
      email: newUser.email,
      id: newUser._id,
      accesstoken: getJsonWebToken(newUser.email, newUser._id, newUser.role),
      role: newUser.role,
      username: newUser.username,
      photoUrl: newUser.photoUrl ?? '',
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
  const existingUser = await UserModal.findOne({email});
  if (!existingUser) {
    return res.status(400).json({message: 'Invalid credentials'});
  }
  //Validate password
  const isMatch = await bcrypt.compare(password, existingUser.password);
  if (!isMatch) {
    return res.status(400).json({message: 'Invalid email or password'});
  }
  res.status(200).json({
    message: 'Login successful',
    data: {
      id: existingUser._id,
      email: existingUser.email,
      username: existingUser.username,
      accesstoken: getJsonWebToken(existingUser.email, existingUser._id, existingUser.role),
      photoUrl: existingUser.photoUrl ?? '',
      role: existingUser.role,
    },
  });
});

function generatePassword(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        password += characters[randomIndex];
    }
    return password;
}

// Forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const {email} = req.body;
  const randomPassword = generatePassword(8);
  const data = {
    from: `Support FitnessApp <${process.env.USERNAME_EMAIL}>`, // sender address
    to: email,
    subject: 'Your new password',
    text: 'Your code to reset password', // plain‑text body
    html: `<h1>${randomPassword}</h1>`, // HTML body
  };

  const user = await UserModal.findOne({email});
  if (user) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(`${randomPassword}`, salt);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      isChangePassword: true,
    });

    await handleSendMail(data)
      .then(() => {
        res.status(200).json({
          message: 'Send email new password successfully',
          data: [],
        });
      })
      .catch(error => {
        res.status(401);
        throw new Error('Error sending email, Can not send email verification');
      });
  } else {
    res.status(401);
    throw new Error('Email not found');
  }
});

module.exports = {
  register,
  login,
  getJsonWebToken,
  verification,
  forgotPassword,
};
