const pdfParse = require("pdf-parse")
const UserProfile = require("../models/userProfile.model")
const ResumeVersion = require("../models/resumeVersion.model")
const JobApplication = require("../models/jobApplication.model")
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

        // Create or update Master Resume Version
        await ResumeVersion.findOneAndUpdate(
            { user: req.user.id, isMaster: true },
            { name: "Master Resume", resumeText: resumeText },
            { upsert: true, new: true }
        )

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

/**
 * @route GET /api/profile/resumes
 * Fetch all resume versions for the user along with their performance metrics
 */
async function getResumeVersions(req, res) {
    try {
        const versions = await ResumeVersion.find({ user: req.user.id }).sort({ createdAt: -1 })
        
        const versionsWithStats = await Promise.all(versions.map(async (v) => {
            const apps = await JobApplication.find({ user: req.user.id, resumeVersion: v._id })
            
            const totalApplications = apps.length
            const interviewsCount = apps.filter(a => a.status === 'interviewing' || a.status === 'offer').length
            const offersCount = apps.filter(a => a.status === 'offer').length
            const rejectionsCount = apps.filter(a => a.status === 'rejected').length
            
            const successRate = totalApplications > 0 
                ? Math.round((interviewsCount / totalApplications) * 100) 
                : 0
                
            return {
                _id: v._id,
                name: v.name,
                resumeText: v.resumeText,
                tailoredHtml: v.tailoredHtml,
                isMaster: v.isMaster,
                createdAt: v.createdAt,
                stats: {
                    totalApplications,
                    interviewsCount,
                    offersCount,
                    rejectionsCount,
                    successRate
                }
            }
        }))
        
        res.status(200).json({ message: "Resume versions fetched.", versions: versionsWithStats })
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch resume versions.", error: error.message })
    }
}

module.exports = { getProfile, updateProfile, getResumeVersions }
