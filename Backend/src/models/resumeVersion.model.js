const mongoose = require('mongoose')

const resumeVersionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    name: { type: String, required: true }, // e.g. "Master Resume", "Google Tailwind Resume v2"
    resumeText: { type: String, required: true },
    tailoredHtml: { type: String }, // optional, for generated tailored resumes
    isMaster: { type: Boolean, default: false }
}, { timestamps: true })

const ResumeVersion = mongoose.model('ResumeVersion', resumeVersionSchema)
module.exports = ResumeVersion
