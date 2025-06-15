const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    dob:{
        type: Date,
        required: true,
    },
    photoUrl: {
        type: String,
    },
    role: {
        type: String,
        enum: ['client', 'pt'],
        default: 'client',
        required: true,
    },
    createAt: {
        type: Date,
        default: Date.now(),
    },
    updateAt: {
        type: Date,
        default: Date.now(),
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLoginAt: {
        type: Date
    }


})

userSchema.pre('save', function(next){
    this.updateAt = Date.now();
    next();
})

const UserModal = mongoose.model('User', userSchema);
module.exports = UserModal;