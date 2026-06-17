const mongoose = require('mongoose')

/**
 * OTP schema for password reset via email.
 * Each document stores a 6-digit OTP (hashed) for a given email.
 * TTL index auto-deletes documents after 10 minutes.
 */
const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // auto-delete after 10 minutes (TTL index)
    },
})

module.exports = mongoose.model('OTP', otpSchema)
