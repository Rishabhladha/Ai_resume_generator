const mongoose = require('mongoose')

const skillProgressSchema = new mongoose.Schema({
    skill: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
    source: { type: String } // e.g., "Learned from job prep for Google SWE"
}, { _id: false })

const userProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, unique: true },
    masterResumeText: { type: String },
    targetRoles: [String],
    yearsOfExperience: { type: Number },
    currentLocation: { type: String },
    targetLocations: [String],
    skills: [String],
    skillProgressLog: [skillProgressSchema]
}, { timestamps: true })

const UserProfile = mongoose.model('UserProfile', userProfileSchema)
module.exports = UserProfile
