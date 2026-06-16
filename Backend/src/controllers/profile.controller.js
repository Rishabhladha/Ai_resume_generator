const pdfParse = require("pdf-parse")
const UserProfile = require("../models/userProfile.model")
const { extractProfileFromResume } = require("../services/ai.service")

/**
 * @route GET /api/profile
 */
async function getProfile(req, res) {
    let profile = await UserProfile.findOne({ user: req.user.id })
    if (!profile) {
        profile = { user: req.user.id, masterResumeText: null, skills: [], targetRoles: [] }
    }
    res.status(200).json({ message: "Profile fetched.", profile })
}

/**
 * @route POST /api/profile
 * Upload master resume (PDF) + optional profile fields
 */
async function updateProfile(req, res) {
    let resumeText = null

    if (req.file) {
        const parsed = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
        resumeText = parsed.text

        // Auto-extract skills and roles from resume
        const extracted = await extractProfileFromResume({ resumeText })

        const profile = await UserProfile.findOneAndUpdate(
            { user: req.user.id },
            {
                masterResumeText: resumeText,
                skills: extracted.skills,
                targetRoles: extracted.targetRoles,
                yearsOfExperience: extracted.yearsOfExperience,
                currentLocation: extracted.currentLocation !== 'Unknown' ? extracted.currentLocation : undefined,
                ...req.body
            },
            { upsert: true, new: true }
        )
        return res.status(200).json({ message: "Profile updated with resume.", profile })
    }

    const profile = await UserProfile.findOneAndUpdate(
        { user: req.user.id },
        req.body,
        { upsert: true, new: true }
    )
    res.status(200).json({ message: "Profile updated.", profile })
}

module.exports = { getProfile, updateProfile }
